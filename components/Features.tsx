'use client';
import React from 'react';

const featuresData = [
  {
    icon: 'smartphone',
    title: 'Mobile Money intégré',
    description: 'Paiement Orange Money et MTN MoMo sécurisé par confirmation USSD. Aucune carte bancaire nécessaire.',
    gradient: 'from-orange-500/10 to-red-500/10',
    iconBg: 'bg-orange-500/10',
    iconColor: 'text-orange-600 dark:text-orange-400',
  },
  {
    icon: 'qr_code_2',
    title: 'Billet QR instantané',
    description: "Plus besoin d'imprimer. Montrez votre QR au chef de gare et embarquez. Validation instantanée à bord.",
    gradient: 'from-primary/10 to-emerald-500/10',
    iconBg: 'bg-primary/10',
    iconColor: 'text-teal-accent dark:text-primary',
  },
  {
    icon: 'swap_horiz',
    title: 'Aller-retour en un clic',
    description: 'Réservez les deux trajets en une transaction, avec possibilité de revenir avec une autre compagnie si besoin.',
    gradient: 'from-blue-500/10 to-cyan-500/10',
    iconBg: 'bg-blue-500/10',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  {
    icon: 'compare_arrows',
    title: 'Comparaison multi-compagnies',
    description: 'Tous les horaires, tous les prix, toutes les options de confort (VIP, Classique, AC) sur un seul écran.',
    gradient: 'from-purple-500/10 to-pink-500/10',
    iconBg: 'bg-purple-500/10',
    iconColor: 'text-purple-600 dark:text-purple-400',
  },
  {
    icon: 'schedule',
    title: 'Réservation 24h/24',
    description: 'Plus de files à 5h du matin. Réservez depuis chez vous, à toute heure, 7 jours sur 7.',
    gradient: 'from-amber-500/10 to-yellow-500/10',
    iconBg: 'bg-amber-500/10',
    iconColor: 'text-amber-600 dark:text-amber-400',
  },
  {
    icon: 'support_agent',
    title: 'Support WhatsApp',
    description: "Une question, un problème ? Notre équipe répond sur WhatsApp 7j/7 de 6h à 22h en français et en anglais.",
    gradient: 'from-emerald-500/10 to-green-500/10',
    iconBg: 'bg-emerald-500/10',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
  },
];

const Features: React.FC = () => (
  <section className="py-20 md:py-28 px-6 md:px-10">
    <div className="max-w-7xl mx-auto">
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 bg-primary/10 text-teal-accent dark:text-primary text-xs font-black uppercase tracking-widest px-4 py-2 rounded-full mb-5">
          <span className="material-symbols-outlined text-sm">auto_awesome</span>
          Pourquoi EasyTravel
        </div>
        <h2 className="text-3xl md:text-4xl font-black text-text-main dark:text-white mb-4">
          L&apos;expérience de voyage nouvelle génération
        </h2>
        <p className="text-text-muted dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
          Nous avons repensé chaque étape pour vous faire gagner du temps et voyager en toute sérénité.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {featuresData.map((feature) => (
          <div
            key={feature.title}
            className={`group relative flex flex-col p-7 rounded-3xl bg-gradient-to-br ${feature.gradient} border border-gray-100 dark:border-gray-800 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-1`}
          >
            <div
              className={`size-14 rounded-2xl ${feature.iconBg} flex items-center justify-center mb-5 ${feature.iconColor} group-hover:scale-110 transition-transform duration-300`}
            >
              <span className="material-symbols-outlined text-3xl">{feature.icon}</span>
            </div>
            <h3 className="text-lg font-black text-text-main dark:text-white mb-2">{feature.title}</h3>
            <p className="text-text-muted dark:text-gray-400 leading-relaxed text-sm">{feature.description}</p>
            <div className="absolute top-5 right-5 size-2 rounded-full bg-primary/30 group-hover:bg-primary transition-colors" />
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default Features;
