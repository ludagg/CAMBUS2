'use client';
import React from 'react';
import SearchWidget from './SearchWidget';

const Hero: React.FC = () => {
  return (
    <div className="relative w-full bg-surface-light dark:bg-background-dark">
      <div className="relative h-[560px] md:h-[620px] w-full overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center scale-105"
          style={{
            backgroundImage:
              "linear-gradient(160deg, rgba(10, 26, 16, 0.72) 0%, rgba(16, 34, 22, 0.85) 100%), url('https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=2000&q=80')",
          }}
          role="img"
          aria-label="Autoroute camerounaise au coucher du soleil"
        />
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-primary/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative h-full flex flex-col items-center justify-center px-4 text-center z-10 max-w-5xl mx-auto pt-8">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 text-white text-[11px] font-black uppercase tracking-widest px-4 py-2 rounded-full mb-7">
            <span className="size-2 rounded-full bg-primary animate-pulse"></span>
            La plateforme n°1 de réservation de bus au Cameroun
          </div>

          <h1 className="text-white text-4xl md:text-6xl lg:text-7xl font-black leading-[1.05] tracking-tight mb-6 drop-shadow-lg">
            Votre billet de bus,
            <br />
            <span className="bg-gradient-to-r from-primary via-emerald-400 to-primary bg-clip-text text-transparent">
              réservé en 2 minutes.
            </span>
          </h1>

          <p className="text-gray-200/95 text-base md:text-xl font-medium max-w-2xl drop-shadow-md leading-relaxed mb-8">
            Toutes les compagnies camerounaises, payables par Orange Money et MTN MoMo.
            Billet QR instantané, plus jamais de file à 5h du matin.
          </p>

          <div className="flex flex-wrap justify-center gap-3 mb-2">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-full">
              <span className="material-symbols-outlined text-sm text-primary">verified</span>
              Paiement sécurisé
            </div>
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-full">
              <span className="material-symbols-outlined text-sm text-primary">bolt</span>
              Confirmation instantanée
            </div>
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-full">
              <span className="material-symbols-outlined text-sm text-primary">support_agent</span>
              Support 7j/7
            </div>
          </div>
        </div>
      </div>

      <SearchWidget />
    </div>
  );
};

export default Hero;
