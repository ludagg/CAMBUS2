'use client';
import React from 'react';
import SectionEyebrow from './SectionEyebrow';
import { useLanguage } from '../../contexts/LanguageContext';

const Testimonials: React.FC = () => {
  const { t } = useLanguage();

  const data = [
    { name: t('testimonials.1.name'), role: t('testimonials.1.role'), avatar: 'M', quote: t('testimonials.1.quote') },
    { name: t('testimonials.2.name'), role: t('testimonials.2.role'), avatar: 'J', quote: t('testimonials.2.quote') },
    { name: t('testimonials.3.name'), role: t('testimonials.3.role'), avatar: 'A', quote: t('testimonials.3.quote') },
  ];

  return (
    <section className="relative py-24 md:py-32 px-6 md:px-10 bg-background-light dark:bg-background-dark">
      <div className="max-w-6xl mx-auto">
        <div className="max-w-2xl mx-auto text-center mb-14 md:mb-16">
          <SectionEyebrow>{t('testimonials.eyebrow')}</SectionEyebrow>
          <h2 className="mt-5 font-display text-3xl md:text-5xl font-semibold text-text-main dark:text-white tracking-tightest leading-[1.05]">
            {t('testimonials.title')} <span className="font-serif-italic text-teal-accent dark:text-primary italic font-normal">{t('testimonials.title.highlight')}</span>
            <br /> {t('testimonials.title.accent')}
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {data.map((item) => (
            <figure
              key={item.name}
              className="relative bg-white dark:bg-surface-dark rounded-2xl border border-ink-100 dark:border-white/10 p-8 hover:border-primary/30 transition-all duration-300"
            >
              <span
                aria-hidden
                className="font-serif-italic absolute top-4 right-6 text-7xl leading-none text-primary/20 select-none pointer-events-none"
              >
                “
              </span>
              <blockquote className="relative font-display text-[17px] md:text-lg leading-relaxed text-text-main dark:text-gray-100 tracking-tight">
                {item.quote}
              </blockquote>
              <figcaption className="mt-6 pt-5 border-t border-ink-100 dark:border-white/10 flex items-center gap-3">
                <div className="size-10 rounded-full bg-primary/10 ring-1 ring-inset ring-primary/20 flex items-center justify-center text-teal-accent dark:text-primary font-display font-semibold">
                  {item.avatar}
                </div>
                <div>
                  <div className="font-display font-semibold tracking-tight text-text-main dark:text-white text-sm">
                    {item.name}
                  </div>
                  <div className="text-xs text-text-muted mt-0.5">{item.role}</div>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
