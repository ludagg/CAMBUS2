'use client';
import React from 'react';

const steps = [
  {
    num: '01',
    icon: 'search',
    title: 'Recherchez votre trajet',
    desc: "Choisissez votre ville de départ, destination et date. Aller simple ou aller-retour, nous comparons toutes les compagnies pour vous.",
    color: 'from-blue-500 to-cyan-500',
  },
  {
    num: '02',
    icon: 'event_seat',
    title: 'Choisissez votre bus',
    desc: 'Comparez les prix, horaires et types de confort (VIP, Classique, Climatisé). Réservez autant de places que nécessaire.',
    color: 'from-primary to-emerald-500',
  },
  {
    num: '03',
    icon: 'smartphone',
    title: 'Payez par Mobile Money',
    desc: 'Orange Money ou MTN MoMo en un clic. Vous recevez une demande de confirmation USSD sur votre téléphone.',
    color: 'from-orange-500 to-red-500',
  },
  {
    num: '04',
    icon: 'qr_code_2',
    title: 'Embarquez avec votre QR',
    desc: "Votre billet s'affiche dans l'app avec un QR code. Le chef de gare le scanne, vous montez à bord. Voilà.",
    color: 'from-purple-500 to-pink-500',
  },
];

const HowItWorks: React.FC = () => (
  <section className="py-20 md:py-28 px-6 md:px-10 bg-white dark:bg-background-dark border-t border-gray-100 dark:border-gray-800">
    <div className="max-w-7xl mx-auto">
      <div className="text-center mb-14">
        <div className="inline-flex items-center gap-2 bg-primary/10 text-teal-accent dark:text-primary text-xs font-black uppercase tracking-widest px-4 py-2 rounded-full mb-5">
          <span className="material-symbols-outlined text-sm">route</span>
          Comment ça marche
        </div>
        <h2 className="text-3xl md:text-4xl font-black text-text-main dark:text-white mb-4">Réservez en 4 étapes simples</h2>
        <p className="text-text-muted dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
          De la recherche à l&apos;embarquement en moins de 2 minutes, directement depuis votre téléphone.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-4">
        {steps.map((s, i) => (
          <div key={s.num} className="relative group">
            <div className="absolute -top-4 left-6 text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-gray-200 to-gray-100 dark:from-gray-800 dark:to-gray-900 pointer-events-none select-none">
              {s.num}
            </div>
            <div className="relative bg-white dark:bg-surface-dark rounded-3xl border border-gray-100 dark:border-gray-800 p-7 pt-14 h-full hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 transition-all duration-300">
              <div className={`size-12 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center text-white shadow-lg mb-5`}>
                <span className="material-symbols-outlined text-2xl">{s.icon}</span>
              </div>
              <h3 className="font-black text-lg text-text-main dark:text-white mb-2">{s.title}</h3>
              <p className="text-sm text-text-muted dark:text-gray-400 leading-relaxed">{s.desc}</p>
            </div>
            {i < steps.length - 1 && (
              <div className="hidden lg:flex absolute top-1/2 -right-2 -translate-y-1/2 z-10 size-8 rounded-full bg-white dark:bg-surface-dark border-2 border-primary/30 items-center justify-center">
                <span className="material-symbols-outlined text-primary text-sm">arrow_forward</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default HowItWorks;
