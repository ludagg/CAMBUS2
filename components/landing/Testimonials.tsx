'use client';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import SectionEyebrow from './SectionEyebrow';
import { useLanguage } from '../../contexts/LanguageContext';

const COUNT = 6;
const AUTOPLAY_MS = 6000;

const Testimonials: React.FC = () => {
  const { t } = useLanguage();
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  const data = Array.from({ length: COUNT }, (_, i) => {
    const n = i + 1;
    const name = t(`testimonials.${n}.name`);
    return {
      name,
      role: t(`testimonials.${n}.role`),
      quote: t(`testimonials.${n}.quote`),
      avatar: name.charAt(0),
    };
  });

  const scrollToIndex = useCallback((index: number) => {
    const track = trackRef.current;
    const card = track?.children[index] as HTMLElement | undefined;
    if (!track || !card) return;
    track.scrollTo({ left: card.offsetLeft - track.offsetLeft, behavior: 'smooth' });
  }, []);

  const go = useCallback(
    (index: number) => scrollToIndex(((index % COUNT) + COUNT) % COUNT),
    [scrollToIndex],
  );

  // Keep the active dot in sync with manual scroll / swipe.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const onScroll = () => {
      const first = track.children[0] as HTMLElement | undefined;
      if (!first) return;
      const step = (track.children[1] as HTMLElement | undefined)
        ? (track.children[1] as HTMLElement).offsetLeft - first.offsetLeft
        : first.offsetWidth;
      setActive(Math.min(COUNT - 1, Math.max(0, Math.round(track.scrollLeft / step))));
    };
    track.addEventListener('scroll', onScroll, { passive: true });
    return () => track.removeEventListener('scroll', onScroll);
  }, []);

  // Autoplay, paused on hover/focus and disabled for reduced motion.
  useEffect(() => {
    if (paused) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = window.setInterval(() => go(active + 1), AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [paused, active, go]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') go(active + 1);
    if (e.key === 'ArrowLeft') go(active - 1);
  };

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

        <div
          role="region"
          aria-roledescription="carousel"
          aria-label={t('testimonials.eyebrow')}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocus={() => setPaused(true)}
          onBlur={() => setPaused(false)}
          onKeyDown={onKeyDown}
        >
          <div
            ref={trackRef}
            className="flex gap-6 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {data.map((item, i) => (
              <figure
                key={i}
                aria-roledescription="slide"
                aria-label={`${i + 1} / ${COUNT}`}
                className="relative snap-start shrink-0 basis-full md:basis-[calc((100%-1.5rem)/2)] lg:basis-[calc((100%-3rem)/3)] bg-white dark:bg-surface-dark rounded-2xl border border-ink-100 dark:border-white/10 p-8 hover:border-primary/30 transition-colors duration-300"
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

          <div className="mt-8 flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => go(active - 1)}
              aria-label={t('testimonials.prev')}
              className="size-10 rounded-full border border-ink-200 dark:border-white/15 flex items-center justify-center text-text-main dark:text-white hover:bg-white dark:hover:bg-white/10 transition-colors"
            >
              <span className="material-symbols-outlined text-xl">arrow_back</span>
            </button>
            <div className="flex items-center gap-2">
              {data.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => go(i)}
                  aria-label={`${t('testimonials.goto')} ${i + 1}`}
                  aria-current={i === active}
                  className={`h-2 rounded-full transition-all ${i === active ? 'w-6 bg-primary' : 'w-2 bg-ink-200 dark:bg-white/20 hover:bg-ink-300'}`}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => go(active + 1)}
              aria-label={t('testimonials.next')}
              className="size-10 rounded-full border border-ink-200 dark:border-white/15 flex items-center justify-center text-text-main dark:text-white hover:bg-white dark:hover:bg-white/10 transition-colors"
            >
              <span className="material-symbols-outlined text-xl">arrow_forward</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
