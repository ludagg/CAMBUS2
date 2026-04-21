'use client';
import React from 'react';

const stats = [
  { icon: 'groups', value: '200k+', label: 'Voyageurs' },
  { icon: 'location_city', value: '8', label: 'Villes couvertes' },
  { icon: 'directions_bus', value: '4', label: 'Compagnies' },
  { icon: 'verified', value: '4,9/5', label: 'Note moyenne' },
];

const StatsBanner: React.FC = () => (
  <section className="bg-gradient-to-r from-teal-accent via-[#0f3d2f] to-background-dark py-12 px-6 md:px-10 border-y border-primary/10">
    <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
      {stats.map((s) => (
        <div key={s.label} className="flex items-center gap-4">
          <div className="size-12 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary flex-shrink-0">
            <span className="material-symbols-outlined text-2xl">{s.icon}</span>
          </div>
          <div>
            <div className="text-2xl md:text-3xl font-black text-white leading-none">{s.value}</div>
            <div className="text-[10px] md:text-xs text-gray-300 font-bold uppercase tracking-widest mt-1">{s.label}</div>
          </div>
        </div>
      ))}
    </div>
  </section>
);

export default StatsBanner;
