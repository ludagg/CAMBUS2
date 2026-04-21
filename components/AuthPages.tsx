'use client';
import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigation } from '../contexts/NavigationContext';

const BrandPanel: React.FC<{ variant: 'login' | 'signup' }> = ({ variant }) => (
  <aside
    aria-hidden
    className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-ink-950 rounded-3xl p-12 text-white min-h-[560px]"
  >
    <div
      aria-hidden
      className="absolute inset-0 bg-grid-subtle opacity-[0.10] pointer-events-none"
      style={{ ['--grid-color' as string]: 'rgba(255,255,255,0.14)' }}
    />
    <div
      aria-hidden
      className="absolute -top-32 -right-24 w-[520px] h-[520px] rounded-full bg-primary/15 blur-[110px]"
    />
    <div className="relative">
      <div className="inline-flex items-center gap-2.5">
        <div className="size-9 rounded-xl bg-white text-text-main flex items-center justify-center shadow-subtle">
          <span className="material-symbols-outlined text-[20px]">directions_bus</span>
        </div>
        <div className="leading-none">
          <div className="font-display text-lg font-semibold tracking-tight">EasyTravel</div>
          <div className="mt-0.5 text-[10px] font-medium text-white/50 uppercase tracking-[0.18em]">Cameroun</div>
        </div>
      </div>
    </div>
    <div className="relative">
      <p className="font-display text-3xl leading-[1.15] tracking-tightest text-white">
        {variant === 'login' ? (
          <>
            Votre prochain voyage,
            <br />
            <span className="font-serif-italic text-primary italic font-normal"> à un clic près.</span>
          </>
        ) : (
          <>
            Rejoignez plus de
            <br />
            <span className="font-serif-italic text-primary italic font-normal">200 000 voyageurs.</span>
          </>
        )}
      </p>
      <p className="mt-5 text-white/70 text-sm leading-relaxed max-w-sm">
        Comparez toutes les compagnies, payez en Mobile Money et embarquez avec un billet QR.
      </p>
    </div>
    <div className="relative flex flex-wrap gap-x-6 gap-y-3 text-[11px] uppercase tracking-[0.18em] text-white/50">
      <span className="inline-flex items-center gap-2">
        <span className="material-symbols-outlined text-[16px] text-primary">shield_lock</span>
        SSL sécurisé
      </span>
      <span className="inline-flex items-center gap-2">
        <span className="material-symbols-outlined text-[16px] text-primary">qr_code_2</span>
        Billet QR
      </span>
      <span className="inline-flex items-center gap-2">
        <span className="material-symbols-outlined text-[16px] text-primary">support_agent</span>
        Support 7j/7
      </span>
    </div>
  </aside>
);

const FieldLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <label className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-text-muted dark:text-gray-400 mb-2">
    {children}
  </label>
);

const inputCls =
  'w-full h-12 pl-11 pr-4 bg-white dark:bg-white/5 border border-ink-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/60 outline-none text-text-main dark:text-white placeholder-text-muted/70 transition-all text-sm';

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
    } catch (err: unknown) {
      console.error('Login error:', err);
      const msg = err instanceof Error ? err.message : 'Une erreur est survenue lors de la connexion.';
      setError(msg);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[82vh] bg-background-light dark:bg-background-dark px-4 md:px-8 py-10 md:py-14">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-8 lg:gap-10 items-stretch">
        <BrandPanel variant="login" />
        <div className="flex items-center">
          <div className="w-full max-w-md mx-auto bg-white dark:bg-surface-dark p-8 md:p-10 rounded-3xl border border-ink-100 dark:border-white/10 shadow-subtle">
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-ink-200 dark:border-white/15 px-2.5 py-1 mb-6">
                <span className="size-1.5 rounded-full bg-primary" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-muted">Connexion</span>
              </div>
              <h1 className="font-display text-3xl md:text-4xl font-semibold text-text-main dark:text-white tracking-tightest leading-tight">
                Content de vous
                <span className="font-serif-italic text-teal-accent dark:text-primary italic font-normal"> revoir.</span>
              </h1>
              <p className="mt-3 text-sm text-text-muted dark:text-gray-400 leading-relaxed">
                {t('auth.login.subtitle')}
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-300 rounded-xl flex items-start gap-3">
                <span className="material-symbols-outlined text-lg flex-shrink-0 mt-0.5">error</span>
                <span className="text-sm font-medium leading-relaxed">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <FieldLabel>{t('auth.label.email')}</FieldLabel>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-text-muted/70 text-lg">mail</span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputCls}
                    placeholder="nom@exemple.com"
                  />
                </div>
              </div>
              <div>
                <div className="flex items-end justify-between mb-2">
                  <FieldLabel>{t('auth.label.password')}</FieldLabel>
                  <button type="button" className="text-[11px] font-semibold text-teal-accent dark:text-primary hover:underline -mt-1">
                    Oublié ?
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-text-muted/70 text-lg">lock</span>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={inputCls}
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                disabled={isSubmitting}
                className="w-full h-12 bg-text-main dark:bg-white text-white dark:text-text-main font-semibold tracking-tight rounded-full mt-2 shadow-card hover:shadow-elevated hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed group"
              >
                {isSubmitting ? (
                  <span className="material-symbols-outlined animate-spin text-xl">progress_activity</span>
                ) : (
                  <>
                    {t('auth.btn.login')}
                    <span className="material-symbols-outlined text-base transition-transform group-hover:translate-x-0.5">arrow_forward</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-ink-100 dark:border-white/10 text-center">
              <p className="text-sm text-text-muted dark:text-gray-400">
                {t('auth.link.no_account')}{' '}
                <button
                  onClick={() => navigateTo('signup')}
                  className="font-semibold text-teal-accent dark:text-primary hover:underline"
                >
                  {t('auth.btn.signup')}
                </button>
              </p>
            </div>
          </div>
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
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      setIsSubmitting(false);
      return;
    }
    try {
      await signup(name, email, password);
    } catch (err: unknown) {
      console.error('Signup error:', err);
      const msg = err instanceof Error ? err.message : "Erreur lors de l'inscription. Vérifiez votre connexion.";
      setError(msg);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[82vh] bg-background-light dark:bg-background-dark px-4 md:px-8 py-10 md:py-14">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-8 lg:gap-10 items-stretch">
        <BrandPanel variant="signup" />
        <div className="flex items-center">
          <div className="w-full max-w-md mx-auto bg-white dark:bg-surface-dark p-8 md:p-10 rounded-3xl border border-ink-100 dark:border-white/10 shadow-subtle">
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-ink-200 dark:border-white/15 px-2.5 py-1 mb-6">
                <span className="size-1.5 rounded-full bg-primary" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-muted">Inscription</span>
              </div>
              <h1 className="font-display text-3xl md:text-4xl font-semibold text-text-main dark:text-white tracking-tightest leading-tight">
                Créez votre
                <span className="font-serif-italic text-teal-accent dark:text-primary italic font-normal"> compte.</span>
              </h1>
              <p className="mt-3 text-sm text-text-muted dark:text-gray-400 leading-relaxed">
                {t('auth.signup.subtitle')}
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-300 rounded-xl flex items-start gap-3">
                <span className="material-symbols-outlined text-lg flex-shrink-0 mt-0.5">error</span>
                <span className="text-sm font-medium leading-relaxed">{error}</span>
              </div>
            )}

            <div className="mb-6 p-4 bg-ink-50 dark:bg-white/5 border border-ink-100 dark:border-white/10 rounded-xl">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="material-symbols-outlined text-teal-accent dark:text-primary text-[18px]">bolt</span>
                <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-main dark:text-white">Comptes de démo</span>
              </div>
              <p className="text-[12px] text-text-muted dark:text-gray-400 leading-relaxed">
                <code className="font-mono text-text-main dark:text-gray-200">admin@easytravel.cm</code> • <code className="font-mono text-text-main dark:text-gray-200">company@express.cm</code> • <code className="font-mono text-text-main dark:text-gray-200">client@easytravel.cm</code> — mot de passe <code className="font-mono font-semibold text-text-main dark:text-gray-200">admin123</code>.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <FieldLabel>{t('auth.label.name')}</FieldLabel>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-text-muted/70 text-lg">person</span>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={inputCls}
                    placeholder="Votre nom complet"
                  />
                </div>
              </div>
              <div>
                <FieldLabel>{t('auth.label.email')}</FieldLabel>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-text-muted/70 text-lg">mail</span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputCls}
                    placeholder="nom@exemple.com"
                  />
                </div>
              </div>
              <div>
                <FieldLabel>{t('auth.label.password')}</FieldLabel>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-text-muted/70 text-lg">lock</span>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={inputCls}
                    placeholder="Min. 6 caractères"
                    minLength={6}
                  />
                </div>
              </div>

              <button
                disabled={isSubmitting}
                className="w-full h-12 bg-text-main dark:bg-white text-white dark:text-text-main font-semibold tracking-tight rounded-full mt-2 shadow-card hover:shadow-elevated hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed group"
              >
                {isSubmitting ? (
                  <span className="material-symbols-outlined animate-spin text-xl">progress_activity</span>
                ) : (
                  <>
                    {t('auth.btn.signup')}
                    <span className="material-symbols-outlined text-base transition-transform group-hover:translate-x-0.5">arrow_forward</span>
                  </>
                )}
              </button>
              <p className="text-[11px] text-text-muted leading-relaxed text-center pt-1">
                En créant un compte, vous acceptez nos Conditions et notre Politique de confidentialité.
              </p>
            </form>

            <div className="mt-8 pt-6 border-t border-ink-100 dark:border-white/10 text-center">
              <p className="text-sm text-text-muted dark:text-gray-400">
                {t('auth.link.has_account')}{' '}
                <button
                  onClick={() => navigateTo('login')}
                  className="font-semibold text-teal-accent dark:text-primary hover:underline"
                >
                  {t('auth.btn.login')}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
