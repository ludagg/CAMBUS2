'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Field, inputCls } from './SuperAdminDashboard';

interface AuditEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  actorRole?: string | null;
  createdAt: string;
  metadata?: Record<string, unknown> | null;
  actor?: { id: string; name: string; email: string; role: string } | null;
}

interface UserOption { id: string; name: string; email: string; }

const ENTITY_TYPES = ['', 'Company', 'Agency', 'Station', 'City', 'Driver', 'Vehicle', 'Route', 'Departure', 'Booking', 'BookingGroup', 'Payment', 'WaitlistEntry', 'Incident', 'CancellationPolicy', 'User'];

const AuditLogPanel: React.FC = () => {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [actionFilter, setActionFilter] = useState('');
  const [entityType, setEntityType] = useState('');
  const [actorUserId, setActorUserId] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/users')
      .then((r) => r.json())
      .then((j) => setUsers((j.data ?? []).map((u: UserOption) => ({ id: u.id, name: u.name, email: u.email }))))
      .catch(() => {});
  }, []);

  const buildParams = (before?: string) => {
    const params = new URLSearchParams({ limit: '50' });
    if (actionFilter) params.set('action', actionFilter);
    if (entityType) params.set('entityType', entityType);
    if (actorUserId) params.set('actorUserId', actorUserId);
    if (before) params.set('before', before);
    return params;
  };

  const refetch = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const params = buildParams();
      const res = await fetch(`/api/audit?${params}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erreur');
      setEntries(json.data ?? []);
      setNextCursor(json.nextCursor ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actionFilter, entityType, actorUserId]);

  useEffect(() => { refetch(); }, [refetch]);

  const loadMore = async () => {
    if (!nextCursor) return;
    setLoadingMore(true);
    try {
      const params = buildParams(nextCursor);
      const res = await fetch(`/api/audit?${params}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erreur');
      setEntries((prev) => [...prev, ...((json.data ?? []) as AuditEntry[])]);
      setNextCursor(json.nextCursor ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <section className="space-y-4">
      <h2 className="font-black text-lg text-text-main dark:text-white">Journal d'audit</h2>

      <div className="grid md:grid-cols-3 gap-3">
        <Field label="Action contient">
          <input value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} placeholder="ex: company.update" className={inputCls + ' font-mono'} />
        </Field>
        <Field label="Type d'entité">
          <select value={entityType} onChange={(e) => setEntityType(e.target.value)} className={inputCls}>
            {ENTITY_TYPES.map((t) => <option key={t} value={t}>{t || '— Tous —'}</option>)}
          </select>
        </Field>
        <Field label="Acteur">
          <select value={actorUserId} onChange={(e) => setActorUserId(e.target.value)} className={inputCls}>
            <option value="">— Tous —</option>
            {users.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
          </select>
        </Field>
      </div>

      {error && <div className="text-red-600 text-xs font-bold bg-red-50 p-2 rounded">{error}</div>}

      {loading ? (
        <div className="text-center py-10"><span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span></div>
      ) : entries.length === 0 ? (
        <p className="text-text-muted text-center py-10">Aucune entrée d'audit.</p>
      ) : (
        <div className="bg-white dark:bg-surface-dark rounded-xl border border-gray-100 dark:border-gray-800 shadow-subtle overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th className="text-left px-3 py-2 font-black uppercase tracking-wider text-text-muted">Date</th>
                <th className="text-left px-3 py-2 font-black uppercase tracking-wider text-text-muted">Acteur</th>
                <th className="text-left px-3 py-2 font-black uppercase tracking-wider text-text-muted">Action</th>
                <th className="text-left px-3 py-2 font-black uppercase tracking-wider text-text-muted">Entité</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id} className="border-t border-gray-100 dark:border-gray-800">
                  <td className="px-3 py-2 text-text-muted whitespace-nowrap">{new Date(e.createdAt).toLocaleString('fr-FR')}</td>
                  <td className="px-3 py-2">
                    {e.actor ? (
                      <div className="flex flex-col">
                        <span className="font-black text-text-main dark:text-white">{e.actor.name}</span>
                        <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[9px] font-black uppercase tracking-widest w-fit mt-0.5">{e.actor.role}</span>
                      </div>
                    ) : (
                      <span className="text-text-muted italic">Système</span>
                    )}
                  </td>
                  <td className="px-3 py-2 font-mono text-text-main dark:text-white">{e.action}</td>
                  <td className="px-3 py-2 text-text-muted">
                    <div className="font-black">{e.entityType}</div>
                    <div className="font-mono text-[10px]">{e.entityId}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {nextCursor && (
        <div className="flex justify-center">
          <button onClick={loadMore} disabled={loadingMore} className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-text-main dark:text-white font-black text-sm disabled:opacity-50">
            {loadingMore ? 'Chargement…' : 'Charger plus'}
          </button>
        </div>
      )}
    </section>
  );
};

export default AuditLogPanel;
