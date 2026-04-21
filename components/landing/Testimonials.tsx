'use client';
import React from 'react';
import SectionEyebrow from './SectionEyebrow';

const data = [
  {
    name: 'Marie Nguema',
    role: 'Commerçante, Douala',
    avatar: 'M',
    quote:
      'J’ai réservé Douala → Yaoundé en 2 minutes pendant que je cuisinais. Paiement MoMo, QR reçu immédiatement. Fini les longues files à l’agence.',
  },
  {
    name: 'Jean-Paul Kamga',
    role: 'Étudiant, Bafoussam',
    avatar: 'J',
    quote:
      'L’aller-retour Bafoussam → Yaoundé est parfait pour mes week-ends. Je compare tous les horaires des compagnies et je choisis le moins cher.',
  },
  {
    name: 'Aïcha Bello',
    role: 'Enseignante, Garoua',
    avatar: 'A',
    quote:
      'Au début j’étais sceptique avec le paiement Mobile Money en ligne. Mais la confirmation USSD sur le téléphone rend l’expérience vraiment sécurisée.',
  },
];

const Testimonials: React.FC = () => (
  <section className="relative py-24 md:py-32 px-6 md:px-10 bg-background-light dark:bg-background-dark">
    <div className="max-w-6xl mx-auto">
      <div className="max-w-2xl mx-auto text-center mb-14 md:mb-16">
        <SectionEyebrow>Ils nous font confiance</SectionEyebrow>
        <h2 className="mt-5 font-display text-3xl md:text-5xl font-semibold text-text-main dark:text-white tracking-tightest leading-[1.05]">
          Plus de <span className="font-serif-italic text-teal-accent dark:text-primary italic font-normal">200 000 voyageurs</span>
          <br /> ont déjà embarqué avec nous.
        </h2>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {data.map((t) => (
          <figure
            key={t.name}
            className="relative bg-white dark:bg-surface-dark rounded-2xl border border-ink-100 dark:border-white/10 p-8 hover:border-primary/30 transition-all duration-300"
          >
            <span
              aria-hidden
              className="font-serif-italic absolute top-4 right-6 text-7xl leading-none text-primary/20 select-none pointer-events-none"
            >
              “
            </span>
            <blockquote className="relative font-display text-[17px] md:text-lg leading-relaxed text-text-main dark:text-gray-100 tracking-tight">
              {t.quote}
            </blockquote>
            <figcaption className="mt-6 pt-5 border-t border-ink-100 dark:border-white/10 flex items-center gap-3">
              <div className="size-10 rounded-full bg-primary/10 ring-1 ring-inset ring-primary/20 flex items-center justify-center text-teal-accent dark:text-primary font-display font-semibold">
                {t.avatar}
              </div>
              <div>
                <div className="font-display font-semibold tracking-tight text-text-main dark:text-white text-sm">
                  {t.name}
                </div>
                <div className="text-xs text-text-muted mt-0.5">{t.role}</div>
              </div>
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  </section>
);

export default Testimonials;
