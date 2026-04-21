'use client';
import React, { useState } from 'react';
import SectionEyebrow from './SectionEyebrow';
import { useLanguage } from '../../contexts/LanguageContext';

const FAQ: React.FC = () => {
  const { t } = useLanguage();
  const [open, setOpen] = useState<number | null>(0);

  const items = [1, 2, 3, 4, 5, 6].map((n) => ({
    q: t(`faq.q${n}`),
    a: t(`faq.a${n}`),
  }));

  return (
    <section className="relative py-24 md:py-32 px-6 md:px-10 bg-white dark:bg-surface-dark/30 border-t border-ink-100 dark:border-white/10">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-14">
          <SectionEyebrow>{t('faq.eyebrow')}</SectionEyebrow>
          <h2 className="mt-5 font-display text-3xl md:text-5xl font-semibold text-text-main dark:text-white tracking-tightest leading-[1.05]">
            {t('faq.title')}
            <span className="font-serif-italic text-teal-accent dark:text-primary italic font-normal"> {t('faq.title.accent')}</span>
          </h2>
        </div>

        <div className="divide-y divide-ink-100 dark:divide-white/10 border-y border-ink-100 dark:border-white/10">
          {items.map((it, i) => {
            const isOpen = open === i;
            return (
              <div key={i} className="group">
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="w-full flex items-start justify-between gap-6 py-6 text-left"
                  aria-expanded={isOpen}
                >
                  <span className={`font-display text-base md:text-lg font-semibold tracking-tight transition-colors ${isOpen ? 'text-teal-accent dark:text-primary' : 'text-text-main dark:text-white group-hover:text-teal-accent dark:group-hover:text-primary'}`}>
                    {it.q}
                  </span>
                  <span
                    className={`mt-1 inline-flex items-center justify-center size-7 rounded-full border transition-all flex-shrink-0 ${
                      isOpen
                        ? 'bg-primary text-text-main border-primary rotate-180'
                        : 'bg-transparent text-text-muted border-ink-200 dark:border-white/20'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">expand_more</span>
                  </span>
                </button>
                <div
                  className={`grid transition-all duration-300 ease-out ${
                    isOpen ? 'grid-rows-[1fr] opacity-100 pb-6' : 'grid-rows-[0fr] opacity-0'
                  }`}
                >
                  <div className="overflow-hidden text-text-muted dark:text-gray-400 leading-relaxed text-[15px] pr-12">
                    {it.a}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-text-muted dark:text-gray-400 mb-4">
            {t('faq.contact_cta')}
          </p>
          <a
            href="https://wa.me/237670000000"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-text-main dark:bg-white text-white dark:text-text-main px-5 py-2.5 text-sm font-semibold tracking-tight shadow-card hover:shadow-elevated hover:-translate-y-0.5 transition-all"
          >
            <span className="material-symbols-outlined text-base">chat</span>
            {t('faq.whatsapp')}
          </a>
        </div>
      </div>
    </section>
  );
};

export default FAQ;
