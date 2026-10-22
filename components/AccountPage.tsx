'use client';
import React, { useEffect, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigation } from '../contexts/NavigationContext';

type Feedback = { kind: 'success' | 'error'; message: string } | null;

const labelCls =
  'block text-[11px] font-semibold uppercase tracking-[0.16em] text-text-muted dark:text-gray-400 mb-2';

const inputCls =
  'w-full h-11 px-3.5 bg-white dark:bg-white/5 border border-ink-200 dark:border-white/10 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary/60 outline-none text-text-main dark:text-white placeholder-text-muted/70 transition-all text-sm';

const cardCls =
  'bg-white dark:bg-surface-dark rounded-2xl border border-ink-100 dark:border-white/10 shadow-subtle p-6 md:p-8';

const primaryBtnCls =
  'inline-flex items-center justify-center gap-2 h-11 px-5 rounded-full bg-text-main dark:bg-white text-white dark:text-text-main font-semibold tracking-tight shadow-subtle hover:shadow-card hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:cursor-not-allowed';

const dangerBtnCls =
  'inline-flex items-center justify-center gap-2 h-11 px-5 rounded-full bg-red-600 text-white font-semibold tracking-tight shadow-subtle hover:bg-red-700 hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:cursor-not-allowed';

const AccountPage: React.FC = () => {
  const { t } = useLanguage();
  const { user, authLoading, navigateTo, refreshUser, setUser } = useNavigation();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileFeedback, setProfileFeedback] = useState<Feedback>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState<Feedback>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteFeedback, setDeleteFeedback] = useState<Feedback>(null);

  useEffect(() => {
    if (!authLoading && !user) navigateTo('login');
  }, [authLoading, user, navigateTo]);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
    }
  }, [user]);

  if (authLoading || !user) return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 bg-background-light dark:bg-background-dark">
      <div className="bg-white dark:bg-surface-dark p-8 rounded-2xl shadow-subtle text-center border border-ink-100 dark:border-white/10">
        <div className="size-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4"><span className="material-symbols-outlined text-primary text-2xl animate-spin">progress_activity</span></div>
        <p className="text-text-muted dark:text-gray-400 font-medium">Chargement de votre profil...</p>
      </div>
    </div>
  );

  const onSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileFeedback(null);
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Mise à jour impossible.');
      setUser(json.data);
      setProfileFeedback({ kind: 'success', message: t('account.profile.saved') });
    } catch (err) {
      setProfileFeedback({
        kind: 'error',
        message: err instanceof Error ? err.message : 'Erreur inconnue.',
      });
    } finally {
      setProfileSaving(false);
    }
  };

  const onChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordFeedback(null);
    if (newPassword.length < 8) {
      setPasswordFeedback({ kind: 'error', message: t('account.password.too_short') });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordFeedback({ kind: 'error', message: t('account.password.mismatch') });
      return;
    }
    setPasswordSaving(true);
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Changement impossible.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      await refreshUser();
      setPasswordFeedback({ kind: 'success', message: t('account.password.saved') });
    } catch (err) {
      setPasswordFeedback({
        kind: 'error',
        message: err instanceof Error ? err.message : 'Erreur inconnue.',
      });
    } finally {
      setPasswordSaving(false);
    }
  };

  const onDelete = async () => {
    setDeleteFeedback(null);
    if (deleteConfirm.trim() !== 'DELETE') {
      setDeleteFeedback({ kind: 'error', message: t('account.delete.confirm_keyword') });
      return;
    }
    setDeleting(true);
    try {
      const res = await fetch('/api/auth/me', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: deletePassword, confirm: 'DELETE' }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Suppression impossible.');
      setUser(null);
      navigateTo('home');
    } catch (err) {
      setDeleteFeedback({
        kind: 'error',
        message: err instanceof Error ? err.message : 'Erreur inconnue.',
      });
      setDeleting(false);
    }
  };

  const renderFeedback = (fb: Feedback) =>
    fb && (
      <div
        role="status"
        className={`mt-4 rounded-lg border px-3.5 py-2.5 text-sm ${
          fb.kind === 'success'
            ? 'border-primary/30 bg-primary/10 text-teal-accent dark:text-primary'
            : 'border-red-300 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
        }`}
      >
        {fb.message}
      </div>
    );

  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen pt-10 md:pt-14 pb-20 px-4">
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-ink-200 dark:border-white/15 px-2.5 py-1 mb-4">
            <span className="size-1.5 rounded-full bg-primary" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-muted">
              {t('account.eyebrow')}
            </span>
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tightest text-text-main dark:text-white mb-2 leading-tight">
            {t('account.title')}
          </h1>
          <p className="text-text-muted dark:text-gray-400 text-sm md:text-base">
            {t('account.subtitle')}
          </p>
        </div>

        {/* Profile */}
        <section className={cardCls} aria-labelledby="account-profile">
          <h2
            id="account-profile"
            className="font-display text-xl font-semibold tracking-tight text-text-main dark:text-white mb-5"
          >
            {t('account.profile.title')}
          </h2>
          <form className="grid gap-4 md:grid-cols-2" onSubmit={onSaveProfile}>
            <div>
              <label htmlFor="account-name" className={labelCls}>
                {t('account.field.name')}
              </label>
              <input
                id="account-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                minLength={2}
                className={inputCls}
              />
            </div>
            <div>
              <label htmlFor="account-email" className={labelCls}>
                {t('account.field.email')}
              </label>
              <input
                id="account-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={inputCls}
              />
            </div>
            <div className="md:col-span-2 flex items-center justify-between gap-3 flex-wrap">
              <div className="text-xs text-text-muted">
                {t('account.role')}:{' '}
                <span className="font-mono font-semibold text-text-main dark:text-white">
                  {user.role}
                </span>
              </div>
              <button type="submit" disabled={profileSaving} className={primaryBtnCls}>
                {profileSaving ? t('common.loading') : t('account.profile.save')}
              </button>
            </div>
            {renderFeedback(profileFeedback)}
          </form>
        </section>

        {/* Password */}
        <section className={cardCls} aria-labelledby="account-password">
          <h2
            id="account-password"
            className="font-display text-xl font-semibold tracking-tight text-text-main dark:text-white mb-5"
          >
            {t('account.password.title')}
          </h2>
          <form className="grid gap-4 md:grid-cols-2" onSubmit={onChangePassword}>
            <div className="md:col-span-2">
              <label htmlFor="pw-current" className={labelCls}>
                {t('account.password.current')}
              </label>
              <input
                id="pw-current"
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className={inputCls}
              />
            </div>
            <div>
              <label htmlFor="pw-new" className={labelCls}>
                {t('account.password.new')}
              </label>
              <input
                id="pw-new"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                className={inputCls}
              />
            </div>
            <div>
              <label htmlFor="pw-confirm" className={labelCls}>
                {t('account.password.confirm')}
              </label>
              <input
                id="pw-confirm"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                className={inputCls}
              />
            </div>
            <div className="md:col-span-2 flex justify-end">
              <button type="submit" disabled={passwordSaving} className={primaryBtnCls}>
                {passwordSaving ? t('common.loading') : t('account.password.save')}
              </button>
            </div>
            {renderFeedback(passwordFeedback)}
          </form>
        </section>

        {/* Danger zone */}
        {user.role === 'USER' && (
          <section
            className="rounded-2xl border border-red-300/60 dark:border-red-900/40 bg-red-50/50 dark:bg-red-900/10 p-6 md:p-8"
            aria-labelledby="account-delete"
          >
            <h2
              id="account-delete"
              className="font-display text-xl font-semibold tracking-tight text-red-700 dark:text-red-300 mb-2"
            >
              {t('account.delete.title')}
            </h2>
            <p className="text-sm text-red-700/80 dark:text-red-200/80 mb-4 leading-relaxed">
              {t('account.delete.description')}
            </p>
            {!deleteOpen ? (
              <button
                type="button"
                onClick={() => setDeleteOpen(true)}
                className="inline-flex items-center gap-2 h-10 px-4 rounded-full border border-red-400/70 text-red-700 dark:text-red-300 hover:bg-red-100/60 dark:hover:bg-red-900/30 text-sm font-semibold tracking-tight transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">delete_forever</span>
                {t('account.delete.button')}
              </button>
            ) : (
              <div className="space-y-4">
                <div>
                  <label htmlFor="del-pw" className={labelCls}>
                    {t('account.password.current')}
                  </label>
                  <input
                    id="del-pw"
                    type="password"
                    autoComplete="current-password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label htmlFor="del-confirm" className={labelCls}>
                    {t('account.delete.type_keyword')}
                  </label>
                  <input
                    id="del-confirm"
                    type="text"
                    value={deleteConfirm}
                    onChange={(e) => setDeleteConfirm(e.target.value)}
                    placeholder="DELETE"
                    className={`${inputCls} font-mono tracking-[0.2em]`}
                  />
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <button
                    type="button"
                    onClick={onDelete}
                    disabled={deleting}
                    className={dangerBtnCls}
                  >
                    {deleting ? t('common.loading') : t('account.delete.confirm')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteOpen(false);
                      setDeletePassword('');
                      setDeleteConfirm('');
                      setDeleteFeedback(null);
                    }}
                    disabled={deleting}
                    className="inline-flex items-center gap-2 h-11 px-5 rounded-full border border-ink-200 dark:border-white/15 text-text-main dark:text-white font-semibold tracking-tight hover:border-ink-300 transition-colors"
                  >
                    {t('common.cancel')}
                  </button>
                </div>
                {renderFeedback(deleteFeedback)}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
};

export default AccountPage;
