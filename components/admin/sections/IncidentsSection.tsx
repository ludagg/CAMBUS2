'use client';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  Dialog,
  EmptyState,
  ErrorState,
  Field,
  InlineAlert,
  PageHeader,
  SegmentedControl,
  Select,
  SkeletonList,
  StatusBadge,
  Textarea,
  cx,
  formatDateTime,
  useToast,
} from '../ui';
import { dayRange, localDateKey, todayLocal } from '@/lib/datetime';

export type IncidentsSectionProps = { agencyId?: string };

type Kind = 'BREAKDOWN' | 'ACCIDENT' | 'ROUTE_BLOCKED' | 'WEATHER' | 'SECURITY' | 'OTHER';
type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

const KIND_META: Record<Kind, { label: string; icon: string }> = {
  BREAKDOWN: { label: 'Panne', icon: 'car_crash' },
  ACCIDENT: { label: 'Accident', icon: 'emergency' },
  ROUTE_BLOCKED: { label: 'Route bloquée', icon: 'block' },
  WEATHER: { label: 'Intempéries', icon: 'thunderstorm' },
  SECURITY: { label: 'Sécurité', icon: 'shield' },
  OTHER: { label: 'Autre', icon: 'report' },
};
const KINDS = Object.keys(KIND_META) as Kind[];
const SEVERITIES: Severity[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const SEVERITY_LABEL: Record<Severity, string> = { LOW: 'Faible', MEDIUM: 'Moyenne', HIGH: 'Élevée', CRITICAL: 'Critique' };
const CHIP: Record<Severity, string> = {
  LOW: 'bg-ink-100 text-ink-600 dark:bg-white/10 dark:text-gray-300',
  MEDIUM: 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  HIGH: 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300',
  CRITICAL: 'bg-red-600 text-white',
};

interface Incident {
  id: string;
  agencyId: string;
  departureId: string | null;
  vehicleId: string | null;
  driverId: string | null;
  kind: Kind;
  severity: Severity;
  description: string;
  createdAt: string;
  resolvedAt: string | null;
  resolutionNote: string | null;
  reportedBy: { id: string; name: string } | null;
  resolvedBy: { id: string; name: string } | null;
  departure: {
    departureAt: string;
    route?: { originCity?: { name: string }; destinationCity?: { name: string } };
  } | null;
}

interface DepartureOpt {
  id: string;
  agencyId: string;
  from: string;
  to: string;
  departureAt: string;
}
interface Named {
  id: string;
  label: string;
}

const hhmm = (iso: string) =>
  new Date(iso).toLocaleTimeString('fr-FR', { timeZone: 'Africa/Douala', hour: '2-digit', minute: '2-digit' });

async function fetchData<T>(url: string, fallback: string): Promise<T[]> {
  const res = await fetch(url);
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || fallback);
  return json.data ?? [];
}

const IncidentsSection: React.FC<IncidentsSectionProps> = ({ agencyId }) => {
  const toast = useToast();
  const [items, setItems] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scope, setScope] = useState<'OPEN' | 'ALL'>('OPEN');
  const [severity, setSeverity] = useState<'' | Severity>('');
  const [creating, setCreating] = useState(false);
  const [resolving, setResolving] = useState<Incident | null>(null);
  const [names, setNames] = useState<Record<string, string>>({});

  const load = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      setError(null);
      try {
        const qs = new URLSearchParams();
        if (agencyId) qs.set('agencyId', agencyId);
        if (scope === 'OPEN') qs.set('unresolved', '1');
        const res = await fetch(`/api/incidents?${qs}`, { signal });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.error || 'Impossible de charger les incidents.');
        setItems(json.data ?? []);
      } catch (e) {
        if ((e as Error).name === 'AbortError') return;
        setError(e instanceof Error ? e.message : 'Impossible de charger les incidents.');
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [agencyId, scope],
  );

  useEffect(() => {
    const ctrl = new AbortController();
    load(ctrl.signal);
    return () => ctrl.abort();
  }, [load]);

  // Resolve vehicle / driver names (the list endpoint only returns their ids).
  useEffect(() => {
    const need = Array.from(new Set(items.filter((i) => i.vehicleId || i.driverId).map((i) => i.agencyId))).slice(0, 10);
    if (need.length === 0) return;
    let cancelled = false;
    (async () => {
      const map: Record<string, string> = {};
      await Promise.all(
        need.flatMap((id) => [
          fetchData<{ id: string; plate: string; model: string }>(`/api/agencies/${id}/vehicles`, '')
            .then((vs) => vs.forEach((v) => (map[v.id] = `${v.plate}`)))
            .catch(() => {}),
          fetchData<{ id: string; fullName: string }>(`/api/agencies/${id}/drivers`, '')
            .then((ds) => ds.forEach((d) => (map[d.id] = d.fullName)))
            .catch(() => {}),
        ]),
      );
      if (!cancelled) setNames(map);
    })();
    return () => {
      cancelled = true;
    };
  }, [items]);

  const visible = useMemo(() => items.filter((i) => !severity || i.severity === severity), [items, severity]);
  const openCount = items.filter((i) => !i.resolvedAt).length;

  const report = (
    <Button variant="primary" icon="add_alert" onClick={() => setCreating(true)}>
      Signaler un incident
    </Button>
  );

  return (
    <div>
      <PageHeader
        eyebrow="Exploitation"
        title="Incidents"
        description={
          loading && items.length === 0
            ? 'Suivez les pannes, accidents et aléas en cours d’exploitation.'
            : openCount === 0
              ? 'Aucun incident ouvert pour le moment.'
              : `${openCount} incident${openCount > 1 ? 's' : ''} ouvert${openCount > 1 ? 's' : ''} à traiter.`
        }
        actions={report}
      />

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <SegmentedControl
          label="Afficher"
          value={scope}
          onChange={setScope}
          options={[
            { value: 'OPEN', label: 'Non résolus' },
            { value: 'ALL', label: 'Tous' },
          ]}
        />
        <Select
          aria-label="Gravité"
          value={severity}
          onChange={(e) => setSeverity(e.target.value as '' | Severity)}
          className="!w-auto min-w-[160px]"
        >
          <option value="">Toutes les gravités</option>
          {SEVERITIES.map((s) => (
            <option key={s} value={s}>
              {SEVERITY_LABEL[s]}
            </option>
          ))}
        </Select>
      </div>

      {loading ? (
        <SkeletonList rows={4} />
      ) : error ? (
        <ErrorState message={error} onRetry={() => load()} />
      ) : visible.length === 0 ? (
        <Card padded={false}>
          <EmptyState
            icon="verified_user"
            title={scope === 'OPEN' && !severity ? 'Aucun incident ouvert' : 'Aucun incident trouvé'}
            description={
              scope === 'OPEN' && !severity
                ? 'Tout roule. Signalez un incident dès qu’un problème survient sur un départ.'
                : 'Modifiez les filtres pour élargir la recherche.'
            }
            action={report}
          />
        </Card>
      ) : (
        <ul className="space-y-3">
          {visible.map((i) => (
            <li key={i.id}>
              <IncidentCard incident={i} names={names} onResolve={() => setResolving(i)} />
            </li>
          ))}
        </ul>
      )}

      {creating && (
        <CreateDialog
          agencyId={agencyId}
          onClose={() => setCreating(false)}
          onSaved={() => {
            setCreating(false);
            toast('Incident signalé.');
            load();
          }}
        />
      )}
      {resolving && (
        <ResolveDialog
          incident={resolving}
          onClose={() => setResolving(null)}
          onSaved={() => {
            setResolving(null);
            toast('Incident marqué comme résolu.');
            load();
          }}
        />
      )}
    </div>
  );
};

const IncidentCard: React.FC<{ incident: Incident; names: Record<string, string>; onResolve: () => void }> = ({
  incident: i,
  names,
  onResolve,
}) => {
  const meta = KIND_META[i.kind] ?? KIND_META.OTHER;
  const route = i.departure?.route;
  const trip =
    i.departure && route?.originCity && route?.destinationCity
      ? `${route.originCity.name} → ${route.destinationCity.name} · ${hhmm(i.departure.departureAt)}`
      : null;
  const parts = [
    trip && { icon: 'route', text: trip },
    i.vehicleId && names[i.vehicleId] && { icon: 'directions_bus', text: names[i.vehicleId] },
    i.driverId && names[i.driverId] && { icon: 'badge', text: names[i.driverId] },
    i.reportedBy && { icon: 'person', text: `Signalé par ${i.reportedBy.name}` },
    { icon: 'schedule', text: formatDateTime(i.createdAt) },
  ].filter(Boolean) as Array<{ icon: string; text: string }>;

  return (
    <Card className="!p-4 md:!p-5">
      <div className="flex gap-4">
        <span
          className={cx('inline-flex size-11 shrink-0 items-center justify-center rounded-xl', CHIP[i.severity])}
          aria-hidden
        >
          <span className="material-symbols-outlined text-[24px]">{meta.icon}</span>
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-base font-semibold text-text-main dark:text-white">{meta.label}</h3>
            <StatusBadge status={i.severity} />
          </div>
          <p className="mt-1 text-sm text-text-main dark:text-gray-200 whitespace-pre-line break-words">{i.description}</p>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-muted dark:text-gray-400">
            {parts.map((p) => (
              <span key={p.icon} className="inline-flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">{p.icon}</span>
                {p.text}
              </span>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            {i.resolvedAt ? (
              <div className="text-sm">
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-300">
                  <span className="material-symbols-outlined text-[18px]">check_circle</span>
                  Résolu le {formatDateTime(i.resolvedAt)}
                  {i.resolvedBy ? ` par ${i.resolvedBy.name}` : ''}
                </span>
                {i.resolutionNote && (
                  <p className="mt-0.5 text-text-muted dark:text-gray-400 break-words">Note : {i.resolutionNote}</p>
                )}
              </div>
            ) : (
              <>
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-amber-700 dark:text-amber-300">
                  <span className="material-symbols-outlined text-[18px]">pending</span>
                  Ouvert
                </span>
                <Button size="sm" variant="secondary" icon="task_alt" onClick={onResolve}>
                  Résoudre
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

const ResolveDialog: React.FC<{ incident: Incident; onClose: () => void; onSaved: () => void }> = ({
  incident,
  onClose,
  onSaved,
}) => {
  const toast = useToast();
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/incidents/${incident.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolve: true, resolutionNote: note.trim() || undefined }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Résolution impossible.');
      onSaved();
    } catch (e2) {
      toast(e2 instanceof Error ? e2.message : 'Résolution impossible.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      title="Résoudre l’incident"
      description={`${KIND_META[incident.kind]?.label ?? 'Incident'} — ${incident.description.slice(0, 80)}`}
      size="sm"
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button variant="primary" type="submit" form="resolve-form" loading={saving}>
            Marquer comme résolu
          </Button>
        </>
      }
    >
      <form id="resolve-form" onSubmit={submit}>
        <Field label="Note de résolution" hint="Optionnel : expliquez ce qui a été fait.">
          <Textarea rows={4} value={note} onChange={(e) => setNote(e.target.value)} maxLength={2000} autoFocus />
        </Field>
      </form>
    </Dialog>
  );
};

const CreateDialog: React.FC<{ agencyId?: string; onClose: () => void; onSaved: () => void }> = ({
  agencyId,
  onClose,
  onSaved,
}) => {
  const [kind, setKind] = useState<Kind>('BREAKDOWN');
  const [severity, setSeverity] = useState<Severity>('MEDIUM');
  const [description, setDescription] = useState('');
  const [departureId, setDepartureId] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [driverId, setDriverId] = useState('');
  const [departures, setDepartures] = useState<DepartureOpt[]>([]);
  const [vehicles, setVehicles] = useState<Named[]>([]);
  const [drivers, setDrivers] = useState<Named[]>([]);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const chosen = departures.find((d) => d.id === departureId);
  const effectiveAgency = agencyId ?? chosen?.agencyId;

  useEffect(() => {
    const today = todayLocal();
    const to = localDateKey(new Date(dayRange(today).start.getTime() + 2 * 24 * 3600 * 1000));
    fetchData<{
      id: string;
      agencyId: string;
      from: string;
      to: string;
      departureAt: string;
    }>(`/api/admin/departures-list?from=${today}&to=${to}`, 'Départs indisponibles.')
      .then((rows) => setDepartures(rows.filter((r) => !agencyId || r.agencyId === agencyId)))
      .catch(() => {});
  }, [agencyId]);

  useEffect(() => {
    setVehicleId('');
    setDriverId('');
    setVehicles([]);
    setDrivers([]);
    if (!effectiveAgency) return;
    let cancelled = false;
    fetchData<{ id: string; plate: string; model: string; status?: string }>(`/api/agencies/${effectiveAgency}/vehicles`, '')
      .then((v) => !cancelled && setVehicles(v.filter((x) => x.status !== 'INACTIVE').map((x) => ({ id: x.id, label: `${x.plate} · ${x.model}` }))))
      .catch(() => {});
    fetchData<{ id: string; fullName: string; status?: string }>(`/api/agencies/${effectiveAgency}/drivers`, '')
      .then((d) => !cancelled && setDrivers(d.filter((x) => x.status !== 'INACTIVE').map((x) => ({ id: x.id, label: x.fullName }))))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [effectiveAgency]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (!effectiveAgency) return setErr('Sélectionnez le départ concerné pour rattacher l’incident à une agence.');
    if (description.trim().length < 3) return setErr('La description doit contenir au moins 3 caractères.');
    setSaving(true);
    try {
      const res = await fetch('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agencyId: effectiveAgency,
          kind,
          severity,
          description: description.trim(),
          departureId: departureId || undefined,
          vehicleId: vehicleId || undefined,
          driverId: driverId || undefined,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Signalement impossible.');
      onSaved();
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : 'Signalement impossible.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      title="Signaler un incident"
      description="Décrivez le problème pour que l’équipe puisse réagir rapidement."
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button variant="primary" type="submit" form="incident-form" loading={saving}>
            Signaler
          </Button>
        </>
      }
    >
      <form id="incident-form" onSubmit={submit} className="space-y-4">
        {err && <InlineAlert>{err}</InlineAlert>}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Type d’incident">
            <Select value={kind} onChange={(e) => setKind(e.target.value as Kind)}>
              {KINDS.map((k) => (
                <option key={k} value={k}>
                  {KIND_META[k].label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Gravité">
            <Select value={severity} onChange={(e) => setSeverity(e.target.value as Severity)}>
              {SEVERITIES.map((s) => (
                <option key={s} value={s}>
                  {SEVERITY_LABEL[s]}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <Field label="Description">
          <Textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} required minLength={3} maxLength={2000} />
        </Field>
        <Field
          label="Départ concerné (optionnel)"
          hint={!agencyId && !departureId ? 'Requis pour déterminer l’agence concernée.' : 'Départs d’aujourd’hui et des 2 prochains jours.'}
        >
          <Select value={departureId} onChange={(e) => setDepartureId(e.target.value)}>
            <option value="">Aucun départ</option>
            {departures.map((d) => (
              <option key={d.id} value={d.id}>
                {localDateKey(new Date(d.departureAt)) !== todayLocal() &&
                  `${new Date(d.departureAt).toLocaleDateString('fr-FR', { timeZone: 'Africa/Douala', day: '2-digit', month: 'short' })} `}
                {hhmm(d.departureAt)} {d.from} → {d.to}
              </option>
            ))}
          </Select>
        </Field>
        {effectiveAgency && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Véhicule (optionnel)">
              <Select value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
                <option value="">Aucun</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Chauffeur (optionnel)">
              <Select value={driverId} onChange={(e) => setDriverId(e.target.value)}>
                <option value="">Aucun</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        )}
      </form>
    </Dialog>
  );
};

export default IncidentsSection;
