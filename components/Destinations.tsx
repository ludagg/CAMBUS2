'use client';
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigation } from '../contexts/NavigationContext';

// Fallback city images (Wikipedia / Wikimedia)
const CITY_IMAGES: Record<string, string> = {
  Douala:      'https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Douala_from_air.jpg/800px-Douala_from_air.jpg',
  "Yaoundé":   'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Yaounde_vue_panoramique.jpg/800px-Yaounde_vue_panoramique.jpg',
  Bafoussam:  'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Vue_Bafoussam.jpg/800px-Vue_Bafoussam.jpg',
  Bamenda:    'https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/Bamenda_skyline.jpg/800px-Bamenda_skyline.jpg',
  Kribi:      'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Kribi_beach.jpg/800px-Kribi_beach.jpg',
  Garoua:     'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Garoua.jpg/800px-Garoua.jpg',
  Maroua:     'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Maroua.jpg/800px-Maroua.jpg',
  "Ngaoundéré": 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Ngaoundere.jpg/800px-Ngaoundere.jpg',
};

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1591522811280-a8759970b03f?w=800&auto=format&fit=crop';

const POPULAR_ROUTES = [
  { from: 'Douala',  to: "Yaoundé",   price: 3500, connections: 12 },
  { from: 'Douala',  to: 'Bafoussam', price: 5000, connections: 8 },
  { from: "Yaoundé", to: 'Bamenda',   price: 6500, connections: 6 },
  { from: 'Douala',  to: 'Kribi',     price: 3000, connections: 5 },
];

const Destinations: React.FC = () => {
  const { t } = useLanguage();
  const { setSearchParams, navigateTo } = useNavigation();
  const [cities, setCities] = useState<{ name: string; region: string }[]>([]);

  useEffect(() => {
    fetch('/api/cities')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.cities?.length) setCities(data.cities); })
      .catch(() => {});
  }, []);

  const handleRouteClick = (route: typeof POPULAR_ROUTES[0]) => {
    const today = new Date().toISOString().split('T')[0];
    setSearchParams({
      from: route.from,
      to: route.to,
      date: today,
      passengers: { adults: 1, children: 0 },
      tripType: 'one-way',
    });
    navigateTo('results');
  };

  const displayRoutes = POPULAR_ROUTES.map((r) => ({
    ...r,
    image: CITY_IMAGES[r.to] || FALLBACK_IMAGE,
  }));

  return (
    <div className="bg-white dark:bg-surface-dark py-20 px-6 md:px-10 border-t border-gray-100 dark:border-gray-800">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-end justify-between mb-12">
          <div>
            <div className="inline-flex items-center gap-2 bg-primary/10 text-teal-accent dark:text-primary text-xs font-black uppercase tracking-widest px-4 py-2 rounded-full mb-4">
              <span className="material-symbols-outlined text-sm">explore</span>
              Destinations
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-text-main dark:text-white">{t('dest.title')}</h2>
          </div>
          <button
            onClick={() => navigateTo('agencies')}
            className="hidden sm:flex items-center gap-1 text-primary font-black text-sm hover:gap-2 transition-all"
          >
            {t('dest.view_all')}
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {displayRoutes.map((route, idx) => (
            <button
              key={`${route.from}-${route.to}`}
              onClick={() => handleRouteClick(route)}
              className={`group relative overflow-hidden rounded-2xl cursor-pointer text-left ${idx === 0 ? 'sm:col-span-2 aspect-[16/9]' : 'aspect-[4/5]'}`}
            >
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                style={{ backgroundImage: `url('${route.image}')` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent group-hover:from-black/90 transition-all" />
              <div className="absolute bottom-0 left-0 w-full p-5">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary text-text-main text-xs font-black mb-2">
                  {t('dest.from')} {route.price.toLocaleString()} FCFA
                </span>
                <h3 className="text-white text-xl font-black leading-tight">{route.from} → {route.to}</h3>
                <p className="text-gray-300 text-xs mt-1">{route.connections} {t('dest.connections')}</p>
              </div>
              <div className="absolute top-4 right-4 size-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 -translate-y-2 group-hover:translate-y-0">
                <span className="material-symbols-outlined text-white text-lg">arrow_outward</span>
              </div>
            </button>
          ))}
        </div>

        {cities.length > 0 && (
          <div className="mt-8 flex flex-wrap gap-2">
            {cities.slice(0, 8).map((city) => (
              <span
                key={city.name}
                className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-text-muted dark:text-gray-300 rounded-full text-xs font-bold"
              >
                {city.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Destinations;
