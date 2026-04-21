'use client';
import React, { useEffect, useState } from 'react';
import SectionEyebrow from './SectionEyebrow';

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
    <section className="relative py-20 md:py-24 px-6 md:px-10 bg-white dark:bg-background-dark border-y border-ink-100 dark:border-white/10">
      <div className="max-w-6xl mx-auto">
        <div className="max-w-2xl mx-auto text-center mb-12 md:mb-14">
          <SectionEyebrow>Compagnies partenaires</SectionEyebrow>
          <h2 className="mt-5 font-display text-2xl md:text-4xl font-semibold text-text-main dark:text-white tracking-tightest leading-[1.1]">
            {companies.length} compagnies de confiance,
            <span className="font-serif-italic text-teal-accent dark:text-primary font-normal italic"> un seul billet.</span>
          </h2>
          <p className="mt-4 text-text-muted dark:text-gray-400 text-sm leading-relaxed">
            Toutes les grandes compagnies camerounaises réunies sur une plateforme unique.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {companies.map((c) => (
            <div
              key={c.id}
              className="group relative bg-background-light dark:bg-ink-900/40 rounded-2xl border border-ink-100 dark:border-white/10 p-5 hover:border-primary/40 transition-all"
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="size-10 rounded-xl flex items-center justify-center text-white shadow-subtle"
                  style={{ backgroundColor: c.brandColor || '#13ec5b' }}
                >
                  <span className="material-symbols-outlined text-xl">{c.logo || 'directions_bus'}</span>
                </div>
                <div className="min-w-0">
                  <div className="font-display font-semibold tracking-tight text-text-main dark:text-white truncate">{c.name}</div>
                  <div className="text-[10px] font-medium text-text-muted uppercase tracking-[0.16em] mt-0.5">Officiel</div>
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs text-text-muted">
                <span><strong className="text-text-main dark:text-white font-semibold">{c._count?.agencies ?? 0}</strong> agences</span>
                <span className="w-1 h-1 rounded-full bg-ink-200 dark:bg-white/20" />
                <span><strong className="text-text-main dark:text-white font-semibold">{c._count?.routes ?? 0}</strong> routes</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustedCompanies;
