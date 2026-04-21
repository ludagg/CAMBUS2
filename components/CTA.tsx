'use client';
import React from 'react';
import { useNavigation } from '../contexts/NavigationContext';

const CTA: React.FC = () => {
  const { navigateTo } = useNavigation();

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-teal-accent via-[#0d4035] to-background-dark py-24 px-6">
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/15 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-primary/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(19,236,91,0.08)_0%,transparent_70%)] pointer-events-none" />

      <div className="relative max-w-5xl mx-auto text-center z-10">
        <div className="inline-flex items-center gap-2 bg-primary/20 text-primary text-xs font-black uppercase tracking-widest px-4 py-2 rounded-full mb-6 border border-primary/30">
          <span className="material-symbols-outlined text-sm">rocket_launch</span>
          Prêt à voyager ?
        </div>
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-5 leading-tight">
          Votre prochain voyage est
          <br />
          <span className="bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent">à 2 clics d&apos;ici.</span>
        </h2>
        <p className="text-gray-300 text-lg leading-relaxed max-w-2xl mx-auto mb-10">
          Rejoignez les milliers de Camerounais qui voyagent plus simplement avec EasyTravel.
          Pas d&apos;application à télécharger, réservez directement depuis votre navigateur.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className="group inline-flex items-center gap-2 bg-primary hover:bg-[#0fd651] text-text-main px-7 py-4 rounded-xl font-black text-sm shadow-2xl shadow-primary/30 transition-all hover:-translate-y-0.5"
          >
            <span className="material-symbols-outlined">search</span>
            Réserver maintenant
            <span className="material-symbols-outlined group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
          </button>
          <button
            onClick={() => navigateTo('agencies')}
            className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white px-6 py-4 rounded-xl font-black text-sm transition-all"
          >
            <span className="material-symbols-outlined">store</span>
            Voir les agences
          </button>
          <a
            href="https://wa.me/237670000000"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#1fb557] text-white px-6 py-4 rounded-xl font-black text-sm transition-all"
          >
            <span className="material-symbols-outlined">chat</span>
            Support WhatsApp
          </a>
        </div>

        <div className="mt-10 flex items-center justify-center gap-8 text-gray-400 text-xs font-bold uppercase tracking-widest">
          <span className="flex items-center gap-2"><span className="material-symbols-outlined text-primary">lock</span> SSL sécurisé</span>
          <span className="flex items-center gap-2"><span className="material-symbols-outlined text-primary">smartphone</span> Mobile-first</span>
          <span className="hidden sm:flex items-center gap-2"><span className="material-symbols-outlined text-primary">language</span> FR / EN</span>
        </div>
      </div>
    </section>
  );
};

export default CTA;
