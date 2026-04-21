'use client';
import React from 'react';
import SectionEyebrow from './SectionEyebrow';
import { useLanguage } from '../../contexts/LanguageContext';

const HowItWorks: React.FC = () => {
  const { t } = useLanguage();

  const steps = [
    { num: '01', icon: 'search', title: t('how.step1.title'), desc: t('how.step1.desc') },
    { num: '02', icon: 'event_seat', title: t('how.step2.title'), desc: t('how.step2.desc') },
    { num: '03', icon: 'smartphone', title: t('how.step3.title'), desc: t('how.step3.desc') },
    { num: '04', icon: 'qr_code_2', title: t('how.step4.title'), desc: t('how.step4.desc') },
  ];

  return (
  <section id="how" className="relative py-24 md:py-32 px-6 md:px-10 bg-background-light dark:bg-background-dark">
    <div className="max-w-6xl mx-auto">
      <div className="max-w-2xl mx-auto text-center mb-16 md:mb-20">
        <SectionEyebrow>{t('how.eyebrow')}</SectionEyebrow>
        <h2 className="mt-5 font-display text-3xl md:text-5xl font-semibold text-text-main dark:text-white tracking-tightest leading-[1.05]">
          {t('how.title')}
          <span className="font-serif-italic text-teal-accent dark:text-primary font-normal italic"> {t('how.title.accent')}</span>
        </h2>
        <p className="mt-5 text-text-muted dark:text-gray-400 leading-relaxed">
          {t('how.subtitle')}
        </p>
      </div>

      <div className="relative grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-ink-100 dark:bg-white/10 border border-ink-100 dark:border-white/10 rounded-2xl overflow-hidden">
        {steps.map((s) => (
          <div
            key={s.num}
            className="group relative bg-white dark:bg-surface-dark p-8 md:p-10 transition-colors hover:bg-ink-50/70 dark:hover:bg-white/5"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="inline-flex items-center justify-center size-11 rounded-xl bg-primary/10 text-teal-accent dark:text-primary ring-1 ring-inset ring-primary/20">
                <span className="material-symbols-outlined text-[22px]">{s.icon}</span>
              </div>
              <span className="font-display text-sm font-medium text-text-muted/70 dark:text-gray-500 tabular-nums tracking-wider">
                {s.num}
              </span>
            </div>
            <h3 className="font-display text-lg font-semibold text-text-main dark:text-white tracking-tight mb-2">
              {s.title}
            </h3>
            <p className="text-sm text-text-muted dark:text-gray-400 leading-relaxed">
              {s.desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  </section>
  );
};

export default HowItWorks;
