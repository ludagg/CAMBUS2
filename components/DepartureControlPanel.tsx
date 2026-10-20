'use client';

import { localDateKey, todayLocal } from '../lib/datetime';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  Field,
  Input,
  InlineAlert,
  SegmentedControl,
  Skeleton,
  StatCard,
  StatusBadge,
  Textarea,
  Dialog,
  cx,
  useConfirm,
  useToast,
} from './admin/ui';

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

type Action = 'DELAY' | 'CANCEL' | 'RESET';
type RangeKey = 'today' | 'tomorrow' | 'week' | 'custom';

const DELAY_CHIPS = [15, 30, 45, 60, 90];
const DAY_MS = 24 * 60 * 60 * 1000;

const timeOf = (iso: string) =>
  new Date(iso).toLocaleTimeString('fr-FR', { timeZone: 'Africa/Douala', hour: '2-digit', minute: '2-digit' });
const dayOf = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { timeZone: 'Africa/Douala', weekday: 'short', day: '2-digit', month: 'short' });

const DepartureControlPanel: React.FC = () => {
  const today = todayLocal();
  const tomorrow = localDateKey(new Date(Date.now() + DAY_MS));
  const weekEnd = localDateKey(new Date(Date.now() + 6 * DAY_MS));

  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const [list, setList] = useState<Departure[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [action, setAction] = useState<{ id: string; kind: 'DELAY' | 'CANCEL' } | null>(null);
  const [delayInput, setDelayInput] = useState('30');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const confirmingRef = useRef(false);
  const toast = useToast();
  const { confirm, dialog } = useConfirm();

  const range: RangeKey =
    from === today && to === today
      ? 'today'
      : from === tomorrow && to === tomorrow
        ? 'tomorrow'
        : from === today && to === weekEnd
          ? 'week'
          : 'custom';

  const setQuick = (r: RangeKey) => {
    if (r === 'today') {
      setFrom(today);
      setTo(today);
    } else if (r === 'tomorrow') {
      setFrom(tomorrow);
      setTo(tomorrow);
    } else if (r === 'week') {
      setFrom(today);
      setTo(weekEnd);
    }
  };

  // Only the latest request is applied: earlier in-flight requests are aborted.
  const load = useCallback(() => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setLoading(true);
    setError(null);
    fetch(`/api/admin/departures-list?from=${from}&to=${to}`, { signal: ac.signal })
      .then(async (r) => {
        const j = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(j.error || 'Impossible de charger les départs.');
        return j;
      })
      .then((j) => {
        if (ac.signal.aborted) return;
        setList(j.data ?? []);
        setLoading(false);
      })
      .catch((e: Error) => {
        if (ac.signal.aborted) return;
        setError(e.message || 'Impossible de charger les départs.');
        setLoading(false);
      });
  }, [from, to]);

  useEffect(() => {
    load();
    return () => abortRef.current?.abort();
  }, [load, attempt]);

  const delayMinutes = Math.max(0, Math.round(Number(delayInput) || 0));

  const doPatch = async (id: string, kind: Action) => {
    const payload: Record<string, unknown> = { action: kind };
    if (kind === 'DELAY') payload.delayMinutes = delayMinutes;
    if (kind !== 'RESET' && reason.trim()) payload.reason = reason.trim();
    const res = await fetch(`/api/departures/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast(json.error || 'Erreur', 'error');
      return;
    }
    toast(
      kind === 'DELAY'
        ? `Retard de ${delayMinutes} min enregistré — passagers notifiés.`
        : kind === 'CANCEL'
          ? 'Départ annulé — passagers notifiés et billets annulés.'
          : 'Statut remis à « prévu ».',
      'success',
    );
    setAction(null);
    setReason('');
    load();
  };

  const patch = async (id: string, kind: Action) => {
    if (busy) return;
    setBusy(true);
    try {
      await doPatch(id, kind);
    } catch (e) {
      toast((e as Error).message || 'Erreur réseau', 'error');
    } finally {
      setBusy(false);
    }
  };

  const openAction = (id: string, kind: 'DELAY' | 'CANCEL') => {
    setReason('');
    setAction({ id, kind });
  };

  const current = action ? list.find((d) => d.id === action.id) : undefined;

  const submitAction = async () => {
    if (!action || !current || busy) return;
    confirmingRef.current = true;
    const ok =
      action.kind === 'DELAY'
        ? await confirm({
            title: 'Notifier le retard ?',
            message: `Les passagers du départ ${current.from} → ${current.to} seront prévenus d'un retard de ${delayMinutes} min.`,
            confirmLabel: 'Notifier les passagers',
            tone: 'primary',
          })
        : await confirm({
            title: 'Annuler ce départ ?',
            message: `Le départ ${current.from} → ${current.to} de ${timeOf(current.departureAt)} sera annulé. Tous les billets seront annulés, les passagers prévenus et remboursés intégralement.`,
            confirmLabel: 'Annuler le départ',
            tone: 'danger',
          });
    confirmingRef.current = false;
    if (ok) await patch(action.id, action.kind);
  };

  const closeAction = useCallback(() => {
    if (confirmingRef.current || busy) return;
    setAction(null);
  }, [busy]);

  const delayed = list.filter((d) => d.tripStatus === 'DELAYED').length;
  const cancelled = list.filter((d) => d.tripStatus === 'CANCELLED').length;

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-wrap items-end gap-3">
        <SegmentedControl<RangeKey>
          label="Période rapide"
          value={range}
          onChange={setQuick}
          options={[
            { value: 'today', label: "Aujourd'hui" },
            { value: 'tomorrow', label: 'Demain' },
            { value: 'week', label: '7 jours' },
          ]}
        />
        <div className="flex items-end gap-2 flex-wrap">
          <Field label="Du" className="w-40">
            <Input type="date" value={from} max={to} onChange={(e) => e.target.value && setFrom(e.target.value)} />
          </Field>
          <span className="pb-2.5 text-text-muted" aria-hidden="true">→</span>
          <Field label="Au" className="w-40">
            <Input type="date" value={to} min={from} onChange={(e) => e.target.value && setTo(e.target.value)} />
          </Field>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard label="Départs" value={loading || error ? '—' : list.length} icon="directions_bus" hint="sur la période" />
        <StatCard label="Retardés" value={loading || error ? '—' : delayed} icon="schedule" tone="warning" hint="passagers prévenus" />
        <StatCard label="Annulés" value={loading || error ? '—' : cancelled} icon="event_busy" tone="danger" hint="billets remboursés" />
      </div>

      {error ? (
        <ErrorState message={error} onRetry={() => setAttempt((a) => a + 1)} />
      ) : loading ? (
        <div className="space-y-3" aria-busy="true" aria-label="Chargement">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <Card padded={false}>
          <EmptyState
            icon="event_available"
            title="Aucun départ sur la période"
            description="Essayez une autre date ou élargissez la période affichée."
            action={
              range !== 'week' && (
                <Button variant="secondary" icon="date_range" onClick={() => setQuick('week')}>
                  Voir les 7 prochains jours
                </Button>
              )
            }
          />
        </Card>
      ) : (
        <ul className="space-y-3">
          {list.map((d) => {
            const booked = d.seatsTotal - d.seatsAvailable;
            const pct = d.seatsTotal > 0 ? Math.round((booked / d.seatsTotal) * 100) : 0;
            const isCancelled = d.tripStatus === 'CANCELLED';
            const isDelayed = d.tripStatus === 'DELAYED';
            return (
              <li key={d.id}>
                <Card
                  className={cx(
                    '!p-4 md:!p-5',
                    isCancelled && 'border-red-200 dark:border-red-500/30',
                    isDelayed && 'border-amber-200 dark:border-amber-500/30',
                  )}
                >
                  <div className="flex flex-wrap items-start gap-x-6 gap-y-4">
                    {/* Time */}
                    <div className="w-24 shrink-0">
                      <div
                        className={cx(
                          'font-display text-3xl font-semibold tracking-tight tabular-nums text-text-main dark:text-white',
                          isCancelled && 'line-through decoration-red-400/70 text-text-muted dark:text-gray-500',
                        )}
                      >
                        {timeOf(d.departureAt)}
                      </div>
                      <div className="text-xs text-text-muted dark:text-gray-400 capitalize">{dayOf(d.departureAt)}</div>
                    </div>

                    {/* Route */}
                    <div className="min-w-[12rem] flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-display text-base font-semibold text-text-main dark:text-white">
                          {d.from} <span className="text-ink-400" aria-hidden="true">→</span>
                          <span className="sr-only"> vers </span> {d.to}
                        </span>
                        <StatusBadge status={d.tripStatus} />
                        {isDelayed && d.delayMinutes ? (
                          <span className="text-xs font-semibold text-amber-700 dark:text-amber-300 tabular-nums">+{d.delayMinutes} min</span>
                        ) : null}
                      </div>
                      <div className="mt-1 text-sm text-text-muted dark:text-gray-400">
                        <span style={{ color: d.brandColor || undefined }} className="font-medium">{d.company}</span>
                        {' · '}
                        {d.agencyName}
                      </div>
                      <div className="mt-0.5 text-xs text-text-muted dark:text-gray-500 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]" aria-hidden="true">directions_bus</span>
                        {d.vehiclePlate ?? 'véhicule non assigné'}
                      </div>
                      {isCancelled && d.cancellationReason && (
                        <p className="mt-2 text-xs italic text-red-700 dark:text-red-300">Motif : {d.cancellationReason}</p>
                      )}
                      {isDelayed && d.cancellationReason && (
                        <p className="mt-2 text-xs italic text-amber-700 dark:text-amber-300">Motif : {d.cancellationReason}</p>
                      )}
                    </div>

                    {/* Seats */}
                    <div className="w-44 shrink-0">
                      <div className="flex items-baseline justify-between text-xs">
                        <span className="text-text-muted dark:text-gray-400">Places</span>
                        <span className="font-semibold tabular-nums text-text-main dark:text-white">
                          {booked}/{d.seatsTotal}
                        </span>
                      </div>
                      <div
                        role="progressbar"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={pct}
                        aria-label={`Remplissage ${booked} sur ${d.seatsTotal} places`}
                        className="mt-1.5 h-2 rounded-full bg-ink-100 dark:bg-white/10 overflow-hidden"
                      >
                        <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                      </div>
                      <div className="mt-1.5 text-xs text-text-muted dark:text-gray-500 tabular-nums">
                        {d.bookingsCount} billet{d.bookingsCount > 1 ? 's' : ''} · {pct}%
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 pt-4 border-t border-ink-100 dark:border-white/10 flex flex-wrap items-center gap-2">
                    <a
                      href={`/admin/manifest/${d.id}/print`}
                      target="_blank"
                      rel="noopener"
                      className="inline-flex h-8 items-center gap-1.5 rounded-xl px-3 text-xs font-semibold tracking-tight text-text-main dark:text-gray-200 hover:bg-ink-100/70 dark:hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                    >
                      <span className="material-symbols-outlined text-[16px]" aria-hidden="true">print</span>
                      Manifeste
                    </a>
                    <span className="flex-1" />
                    {d.tripStatus === 'SCHEDULED' || isDelayed ? (
                      <>
                        <Button size="sm" variant="secondary" icon="schedule" disabled={busy} onClick={() => openAction(d.id, 'DELAY')}>
                          {isDelayed ? 'Modifier le retard' : 'Retard'}
                        </Button>
                        <Button size="sm" variant="danger" icon="event_busy" disabled={busy} onClick={() => openAction(d.id, 'CANCEL')}>
                          Annuler
                        </Button>
                      </>
                    ) : null}
                    {isDelayed && (
                      <Button size="sm" variant="secondary" icon="undo" disabled={busy} onClick={() => patch(d.id, 'RESET')}>
                        Rétablir
                      </Button>
                    )}
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      {action && current && (
        <Dialog
          size="sm"
          title={action.kind === 'DELAY' ? 'Signaler un retard' : 'Annuler le départ'}
          description={`${current.from} → ${current.to} · ${dayOf(current.departureAt)} ${timeOf(current.departureAt)}`}
          onClose={closeAction}
          footer={
            <>
              <Button variant="ghost" onClick={closeAction} disabled={busy}>
                Fermer
              </Button>
              {action.kind === 'DELAY' ? (
                <Button variant="primary" icon="notifications_active" loading={busy} disabled={delayMinutes <= 0} onClick={submitAction}>
                  Notifier le retard
                </Button>
              ) : (
                <Button variant="danger" icon="event_busy" loading={busy} onClick={submitAction}>
                  Annuler le départ
                </Button>
              )}
            </>
          }
        >
          <div className="space-y-4">
            {action.kind === 'DELAY' ? (
              <>
                <Field label="Minutes de retard">
                  <Input
                    type="number"
                    min={1}
                    max={720}
                    inputMode="numeric"
                    value={delayInput}
                    onChange={(e) => setDelayInput(e.target.value)}
                  />
                </Field>
                <div role="group" aria-label="Durées courantes" className="flex flex-wrap gap-2">
                  {DELAY_CHIPS.map((m) => (
                    <button
                      key={m}
                      type="button"
                      aria-pressed={delayMinutes === m}
                      onClick={() => setDelayInput(String(m))}
                      className={cx(
                        'h-8 rounded-full px-3 text-xs font-semibold tabular-nums border transition-colors',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60',
                        delayMinutes === m
                          ? 'bg-primary/15 border-primary/50 text-teal-accent dark:text-primary'
                          : 'border-ink-200 dark:border-white/15 text-text-muted hover:bg-ink-50 dark:hover:bg-white/10',
                      )}
                    >
                      {m} min
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <InlineAlert tone="warning">
                Les passagers seront prévenus et remboursés intégralement. Cette action annule tous les billets du départ.
              </InlineAlert>
            )}
            <Field
              label={action.kind === 'DELAY' ? 'Motif (optionnel)' : 'Motif de l’annulation (optionnel)'}
              hint="Envoyé aux passagers dans la notification."
            >
              <Textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ex. : panne mécanique, intempéries…" />
            </Field>
          </div>
        </Dialog>
      )}
      {dialog}
    </div>
  );
};

export default DepartureControlPanel;
