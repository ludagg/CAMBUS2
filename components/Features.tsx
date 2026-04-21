'use client';
import React from 'react';
import SectionEyebrow from './landing/SectionEyebrow';
import { useLanguage } from '../contexts/LanguageContext';

const Features: React.FC = () => {
  const { t } = useLanguage();

  const featuresData = [
    { icon: 'smartphone', title: t('features.momo.title'), description: t('features.momo.desc') },
    { icon: 'qr_code_2', title: t('features.qr.title'), description: t('features.qr.desc') },
    { icon: 'swap_horiz', title: t('features.roundtrip.title'), description: t('features.roundtrip.desc') },
    { icon: 'compare_arrows', title: t('features.compare.title'), description: t('features.compare.desc') },
    { icon: 'schedule', title: t('features.24_7.title'), description: t('features.24_7.desc') },
    { icon: 'support_agent', title: t('features.support.title'), description: t('features.support.desc') },
  ];

  return (
    <section className="relative py-24 md:py-32 px-6 md:px-10 bg-white dark:bg-surface-dark/40 border-y border-ink-100 dark:border-white/10">
      <div className="max-w-6xl mx-auto">
        <div className="max-w-2xl mb-16 md:mb-20">
          <SectionEyebrow align="left">{t('features.eyebrow')}</SectionEyebrow>
          <h2 className="mt-5 font-display text-3xl md:text-5xl font-semibold text-text-main dark:text-white tracking-tightest leading-[1.05]">
            {t('features.title.b')}
            <br />
            <span className="font-serif-italic text-teal-accent dark:text-primary font-normal italic">{t('features.title.b.accent')}</span>
          </h2>
          <p className="mt-5 text-text-muted dark:text-gray-400 leading-relaxed max-w-xl">
            {t('features.subtitle.b')}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuresData.map((feature) => (
            <div
              key={feature.title}
              className="group relative flex flex-col p-7 rounded-2xl bg-background-light dark:bg-ink-900/40 border border-ink-100 dark:border-white/10 hover:border-primary/40 hover:-translate-y-0.5 transition-all duration-300"
            >
              <div className="size-11 rounded-xl bg-primary/10 ring-1 ring-inset ring-primary/20 flex items-center justify-center text-teal-accent dark:text-primary mb-5">
                <span className="material-symbols-outlined text-[22px]">{feature.icon}</span>
              </div>
              <h3 className="font-display text-lg font-semibold tracking-tight text-text-main dark:text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-text-muted dark:text-gray-400 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
