'use client';
import React, { useState } from 'react';
import SectionEyebrow from './SectionEyebrow';

const items = [
  {
    q: 'Comment réserver un billet de bus sur EasyTravel ?',
    a: 'Entrez votre ville de départ, destination et date dans la barre de recherche en haut de la page. Comparez les compagnies, sélectionnez votre bus, renseignez vos informations passager, payez par Mobile Money et recevez votre billet QR instantanément.',
  },
  {
    q: 'Quels modes de paiement acceptez-vous ?',
    a: 'Nous acceptons Orange Money, MTN Mobile Money et les cartes bancaires. Les paiements Mobile Money sont sécurisés par une confirmation USSD sur votre téléphone : aucun risque de débit non autorisé.',
  },
  {
    q: 'Puis-je réserver un aller-retour ?',
    a: 'Bien sûr. Dans la barre de recherche, cochez « Aller-retour » et choisissez votre date de retour. Vous réservez les deux trajets en une seule transaction et recevez deux billets QR.',
  },
  {
    q: 'Comment fonctionne le billet QR ? Dois-je l’imprimer ?',
    a: 'Non, pas besoin d’imprimer. Ouvrez l’application ou votre email de confirmation, montrez le QR code au chef de gare qui le scanne à l’embarquement. C’est instantané.',
  },
  {
    q: 'Puis-je annuler ou modifier ma réservation ?',
    a: 'Les conditions d’annulation dépendent de chaque compagnie partenaire. Rendez-vous dans « Mes réservations » pour consulter les options disponibles pour votre trajet, ou contactez directement notre support WhatsApp.',
  },
  {
    q: 'Mes informations de paiement sont-elles sécurisées ?',
    a: 'Oui. Nous n’enregistrons jamais vos identifiants Mobile Money. Chaque paiement transite par les API officielles d’Orange et de MTN, et nécessite votre confirmation USSD/PIN sur votre téléphone.',
  },
];

const FAQ: React.FC = () => {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="relative py-24 md:py-32 px-6 md:px-10 bg-white dark:bg-surface-dark/30 border-t border-ink-100 dark:border-white/10">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-14">
          <SectionEyebrow>Questions fréquentes</SectionEyebrow>
          <h2 className="mt-5 font-display text-3xl md:text-5xl font-semibold text-text-main dark:text-white tracking-tightest leading-[1.05]">
            Tout ce qu’il faut savoir,
            <span className="font-serif-italic text-teal-accent dark:text-primary italic font-normal"> avant de partir.</span>
          </h2>
        </div>

        <div className="divide-y divide-ink-100 dark:divide-white/10 border-y border-ink-100 dark:border-white/10">
          {items.map((it, i) => {
            const isOpen = open === i;
            return (
              <div key={i} className="group">
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="w-full flex items-start justify-between gap-6 py-6 text-left"
                  aria-expanded={isOpen}
                >
                  <span className={`font-display text-base md:text-lg font-semibold tracking-tight transition-colors ${isOpen ? 'text-teal-accent dark:text-primary' : 'text-text-main dark:text-white group-hover:text-teal-accent dark:group-hover:text-primary'}`}>
                    {it.q}
                  </span>
                  <span
                    className={`mt-1 inline-flex items-center justify-center size-7 rounded-full border transition-all flex-shrink-0 ${
                      isOpen
                        ? 'bg-primary text-text-main border-primary rotate-180'
                        : 'bg-transparent text-text-muted border-ink-200 dark:border-white/20'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">expand_more</span>
                  </span>
                </button>
                <div
                  className={`grid transition-all duration-300 ease-out ${
                    isOpen ? 'grid-rows-[1fr] opacity-100 pb-6' : 'grid-rows-[0fr] opacity-0'
                  }`}
                >
                  <div className="overflow-hidden text-text-muted dark:text-gray-400 leading-relaxed text-[15px] pr-12">
                    {it.a}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-text-muted dark:text-gray-400 mb-4">
            Toujours une question ? Notre équipe est disponible 7j/7 de 6 h à 22 h.
          </p>
          <a
            href="https://wa.me/237670000000"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-text-main dark:bg-white text-white dark:text-text-main px-5 py-2.5 text-sm font-semibold tracking-tight shadow-card hover:shadow-elevated hover:-translate-y-0.5 transition-all"
          >
            <span className="material-symbols-outlined text-base">chat</span>
            Contacter le support
          </a>
        </div>
      </div>
    </section>
  );
};

export default FAQ;
