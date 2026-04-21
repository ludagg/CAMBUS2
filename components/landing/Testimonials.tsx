'use client';
import React from 'react';

const data = [
  {
    name: 'Marie Nguema',
    role: 'Commerçante, Douala',
    avatar: 'M',
    color: 'from-pink-500 to-rose-500',
    stars: 5,
    quote:
      "J'ai réservé Douala → Yaoundé en 2 minutes pendant que je cuisinais. Paiement MoMo, QR code reçu immédiatement. C'est fini les longues files à l'agence.",
  },
  {
    name: 'Jean-Paul Kamga',
    role: 'Étudiant, Bafoussam',
    avatar: 'J',
    color: 'from-blue-500 to-cyan-500',
    stars: 5,
    quote:
      "L'aller-retour Bafoussam → Yaoundé est super pratique pour mes week-ends. Je vois tous les horaires des compagnies sur un seul écran, je choisis le moins cher.",
  },
  {
    name: 'Aïcha Bello',
    role: 'Enseignante, Garoua',
    avatar: 'A',
    color: 'from-amber-500 to-orange-500',
    stars: 5,
    quote:
      "Au début j'étais sceptique avec les paiements Mobile Money sur internet. Mais le système demande confirmation USSD sur le téléphone, donc c'est vraiment sécurisé. Je recommande.",
  },
];

const Testimonials: React.FC = () => (
  <section className="py-20 md:py-24 px-6 md:px-10 bg-background-light dark:bg-surface-dark/50">
    <div className="max-w-7xl mx-auto">
      <div className="text-center mb-14">
        <div className="inline-flex items-center gap-2 bg-primary/10 text-teal-accent dark:text-primary text-xs font-black uppercase tracking-widest px-4 py-2 rounded-full mb-5">
          <span className="material-symbols-outlined text-sm">favorite</span>
          Ils nous font confiance
        </div>
        <h2 className="text-3xl md:text-4xl font-black text-text-main dark:text-white mb-3">
          Plus de <span className="text-primary">200 000</span> voyageurs satisfaits
        </h2>
        <p className="text-text-muted dark:text-gray-400 max-w-2xl mx-auto">
          Ce que pensent nos clients après avoir voyagé avec EasyTravel.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {data.map((t) => (
          <div
            key={t.name}
            className="relative bg-white dark:bg-surface-dark rounded-3xl border border-gray-100 dark:border-gray-800 p-7 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300"
          >
            <span className="material-symbols-outlined absolute top-5 right-5 text-6xl text-primary/10 select-none pointer-events-none">format_quote</span>
            <div className="flex gap-0.5 mb-4">
              {Array.from({ length: t.stars }).map((_, i) => (
                <span key={i} className="material-symbols-outlined text-amber-400 text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              ))}
            </div>
            <p className="text-text-main dark:text-gray-200 leading-relaxed mb-6 relative z-10">&ldquo;{t.quote}&rdquo;</p>
            <div className="flex items-center gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
              <div className={`size-11 rounded-full bg-gradient-to-br ${t.color} flex items-center justify-center text-white font-black text-lg shadow-md`}>
                {t.avatar}
              </div>
              <div>
                <div className="font-black text-text-main dark:text-white text-sm">{t.name}</div>
                <div className="text-xs text-text-muted">{t.role}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default Testimonials;
