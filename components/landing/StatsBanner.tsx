'use client';
import React from 'react';

const stats = [
  { value: '200k+', label: 'Voyageurs transportés' },
  { value: '8', label: 'Villes couvertes' },
  { value: '4', label: 'Compagnies partenaires' },
  { value: '4.9/5', label: 'Note moyenne des clients' },
];

const StatsBanner: React.FC = () => (
  <section className="relative border-y border-ink-100 dark:border-white/10 bg-white dark:bg-background-dark">
    <div className="max-w-7xl mx-auto px-6 md:px-10 py-14 md:py-20">
      <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-ink-100 dark:divide-white/10">
        {stats.map((s, i) => (
          <div
            key={s.label}
            className={`${i < 2 ? 'border-b md:border-b-0 border-ink-100 dark:border-white/10 pb-8 md:pb-0 mb-8 md:mb-0' : ''} px-4 md:px-8 first:pl-0 last:pr-0`}
          >
            <div className="font-display text-4xl md:text-5xl lg:text-6xl font-semibold text-text-main dark:text-white tracking-tightest leading-none">
              {s.value}
            </div>
            <div className="mt-3 text-[13px] text-text-muted dark:text-gray-400 leading-snug">
              {s.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default StatsBanner;
