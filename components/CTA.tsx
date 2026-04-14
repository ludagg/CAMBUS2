'use client';
import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const CTA: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="bg-teal-accent text-white py-16 px-6">
      <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
        <div>
          <h2 className="text-3xl font-bold mb-2">{t('cta.title')}</h2>
          <p className="text-gray-300">{t('cta.desc')}</p>
        </div>
        <div className="flex gap-4">
          <button className="bg-black text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 hover:bg-gray-900 transition-colors">
            <span className="material-symbols-outlined">ios</span>
            {t('cta.app_store')}
          </button>
          <button className="bg-black text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 hover:bg-gray-900 transition-colors">
            <span className="material-symbols-outlined">android</span>
            {t('cta.google_play')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CTA;