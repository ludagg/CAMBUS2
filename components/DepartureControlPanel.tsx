'use client';

import { todayLocal } from '../lib/datetime';
import React, { useEffect, useState } from 'react';

type Departure = {
  id: string;
  agencyName: string;
  company: string;
  brandColor: string;
  from: string;
  to: string;
  departureAt: string;
  seatsTotal: number;
  seatsAvailable: number;
  vehiclePlate: string | null;
  tripStatus: string;
  delayMinutes: number | null;
  cancellationReason: string | null;
  bookingsCount: number;
};

const DepartureControlPanel: React.FC = () => {
  const today = todayLocal();
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const [list, setList] = useState<Departure[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionOn, setActionOn] = useState<string | null>(null);
  const [delayInput, setDelayInput] = useState(30);
  const [reason, setReason] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = () => {
    setLoading(true);
    fetch(`/api/admin/departures-list?from=${from}&to=${to}`)
      .then(async (r) => {
        const j = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(j.error || 'Impossible de charger les départs.');
        return j;
      })
      .then((j) => setList(j.data ?? []))
      .catch((e: Error) => setMsg(`✖ ${e.message}`))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to]);

  const patch = async (id: string, action: 'DELAY' | 'CANCEL' | 'RESET') => {
    if (busy) return;
    setBusy(true);
    setMsg(null);
    try {
      await doPatch(id, action);
    } catch (e) {
      setMsg(`✖ ${(e as Error).message || 'Erreur réseau'}`);
    } finally {
      setBusy(false);
    }
  };

  const doPatch = async (id: string, action: 'DELAY' | 'CANCEL' | 'RESET') => {
    const payload: Record<string, unknown> = { action }
    if (action === 'DELAY') payload.delayMinutes = delayInput
    if (action !== 'RESET' && reason.trim()) payload.reason = reason.trim()
    const res = await fetch(`/api/departures/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMsg(`✖ ${json.error || 'Erreur'}`);
      return;
    }
    setMsg(
      action === 'DELAY'
        ? `✔ Retard de ${delayInput}min enregistré — passagers notifiés.`
        : action === 'CANCEL'
          ? '✔ Départ annulé — passagers notifiés et billets annulés.'
          : '✔ Statut remis à "prévu".',
    );
    setActionOn(null);
    setReason('');
    load();
  };

  return (
    <div className="bg-white dark:bg-surface-dark rounded-xl border border-gray-100 dark:border-gray-800 p-4">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
        <h2 className="font-black text-text-main dark:text-white flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">schedule</span>
          Gestion des départs
        </h2>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="rounded-lg border border-gray-200 dark:border-gray-700 px-2 py-1 text-xs font-black bg-white dark:bg-background-dark text-text-main dark:text-white"
          />
          <span className="text-xs text-text-muted">→</span>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="rounded-lg border border-gray-200 dark:border-gray-700 px-2 py-1 text-xs font-black bg-white dark:bg-background-dark text-text-main dark:text-white"
          />
        </div>
      </div>

      {msg && (
        <div
          className={`mb-3 px-3 py-2 rounded-lg text-xs font-black ${
            msg.startsWith('✔')
              ? 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300'
              : 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300'
          }`}
        >
          {msg}
        </div>
      )}

      {loading ? (
        <div className="text-text-muted text-sm py-6 text-center">Chargement…</div>
      ) : list.length === 0 ? (
        <div className="text-text-muted text-sm py-6 text-center">Aucun départ sur la période.</div>
      ) : (
        <div className="space-y-2">
          {list.map((d) => (
            <div
              key={d.id}
              className={`rounded-lg border p-3 text-xs ${
                d.tripStatus === 'CANCELLED'
                  ? 'border-red-200 dark:border-red-800 bg-red-50/40 dark:bg-red-950/20'
                  : d.tripStatus === 'DELAYED'
                    ? 'border-orange-200 dark:border-orange-800 bg-orange-50/40 dark:bg-orange-950/20'
                    : 'border-gray-100 dark:border-gray-800'
              }`}
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <div className="font-black text-text-main dark:text-white">
                    {new Date(d.departureAt).toLocaleString('fr-FR', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}{' '}
                    · {d.from} → {d.to}
                  </div>
                  <div className="text-text-muted">
                    {d.company} · {d.agencyName} · {d.vehiclePlate ?? 'véhicule non assigné'} ·{' '}
                    {d.seatsTotal - d.seatsAvailable}/{d.seatsTotal} places ({d.bookingsCount}{' '}
                    billets)
                  </div>
                  {d.tripStatus !== 'SCHEDULED' && (
                    <div className="mt-1">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          d.tripStatus === 'CANCELLED'
                            ? 'bg-red-200 text-red-800'
                            : 'bg-orange-200 text-orange-800'
                        }`}
                      >
                        {d.tripStatus}
                        {d.delayMinutes ? ` · ${d.delayMinutes}min` : ''}
                      </span>
                      {d.cancellationReason && (
                        <span className="ml-2 text-text-muted italic">
                          {d.cancellationReason}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <a
                    href={`/admin/manifest/${d.id}/print`}
                    target="_blank"
                    rel="noopener"
                    className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-[10px] font-black flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-sm">print</span>
                    Manifeste
                  </a>
                  {d.tripStatus === 'SCHEDULED' ? (
                    <button
                      onClick={() => { setReason(''); setActionOn(actionOn === d.id ? null : d.id); }}
                      className="px-2 py-1 rounded bg-orange-500/20 text-orange-700 dark:text-orange-300 text-[10px] font-black"
                    >
                      Retard / Annuler
                    </button>
                  ) : (
                    <button
                      onClick={() => patch(d.id, 'RESET')}
                      disabled={busy}
                      className="px-2 py-1 rounded bg-blue-500/20 text-blue-700 dark:text-blue-300 text-[10px] font-black"
                    >
                      Rétablir
                    </button>
                  )}
                </div>
              </div>

              {actionOn === d.id && (
                <div className="mt-3 p-3 rounded bg-white dark:bg-background-dark border border-gray-200 dark:border-gray-700 space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={delayInput}
                      onChange={(e) => setDelayInput(Number(e.target.value))}
                      className="w-24 rounded border border-gray-200 dark:border-gray-700 px-2 py-1 text-xs bg-white dark:bg-background-dark text-text-main dark:text-white"
                    />
                    <span className="text-[10px] text-text-muted">min de retard</span>
                    <button
                      onClick={() => patch(d.id, 'DELAY')}
                      disabled={busy}
                      className="px-2 py-1 rounded bg-orange-500 text-white text-[10px] font-black"
                    >
                      Marquer retardé
                    </button>
                  </div>
                  <input
                    placeholder="Motif (optionnel) — envoyé aux passagers"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full rounded border border-gray-200 dark:border-gray-700 px-2 py-1 text-xs bg-white dark:bg-background-dark text-text-main dark:text-white"
                  />
                  <button
                    onClick={() => {
                      if (
                        confirm(
                          `Annuler le départ ${d.from} → ${d.to} ? Tous les billets seront annulés et les passagers notifiés.`,
                        )
                      ) {
                        patch(d.id, 'CANCEL');
                      }
                    }}
                    className="w-full px-2 py-1 rounded bg-red-600 text-white text-[10px] font-black"
                  >
                    Annuler le départ
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DepartureControlPanel;
