'use client';
import React from 'react';
import SearchWidget from './SearchWidget';

const Hero: React.FC = () => {
  return (
    <section className="relative w-full bg-background-light dark:bg-background-dark overflow-hidden">
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

      <div className="relative max-w-6xl mx-auto px-6 md:px-10 pt-20 md:pt-28 pb-28 md:pb-36 text-center">
        <div className="inline-flex items-center gap-2.5 rounded-full border border-ink-200/70 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur px-3.5 py-1.5 mb-8 animate-reveal">
          <span className="relative flex items-center justify-center">
            <span className="absolute size-2.5 rounded-full bg-primary/50 animate-ping" />
            <span className="relative size-2 rounded-full bg-primary" />
          </span>
          <span className="text-[12px] font-medium text-text-main dark:text-gray-200 tracking-tight">
            Nouveau — paiement Mobile Money instantané
          </span>
          <span className="material-symbols-outlined text-sm text-text-muted">arrow_forward</span>
        </div>

        <h1 className="font-display font-semibold text-text-main dark:text-white tracking-tightest leading-[0.98] text-5xl sm:text-6xl md:text-7xl lg:text-[88px] animate-reveal">
          Voyagez partout au Cameroun,
          <br />
          <span className="font-serif-italic text-teal-accent dark:text-primary font-normal italic">
            sans faire la file.
          </span>
        </h1>

        <p className="mx-auto mt-7 max-w-2xl text-base md:text-lg text-text-muted dark:text-gray-400 leading-relaxed animate-reveal" style={{ animationDelay: '80ms' }}>
          Comparez toutes les compagnies de bus, réservez en 2 minutes et embarquez avec un
          billet QR. Orange Money & MTN MoMo acceptés.
        </p>

        <div className="mt-9 flex flex-wrap items-center justify-center gap-3 animate-reveal" style={{ animationDelay: '160ms' }}>
          <a
            href="#search"
            className="group inline-flex items-center gap-2 rounded-full bg-text-main dark:bg-white text-white dark:text-text-main px-5 py-3 text-sm font-semibold tracking-tight shadow-card hover:shadow-elevated hover:-translate-y-0.5 active:translate-y-0 transition-all"
          >
            Rechercher un trajet
            <span className="material-symbols-outlined text-base group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
          </a>
          <a
            href="#how"
            className="inline-flex items-center gap-2 rounded-full border border-ink-200 dark:border-white/15 bg-white/60 dark:bg-white/5 backdrop-blur text-text-main dark:text-gray-100 px-5 py-3 text-sm font-medium tracking-tight hover:bg-white dark:hover:bg-white/10 transition-all"
          >
            <span className="material-symbols-outlined text-base">play_circle</span>
            Comment ça marche
          </a>
        </div>

        <div className="mt-14 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-[12px] text-text-muted dark:text-gray-400 animate-reveal" style={{ animationDelay: '240ms' }}>
          <span className="inline-flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px] text-teal-accent dark:text-primary">shield_lock</span>
            Paiement sécurisé
          </span>
          <span className="h-1 w-1 rounded-full bg-ink-200 dark:bg-white/20 hidden sm:inline-block" />
          <span className="inline-flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px] text-teal-accent dark:text-primary">qr_code_2</span>
            Billet QR instantané
          </span>
          <span className="h-1 w-1 rounded-full bg-ink-200 dark:bg-white/20 hidden sm:inline-block" />
          <span className="inline-flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px] text-teal-accent dark:text-primary">support_agent</span>
            Support 7j/7
          </span>
        </div>
      </div>

      <div id="search" className="relative">
        <SearchWidget />
      </div>
    </section>
  );
};

export default Hero;
