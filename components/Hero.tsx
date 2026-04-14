'use client';
import React from 'react';
import SearchWidget from './SearchWidget';
import { useLanguage } from '../contexts/LanguageContext';

const Hero: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="relative w-full bg-surface-light dark:bg-background-dark">
      {/* Hero Background Image */}
      <div className="relative h-[520px] w-full overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-700 scale-105"
          style={{
            backgroundImage: "linear-gradient(160deg, rgba(10, 26, 16, 0.55) 0%, rgba(16, 34, 22, 0.7) 100%), url('https://lh3.googleusercontent.com/aida-public/AB6AXuDUTEFOYMI8eyP5aL-0vjSJnpMBA7_gLVpQz5Dzwybkx9lteu5XHQCz42z0vbeE0o-vNAFt9Z-U340hujDxju8xQDuF79dH2IYVvrKP3H8Y7EbJi8vQDaii6eEjPdYdhY8kSP3N8nmP1SBkbFZmwodQpYdDAVImz80XqdIUSVd-SI7qSEVpHoryBo5QFzeRRdNaUK2y3V2TSntTSU6yiwQv5S9rc9b5ncYu1AkK-rdJmq4a714aHMVWpHcjGyic0soSSnxo8-VXAI6v')"
          }}
          role="img"
          aria-label="Scenic bus travel on a highway through mountains"
        />
        {/* Decorative gradient orbs */}
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative h-full flex flex-col items-center justify-center px-4 text-center z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white text-xs font-black uppercase tracking-widest px-4 py-2 rounded-full mb-6">
            <span className="size-2 rounded-full bg-primary animate-pulse"></span>
            EasyTravel — Voyagez Mieux
          </div>
          <h1 className="text-white text-4xl md:text-6xl font-black leading-tight tracking-tight mb-5 max-w-4xl drop-shadow-lg">
            {t('hero.title')}
          </h1>
          <p className="text-gray-200/90 text-base md:text-xl font-medium max-w-2xl drop-shadow-md leading-relaxed">
            {t('hero.subtitle')}
          </p>
          {/* Stats bar */}
          <div className="flex items-center gap-8 mt-8">
            <div className="text-center">
              <div className="text-2xl font-black text-primary">50+</div>
              <div className="text-[10px] text-gray-300 font-bold uppercase tracking-widest">Villes</div>
            </div>
            <div className="w-px h-8 bg-white/20" />
            <div className="text-center">
              <div className="text-2xl font-black text-primary">4.9</div>
              <div className="text-[10px] text-gray-300 font-bold uppercase tracking-widest">Note</div>
            </div>
            <div className="w-px h-8 bg-white/20" />
            <div className="text-center">
              <div className="text-2xl font-black text-primary">200k+</div>
              <div className="text-[10px] text-gray-300 font-bold uppercase tracking-widest">Voyageurs</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Overlapping Search Widget */}
      <SearchWidget />
    </div>
  );
};

export default Hero;
