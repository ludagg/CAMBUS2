'use client';

import React, { useCallback, useEffect, useState } from 'react';

type WaitlistStatus = 'WAITING' | 'NOTIFIED' | 'PROMOTED' | 'EXPIRED' | 'CANCELLED';

interface WaitlistEntry {
  id: string;
  passengerFullName: string;
  email?: string | null;
  phone?: string | null;
  seatsRequested: number;
  status: WaitlistStatus;
  createdAt: string;
  user?: { id: string; name: string; email: string } | null;
  departure?: {
    id: string;
    departureAt: string;
    route?: {
      originCity?: { name: string } | null;
      destinationCity?: { name: string } | null;
    } | null;
  } | null;
}

const STATUS_COLORS: Record<WaitlistStatus, string> = {
  WAITING: 'bg-amber-100 text-amber-700',
  NOTIFIED: 'bg-sky-100 text-sky-700',
  PROMOTED: 'bg-green-100 text-green-700',
  EXPIRED: 'bg-gray-200 text-gray-600',
  CANCELLED: 'bg-gray-200 text-gray-600',
};

interface Props {
  agencyId?: string;
}

const WaitlistPanel: React.FC<Props> = ({ agencyId }) => {
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<WaitlistStatus | ''>('');

  const refetch = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const params = new URLSearchParams();
      if (agencyId) params.set('agencyId', agencyId);
      if (statusFilter) params.set('status', statusFilter);
      const res = await fetch(`/api/admin/waitlist${params.toString() ? `?${params}` : ''}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erreur');
      setEntries(json.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setLoading(false);
    }
  }, [agencyId, statusFilter]);

  useEffect(() => { refetch(); }, [refetch]);

  const cancel = async (entry: WaitlistEntry) => {
    if (!confirm(`Annuler l'inscription de ${entry.passengerFullName} ?`)) return;
    const res = await fetch(`/api/waitlist/${entry.id}`, { method: 'DELETE' });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      alert(j.error || 'Impossible d\'annuler.');
      return;
    }
    await refetch();
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="font-black text-lg text-text-main dark:text-white">Liste d'attente ({entries.length})</h2>
        <div className="flex gap-1 p-1 rounded-full bg-gray-100 dark:bg-gray-800 text-xs font-black overflow-x-auto">
          {(['', 'WAITING', 'NOTIFIED', 'PROMOTED', 'EXPIRED', 'CANCELLED'] as const).map((s) => (
            <button
              key={s || 'ALL'}
              onClick={() => setStatusFilter(s as WaitlistStatus | '')}
              className={`px-3 py-1.5 rounded-full whitespace-nowrap transition-colors ${
                statusFilter === s ? 'bg-primary text-text-main' : 'text-text-muted hover:text-text-main'
              }`}
            >
              {s || 'Tous'}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="text-red-600 text-xs font-bold bg-red-50 dark:bg-red-900/30 p-2 rounded">{error}</div>}

      {loading ? (
        <div className="text-center py-10"><span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span></div>
      ) : entries.length === 0 ? (
        <p className="text-text-muted text-center py-10">Aucune entrée.</p>
      ) : (
        <div className="space-y-2">
          {entries.map((e) => (
            <div key={e.id} className="bg-white dark:bg-surface-dark rounded-xl border border-gray-100 dark:border-gray-800 shadow-subtle p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <div className="font-black text-text-main dark:text-white">{e.passengerFullName}</div>
                  <div className="text-xs text-text-muted">{e.email ?? '—'}{e.phone ? ` • ${e.phone}` : ''}</div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${STATUS_COLORS[e.status]}`}>{e.status}</span>
              </div>
              {e.departure?.route && (
                <div className="text-xs text-text-muted mt-2">
                  Départ: <strong className="text-text-main dark:text-white">{e.departure.route.originCity?.name} → {e.departure.route.destinationCity?.name}</strong>
                  {e.departure.departureAt && ` • ${new Date(e.departure.departureAt).toLocaleString('fr-FR')}`}
                </div>
              )}
              <div className="text-xs text-text-muted mt-1">
                {e.seatsRequested} place(s) demandée(s) • inscrit le {new Date(e.createdAt).toLocaleDateString('fr-FR')}
              </div>
              {(e.status === 'WAITING' || e.status === 'NOTIFIED') && (
                <div className="mt-2 flex justify-end">
                  <button onClick={() => cancel(e)} className="px-3 py-1 rounded-lg text-xs font-black bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/20">
                    Annuler
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default WaitlistPanel;
