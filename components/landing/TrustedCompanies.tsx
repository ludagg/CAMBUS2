'use client';
import React, { useEffect, useState } from 'react';

interface Company {
  id: string;
  name: string;
  logo: string | null;
  brandColor: string;
  _count?: { agencies: number; routes: number };
}

const TrustedCompanies: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);

  useEffect(() => {
    fetch('/api/companies')
      .then((r) => r.json())
      .then((j) => setCompanies(j.data ?? []))
      .catch(() => setCompanies([]));
  }, []);

  if (companies.length === 0) return null;

  return (
    <section className="py-16 px-6 md:px-10 bg-white dark:bg-background-dark border-y border-gray-100 dark:border-gray-800">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-teal-accent dark:text-primary text-xs font-black uppercase tracking-widest px-4 py-2 rounded-full mb-4">
            <span className="material-symbols-outlined text-sm">verified</span>
            Compagnies partenaires
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-text-main dark:text-white">
            {companies.length} compagnies de confiance, un seul billet
          </h2>
          <p className="text-text-muted dark:text-gray-400 mt-2 text-sm">
            Toutes les grandes compagnies camerounaises sur une plateforme unique.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {companies.map((c) => (
            <div
              key={c.id}
              className="group relative bg-background-light dark:bg-surface-dark rounded-2xl border border-gray-100 dark:border-gray-800 p-5 hover:border-primary/30 hover:shadow-lg transition-all"
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="size-11 rounded-xl flex items-center justify-center text-white shadow-md"
                  style={{ backgroundColor: c.brandColor || '#13ec5b' }}
                >
                  <span className="material-symbols-outlined text-2xl">{c.logo || 'directions_bus'}</span>
                </div>
                <div className="min-w-0">
                  <div className="font-black text-text-main dark:text-white truncate">{c.name}</div>
                  <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Officiel</div>
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs text-text-muted">
                <span><strong className="text-text-main dark:text-white">{c._count?.agencies ?? 0}</strong> agences</span>
                <span className="w-1 h-1 rounded-full bg-gray-300" />
                <span><strong className="text-text-main dark:text-white">{c._count?.routes ?? 0}</strong> routes</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustedCompanies;
