'use client';
import React from 'react';
import { useNavigation } from '../contexts/NavigationContext';

const CTA: React.FC = () => {
  const { navigateTo } = useNavigation();

  return (
    <section className="relative overflow-hidden bg-ink-950 dark:bg-ink-950">
      <div
        aria-hidden
        className="absolute inset-0 bg-grid-subtle opacity-[0.08] pointer-events-none"
        style={{ ['--grid-color' as string]: 'rgba(255,255,255,0.12)' }}
      />
      <div
        aria-hidden
        className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full bg-primary/10 blur-[120px] pointer-events-none"
      />

      <div className="relative max-w-5xl mx-auto px-6 md:px-10 py-24 md:py-32 text-center">
        <h2 className="font-display text-4xl md:text-6xl lg:text-7xl font-semibold text-white tracking-tightest leading-[1.02]">
          Votre prochain voyage
          <br />
          <span className="font-serif-italic text-primary italic font-normal">
            commence maintenant.
          </span>
        </h2>
        <p className="mt-6 text-gray-300/90 text-base md:text-lg leading-relaxed max-w-xl mx-auto">
          Pas d’application à télécharger. Réservez en 2 minutes depuis votre navigateur,
          recevez votre billet QR par email et WhatsApp.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className="group inline-flex items-center gap-2 rounded-full bg-primary hover:bg-primary-600 text-text-main px-6 py-3.5 text-sm font-semibold tracking-tight shadow-card transition-all hover:-translate-y-0.5"
          >
            <span className="material-symbols-outlined text-base">search</span>
            Rechercher un trajet
            <span className="material-symbols-outlined text-base group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
          </button>
          <button
            onClick={() => navigateTo('agencies')}
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 backdrop-blur-md text-white hover:bg-white/10 px-5 py-3.5 text-sm font-medium tracking-tight transition-all"
          >
            <span className="material-symbols-outlined text-base">store</span>
            Nos agences
          </button>
          <a
            href="https://wa.me/237670000000"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 backdrop-blur-md text-white hover:bg-white/10 px-5 py-3.5 text-sm font-medium tracking-tight transition-all"
          >
            <span className="material-symbols-outlined text-base">chat</span>
            Support WhatsApp
          </a>
        </div>

        <div className="mt-14 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-[11px] uppercase tracking-[0.18em] text-white/50">
          <span className="inline-flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-primary">lock</span>
            SSL sécurisé
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-primary">smartphone</span>
            Mobile-first
          </span>
          <span className="hidden sm:inline-flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-primary">language</span>
            FR / EN
          </span>
        </div>
      </div>
    </section>
  );
};

export default CTA;
