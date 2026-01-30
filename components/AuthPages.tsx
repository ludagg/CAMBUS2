import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigation } from '../contexts/NavigationContext';

export const LoginPage: React.FC = () => {
  const { t } = useLanguage();
  const { navigateTo, login, bookingDetails } = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate login
    login({ name: 'User Test', email });
    
    // Redirect logic
    if (bookingDetails) {
      navigateTo('checkout');
    } else {
      navigateTo('home');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background-light dark:bg-background-dark">
      <div className="w-full max-w-md bg-white dark:bg-surface-dark p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800">
        <div className="text-center mb-8">
           <div className="size-12 bg-primary/20 rounded-xl flex items-center justify-center mx-auto mb-4 text-primary">
              <span className="material-symbols-outlined text-2xl">lock</span>
           </div>
           <h1 className="text-2xl font-black text-text-main dark:text-white mb-2">{t('auth.login.title')}</h1>
           <p className="text-text-muted text-sm">{t('auth.login.subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
           <div>
              <label className="block text-xs font-bold text-text-muted mb-1 uppercase">{t('auth.label.email')}</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-12 px-4 bg-gray-50 dark:bg-[#102216] border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-text-main dark:text-white transition-all"
              />
           </div>
           <div>
              <label className="block text-xs font-bold text-text-muted mb-1 uppercase">{t('auth.label.password')}</label>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-12 px-4 bg-gray-50 dark:bg-[#102216] border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-text-main dark:text-white transition-all"
              />
           </div>
           
           <button className="w-full h-12 bg-primary text-text-main font-bold rounded-xl hover:bg-[#0fd651] transition-colors mt-2">
              {t('auth.btn.login')}
           </button>
        </form>

        <div className="mt-6 text-center">
           <button 
             onClick={() => navigateTo('signup')}
             className="text-sm font-medium text-text-muted hover:text-primary transition-colors"
           >
              {t('auth.link.no_account')}
           </button>
        </div>
      </div>
    </div>
  );
};

export const SignupPage: React.FC = () => {
  const { t } = useLanguage();
  const { navigateTo, login, bookingDetails } = useNavigation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate signup
    login({ name, email });

    // Redirect logic
    if (bookingDetails) {
      navigateTo('checkout');
    } else {
      navigateTo('home');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background-light dark:bg-background-dark">
      <div className="w-full max-w-md bg-white dark:bg-surface-dark p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800">
        <div className="text-center mb-8">
           <div className="size-12 bg-primary/20 rounded-xl flex items-center justify-center mx-auto mb-4 text-primary">
              <span className="material-symbols-outlined text-2xl">person_add</span>
           </div>
           <h1 className="text-2xl font-black text-text-main dark:text-white mb-2">{t('auth.signup.title')}</h1>
           <p className="text-text-muted text-sm">{t('auth.signup.subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
           <div>
              <label className="block text-xs font-bold text-text-muted mb-1 uppercase">{t('auth.label.name')}</label>
              <input 
                type="text" 
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-12 px-4 bg-gray-50 dark:bg-[#102216] border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-text-main dark:text-white transition-all"
              />
           </div>
           <div>
              <label className="block text-xs font-bold text-text-muted mb-1 uppercase">{t('auth.label.email')}</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-12 px-4 bg-gray-50 dark:bg-[#102216] border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-text-main dark:text-white transition-all"
              />
           </div>
           <div>
              <label className="block text-xs font-bold text-text-muted mb-1 uppercase">{t('auth.label.password')}</label>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-12 px-4 bg-gray-50 dark:bg-[#102216] border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-text-main dark:text-white transition-all"
              />
           </div>
           
           <button className="w-full h-12 bg-primary text-text-main font-bold rounded-xl hover:bg-[#0fd651] transition-colors mt-2">
              {t('auth.btn.signup')}
           </button>
        </form>

        <div className="mt-6 text-center">
           <button 
             onClick={() => navigateTo('login')}
             className="text-sm font-medium text-text-muted hover:text-primary transition-colors"
           >
              {t('auth.link.has_account')}
           </button>
        </div>
      </div>
    </div>
  );
};