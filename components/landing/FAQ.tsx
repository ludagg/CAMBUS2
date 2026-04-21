'use client';
import React, { useState } from 'react';

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
    q: "Comment fonctionne le billet QR ? Dois-je l'imprimer ?",
    a: "Non, pas besoin d'imprimer. Ouvrez l'application ou votre email de confirmation, montrez le QR code au chef de gare qui le scanne à l'embarquement. C'est instantané.",
  },
  {
    q: 'Puis-je annuler ou modifier ma réservation ?',
    a: "Les conditions d'annulation dépendent de chaque compagnie partenaire. Rendez-vous dans « Mes réservations » pour consulter les options disponibles pour votre trajet, ou contactez directement notre support WhatsApp.",
  },
  {
    q: 'Mes informations de paiement sont-elles sécurisées ?',
    a: "Oui. Nous n'enregistrons jamais vos identifiants Mobile Money. Chaque paiement transite par les API officielles d'Orange et de MTN, et nécessite votre confirmation USSD/PIN sur votre téléphone.",
  },
];

const FAQ: React.FC = () => {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="py-20 md:py-24 px-6 md:px-10 bg-white dark:bg-background-dark">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-teal-accent dark:text-primary text-xs font-black uppercase tracking-widest px-4 py-2 rounded-full mb-5">
            <span className="material-symbols-outlined text-sm">help</span>
            Questions fréquentes
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-text-main dark:text-white mb-3">
            Tout ce que vous devez savoir
          </h2>
          <p className="text-text-muted dark:text-gray-400">
            Une question ? La réponse est probablement juste en dessous.
          </p>
        </div>

        <div className="space-y-3">
          {items.map((it, i) => {
            const isOpen = open === i;
            return (
              <div
                key={i}
                className={`rounded-2xl border transition-all ${
                  isOpen
                    ? 'bg-primary/5 border-primary/30 shadow-lg shadow-primary/5'
                    : 'bg-background-light dark:bg-surface-dark border-gray-100 dark:border-gray-800 hover:border-gray-200'
                }`}
              >
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="w-full flex items-center justify-between gap-4 p-5 text-left"
                  aria-expanded={isOpen}
                >
                  <span className="font-black text-text-main dark:text-white text-base md:text-lg">{it.q}</span>
                  <span
                    className={`size-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                      isOpen ? 'bg-primary text-text-main rotate-180' : 'bg-gray-100 dark:bg-gray-800 text-text-muted'
                    }`}
                  >
                    <span className="material-symbols-outlined text-lg">expand_more</span>
                  </span>
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 -mt-1 text-text-muted dark:text-gray-400 leading-relaxed">{it.a}</div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-10 text-center bg-gradient-to-br from-primary/10 to-emerald-500/10 border border-primary/20 rounded-2xl p-8">
          <h3 className="font-black text-xl text-text-main dark:text-white mb-2">Toujours une question ?</h3>
          <p className="text-text-muted dark:text-gray-400 mb-5 text-sm">
            Notre équipe support est disponible 7j/7 de 6h à 22h.
          </p>
          <a
            href="https://wa.me/237670000000"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#1fb557] text-white font-black px-6 py-3 rounded-xl shadow-lg shadow-[#25D366]/30 transition-all hover:-translate-y-0.5"
          >
            <span className="material-symbols-outlined">chat</span>
            Nous contacter sur WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
};

export default FAQ;
