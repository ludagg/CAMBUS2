'use client';
import React, { useEffect, useState } from 'react';
import { useNavigation } from '../../contexts/NavigationContext';
import { useLanguage } from '../../contexts/LanguageContext';
import SectionEyebrow from './SectionEyebrow';

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
  const { t, language } = useLanguage();
  const fmtXAFLocal = (n: number) => n.toLocaleString(language === 'en' ? 'en-US' : 'fr-FR') + ' XAF';
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
    <section className="relative py-24 md:py-32 px-6 md:px-10 bg-background-light dark:bg-background-dark">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-14 md:mb-16">
          <div className="max-w-2xl">
            <SectionEyebrow align="left">{t('routes.eyebrow')}</SectionEyebrow>
            <h2 className="mt-5 font-display text-3xl md:text-5xl font-semibold text-text-main dark:text-white tracking-tightest leading-[1.05]">
              {t('routes.title')}
              <br />
              <span className="font-serif-italic text-teal-accent dark:text-primary font-normal italic">{t('routes.title.accent')}</span>
            </h2>
            <p className="mt-5 text-text-muted dark:text-gray-400 leading-relaxed max-w-xl">
              {t('routes.subtitle')}
            </p>
          </div>
          <button
            onClick={() => navigateTo('home')}
            className="hidden md:inline-flex items-center gap-1.5 text-sm font-medium text-text-main dark:text-gray-200 hover:text-teal-accent dark:hover:text-primary transition-colors"
          >
            {t('routes.view_all')}
            <span className="material-symbols-outlined text-base">arrow_forward</span>
          </button>
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-[4/3] rounded-2xl bg-ink-100 dark:bg-ink-800 animate-pulse" />
            ))}
          </div>
        ) : routes.length === 0 ? (
          <p className="text-center text-text-muted py-16">{t('routes.empty')}</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {routes.map((r, idx) => (
              <button
                key={idx}
                onClick={() => handleClick(r)}
                className="group relative text-left overflow-hidden rounded-2xl aspect-[4/3] ring-1 ring-ink-100 dark:ring-white/10 hover:ring-primary/40 shadow-subtle hover:shadow-card transition-all duration-300"
              >
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-[1200ms] group-hover:scale-[1.06]"
                  style={{ backgroundImage: `url('${r.image}')` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink-950/90 via-ink-950/40 to-transparent" />

                <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 px-2.5 py-1 text-[11px] font-medium text-white/90">
                  <span className="material-symbols-outlined text-[14px]">schedule</span>
                  {fmtDur(r.durationMin)}
                </div>

                <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                  <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.16em] text-white/60 mb-3">
                    <span className="material-symbols-outlined text-[14px]">directions_bus</span>
                    {r.dailyCount}+ {t('routes.connections')}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-display text-2xl md:text-3xl font-semibold tracking-tight">{r.from}</span>
                    <span className="material-symbols-outlined text-primary text-xl">arrow_forward</span>
                    <span className="font-display text-2xl md:text-3xl font-semibold tracking-tight">{r.to}</span>
                  </div>
                  <div className="mt-4 flex items-end justify-between">
                    <div>
                      <div className="text-[11px] uppercase tracking-[0.16em] text-white/50">{t('routes.from')}</div>
                      <div className="font-display text-lg font-semibold text-white mt-0.5">{fmtXAFLocal(r.priceFromXAF)}</div>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary text-text-main px-3 py-1.5 text-xs font-semibold tracking-tight shadow-card group-hover:translate-x-0.5 transition-transform">
                      {t('nav.book_now')}
                      <span className="material-symbols-outlined text-sm">arrow_outward</span>
                    </span>
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
