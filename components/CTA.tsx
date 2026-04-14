'use client';
import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const CTA: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-teal-accent via-[#0d4035] to-background-dark py-20 px-6">
      {/* Decorative circles */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(19,236,91,0.07)_0%,transparent_70%)] pointer-events-none" />
      
      <div className="relative max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-10 z-10">
        <div>
          <div className="inline-flex items-center gap-2 bg-primary/20 text-primary text-xs font-black uppercase tracking-widest px-4 py-2 rounded-full mb-5 border border-primary/20">
            <span className="material-symbols-outlined text-sm">smartphone</span>
            Application Mobile
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-white mb-3">{t('cta.title')}</h2>
          <p className="text-gray-300 leading-relaxed max-w-md">{t('cta.desc')}</p>
          
          {/* App store badges */}
          <div className="flex gap-4 mt-8">
            <button className="group flex items-center gap-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white px-5 py-3.5 rounded-2xl font-bold transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20">
              <span className="material-symbols-outlined text-2xl">ios</span>
              <div className="text-left">
                <div className="text-[9px] uppercase tracking-widest text-gray-300 font-bold leading-none mb-0.5">Télécharger sur</div>
                <div className="text-sm font-black">{t('cta.app_store')}</div>
              </div>
            </button>
            <button className="group flex items-center gap-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white px-5 py-3.5 rounded-2xl font-bold transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20">
              <span className="material-symbols-outlined text-2xl">android</span>
              <div className="text-left">
                <div className="text-[9px] uppercase tracking-widest text-gray-300 font-bold leading-none mb-0.5">Disponible sur</div>
                <div className="text-sm font-black">{t('cta.google_play')}</div>
              </div>
            </button>
          </div>
        </div>
        
        {/* Phone mockup */}
        <div className="relative hidden md:flex items-center justify-center">
          <div className="w-48 h-80 bg-gradient-to-br from-white/10 to-white/5 rounded-[2.5rem] border-2 border-white/20 backdrop-blur-sm flex flex-col items-center justify-center gap-4 shadow-2xl shadow-black/30">
            <div className="size-14 rounded-2xl bg-primary/30 flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl text-primary">directions_bus</span>
            </div>
            <div className="text-center">
              <div className="text-white font-black text-sm">EasyTravel</div>
              <div className="text-gray-400 text-xs">Bus Tickets</div>
            </div>
            <div className="w-32 h-0.5 bg-white/10 rounded-full" />
            <div className="flex gap-2">
              <div className="size-2 rounded-full bg-primary animate-pulse" />
              <div className="size-2 rounded-full bg-primary/50 animate-pulse" style={{ animationDelay: '0.2s' }} />
              <div className="size-2 rounded-full bg-primary/30 animate-pulse" style={{ animationDelay: '0.4s' }} />
            </div>
          </div>
          <div className="absolute inset-0 bg-primary/5 rounded-full blur-2xl scale-150" />
        </div>
      </div>
    </div>
  );
};

export default CTA;
