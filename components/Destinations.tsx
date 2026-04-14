'use client';
import React from 'react';
import { Destination } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

const destinationsData: Destination[] = [
  {
    id: 1,
    name: "New York City",
    price: "19.99",
    connections: 34,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBsE7n4TTVZMTE4DgqQV77gfGu6dPmxSh6CwjTzJO4VHxS5GSovYlEeY5BNRDZKSXBqW97s8WJxxI6tXuQNe1kUSZ9TCyezt4fC3TPLU3lrBDhJpfx4j49r9KTKH9MkI3Ex5A8X6TZC8TN6gtRL2erMQ3GQIC9qGAlAiCYv5YY6eIt7QaxvLbtt83UMeQQBZerGe3Jt9QSwBGf6HbblzPzyCJggRoLF0S1UendUdlCdbHcIWy6hM5a-Qs3SqXGke38jzucozWREsNHC"
  },
  {
    id: 2,
    name: "Boston",
    price: "14.50",
    connections: 22,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAwnWd8XlO9iYnBVqohk7Pdytb8v7J_X-ijWKTnvxNgC1dmk8xZaF9w_3sUcOMGrEWhybH-qZOFsunT1xYrIlOi3R8MXe_LxPOhP_DQesLgCgAcIwXIu1-cz0bsGR-UI3Yp2Akue6xvcnZeqzv1mEdtNic-3kEGpvGIuAZQpjBWUN2CUKDxJtTj2Avcl2ia4JwJHFV8j0HKnnO-6nal-M5CZ-hgPaSkJrPMk6D__yGhnbVoBTr4pgywsA-QedYZgC11HUggpKrnbYhV"
  },
  {
    id: 3,
    name: "Chicago",
    price: "29.99",
    connections: 18,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDevbmteDlWa-W8SJrw8oDbGTyv3nLrk6JBsd2Nc5qrBRuDPLCLS-MYPkdGQUxqYMPeBLOSL1X9BD4rFQ_DslWwQh041jDGn2FxZf8i4YImxafa-L2YZnT14bxz65c4--3mZCKArzpGyo9jJGqYVD7GSxckrdr4L9xfyvXxG6YjIRN-XNCH4a3m7lemvGAFNsIIyZrKCKj0pOxzQmO43olgVKlJ3Wjsc-QeXESzxHfEV11L6dpcyApDHfAm9O7W2QVEugeFNpOVTdLC"
  },
  {
    id: 4,
    name: "Toronto",
    price: "24.99",
    connections: 12,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBnZ3bfYZn6RIIncU6kIJQF7PC8sK7ek05XCXE49ahmQaBU8JOL9eI3UGx3l1cSP7l1qRbfrYX_8qWLDMsdx-dJl9HcPXcyEe6TZgVI002Jbe_UMDHyMuN1kzJ9QXd-8p6QRCFkRSgMA1x49v1olKXftducJ_KVBv60WnE9Db0jZqXCFfyXz2VI0ysyL21GwxvFK0F5TIQ_kXibRI0zfBDeZGGYBCNpYJymyeGrKCKwVfXTnL96BeNeO8ukJ__tGk7pmAIiuEKiqS2E"
  }
];

const Destinations: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="bg-white dark:bg-surface-dark py-20 px-6 md:px-10 border-t border-gray-100 dark:border-gray-800">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-end justify-between mb-12">
          <div>
            <div className="inline-flex items-center gap-2 bg-primary/10 text-teal-accent dark:text-primary text-xs font-black uppercase tracking-widest px-4 py-2 rounded-full mb-4">
              <span className="material-symbols-outlined text-sm">explore</span>
              Destinations
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-text-main dark:text-white">{t('dest.title')}</h2>
          </div>
          <a href="#" className="hidden sm:flex items-center gap-1 text-primary font-black text-sm hover:gap-2 transition-all">
            {t('dest.view_all')}
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </a>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {destinationsData.map((dest, idx) => (
            <div key={dest.id} className={`group relative overflow-hidden rounded-2xl cursor-pointer ${idx === 0 ? 'sm:col-span-2 aspect-[16/9]' : 'aspect-[4/5]'}`}>
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                style={{
                  backgroundImage: `url('${dest.image}')`
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent group-hover:from-black/90 transition-all" />
              <div className="absolute bottom-0 left-0 w-full p-5">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary text-text-main text-xs font-black mb-2">
                  {t('dest.from')} ${dest.price}
                </span>
                <h3 className="text-white text-xl font-black leading-tight">{dest.name}</h3>
                <p className="text-gray-300 text-xs mt-1">{dest.connections} {t('dest.connections')}</p>
              </div>
              {/* Hover badge */}
              <div className="absolute top-4 right-4 size-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 -translate-y-2 group-hover:translate-y-0">
                <span className="material-symbols-outlined text-white text-lg">arrow_outward</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Destinations;
