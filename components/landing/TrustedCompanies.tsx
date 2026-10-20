'use client';
import React, { useEffect, useState } from 'react';
import SectionEyebrow from './SectionEyebrow';
import { useLanguage } from '../../contexts/LanguageContext';

interface Company {
  id: string;
  name: string;
  logo: string | null;
  brandColor: string;
  _count?: { agencies: number; routes: number };
}

const TrustedCompanies: React.FC = () => {
  const { t } = useLanguage();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/companies')
      .then((r) => r.json())
      .then((j) => setCompanies(j.data ?? []))
      .catch(() => setCompanies([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section aria-hidden className="py-20 md:py-24 px-6 md:px-10 bg-white dark:bg-background-dark border-y border-ink-100 dark:border-white/10">
        <div className="max-w-6xl mx-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-ink-100 dark:bg-white/5 animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  if (companies.length === 0) return null;

  return (
    <section className="relative py-20 md:py-24 px-6 md:px-10 bg-white dark:bg-background-dark border-y border-ink-100 dark:border-white/10">
      <div className="max-w-6xl mx-auto">
        <div className="max-w-2xl mx-auto text-center mb-12 md:mb-14">
          <SectionEyebrow>{t('trusted.eyebrow')}</SectionEyebrow>
          <h2 className="mt-5 font-display text-2xl md:text-4xl font-semibold text-text-main dark:text-white tracking-tightest leading-[1.1]">
            {t('trusted.title', { count: companies.length })}
            <span className="font-serif-italic text-teal-accent dark:text-primary font-normal italic"> {t('trusted.title.accent')}</span>
          </h2>
          <p className="mt-4 text-text-muted dark:text-gray-400 text-sm leading-relaxed">
            {t('trusted.subtitle')}
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
                  <div className="text-[10px] font-medium text-text-muted uppercase tracking-[0.16em] mt-0.5">{t('trusted.official')}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs text-text-muted">
                <span><strong className="text-text-main dark:text-white font-semibold">{c._count?.agencies ?? 0}</strong> {t('trusted.agencies')}</span>
                <span className="w-1 h-1 rounded-full bg-ink-200 dark:bg-white/20" />
                <span><strong className="text-text-main dark:text-white font-semibold">{c._count?.routes ?? 0}</strong> {t('trusted.routes')}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustedCompanies;
