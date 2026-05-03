'use client';

import React, { useCallback, useEffect, useState } from 'react';
import AdminModal from './AdminModal';
import { Field, inputCls } from './SuperAdminDashboard';

type IncidentKind = 'BREAKDOWN' | 'ACCIDENT' | 'ROUTE_BLOCKED' | 'WEATHER' | 'SECURITY' | 'OTHER';
type IncidentSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

interface Incident {
  id: string;
  agencyId: string;
  departureId?: string | null;
  vehicleId?: string | null;
  driverId?: string | null;
  kind: IncidentKind;
  severity: IncidentSeverity;
  description: string;
  resolvedAt?: string | null;
  resolutionNote?: string | null;
  createdAt: string;
  reportedBy?: { id: string; name: string; role?: string } | null;
  resolvedBy?: { id: string; name: string } | null;
  departure?: {
    id: string;
    departureAt: string;
    route?: {
      originCity?: { name: string };
      destinationCity?: { name: string };
    } | null;
  } | null;
}

const KIND_LABELS: Record<IncidentKind, string> = {
  BREAKDOWN: 'Panne',
  ACCIDENT: 'Accident',
  ROUTE_BLOCKED: 'Route coupée',
  WEATHER: 'Météo',
  SECURITY: 'Sécurité',
  OTHER: 'Autre',
};

const KIND_COLORS: Record<IncidentKind, string> = {
  BREAKDOWN: 'bg-orange-100 text-orange-700',
  ACCIDENT: 'bg-red-100 text-red-700',
  ROUTE_BLOCKED: 'bg-amber-100 text-amber-700',
  WEATHER: 'bg-sky-100 text-sky-700',
  SECURITY: 'bg-purple-100 text-purple-700',
  OTHER: 'bg-gray-100 text-gray-700',
};

const SEVERITY_COLORS: Record<IncidentSeverity, string> = {
  LOW: 'bg-emerald-100 text-emerald-700',
  MEDIUM: 'bg-yellow-100 text-yellow-800',
  HIGH: 'bg-orange-100 text-orange-700',
  CRITICAL: 'bg-red-100 text-red-700',
};

interface Props {
  agencyId?: string;
}

const IncidentPanel: React.FC<Props> = ({ agencyId }) => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unresolvedOnly, setUnresolvedOnly] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [resolving, setResolving] = useState<Incident | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (agencyId) params.set('agencyId', agencyId);
      if (unresolvedOnly) params.set('unresolved', '1');
      const res = await fetch(`/api/incidents${params.toString() ? `?${params}` : ''}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erreur');
      setIncidents(json.data ?? []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setLoading(false);
    }
  }, [agencyId, unresolvedOnly]);

  useEffect(() => { refetch(); }, [refetch]);

  const reopen = async (i: Incident) => {
    if (!confirm('Rouvrir cet incident ?')) return;
    const res = await fetch(`/api/incidents/${i.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resolve: false }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      alert(j.error || 'Erreur');
      return;
    }
    await refetch();
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="font-black text-lg text-text-main dark:text-white">Incidents ({incidents.length})</h2>
        <div className="flex items-center gap-2 flex-wrap">
          <label className="flex items-center gap-2 text-xs font-black text-text-muted cursor-pointer">
            <input type="checkbox" checked={unresolvedOnly} onChange={(e) => setUnresolvedOnly(e.target.checked)} className="size-4 accent-primary" />
            Non résolus seulement
          </label>
          <button
            onClick={() => setCreateOpen(true)}
            className="px-4 py-2 rounded-lg bg-primary text-text-main font-black text-sm flex items-center gap-2 hover:bg-[#0fd651]"
          >
            <span className="material-symbols-outlined text-[18px]">report</span>
            Déclarer un incident
          </button>
        </div>
      </div>

      {error && <div className="text-red-600 text-xs font-bold bg-red-50 dark:bg-red-900/30 p-2 rounded">{error}</div>}

      {loading ? (
        <div className="text-center py-10"><span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span></div>
      ) : incidents.length === 0 ? (
        <p className="text-text-muted text-center py-10">Aucun incident.</p>
      ) : (
        <div className="space-y-3">
          {incidents.map((i) => {
            const resolved = !!i.resolvedAt;
            return (
              <div key={i.id} className="bg-white dark:bg-surface-dark rounded-xl border border-gray-100 dark:border-gray-800 shadow-subtle p-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${KIND_COLORS[i.kind]}`}>{KIND_LABELS[i.kind]}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${SEVERITY_COLORS[i.severity]}`}>{i.severity}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${resolved ? 'bg-gray-100 text-gray-600' : 'bg-red-100 text-red-700'}`}>
                      {resolved ? 'Résolu' : 'Ouvert'}
                    </span>
                    <span className="text-xs text-text-muted">{new Date(i.createdAt).toLocaleString('fr-FR')}</span>
                  </div>
                  <div className="flex gap-2">
                    {!resolved && (
                      <button onClick={() => setResolving(i)} className="px-3 py-1 rounded-lg text-xs font-black bg-primary text-text-main hover:bg-[#0fd651]">
                        Résoudre
                      </button>
                    )}
                    {resolved && (
                      <button onClick={() => reopen(i)} className="px-3 py-1 rounded-lg text-xs font-black bg-gray-100 dark:bg-gray-800 text-text-main dark:text-white hover:bg-gray-200">
                        Rouvrir
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-sm text-text-main dark:text-white mt-3">{i.description}</p>
                <div className="text-xs text-text-muted mt-2 flex flex-wrap gap-3">
                  {i.reportedBy && <span>par <strong className="text-text-main dark:text-white">{i.reportedBy.name}</strong></span>}
                  {i.departure?.route && (
                    <span>
                      Départ: <strong className="text-text-main dark:text-white">{i.departure.route.originCity?.name} → {i.departure.route.destinationCity?.name}</strong>
                      {i.departure.departureAt && ` (${new Date(i.departure.departureAt).toLocaleDateString('fr-FR')})`}
                    </span>
                  )}
                </div>
                {resolved && i.resolutionNote && (
                  <div className="mt-2 text-xs text-text-muted bg-gray-50 dark:bg-gray-900/50 rounded p-2">
                    <strong className="text-text-main dark:text-white">Résolution:</strong> {i.resolutionNote}
                    {i.resolvedBy && <span> · {i.resolvedBy.name}</span>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {createOpen && (
        <IncidentForm
          agencyId={agencyId}
          onClose={() => setCreateOpen(false)}
          onSaved={async () => { setCreateOpen(false); await refetch(); }}
        />
      )}
      {resolving && (
        <ResolveForm
          incident={resolving}
          onClose={() => setResolving(null)}
          onSaved={async () => { setResolving(null); await refetch(); }}
        />
      )}
    </section>
  );
};

const IncidentForm: React.FC<{ agencyId?: string; onClose: () => void; onSaved: () => void }> = ({ agencyId, onClose, onSaved }) => {
  const [agencies, setAgencies] = useState<{ id: string; name: string }[]>([]);
  const [selectedAgencyId, setSelectedAgencyId] = useState<string>(agencyId ?? '');
  const [kind, setKind] = useState<IncidentKind>('BREAKDOWN');
  const [severity, setSeverity] = useState<IncidentSeverity>('MEDIUM');
  const [description, setDescription] = useState('');
  const [departureId, setDepartureId] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [driverId, setDriverId] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (agencyId) return;
    fetch('/api/agencies')
      .then((r) => r.json())
      .then((j) => {
        const list = (j.data ?? []) as { id: string; name: string }[];
        setAgencies(list);
        if (!selectedAgencyId && list[0]) setSelectedAgencyId(list[0].id);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agencyId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError(null);
    try {
      const res = await fetch('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agencyId: selectedAgencyId,
          kind,
          severity,
          description,
          departureId: departureId || undefined,
          vehicleId: vehicleId || undefined,
          driverId: driverId || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erreur');
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminModal title="Déclarer un incident" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        {!agencyId && (
          <Field label="Agence">
            <select required value={selectedAgencyId} onChange={(e) => setSelectedAgencyId(e.target.value)} className={inputCls}>
              {agencies.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </Field>
        )}
        <div className="grid md:grid-cols-2 gap-3">
          <Field label="Type">
            <select value={kind} onChange={(e) => setKind(e.target.value as IncidentKind)} className={inputCls}>
              {(Object.entries(KIND_LABELS) as [IncidentKind, string][]).map(([k, l]) => (
                <option key={k} value={k}>{l}</option>
              ))}
            </select>
          </Field>
          <Field label="Gravité">
            <select value={severity} onChange={(e) => setSeverity(e.target.value as IncidentSeverity)} className={inputCls}>
              {(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const).map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Description">
          <textarea required minLength={3} value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className={inputCls + ' h-auto py-2'} />
        </Field>
        <div className="grid md:grid-cols-3 gap-3">
          <Field label="ID Départ (optionnel)">
            <input value={departureId} onChange={(e) => setDepartureId(e.target.value)} className={inputCls + ' font-mono'} />
          </Field>
          <Field label="ID Véhicule (optionnel)">
            <input value={vehicleId} onChange={(e) => setVehicleId(e.target.value)} className={inputCls + ' font-mono'} />
          </Field>
          <Field label="ID Chauffeur (optionnel)">
            <input value={driverId} onChange={(e) => setDriverId(e.target.value)} className={inputCls + ' font-mono'} />
          </Field>
        </div>
        {error && <div className="text-red-600 text-xs font-bold bg-red-50 p-2 rounded">{error}</div>}
        <div className="flex gap-2 justify-end pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-text-muted font-black text-sm">Annuler</button>
          <button type="submit" disabled={saving || !selectedAgencyId} className="px-4 py-2 rounded-lg bg-primary text-text-main font-black text-sm disabled:opacity-50">
            {saving ? 'Enregistrement…' : 'Déclarer'}
          </button>
        </div>
      </form>
    </AdminModal>
  );
};

const ResolveForm: React.FC<{ incident: Incident; onClose: () => void; onSaved: () => void }> = ({ incident, onClose, onSaved }) => {
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError(null);
    try {
      const res = await fetch(`/api/incidents/${incident.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolve: true, resolutionNote: note }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erreur');
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminModal title="Résoudre l'incident" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Note de résolution">
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={4} className={inputCls + ' h-auto py-2'} placeholder="Comment l'incident a-t-il été résolu ?" />
        </Field>
        {error && <div className="text-red-600 text-xs font-bold bg-red-50 p-2 rounded">{error}</div>}
        <div className="flex gap-2 justify-end pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-text-muted font-black text-sm">Annuler</button>
          <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-primary text-text-main font-black text-sm disabled:opacity-50">
            {saving ? 'Enregistrement…' : 'Marquer résolu'}
          </button>
        </div>
      </form>
    </AdminModal>
  );
};

export default IncidentPanel;
