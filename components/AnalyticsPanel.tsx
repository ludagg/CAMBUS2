'use client';

import React, { useEffect, useState } from 'react';

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

function formatXAF(cents: number) {
  return `${cents.toLocaleString('fr-FR')} FCFA`;
}

const AnalyticsPanel: React.FC = () => {
  const [data, setData] = useState<Analytics | null>(null);
  const [rangeDays, setRangeDays] = useState(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/analytics?rangeDays=${rangeDays}`)
      .then((r) => r.json())
      .then((j) => setData(j.data))
      .finally(() => setLoading(false));
  }, [rangeDays]);

  if (loading || !data) {
    return (
      <div className="bg-white dark:bg-surface-dark rounded-xl border border-gray-100 dark:border-gray-800 p-6">
        <div className="text-text-muted text-sm">Chargement des statistiques…</div>
      </div>
    );
  }

  const maxDaily = Math.max(1, ...data.daily.map((d) => d.revenue));
  const maxHeat = Math.max(1, ...data.seatHeatmap.map((s) => s.count));

  return (
    <div className="space-y-4">
      {/* Header + range */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="font-black text-text-main dark:text-white flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">analytics</span>
          Analytics & rapports
        </h2>
        <div className="flex items-center gap-2">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setRangeDays(d)}
              className={`px-3 py-1 rounded-lg text-xs font-black ${
                rangeDays === d
                  ? 'bg-primary text-text-main'
                  : 'bg-gray-100 dark:bg-gray-800 text-text-muted'
              }`}
            >
              {d}j
            </button>
          ))}
          <a
            href={`/api/admin/export/bookings?rangeDays=${rangeDays}`}
            className="px-3 py-1 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-black flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-sm">download</span>
            Export CSV
          </a>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            label: `Revenu (${rangeDays}j)`,
            value: formatXAF(data.totals.revenueCents),
            icon: 'payments',
          },
          {
            label: 'Billets vendus',
            value: data.totals.bookings.toString(),
            icon: 'confirmation_number',
          },
          {
            label: 'Vente guichet',
            value: formatXAF(data.totals.counterRevenueCents),
            icon: 'point_of_sale',
          },
          {
            label: 'Occupation moy.',
            value: `${data.totals.avgOccupancyPct}%`,
            icon: 'airline_seat_recline_normal',
          },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="bg-white dark:bg-surface-dark rounded-xl border border-gray-100 dark:border-gray-800 p-4"
          >
            <div className="flex items-center gap-2 text-text-muted text-xs font-black uppercase tracking-wider">
              <span className="material-symbols-outlined text-base text-primary">{kpi.icon}</span>
              {kpi.label}
            </div>
            <div className="mt-1 font-black text-text-main dark:text-white text-xl">{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Daily revenue chart */}
      <div className="bg-white dark:bg-surface-dark rounded-xl border border-gray-100 dark:border-gray-800 p-4">
        <div className="text-xs font-black text-text-muted uppercase tracking-wider mb-2">
          Revenu journalier
        </div>
        <div className="flex items-end gap-0.5 h-40">
          {data.daily.map((d) => (
            <div
              key={d.date}
              title={`${d.date} · ${formatXAF(d.revenue)} · ${d.bookings} billets`}
              className="flex-1 bg-primary/20 hover:bg-primary rounded-t"
              style={{ height: `${(d.revenue / maxDaily) * 100}%`, minHeight: d.revenue > 0 ? 2 : 0 }}
            />
          ))}
        </div>
        <div className="flex justify-between text-[10px] text-text-muted mt-1 font-mono">
          <span>{data.daily[0]?.date}</span>
          <span>{data.daily[data.daily.length - 1]?.date}</span>
        </div>
      </div>

      {/* Top routes & Heatmap */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="bg-white dark:bg-surface-dark rounded-xl border border-gray-100 dark:border-gray-800 p-4">
          <div className="text-xs font-black text-text-muted uppercase tracking-wider mb-3">
            Top trajets
          </div>
          <div className="space-y-2">
            {data.topRoutes.slice(0, 8).map((r) => {
              const max = data.topRoutes[0]?.bookings || 1;
              return (
                <div key={`${r.from}-${r.to}`} className="text-xs">
                  <div className="flex justify-between mb-0.5">
                    <span className="font-black text-text-main dark:text-white">
                      {r.from} → {r.to}
                    </span>
                    <span className="text-text-muted">{r.bookings} billets</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${(r.bookings / max) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {data.topRoutes.length === 0 && (
              <div className="text-text-muted text-xs">Pas encore de données.</div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-surface-dark rounded-xl border border-gray-100 dark:border-gray-800 p-4">
          <div className="text-xs font-black text-text-muted uppercase tracking-wider mb-3">
            Sièges les plus demandés
          </div>
          <div className="flex flex-wrap gap-1.5">
            {data.seatHeatmap.slice(0, 40).map((s) => {
              const intensity = s.count / maxHeat;
              const bg = `rgba(19, 236, 91, ${Math.max(0.15, intensity)})`;
              return (
                <span
                  key={s.seat}
                  title={`${s.seat} · ${s.count} réservations`}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-black"
                  style={{ background: bg, color: intensity > 0.5 ? '#065f46' : '#111827' }}
                >
                  {s.seat}
                  <span className="text-[9px] opacity-80">×{s.count}</span>
                </span>
              );
            })}
            {data.seatHeatmap.length === 0 && (
              <div className="text-text-muted text-xs">Pas de sièges réservés sur la période.</div>
            )}
          </div>
        </div>
      </div>

      {/* Occupancy per departure */}
      <div className="bg-white dark:bg-surface-dark rounded-xl border border-gray-100 dark:border-gray-800 p-4">
        <div className="text-xs font-black text-text-muted uppercase tracking-wider mb-3">
          Taux de remplissage par départ (derniers)
        </div>
        <div className="space-y-1 max-h-80 overflow-auto">
          {data.occupancy.slice(0, 30).map((o) => (
            <div key={o.id} className="flex items-center gap-2 text-xs">
              <span className="font-mono text-text-muted w-24 shrink-0">
                {new Date(o.departureAt).toLocaleString('fr-FR', {
                  day: '2-digit',
                  month: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
              <span className="flex-1 truncate text-text-main dark:text-white font-black">
                {o.from} → {o.to}
              </span>
              {o.tripStatus !== 'SCHEDULED' && (
                <span className="px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 font-black text-[9px]">
                  {o.tripStatus}
                </span>
              )}
              <div className="w-32 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    o.occupancyPct >= 80
                      ? 'bg-green-500'
                      : o.occupancyPct >= 40
                        ? 'bg-yellow-500'
                        : 'bg-red-400'
                  }`}
                  style={{ width: `${o.occupancyPct}%` }}
                />
              </div>
              <span className="font-black text-text-main dark:text-white w-10 text-right">
                {o.occupancyPct}%
              </span>
              <span className="text-text-muted w-12 text-right">
                {o.seatsBooked}/{o.seatsTotal}
              </span>
            </div>
          ))}
          {data.occupancy.length === 0 && (
            <div className="text-text-muted text-xs">Aucun départ sur la période.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPanel;
