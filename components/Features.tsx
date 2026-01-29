import React from 'react';
import { Feature } from '../types';

const featuresData: Feature[] = [
  {
    id: 1,
    icon: 'wifi',
    title: 'Free 4G Wi-Fi',
    description: 'Stay connected throughout your journey. Browse, stream, or work comfortably from your seat.'
  },
  {
    id: 2,
    icon: 'airline_seat_recline_extra',
    title: 'Extra Legroom',
    description: 'Our modern fleet features adjustable seats with plenty of space to stretch out and relax.'
  },
  {
    id: 3,
    icon: 'eco',
    title: 'Eco-Friendly Travel',
    description: 'Travel green. Our buses produce a fraction of the CO2 compared to cars or planes.'
  }
];

const Features: React.FC = () => {
  return (
    <div className="py-16 md:py-24 px-6 md:px-10 max-w-7xl mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-bold text-text-main dark:text-white mb-4">Why travel with CamBus?</h2>
        <p className="text-text-muted dark:text-gray-400 max-w-2xl mx-auto">
          We're redefining bus travel with a focus on comfort, technology, and sustainability.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-10">
        {featuresData.map((feature) => (
          <div key={feature.id} className="flex flex-col items-center text-center p-6 rounded-2xl bg-white dark:bg-surface-dark border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow">
            <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center mb-6 text-teal-accent dark:text-primary">
              <span className="material-symbols-outlined text-4xl">{feature.icon}</span>
            </div>
            <h3 className="text-xl font-bold text-text-main dark:text-white mb-3">{feature.title}</h3>
            <p className="text-text-muted dark:text-gray-400 leading-relaxed">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Features;