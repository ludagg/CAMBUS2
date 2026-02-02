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
    setError('');
    setIsSubmitting(true);

    try {
      await login(email, password);
      // La redirection est gérée dans NavigationContext
    } catch (err: any) {
      console.error("Login error:", err);
      if (err.code === 'auth/invalid-credential') {
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
    <div className="min-h-screen flex items-center justify-center px-4 bg-background-light dark:bg-background-dark py-12">
      <div className="w-full max-w-md bg-white dark:bg-surface-dark p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800">
        <div className="text-center mb-8">
           <div className="size-12 bg-primary/20 rounded-xl flex items-center justify-center mx-auto mb-4 text-primary">
              <span className="material-symbols-outlined text-2xl">lock</span>
           </div>
           <h1 className="text-2xl font-black text-text-main dark:text-white mb-2">{t('auth.login.title')}</h1>
           <p className="text-text-muted text-sm">{t('auth.login.subtitle')}</p>
        </div>

        {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-200 text-red-700 rounded-lg text-sm text-center font-medium">
                {error}
            </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
           <div>
              <label className="block text-xs font-bold text-text-muted mb-1 uppercase">{t('auth.label.email')}</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-12 px-4 bg-gray-50 dark:bg-[#102216] border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-text-main dark:text-white transition-all"
                placeholder="nom@exemple.com"
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
                placeholder="••••••••"
              />
           </div>
           
           <button 
             disabled={isSubmitting}
             className="w-full h-12 bg-primary text-text-main font-bold rounded-xl hover:bg-[#0fd651] transition-colors mt-2 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
           >
              {isSubmitting && <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>}
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
  const { navigateTo, signup } = useNavigation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    if (password.length < 6) {
        setError("Le mot de passe doit contenir au moins 6 caractères.");
        setIsSubmitting(false);
        return;
    }

    try {
        await signup(name, email, password);
        // La redirection est gérée dans NavigationContext
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
    <div className="min-h-screen flex items-center justify-center px-4 bg-background-light dark:bg-background-dark py-12">
      <div className="w-full max-w-md bg-white dark:bg-surface-dark p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800">
        <div className="text-center mb-8">
           <div className="size-12 bg-primary/20 rounded-xl flex items-center justify-center mx-auto mb-4 text-primary">
              <span className="material-symbols-outlined text-2xl">person_add</span>
           </div>
           <h1 className="text-2xl font-black text-text-main dark:text-white mb-2">{t('auth.signup.title')}</h1>
           <p className="text-text-muted text-sm">{t('auth.signup.subtitle')}</p>
        </div>

        {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-200 text-red-700 rounded-lg text-sm text-center font-medium">
                {error}
            </div>
        )}

        <div className="mb-6 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg text-xs text-blue-700 dark:text-blue-300">
            <p className="font-bold mb-1">💡 Astuce Admin :</p>
            <p>Utilisez un email contenant <b>"admin"</b> pour créer automatiquement un compte Super Admin et accéder au tableau de bord.</p>
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
                minLength={6}
              />
           </div>
           
           <button 
             disabled={isSubmitting}
             className="w-full h-12 bg-primary text-text-main font-bold rounded-xl hover:bg-[#0fd651] transition-colors mt-2 shadow-lg flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
           >
              {isSubmitting && <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>}
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