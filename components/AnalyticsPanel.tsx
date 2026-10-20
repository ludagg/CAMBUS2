'use client';

import React, { useEffect, useState } from 'react';
import {
  Card,
  CardHeader,
  EmptyState,
  ErrorState,
  SegmentedControl,
  Skeleton,
  StatCard,
  StatusBadge,
  Table,
  TD,
  TR,
  THead,
  Th,
  cx,
  formatXAF,
} from './admin/ui';

type Analytics = {
  rangeDays: number;
  totals: {
    revenueCents: number;
    bookings: number;
    counterRevenueCents: number;
    onlineRevenueCents: number;
    avgOccupancyPct: number;
  };
  daily: { date: string; revenue: number; bookings: number }[];
  topRoutes: { from: string; to: string; revenue: number; bookings: number }[];
  seatHeatmap: { seat: string; count: number }[];
  occupancy: {
    id: string;
    departureAt: string;
    from: string;
    to: string;
    seatsTotal: number;
    seatsBooked: number;
    occupancyPct: number;
    tripStatus: string;
  }[];
};

const fmtDay = (key: string) => {
  const [, m, d] = key.split('-');
  return d && m ? `${d}/${m}` : key;
};

const fmtCompact = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1).replace('.', ',')} M` : n >= 1000 ? `${Math.round(n / 1000)} k` : String(Math.round(n));

const AnalyticsPanel: React.FC = () => {
  const [data, setData] = useState<Analytics | null>(null);
  const [rangeDays, setRangeDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const ac = new AbortController();
    setLoading(true);
    setError(null);
    fetch(`/api/admin/analytics?rangeDays=${rangeDays}`, { signal: ac.signal })
      .then(async (r) => {
        const j: { data?: Analytics; error?: string } = await r.json().catch(() => ({}));
        if (!r.ok || !j.data) throw new Error(j.error || 'Impossible de charger les statistiques.');
        return j.data;
      })
      .then((d) => {
        if (ac.signal.aborted) return;
        setData(d);
        setLoading(false);
      })
      .catch((e: Error) => {
        if (ac.signal.aborted) return;
        setData(null);
        setError(e.message || 'Impossible de charger les statistiques.');
        setLoading(false);
      });
    return () => ac.abort();
  }, [rangeDays, attempt]);

  const toolbar = (
    <div className="flex items-center justify-between flex-wrap gap-3">
      <SegmentedControl<string>
        label="Période"
        value={String(rangeDays)}
        onChange={(v) => setRangeDays(Number(v))}
        options={[
          { value: '7', label: '7 j' },
          { value: '30', label: '30 j' },
          { value: '90', label: '90 j' },
        ]}
      />
      <a
        href={`/api/admin/export/bookings?rangeDays=${rangeDays}`}
        className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-ink-200 dark:border-white/15 bg-white dark:bg-white/5 px-3 text-xs font-semibold tracking-tight text-text-main dark:text-white hover:bg-ink-50 dark:hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
      >
        <span className="material-symbols-outlined text-[16px]" aria-hidden="true">download</span>
        Export CSV
      </a>
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-5" aria-busy="true" aria-label="Chargement des statistiques">
        {toolbar}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[116px]" />
          ))}
        </div>
        <Skeleton className="h-64" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-5">
        {toolbar}
        <ErrorState message={error ?? 'Impossible de charger les statistiques.'} onRetry={() => setAttempt((a) => a + 1)} />
      </div>
    );
  }

  const { totals } = data;
  const maxDaily = Math.max(1, ...data.daily.map((d) => d.revenue));
  const maxHeat = Math.max(1, ...data.seatHeatmap.map((s) => s.count));
  const maxRouteRevenue = Math.max(1, ...data.topRoutes.map((r) => r.revenue));
  const avgBasket = totals.bookings > 0 ? totals.revenueCents / totals.bookings : 0;
  const counterShare = totals.revenueCents > 0 ? Math.round((totals.counterRevenueCents / totals.revenueCents) * 100) : 0;
  const onlineShare = totals.revenueCents > 0 ? 100 - counterShare : 0;
  const hasRevenue = data.daily.some((d) => d.revenue > 0);
  const labelEvery = Math.max(1, Math.ceil(data.daily.length / 6));

  return (
    <div className="space-y-5">
      {toolbar}

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label={`Revenu (${rangeDays} j)`} value={formatXAF(totals.revenueCents)} icon="payments" />
        <StatCard label="Billets vendus" value={totals.bookings.toLocaleString('fr-FR')} icon="confirmation_number" />
        <StatCard label="Panier moyen" value={formatXAF(avgBasket)} icon="shopping_basket" hint="par billet" />
        <StatCard
          label="Guichet vs en ligne"
          value={totals.revenueCents > 0 ? `${counterShare} / ${onlineShare} %` : '—'}
          icon="point_of_sale"
          hint={`Guichet ${formatXAF(totals.counterRevenueCents)}`}
        />
      </div>

      {/* Daily revenue */}
      <Card>
        <CardHeader
          icon="bar_chart"
          title="Revenu par jour"
          subtitle={`Pic : ${formatXAF(maxDaily === 1 && !hasRevenue ? 0 : maxDaily)} · moyenne : ${formatXAF(
            data.daily.length ? totals.revenueCents / data.daily.length : 0,
          )}`}
        />
        {!hasRevenue ? (
          <EmptyState icon="query_stats" title="Aucune vente sur la période" description="Les ventes apparaîtront ici dès le premier billet." />
        ) : (
          <>
            <div className="flex gap-3">
              <div className="flex h-44 flex-col justify-between text-right text-[10px] tabular-nums text-text-muted dark:text-gray-500" aria-hidden="true">
                <span>{fmtCompact(maxDaily)}</span>
                <span>{fmtCompact(maxDaily / 2)}</span>
                <span>0</span>
              </div>
              <div className="relative flex-1 min-w-0">
                <div className="pointer-events-none absolute inset-0 flex flex-col justify-between" aria-hidden="true">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="border-t border-ink-100 dark:border-white/10" />
                  ))}
                </div>
                <div className="relative flex h-44 items-end gap-[3px]" role="img" aria-label={`Graphique du revenu par jour sur ${data.daily.length} jours. Tableau de données ci-dessous.`}>
                  {data.daily.map((d) => (
                    <div
                      key={d.date}
                      title={`${fmtDay(d.date)} · ${formatXAF(d.revenue)} · ${d.bookings} billet${d.bookings > 1 ? 's' : ''}`}
                      className="group flex h-full flex-1 items-end"
                    >
                      <div
                        className="w-full rounded-t-[4px] bg-primary/70 transition-colors group-hover:bg-primary-700"
                        style={{ height: `${(d.revenue / maxDaily) * 100}%`, minHeight: d.revenue > 0 ? 3 : 0 }}
                      />
                    </div>
                  ))}
                </div>
                <div className="mt-2 flex gap-[3px] text-[10px] tabular-nums text-text-muted dark:text-gray-500" aria-hidden="true">
                  {data.daily.map((d, i) => (
                    <div key={d.date} className="relative flex-1 h-3">
                      {i % labelEvery === 0 && <span className="absolute left-0 whitespace-nowrap">{fmtDay(d.date)}</span>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <table className="sr-only">
              <caption>Revenu et billets par jour</caption>
              <thead>
                <tr>
                  <th scope="col">Date</th>
                  <th scope="col">Revenu</th>
                  <th scope="col">Billets</th>
                </tr>
              </thead>
              <tbody>
                {data.daily.map((d) => (
                  <tr key={d.date}>
                    <td>{fmtDay(d.date)}</td>
                    <td>{formatXAF(d.revenue)}</td>
                    <td>{d.bookings}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </Card>

      {/* Top routes & Heatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Card>
          <CardHeader icon="route" title="Top trajets" subtitle="Classés par revenu" />
          {data.topRoutes.length === 0 ? (
            <p className="text-sm text-text-muted dark:text-gray-400">Pas encore de données.</p>
          ) : (
            <ol className="space-y-4">
              {data.topRoutes.slice(0, 8).map((r, i) => (
                <li key={`${r.from}-${r.to}`}>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="min-w-0 break-words font-medium text-text-main dark:text-white">
                      <span className="mr-2 text-xs tabular-nums text-text-muted">{i + 1}</span>
                      {r.from} → {r.to}
                    </span>
                    <span className="shrink-0 font-semibold tabular-nums text-text-main dark:text-white">{formatXAF(r.revenue)}</span>
                  </div>
                  <div
                    role="img"
                    aria-label={`${r.from} vers ${r.to} : ${formatXAF(r.revenue)}, ${r.bookings} billets`}
                    className="mt-1.5 h-2 rounded-full bg-ink-100 dark:bg-white/10 overflow-hidden"
                  >
                    <div className="h-full rounded-full bg-primary" style={{ width: `${(r.revenue / maxRouteRevenue) * 100}%` }} />
                  </div>
                  <div className="mt-1 text-xs tabular-nums text-text-muted dark:text-gray-500">
                    {r.bookings} billet{r.bookings > 1 ? 's' : ''}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Card>

        <Card>
          <CardHeader icon="event_seat" title="Sièges les plus demandés" subtitle="Nombre de réservations par siège" />
          {data.seatHeatmap.length === 0 ? (
            <p className="text-sm text-text-muted dark:text-gray-400">Pas de sièges réservés sur la période.</p>
          ) : (
            <>
              <ul
                className="grid grid-cols-[repeat(auto-fill,minmax(3.25rem,1fr))] gap-1.5"
                aria-label="Sièges les plus demandés"
              >
                {data.seatHeatmap.slice(0, 40).map((s) => {
                  const intensity = s.count / maxHeat;
                  return (
                    <li
                      key={s.seat}
                      title={`${s.seat} · ${s.count} réservation${s.count > 1 ? 's' : ''}`}
                      aria-label={`${s.seat}, ${s.count} réservation${s.count > 1 ? 's' : ''}`}
                      className={cx(
                        'flex h-12 flex-col items-center justify-center rounded-lg border border-primary/20 text-xs font-semibold leading-tight tabular-nums',
                        intensity > 0.45 ? 'text-ink-950' : 'text-text-main dark:text-white',
                      )}
                      style={{ backgroundColor: `rgba(19, 236, 91, ${(0.08 + intensity * 0.82).toFixed(2)})` }}
                    >
                      <span aria-hidden="true">{s.seat}</span>
                      <span aria-hidden="true" className="text-[10px] font-medium opacity-70">×{s.count}</span>
                    </li>
                  );
                })}
              </ul>
              <div className="mt-4 flex items-center gap-2 text-[11px] text-text-muted dark:text-gray-400" aria-hidden="true">
                <span>Moins</span>
                {[0.1, 0.3, 0.5, 0.7, 0.9].map((a) => (
                  <span key={a} className="size-4 rounded border border-primary/20" style={{ backgroundColor: `rgba(19, 236, 91, ${a})` }} />
                ))}
                <span>Plus demandé</span>
              </div>
            </>
          )}
        </Card>
      </div>

      {/* Occupancy per departure */}
      <div>
        <div className="mb-3 flex items-baseline justify-between flex-wrap gap-2">
          <div>
            <h2 className="font-display text-base font-semibold tracking-tight text-text-main dark:text-white">Remplissage par départ</h2>
            <p className="text-sm text-text-muted dark:text-gray-400">Occupation moyenne : {totals.avgOccupancyPct} %</p>
          </div>
        </div>
        {data.occupancy.length === 0 ? (
          <Card padded={false}>
            <EmptyState icon="directions_bus" title="Aucun départ sur la période" />
          </Card>
        ) : (
          <Table>
            <THead>
              <Th>Départ</Th>
              <Th>Trajet</Th>
              <Th>Statut</Th>
              <Th className="min-w-[10rem]">Remplissage</Th>
              <Th className="text-right">Places</Th>
            </THead>
            <tbody>
              {data.occupancy.slice(0, 30).map((o) => (
                <TR key={o.id}>
                  <TD className="whitespace-nowrap tabular-nums text-text-muted dark:text-gray-400">
                    {new Date(o.departureAt).toLocaleString('fr-FR', {
                      timeZone: 'Africa/Douala',
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </TD>
                  <TD className="font-medium">
                    {o.from} → {o.to}
                  </TD>
                  <TD>{o.tripStatus !== 'SCHEDULED' ? <StatusBadge status={o.tripStatus} /> : <span className="text-text-muted">—</span>}</TD>
                  <TD>
                    <div className="flex items-center gap-3">
                      <div
                        role="progressbar"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={o.occupancyPct}
                        aria-label={`Taux de remplissage ${o.occupancyPct}%`}
                        className="h-2 w-24 sm:w-32 shrink-0 overflow-hidden rounded-full bg-ink-100 dark:bg-white/10"
                      >
                        <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, o.occupancyPct)}%` }} />
                      </div>
                      <span className="w-10 text-right text-xs font-semibold tabular-nums">{o.occupancyPct}%</span>
                    </div>
                  </TD>
                  <TD className="text-right tabular-nums text-text-muted dark:text-gray-400">
                    {o.seatsBooked}/{o.seatsTotal}
                  </TD>
                </TR>
              ))}
            </tbody>
          </Table>
        )}
      </div>
    </div>
  );
};

export default AnalyticsPanel;
