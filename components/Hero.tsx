'use client';
import React, { useEffect, useRef } from 'react';
import SearchWidget from './SearchWidget';
import HeroScene from './landing/HeroScene';
import { useLanguage } from '../contexts/LanguageContext';

const Hero: React.FC = () => {
  const { t } = useLanguage();
  const sectionRef = useRef<HTMLElement>(null);

  // Pointer-driven parallax: eased --mx/--my in [-1, 1], spotlight position
  // (--px/--py) and a lean angle for the bus derived from its speed.
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!window.matchMedia('(pointer: fine)').matches) return;

    let tx = 0, ty = 0, x = 0, y = 0, prevX = 0, raf = 0;
    const tick = () => {
      x += (tx - x) * 0.06;
      y += (ty - y) * 0.06;
      const v = x - prevX;
      prevX = x;
      el.style.setProperty('--mx', x.toFixed(4));
      el.style.setProperty('--my', y.toFixed(4));
      el.style.setProperty('--lean', `${Math.max(-4, Math.min(4, v * -160)).toFixed(2)}deg`);
      if (Math.abs(tx - x) > 0.0005 || Math.abs(ty - y) > 0.0005) {
        raf = requestAnimationFrame(tick);
      } else {
        raf = 0;
        el.style.setProperty('--lean', '0deg');
      }
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(tick); };
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width) * 2 - 1;
      ty = ((e.clientY - r.top) / r.height) * 2 - 1;
      el.style.setProperty('--px', `${e.clientX - r.left}px`);
      el.style.setProperty('--py', `${e.clientY - r.top}px`);
      kick();
    };
    const onLeave = () => { tx = 0; ty = 0; kick(); };
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);
    return () => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section ref={sectionRef} className="relative w-full bg-background-light dark:bg-background-dark overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0 bg-grid-subtle mask-fade-b opacity-80 pointer-events-none"
      />
      <div
        aria-hidden
        className="absolute -top-32 left-1/2 -translate-x-1/2 w-[1100px] h-[1100px] rounded-full bg-primary/15 blur-[120px] pointer-events-none"
      />
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none bg-[radial-gradient(60%_60%_at_50%_0%,rgba(19,236,91,0.10)_0%,transparent_70%)]"
      />
      {/* cursor spotlight */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(520px circle at var(--px, 50%) var(--py, 20%), rgba(19,236,91,0.10), transparent 60%)' }}
      />

      <div className="relative max-w-6xl mx-auto px-6 md:px-10 pt-12 md:pt-16 pb-2 md:pb-4 text-center">
        <div className="inline-flex items-center gap-2.5 rounded-full border border-ink-200/70 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur px-3.5 py-1.5 mb-6 animate-reveal">
          <span className="relative flex items-center justify-center">
            <span className="absolute size-2.5 rounded-full bg-primary/50 animate-ping" />
            <span className="relative size-2 rounded-full bg-primary" />
          </span>
          <span className="text-[12px] font-medium text-text-main dark:text-gray-200 tracking-tight">
            {t('hero.eyebrow')} — {t('hero.trust.mobile_money')}
          </span>
          <span className="material-symbols-outlined text-sm text-text-muted">arrow_forward</span>
        </div>

        <h1 className="font-display font-semibold text-text-main dark:text-white tracking-tightest leading-[0.98] text-5xl sm:text-6xl md:text-7xl lg:text-[80px] animate-reveal">
          {t('hero.title')}
          <br />
          <span className="font-serif-italic text-teal-accent dark:text-primary font-normal italic">
            {t('hero.title.accent')}
          </span>
        </h1>

        <p className="mx-auto mt-7 max-w-2xl text-base md:text-lg text-text-muted dark:text-gray-400 leading-relaxed animate-reveal" style={{ animationDelay: '80ms' }}>
          {t('hero.subtitle')}
        </p>

        <div className="mt-9 flex flex-wrap items-center justify-center gap-3 animate-reveal" style={{ animationDelay: '160ms' }}>
          <a
            href="#search"
            className="group inline-flex items-center gap-2 rounded-full bg-text-main dark:bg-white text-white dark:text-text-main px-5 py-3 text-sm font-semibold tracking-tight shadow-card hover:shadow-elevated hover:-translate-y-0.5 active:translate-y-0 transition-all"
          >
            {t('hero.cta.primary')}
            <span className="material-symbols-outlined text-base group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
          </a>
          <a
            href="#how"
            className="inline-flex items-center gap-2 rounded-full border border-ink-200 dark:border-white/15 bg-white/60 dark:bg-white/5 backdrop-blur text-text-main dark:text-gray-100 px-5 py-3 text-sm font-medium tracking-tight hover:bg-white dark:hover:bg-white/10 transition-all"
          >
            <span className="material-symbols-outlined text-base">expand_more</span>
            {t('how.eyebrow')}
          </a>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-[12px] text-text-muted dark:text-gray-400 animate-reveal" style={{ animationDelay: '240ms' }}>
          <span className="inline-flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px] text-teal-accent dark:text-primary">shield_lock</span>
            {t('hero.trust.mobile_money')}
          </span>
          <span className="h-1 w-1 rounded-full bg-ink-200 dark:bg-white/20 hidden sm:inline-block" />
          <span className="inline-flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px] text-teal-accent dark:text-primary">qr_code_2</span>
            {t('hero.trust.qr')}
          </span>
          <span className="h-1 w-1 rounded-full bg-ink-200 dark:bg-white/20 hidden sm:inline-block" />
          <span className="inline-flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px] text-teal-accent dark:text-primary">schedule</span>
            {t('hero.trust.realtime')}
          </span>
        </div>
      </div>

      <HeroScene />

      <div id="search" className="relative">
        <SearchWidget />
      </div>
    </section>
  );
};

export default Hero;
