'use client';
import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const Features: React.FC = () => {
  const { t } = useLanguage();

  const featuresData = [
    {
      id: 1,
      icon: 'wifi',
      title: t('features.wifi.title'),
      description: t('features.wifi.desc'),
      gradient: 'from-blue-500/10 to-cyan-500/10',
      iconBg: 'bg-blue-500/10',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      id: 2,
      icon: 'airline_seat_recline_extra',
      title: t('features.legroom.title'),
      description: t('features.legroom.desc'),
      gradient: 'from-primary/10 to-emerald-500/10',
      iconBg: 'bg-primary/10',
      iconColor: 'text-teal-accent dark:text-primary',
    },
    {
      id: 3,
      icon: 'eco',
      title: t('features.eco.title'),
      description: t('features.eco.desc'),
      gradient: 'from-emerald-500/10 to-green-500/10',
      iconBg: 'bg-emerald-500/10',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
    }
  ];

  return (
    <div className="py-20 md:py-28 px-6 md:px-10 max-w-7xl mx-auto">
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 bg-primary/10 text-teal-accent dark:text-primary text-xs font-black uppercase tracking-widest px-4 py-2 rounded-full mb-5">
          <span className="material-symbols-outlined text-sm">verified</span>
          Pourquoi nous choisir
        </div>
        <h2 className="text-3xl md:text-4xl font-black text-text-main dark:text-white mb-4">{t('features.title')}</h2>
        <p className="text-text-muted dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
          {t('features.subtitle')}
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {featuresData.map((feature) => (
          <div key={feature.id} className={`group relative flex flex-col items-center text-center p-8 rounded-3xl bg-gradient-to-br ${feature.gradient} border border-gray-100 dark:border-gray-800 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-1`}>
            <div className={`size-16 rounded-2xl ${feature.iconBg} flex items-center justify-center mb-6 ${feature.iconColor} group-hover:scale-110 transition-transform duration-300`}>
              <span className="material-symbols-outlined text-4xl">{feature.icon}</span>
            </div>
            <h3 className="text-xl font-black text-text-main dark:text-white mb-3">{feature.title}</h3>
            <p className="text-text-muted dark:text-gray-400 leading-relaxed text-sm">
              {feature.description}
            </p>
            {/* Decorative element */}
            <div className="absolute top-4 right-4 size-2 rounded-full bg-primary/30 group-hover:bg-primary transition-colors" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Features;
