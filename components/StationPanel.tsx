'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import AdminModal from './AdminModal';
import { Field, inputCls } from './SuperAdminDashboard';

interface City {
  id: string;
  name: string;
  region?: string;
}

interface Station {
  id: string;
  name: string;
  address?: string | null;
  agencyId: string;
  cityId: string;
  city: { id: string; name: string };
  agency: { id: string; name: string };
}

interface AgencyOption {
  id: string;
  name: string;
}

interface Props {
  agencyId?: string;
  companyId?: string;
  cities: City[];
}

const StationPanel: React.FC<Props> = ({ agencyId, companyId, cities }) => {
  const [stations, setStations] = useState<Station[]>([]);
  const [agencies, setAgencies] = useState<AgencyOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Station | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (agencyId) params.set('agencyId', agencyId);
      const res = await fetch(`/api/stations${params.toString() ? `?${params}` : ''}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erreur');
      let list = (json.data ?? []) as Station[];
      if (!agencyId && companyId) {
        const agUrl = `/api/agencies?companyId=${companyId}`;
        const agRes = await fetch(agUrl);
        const agJson = await agRes.json();
        const ids = new Set(((agJson.data ?? []) as { id: string }[]).map((a) => a.id));
        list = list.filter((s) => ids.has(s.agencyId));
      }
      setStations(list);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setLoading(false);
    }
  }, [agencyId, companyId]);

  useEffect(() => { refetch(); }, [refetch]);

  useEffect(() => {
    if (agencyId) return;
    const url = companyId ? `/api/agencies?companyId=${companyId}` : '/api/agencies';
    fetch(url)
      .then((r) => r.json())
      .then((j) => setAgencies((j.data ?? []).map((a: { id: string; name: string }) => ({ id: a.id, name: a.name }))));
  }, [agencyId, companyId]);

  const remove = async (s: Station) => {
    if (!confirm(`Supprimer la station "${s.name}" ?`)) return;
    const res = await fetch(`/api/stations/${s.id}`, { method: 'DELETE' });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      alert(j.error || 'Impossible de supprimer.');
      return;
    }
    await refetch();
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="font-black text-lg text-text-main dark:text-white">Stations ({stations.length})</h2>
        <button
          onClick={() => setCreateOpen(true)}
          disabled={!agencyId && agencies.length === 0}
          className="px-4 py-2 rounded-lg bg-primary text-text-main font-black text-sm flex items-center gap-2 hover:bg-[#0fd651] disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Nouvelle station
        </button>
      </div>

      {error && <div className="text-red-600 text-xs font-bold bg-red-50 dark:bg-red-900/30 p-2 rounded">{error}</div>}

      {loading ? (
        <div className="text-center py-10"><span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span></div>
      ) : stations.length === 0 ? (
        <p className="text-text-muted text-center py-10">Aucune station.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {stations.map((s) => (
            <div key={s.id} className="bg-white dark:bg-surface-dark rounded-xl border border-gray-100 dark:border-gray-800 shadow-subtle p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-black text-text-main dark:text-white">{s.name}</div>
                  <div className="text-xs text-text-muted">{s.city.name} • {s.agency.name}</div>
                  {s.address && <div className="text-xs text-text-muted mt-1">{s.address}</div>}
                </div>
                <div className="flex flex-col gap-1">
                  <button onClick={() => setEditing(s)} className="px-3 py-1 rounded-lg text-xs font-black bg-gray-100 dark:bg-gray-800 text-text-main dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700">Éditer</button>
                  <button onClick={() => remove(s)} className="px-3 py-1 rounded-lg text-xs font-black bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/20">Supprimer</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {createOpen && (
        <StationForm
          mode="create"
          agencyId={agencyId}
          agencies={agencies}
          cities={cities}
          onClose={() => setCreateOpen(false)}
          onSaved={async () => { setCreateOpen(false); await refetch(); }}
        />
      )}
      {editing && (
        <StationForm
          mode="edit"
          station={editing}
          agencyId={agencyId}
          agencies={agencies}
          cities={cities}
          onClose={() => setEditing(null)}
          onSaved={async () => { setEditing(null); await refetch(); }}
        />
      )}
    </section>
  );
};

const StationForm: React.FC<{
  mode: 'create' | 'edit';
  station?: Station;
  agencyId?: string;
  agencies: AgencyOption[];
  cities: City[];
  onClose: () => void;
  onSaved: () => void;
}> = ({ mode, station, agencyId, agencies, cities, onClose, onSaved }) => {
  const initialAgencyId = useMemo(
    () => station?.agencyId ?? agencyId ?? agencies[0]?.id ?? '',
    [station?.agencyId, agencyId, agencies],
  );
  const [selectedAgencyId, setSelectedAgencyId] = useState(initialAgencyId);
  const [cityId, setCityId] = useState(station?.cityId ?? cities[0]?.id ?? '');
  const [name, setName] = useState(station?.name ?? '');
  const [address, setAddress] = useState(station?.address ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError(null);
    try {
      const url = mode === 'create' ? '/api/stations' : `/api/stations/${station!.id}`;
      const method = mode === 'create' ? 'POST' : 'PATCH';
      const body =
        mode === 'create'
          ? { agencyId: selectedAgencyId, cityId, name, address: address || undefined }
          : { name, address: address || null };
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
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

  const showAgencySelect = mode === 'create' && !agencyId && agencies.length > 0;

  return (
    <AdminModal title={mode === 'create' ? 'Nouvelle station' : 'Éditer la station'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        {showAgencySelect && (
          <Field label="Agence">
            <select required value={selectedAgencyId} onChange={(e) => setSelectedAgencyId(e.target.value)} className={inputCls}>
              {agencies.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </Field>
        )}
        {mode === 'create' && (
          <Field label="Ville">
            <select required value={cityId} onChange={(e) => setCityId(e.target.value)} className={inputCls}>
              {cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
        )}
        <Field label="Nom de la station">
          <input required value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="Ex: Gare routière de Bonaberi" />
        </Field>
        <Field label="Adresse">
          <input value={address} onChange={(e) => setAddress(e.target.value)} className={inputCls} />
        </Field>
        {error && <div className="text-red-600 text-xs font-bold bg-red-50 p-2 rounded">{error}</div>}
        <div className="flex gap-2 justify-end pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-text-muted font-black text-sm">Annuler</button>
          <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-primary text-text-main font-black text-sm disabled:opacity-50">
            {saving ? 'Enregistrement…' : mode === 'create' ? 'Créer' : 'Enregistrer'}
          </button>
        </div>
      </form>
    </AdminModal>
  );
};

export default StationPanel;
