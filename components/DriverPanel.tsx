'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import AdminModal from './AdminModal';
import { Field, inputCls } from './SuperAdminDashboard';

type LicenseCategory = 'B' | 'C' | 'D' | 'D1' | 'DE';

interface Driver {
  id: string;
  agencyId: string;
  fullName: string;
  phone?: string | null;
  licenseNumber: string;
  licenseCategory: LicenseCategory;
  licenseExpiresAt: string;
  status: 'ACTIVE' | 'INACTIVE';
  agency?: { id: string; name: string } | null;
}

interface AgencyOption {
  id: string;
  name: string;
}

interface Props {
  agencyId?: string;
  companyId?: string;
}

const DriverPanel: React.FC<Props> = ({ agencyId, companyId }) => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [agencies, setAgencies] = useState<AgencyOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Driver | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (agencyId) params.set('agencyId', agencyId);
      else if (companyId) params.set('companyId', companyId);
      const res = await fetch(`/api/drivers${params.toString() ? `?${params}` : ''}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erreur');
      setDrivers(json.data ?? []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setLoading(false);
    }
  }, [agencyId, companyId]);

  useEffect(() => { refetch(); }, [refetch]);

  useEffect(() => {
    if (agencyId) {
      setAgencies([{ id: agencyId, name: '' }]);
      return;
    }
    const url = companyId ? `/api/agencies?companyId=${companyId}` : '/api/agencies';
    fetch(url)
      .then((r) => r.json())
      .then((j) => setAgencies((j.data ?? []).map((a: { id: string; name: string }) => ({ id: a.id, name: a.name }))));
  }, [agencyId, companyId]);

  const disable = async (d: Driver) => {
    if (!confirm(`Désactiver ${d.fullName} ?`)) return;
    const res = await fetch(`/api/drivers/${d.id}`, { method: 'DELETE' });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      alert(json.error || 'Impossible de désactiver.');
      return;
    }
    await refetch();
  };

  const now = new Date();

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="font-black text-lg text-text-main dark:text-white">Chauffeurs ({drivers.length})</h2>
        <button
          onClick={() => setCreateOpen(true)}
          disabled={agencies.length === 0 && !agencyId}
          className="px-4 py-2 rounded-lg bg-primary text-text-main font-black text-sm flex items-center gap-2 hover:bg-[#0fd651] disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Nouveau chauffeur
        </button>
      </div>

      {error && <div className="text-red-600 text-xs font-bold bg-red-50 dark:bg-red-900/30 p-2 rounded">{error}</div>}

      {loading ? (
        <div className="text-center py-10"><span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span></div>
      ) : drivers.length === 0 ? (
        <p className="text-text-muted text-center py-10">Aucun chauffeur.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {drivers.map((d) => {
            const expiresAt = new Date(d.licenseExpiresAt);
            const expired = expiresAt < now;
            const expiresSoon = !expired && expiresAt.getTime() - now.getTime() < 30 * 24 * 3600 * 1000;
            return (
              <div key={d.id} className={`bg-white dark:bg-surface-dark rounded-xl border shadow-subtle p-4 ${d.status === 'INACTIVE' ? 'border-gray-300 opacity-60' : 'border-gray-100 dark:border-gray-800'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-black text-text-main dark:text-white">{d.fullName}</div>
                    <div className="text-xs text-text-muted">{d.phone || '—'}</div>
                    {d.agency && <div className="text-[10px] font-black text-text-muted uppercase tracking-widest mt-1">{d.agency.name}</div>}
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${d.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>{d.status}</span>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                  <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-black">Cat. {d.licenseCategory}</span>
                  <span className="font-mono text-text-muted">{d.licenseNumber}</span>
                  <span className={`font-black ${expired ? 'text-red-600' : expiresSoon ? 'text-orange-600' : 'text-text-muted'}`}>
                    Permis {expired ? 'expiré le' : 'expire le'} {expiresAt.toLocaleDateString('fr-FR')}
                  </span>
                </div>
                <div className="mt-3 flex gap-2 justify-end">
                  <button onClick={() => setEditing(d)} className="px-3 py-1 rounded-lg text-xs font-black bg-gray-100 dark:bg-gray-800 text-text-main dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700">Éditer</button>
                  {d.status === 'ACTIVE' && (
                    <button onClick={() => disable(d)} className="px-3 py-1 rounded-lg text-xs font-black bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/20">Désactiver</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {createOpen && (
        <DriverForm
          mode="create"
          agencyId={agencyId}
          agencies={agencies}
          onClose={() => setCreateOpen(false)}
          onSaved={async () => { setCreateOpen(false); await refetch(); }}
        />
      )}
      {editing && (
        <DriverForm
          mode="edit"
          driver={editing}
          agencyId={agencyId}
          agencies={agencies}
          onClose={() => setEditing(null)}
          onSaved={async () => { setEditing(null); await refetch(); }}
        />
      )}
    </section>
  );
};

const DriverForm: React.FC<{
  mode: 'create' | 'edit';
  driver?: Driver;
  agencyId?: string;
  agencies: AgencyOption[];
  onClose: () => void;
  onSaved: () => void;
}> = ({ mode, driver, agencyId, agencies, onClose, onSaved }) => {
  const initialAgency = useMemo(
    () => driver?.agencyId ?? agencyId ?? agencies[0]?.id ?? '',
    [driver?.agencyId, agencyId, agencies],
  );
  const [selectedAgencyId, setSelectedAgencyId] = useState<string>(initialAgency);
  const [fullName, setFullName] = useState(driver?.fullName ?? '');
  const [phone, setPhone] = useState(driver?.phone ?? '');
  const [licenseNumber, setLicenseNumber] = useState(driver?.licenseNumber ?? '');
  const [licenseCategory, setLicenseCategory] = useState<LicenseCategory>(driver?.licenseCategory ?? 'D');
  const [licenseExpiresAt, setLicenseExpiresAt] = useState(
    driver?.licenseExpiresAt ? driver.licenseExpiresAt.slice(0, 10) : '',
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError(null);
    try {
      const expiresIso = licenseExpiresAt ? new Date(`${licenseExpiresAt}T00:00:00.000Z`).toISOString() : '';
      const url = mode === 'create' ? '/api/drivers' : `/api/drivers/${driver!.id}`;
      const method = mode === 'create' ? 'POST' : 'PATCH';
      const body =
        mode === 'create'
          ? {
              agencyId: selectedAgencyId,
              fullName,
              phone: phone || undefined,
              licenseNumber,
              licenseCategory,
              licenseExpiresAt: expiresIso,
            }
          : {
              fullName,
              phone: phone || undefined,
              licenseNumber,
              licenseCategory,
              licenseExpiresAt: expiresIso || undefined,
            };
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erreur');
      onSaved();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  const showAgencySelect = mode === 'create' && !agencyId && agencies.length > 0;

  return (
    <AdminModal title={mode === 'create' ? 'Nouveau chauffeur' : 'Éditer le chauffeur'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        {showAgencySelect && (
          <Field label="Agence">
            <select required value={selectedAgencyId} onChange={(e) => setSelectedAgencyId(e.target.value)} className={inputCls}>
              {agencies.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </Field>
        )}
        <Field label="Nom complet">
          <input required value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputCls} placeholder="Jean Dupont" />
        </Field>
        <div className="grid md:grid-cols-2 gap-3">
          <Field label="Téléphone">
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} placeholder="+237 6..." />
          </Field>
          <Field label="Catégorie de permis">
            <select value={licenseCategory} onChange={(e) => setLicenseCategory(e.target.value as LicenseCategory)} className={inputCls}>
              {(['B', 'C', 'D', 'D1', 'DE'] as const).map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          <Field label="Numéro de permis">
            <input required value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} className={inputCls + ' font-mono'} />
          </Field>
          <Field label="Date d'expiration">
            <input required={mode === 'create'} type="date" value={licenseExpiresAt} onChange={(e) => setLicenseExpiresAt(e.target.value)} className={inputCls} />
          </Field>
        </div>
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

export default DriverPanel;
