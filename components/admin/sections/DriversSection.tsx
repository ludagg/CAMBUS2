'use client';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Button,
  Dialog,
  EmptyState,
  ErrorState,
  Field,
  IconButton,
  Input,
  PageHeader,
  SearchInput,
  Select,
  SegmentedControl,
  SkeletonList,
  StatCard,
  StatusBadge,
  Table,
  TD,
  Th,
  THead,
  TR,
  useConfirm,
  useToast,
  Avatar,
  InlineAlert,
  type Tone,
} from '../ui';
import { localDateKey } from '@/lib/datetime';

export type DriversSectionProps = { agencyId?: string; agencies?: Array<{ id: string; name: string }> };

type Category = 'B' | 'C' | 'D' | 'D1' | 'DE';
interface Driver {
  id: string;
  fullName: string;
  phone: string | null;
  licenseNumber: string;
  licenseCategory: Category;
  licenseExpiresAt: string;
  status: 'ACTIVE' | 'INACTIVE';
}

const CATEGORIES: Category[] = ['B', 'C', 'D', 'D1', 'DE'];
const DAY = 24 * 3600 * 1000;

function licenseInfo(iso: string): { tone: Tone; label: string; days: number } {
  const days = Math.ceil((new Date(iso).getTime() - Date.now()) / DAY);
  if (new Date(iso).getTime() < Date.now()) return { tone: 'danger', label: 'Expirée', days };
  if (days < 30) return { tone: 'warning', label: `Expire dans ${days} j`, days };
  return { tone: 'neutral', label: `Expire dans ${days} j`, days };
}

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { timeZone: 'Africa/Douala', day: '2-digit', month: 'short', year: 'numeric' });

interface FormState {
  fullName: string;
  phone: string;
  licenseNumber: string;
  licenseCategory: Category;
  expiry: string;
}
const EMPTY_FORM: FormState = { fullName: '', phone: '', licenseNumber: '', licenseCategory: 'D', expiry: '' };

const DriversSection: React.FC<DriversSectionProps> = ({ agencyId, agencies }) => {
  const toast = useToast();
  const { confirm, dialog } = useConfirm();
  const [pickedAgency, setPickedAgency] = useState<string>('');
  const activeAgency = agencyId ?? (pickedAgency || agencies?.[0]?.id || '');

  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ACTIVE' | 'INACTIVE' | 'ALL'>('ACTIVE');
  const [editing, setEditing] = useState<Driver | 'new' | null>(null);

  const load = useCallback(
    async (signal?: AbortSignal) => {
      if (!activeAgency) {
        setDrivers([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/agencies/${activeAgency}/drivers`, { signal });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.error || 'Impossible de charger les chauffeurs.');
        setDrivers(json.data ?? []);
      } catch (e) {
        if ((e as Error).name === 'AbortError') return;
        setError(e instanceof Error ? e.message : 'Impossible de charger les chauffeurs.');
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [activeAgency],
  );

  useEffect(() => {
    const ctrl = new AbortController();
    load(ctrl.signal);
    return () => ctrl.abort();
  }, [load]);

  const kpis = useMemo(
    () => ({
      total: drivers.length,
      renew: drivers.filter((d) => d.status === 'ACTIVE' && licenseInfo(d.licenseExpiresAt).days < 30).length,
      inactive: drivers.filter((d) => d.status === 'INACTIVE').length,
    }),
    [drivers],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return drivers.filter((d) => {
      if (statusFilter !== 'ALL' && d.status !== statusFilter) return false;
      if (!q) return true;
      return [d.fullName, d.phone ?? '', d.licenseNumber].some((v) => v.toLowerCase().includes(q));
    });
  }, [drivers, query, statusFilter]);

  const deactivate = async (d: Driver) => {
    const ok = await confirm({
      title: 'Désactiver ce chauffeur ?',
      message: (
        <>
          <strong>{d.fullName}</strong> ne pourra plus être assigné à de nouveaux départs. Vous pourrez le réactiver à tout moment.
        </>
      ),
      confirmLabel: 'Désactiver',
    });
    if (!ok) return;
    try {
      const res = await fetch(`/api/drivers/${d.id}`, { method: 'DELETE' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Désactivation impossible.');
      toast(`${d.fullName} a été désactivé.`);
      load();
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Désactivation impossible.', 'error');
    }
  };

  const reactivate = async (d: Driver) => {
    try {
      const res = await fetch(`/api/drivers/${d.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ACTIVE' }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Réactivation impossible.');
      toast(`${d.fullName} est de nouveau actif.`);
      load();
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Réactivation impossible.', 'error');
    }
  };

  const addButton = (
    <Button variant="primary" icon="add" onClick={() => setEditing('new')} disabled={!activeAgency}>
      Ajouter un chauffeur
    </Button>
  );

  return (
    <div>
      <PageHeader
        eyebrow="Exploitation"
        title="Chauffeurs"
        description="Gérez les conducteurs de l'agence et surveillez la validité de leurs permis."
        actions={addButton}
      />

      {!activeAgency ? (
        <EmptyState icon="badge" title="Aucune agence disponible" description="Créez d'abord une agence pour y enregistrer des chauffeurs." />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
            <StatCard label="Chauffeurs" value={kpis.total} icon="badge" />
            <StatCard
              label="Permis à renouveler"
              value={kpis.renew}
              icon="event_busy"
              tone={kpis.renew > 0 ? 'warning' : 'brand'}
              hint="Expirés ou à moins de 30 jours"
            />
            <StatCard label="Inactifs" value={kpis.inactive} icon="person_off" tone="info" />
          </div>

          <div className="flex flex-wrap items-center gap-3 mb-4">
            {!agencyId && agencies && agencies.length > 0 && (
              <Select
                aria-label="Agence"
                value={activeAgency}
                onChange={(e) => setPickedAgency(e.target.value)}
                className="!w-auto min-w-[180px]"
              >
                {agencies.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </Select>
            )}
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder="Nom, téléphone, n° de permis…"
              label="Rechercher un chauffeur"
              className="flex-1 min-w-[200px] max-w-sm"
            />
            <SegmentedControl
              label="Filtrer par statut"
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: 'ACTIVE', label: 'Actifs' },
                { value: 'INACTIVE', label: 'Inactifs' },
                { value: 'ALL', label: 'Tous' },
              ]}
            />
          </div>

          {loading ? (
            <SkeletonList rows={5} />
          ) : error ? (
            <ErrorState message={error} onRetry={() => load()} />
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-ink-100 dark:border-white/10 bg-white dark:bg-surface-dark shadow-subtle">
              <EmptyState
                icon="badge"
                title={drivers.length === 0 ? 'Aucun chauffeur enregistré' : 'Aucun résultat'}
                description={
                  drivers.length === 0
                    ? 'Ajoutez vos conducteurs pour pouvoir les assigner aux départs.'
                    : 'Modifiez la recherche ou le filtre de statut.'
                }
                action={drivers.length === 0 ? addButton : undefined}
              />
            </div>
          ) : (
            <Table>
              <THead>
                <Th>Chauffeur</Th>
                <Th>N° de permis</Th>
                <Th>Catégorie</Th>
                <Th>Validité du permis</Th>
                <Th>Statut</Th>
                <Th className="text-right">Actions</Th>
              </THead>
              <tbody>
                {filtered.map((d) => {
                  const lic = licenseInfo(d.licenseExpiresAt);
                  return (
                    <TR key={d.id}>
                      <TD>
                        <div className="flex items-center gap-3 min-w-[180px]">
                          <Avatar name={d.fullName} size="sm" />
                          <div className="min-w-0">
                            <div className="font-semibold truncate">{d.fullName}</div>
                            <div className="text-xs text-text-muted dark:text-gray-400 tabular-nums">{d.phone || 'Téléphone non renseigné'}</div>
                          </div>
                        </div>
                      </TD>
                      <TD className="tabular-nums whitespace-nowrap">{d.licenseNumber}</TD>
                      <TD>
                        <Badge tone="info">Catégorie {d.licenseCategory}</Badge>
                      </TD>
                      <TD>
                        <div className="flex flex-col items-start gap-1">
                          <Badge tone={lic.tone} dot>
                            {lic.label}
                          </Badge>
                          <span className="text-xs text-text-muted dark:text-gray-400 tabular-nums">{fmtDate(d.licenseExpiresAt)}</span>
                        </div>
                      </TD>
                      <TD>
                        <StatusBadge status={d.status} />
                      </TD>
                      <TD>
                        <div className="flex items-center justify-end gap-1">
                          <IconButton icon="edit" label={`Modifier ${d.fullName}`} onClick={() => setEditing(d)} />
                          {d.status === 'ACTIVE' ? (
                            <IconButton icon="person_off" label={`Désactiver ${d.fullName}`} tone="danger" onClick={() => deactivate(d)} />
                          ) : (
                            <IconButton icon="person_check" label={`Réactiver ${d.fullName}`} onClick={() => reactivate(d)} />
                          )}
                        </div>
                      </TD>
                    </TR>
                  );
                })}
              </tbody>
            </Table>
          )}
        </>
      )}

      {editing && activeAgency && (
        <DriverDialog
          agencyId={activeAgency}
          driver={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={(msg) => {
            setEditing(null);
            toast(msg);
            load();
          }}
        />
      )}
      {dialog}
    </div>
  );
};

const DriverDialog: React.FC<{
  agencyId: string;
  driver: Driver | null;
  onClose: () => void;
  onSaved: (message: string) => void;
}> = ({ agencyId, driver, onClose, onSaved }) => {
  const [form, setForm] = useState<FormState>(
    driver
      ? {
          fullName: driver.fullName,
          phone: driver.phone ?? '',
          licenseNumber: driver.licenseNumber,
          licenseCategory: driver.licenseCategory,
          expiry: localDateKey(new Date(driver.licenseExpiresAt)),
        }
      : EMPTY_FORM,
  );
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (form.fullName.trim().length < 2) return setErr('Le nom doit contenir au moins 2 caractères.');
    if (form.licenseNumber.trim().length < 3) return setErr('Le numéro de permis doit contenir au moins 3 caractères.');
    if (!form.expiry) return setErr("Indiquez la date d'expiration du permis.");
    const payload: Record<string, unknown> = {
      fullName: form.fullName.trim(),
      licenseNumber: form.licenseNumber.trim(),
      licenseCategory: form.licenseCategory,
      licenseExpiresAt: new Date(`${form.expiry}T23:59:59+01:00`).toISOString(),
    };
    if (form.phone.trim() || !driver) {
      if (form.phone.trim()) payload.phone = form.phone.trim();
    } else {
      payload.phone = '';
    }
    setSaving(true);
    try {
      const res = await fetch(driver ? `/api/drivers/${driver.id}` : `/api/agencies/${agencyId}/drivers`, {
        method: driver ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Enregistrement impossible.');
      onSaved(driver ? 'Chauffeur mis à jour.' : 'Chauffeur ajouté.');
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : 'Enregistrement impossible.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      title={driver ? 'Modifier le chauffeur' : 'Ajouter un chauffeur'}
      description={driver ? undefined : "Renseignez l'identité et le permis du conducteur."}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button variant="primary" type="submit" form="driver-form" loading={saving}>
            {driver ? 'Enregistrer' : 'Ajouter'}
          </Button>
        </>
      }
    >
      <form id="driver-form" onSubmit={submit} className="space-y-4">
        {err && <InlineAlert>{err}</InlineAlert>}
        <Field label="Nom complet">
          <Input value={form.fullName} onChange={(e) => set('fullName', e.target.value)} required autoFocus maxLength={120} />
        </Field>
        <Field label="Téléphone">
          <Input type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+237 6 …" maxLength={40} />
        </Field>
        <Field label="Numéro de permis">
          <Input value={form.licenseNumber} onChange={(e) => set('licenseNumber', e.target.value)} required maxLength={40} />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Catégorie">
            <Select value={form.licenseCategory} onChange={(e) => set('licenseCategory', e.target.value as Category)}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  Catégorie {c}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Expiration du permis">
            <Input type="date" value={form.expiry} onChange={(e) => set('expiry', e.target.value)} required />
          </Field>
        </div>
      </form>
    </Dialog>
  );
};

export default DriversSection;
