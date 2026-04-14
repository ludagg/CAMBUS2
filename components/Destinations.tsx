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
    <div className="bg-white dark:bg-surface-dark py-16 px-6 md:px-10 border-t border-gray-100 dark:border-gray-800">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-text-main dark:text-white">{t('dest.title')}</h2>
          <a href="#" className="hidden sm:flex items-center gap-1 text-primary font-bold hover:underline">
            {t('dest.view_all')}
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </a>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {destinationsData.map((dest) => (
            <div key={dest.id} className="group relative overflow-hidden rounded-xl aspect-[4/5] cursor-pointer">
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                style={{
                  backgroundImage: `linear-gradient(to top, rgba(0,0,0,0.8), transparent), url('${dest.image}')`
                }}
              />
              <div className="absolute bottom-0 left-0 w-full p-5">
                <span className="inline-block px-2 py-1 rounded bg-primary text-text-main text-xs font-bold mb-2">
                  {t('dest.from')} ${dest.price}
                </span>
                <h3 className="text-white text-xl font-bold">{dest.name}</h3>
                <p className="text-gray-300 text-sm">{dest.connections} {t('dest.connections')}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Destinations;