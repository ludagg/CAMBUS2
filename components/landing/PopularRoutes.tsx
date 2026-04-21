'use client';
import React, { useEffect, useState } from 'react';
import { useNavigation } from '../../contexts/NavigationContext';

interface RouteItem {
  from: string;
  to: string;
  priceFromXAF: number;
  durationMin: number;
  dailyCount: number;
  image: string;
}

// Curated Cameroon highlights (images: unsplash)
const CURATED: Omit<RouteItem, 'priceFromXAF' | 'durationMin' | 'dailyCount'>[] = [
  { from: 'Douala', to: 'Yaoundé', image: 'https://images.unsplash.com/photo-1523805009345-7448845a9e53?w=1200&q=80' },
  { from: 'Yaoundé', to: 'Bafoussam', image: 'https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=1200&q=80' },
  { from: 'Douala', to: 'Kribi', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=80' },
  { from: 'Yaoundé', to: 'Ngaoundéré', image: 'https://images.unsplash.com/photo-1519861531473-9200262188bf?w=1200&q=80' },
  { from: 'Douala', to: 'Bamenda', image: 'https://images.unsplash.com/photo-1493514789931-586cb221d7a7?w=1200&q=80' },
  { from: 'Yaoundé', to: 'Garoua', image: 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?w=1200&q=80' },
];

const fmtXAF = (n: number) => n.toLocaleString('fr-FR') + ' XAF';
const fmtDur = (m: number) => {
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r ? `${h}h${String(r).padStart(2, '0')}` : `${h}h`;
};

const PopularRoutes: React.FC = () => {
  const { setSearchParams, navigateTo } = useNavigation();
  const [routes, setRoutes] = useState<RouteItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const results = await Promise.all(
          CURATED.map(async (c) => {
            try {
              const url = `/api/departures?from=${encodeURIComponent(c.from)}&to=${encodeURIComponent(c.to)}`;
              const res = await fetch(url);
              const json = await res.json();
              const list = (json.data ?? []) as Array<{ priceCents: number; route: { defaultDurationMin: number } }>;
              if (list.length === 0) return null;
              const min = list.reduce((acc, d) => Math.min(acc, d.priceCents), Infinity);
              return {
                ...c,
                priceFromXAF: min,
                durationMin: list[0].route.defaultDurationMin,
                dailyCount: Math.min(list.length, 24),
              } as RouteItem;
            } catch {
              return null;
            }
          })
        );
        setRoutes(results.filter((x): x is RouteItem => x !== null));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleClick = (r: RouteItem) => {
    const todayISO = new Date().toISOString().split('T')[0];
    setSearchParams({
      from: r.from,
      to: r.to,
      date: todayISO,
      passengers: { adults: 1, children: 0 },
      tripType: 'one-way',
    });
    navigateTo('results');
  };

  return (
    <section className="py-20 md:py-24 px-6 md:px-10 bg-background-light dark:bg-surface-dark/50">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-end justify-between flex-wrap gap-4 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 bg-primary/10 text-teal-accent dark:text-primary text-xs font-black uppercase tracking-widest px-4 py-2 rounded-full mb-4">
              <span className="material-symbols-outlined text-sm">trending_up</span>
              Trajets populaires
            </div>
            <h2 className="text-2xl md:text-4xl font-black text-text-main dark:text-white">
              Les destinations les plus réservées
            </h2>
            <p className="text-text-muted dark:text-gray-400 mt-2 max-w-2xl">
              Des prix négociés sur les axes stratégiques du Cameroun, mis à jour en temps réel.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-[4/3] rounded-2xl bg-gray-100 dark:bg-gray-900 animate-pulse" />
            ))}
          </div>
        ) : routes.length === 0 ? (
          <p className="text-center text-text-muted py-16">Aucun départ pour le moment. Revenez bientôt.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {routes.map((r, idx) => (
              <button
                key={idx}
                onClick={() => handleClick(r)}
                className="group relative text-left overflow-hidden rounded-2xl aspect-[4/3] shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
              >
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                  style={{ backgroundImage: `url('${r.image}')` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                <div className="absolute top-4 right-4 bg-white/10 backdrop-blur-md border border-white/30 rounded-full px-3 py-1 text-[11px] font-black text-white">
                  {fmtDur(r.durationMin)}
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <div className="flex items-center gap-2 text-xs text-gray-300 font-bold mb-2">
                    <span className="material-symbols-outlined text-sm">directions_bus</span>
                    {r.dailyCount}+ départ{r.dailyCount > 1 ? 's' : ''} / jour
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl font-black">{r.from}</span>
                    <span className="material-symbols-outlined text-primary">arrow_forward</span>
                    <span className="text-2xl font-black">{r.to}</span>
                  </div>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary text-text-main text-sm font-black">
                    À partir de {fmtXAF(r.priceFromXAF)}
                    <span className="material-symbols-outlined text-base">arrow_outward</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default PopularRoutes;
