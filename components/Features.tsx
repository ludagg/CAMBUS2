'use client';
import React from 'react';
import SectionEyebrow from './landing/SectionEyebrow';

const featuresData = [
  {
    icon: 'smartphone',
    title: 'Mobile Money natif',
    description:
      'Paiement Orange Money et MTN MoMo sécurisé par confirmation USSD. Aucune carte bancaire requise.',
  },
  {
    icon: 'qr_code_2',
    title: 'Billet QR instantané',
    description:
      'Plus besoin d’imprimer. Montrez votre QR au chef de gare et embarquez. Validation en temps réel à bord.',
  },
  {
    icon: 'swap_horiz',
    title: 'Aller-retour en un clic',
    description:
      'Réservez les deux trajets en une transaction, avec la possibilité de revenir avec une autre compagnie.',
  },
  {
    icon: 'compare_arrows',
    title: 'Comparaison multi-compagnies',
    description:
      'Tous les horaires, tous les prix et toutes les options de confort (VIP, Classique, AC) sur un seul écran.',
  },
  {
    icon: 'schedule',
    title: 'Réservation 24 / 7',
    description:
      'Plus de file à 5 h du matin. Réservez depuis chez vous, à toute heure et depuis n’importe quel appareil.',
  },
  {
    icon: 'support_agent',
    title: 'Support WhatsApp',
    description:
      'Notre équipe répond sur WhatsApp 7j/7 de 6 h à 22 h, en français et en anglais.',
  },
];

const Features: React.FC = () => (
  <section className="relative py-24 md:py-32 px-6 md:px-10 bg-white dark:bg-surface-dark/40 border-y border-ink-100 dark:border-white/10">
    <div className="max-w-6xl mx-auto">
      <div className="max-w-2xl mb-16 md:mb-20">
        <SectionEyebrow align="left">Pourquoi EasyTravel</SectionEyebrow>
        <h2 className="mt-5 font-display text-3xl md:text-5xl font-semibold text-text-main dark:text-white tracking-tightest leading-[1.05]">
          Repensé de fond en comble,
          <br />
          <span className="font-serif-italic text-teal-accent dark:text-primary font-normal italic">pour vous faire gagner du temps.</span>
        </h2>
        <p className="mt-5 text-text-muted dark:text-gray-400 leading-relaxed max-w-xl">
          Chaque étape a été pensée pour être la plus courte possible, tout en restant fiable
          et sécurisée. Parce que le meilleur voyage commence avant l’embarquement.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {featuresData.map((feature) => (
          <div
            key={feature.title}
            className="group relative flex flex-col p-7 rounded-2xl bg-background-light dark:bg-ink-900/40 border border-ink-100 dark:border-white/10 hover:border-primary/40 hover:-translate-y-0.5 transition-all duration-300"
          >
            <div className="size-11 rounded-xl bg-primary/10 ring-1 ring-inset ring-primary/20 flex items-center justify-center text-teal-accent dark:text-primary mb-5">
              <span className="material-symbols-outlined text-[22px]">{feature.icon}</span>
            </div>
            <h3 className="font-display text-lg font-semibold tracking-tight text-text-main dark:text-white mb-2">
              {feature.title}
            </h3>
            <p className="text-sm text-text-muted dark:text-gray-400 leading-relaxed">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default Features;
