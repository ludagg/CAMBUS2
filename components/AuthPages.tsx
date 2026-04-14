'use client';
import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigation } from '../contexts/NavigationContext';

export const LoginPage: React.FC = () => {
  const { t } = useLanguage();
  const { navigateTo, login } = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setError('');
    setIsSubmitting(true);

    try {
      await login(email, password);
    } catch (err: any) {
      console.error("Login error:", err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError("Email ou mot de passe incorrect.");
      } else if (err.code === 'auth/too-many-requests') {
        setError("Trop de tentatives. Veuillez réessayer plus tard.");
      } else {
        setError("Une erreur est survenue lors de la connexion.");
      }
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 bg-background-light dark:bg-background-dark py-12">
      <div className="w-full max-w-md bg-white dark:bg-surface-dark p-8 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 transform transition-all">
        <div className="text-center mb-8">
           <div className="size-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-primary">
              <span className="material-symbols-outlined text-3xl">login</span>
           </div>
           <h1 className="text-3xl font-black text-text-main dark:text-white mb-2">{t('auth.login.title')}</h1>
           <p className="text-text-muted text-sm">{t('auth.login.subtitle')}</p>
        </div>

        {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 text-red-700 dark:text-red-400 rounded flex items-center gap-3 animate-shake">
                <span className="material-symbols-outlined text-lg">error</span>
                <span className="text-sm font-bold">{error}</span>
            </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
           <div className="space-y-1.5">
              <label className="block text-xs font-black text-text-muted uppercase tracking-wider">{t('auth.label.email')}</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 text-lg">mail</span>
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-12 pl-11 pr-4 bg-gray-50 dark:bg-[#102216] border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-text-main dark:text-white transition-all font-medium"
                  placeholder="nom@exemple.com"
                />
              </div>
           </div>
           <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-black text-text-muted uppercase tracking-wider">{t('auth.label.password')}</label>
                <button type="button" className="text-[10px] font-bold text-primary uppercase hover:underline">Oublié ?</button>
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 text-lg">lock</span>
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-12 pl-11 pr-4 bg-gray-50 dark:bg-[#102216] border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-text-main dark:text-white transition-all font-medium"
                  placeholder="••••••••"
                />
              </div>
           </div>
           
           <button 
             disabled={isSubmitting}
             className="w-full h-14 bg-primary text-text-main font-black rounded-xl hover:bg-[#0fd651] transition-all mt-4 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed group active:scale-[0.98]"
           >
              {isSubmitting ? (
                <span className="material-symbols-outlined animate-spin text-xl">progress_activity</span>
              ) : (
                <>
                  {t('auth.btn.login')}
                  <span className="material-symbols-outlined transition-transform group-hover:translate-x-1">arrow_forward</span>
                </>
              )}
           </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800 text-center">
           <p className="text-sm text-text-muted">
             {t('auth.link.no_account')} {' '}
             <button 
               onClick={() => navigateTo('signup')}
               className="font-black text-primary hover:underline"
             >
                {t('auth.btn.signup')}
             </button>
           </p>
        </div>
      </div>
    </div>
  );
};

export const SignupPage: React.FC = () => {
  const { t } = useLanguage();
  const { navigateTo, signup } = useNavigation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) return;
    
    setError('');
    setIsSubmitting(true);

    if (password.length < 6) {
        setError("Le mot de passe doit contenir au moins 6 caractères.");
        setIsSubmitting(false);
        return;
    }

    try {
        await signup(name, email, password);
    } catch (err: any) {
        console.error("Signup error:", err);
        if (err.code === 'auth/email-already-in-use') {
            setError("Cette adresse email est déjà utilisée.");
        } else {
            setError("Erreur lors de l'inscription. Vérifiez votre connexion.");
        }
        setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 bg-background-light dark:bg-background-dark py-12">
      <div className="w-full max-w-md bg-white dark:bg-surface-dark p-8 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 transform transition-all">
        <div className="text-center mb-8">
           <div className="size-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-primary">
              <span className="material-symbols-outlined text-3xl">person_add</span>
           </div>
           <h1 className="text-3xl font-black text-text-main dark:text-white mb-2">{t('auth.signup.title')}</h1>
           <p className="text-text-muted text-sm">{t('auth.signup.subtitle')}</p>
        </div>

        {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 text-red-700 dark:text-red-400 rounded flex items-center gap-3 animate-shake">
                <span className="material-symbols-outlined text-lg">error</span>
                <span className="text-sm font-bold">{error}</span>
            </div>
        )}

        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl flex gap-3 items-start">
            <span className="material-symbols-outlined text-blue-500 mt-0.5">info</span>
            <div className="text-[11px] text-blue-800 dark:text-blue-300 leading-relaxed">
              <p className="font-bold mb-0.5">💡 Note Administrateur :</p>
              <p>Utilisez un email contenant <b>"admin"</b> pour simuler un accès Super Admin, <b>"express"</b> pour Agence, ou <b>"station"</b> pour Chef de Gare.</p>
            </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
           <div className="space-y-1.5">
              <label className="block text-xs font-black text-text-muted uppercase tracking-wider">{t('auth.label.name')}</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 text-lg">person</span>
                <input 
                  type="text" 
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-12 pl-11 pr-4 bg-gray-50 dark:bg-[#102216] border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-text-main dark:text-white transition-all font-medium"
                  placeholder="Votre nom complet"
                />
              </div>
           </div>
           <div className="space-y-1.5">
              <label className="block text-xs font-black text-text-muted uppercase tracking-wider">{t('auth.label.email')}</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 text-lg">mail</span>
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-12 pl-11 pr-4 bg-gray-50 dark:bg-[#102216] border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-text-main dark:text-white transition-all font-medium"
                  placeholder="nom@exemple.com"
                />
              </div>
           </div>
           <div className="space-y-1.5">
              <label className="block text-xs font-black text-text-muted uppercase tracking-wider">{t('auth.label.password')}</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 text-lg">lock</span>
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-12 pl-11 pr-4 bg-gray-50 dark:bg-[#102216] border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-text-main dark:text-white transition-all font-medium"
                  placeholder="Min. 6 caractères"
                  minLength={6}
                />
              </div>
           </div>
           
           <button 
             disabled={isSubmitting}
             className="w-full h-14 bg-primary text-text-main font-black rounded-xl hover:bg-[#0fd651] transition-all mt-4 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed group active:scale-[0.98]"
           >
              {isSubmitting ? (
                <span className="material-symbols-outlined animate-spin text-xl">progress_activity</span>
              ) : (
                <>
                  {t('auth.btn.signup')}
                  <span className="material-symbols-outlined transition-transform group-hover:translate-x-1">person_add</span>
                </>
              )}
           </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800 text-center">
           <p className="text-sm text-text-muted">
             {t('auth.link.has_account')} {' '}
             <button 
               onClick={() => navigateTo('login')}
               className="font-black text-primary hover:underline"
             >
                {t('auth.btn.login')}
             </button>
           </p>
        </div>
      </div>
    </div>
  );
};