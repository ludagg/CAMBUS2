'use client';
import React, { useState, useEffect } from 'react';
import { useNavigation } from '../../contexts/NavigationContext';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

export default function ProfilePage() {
  const { user, setUser, authLoading } = useNavigation();
  const [name, setName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (user) setName(user.name);
  }, [user]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="material-symbols-outlined text-5xl text-primary animate-spin">progress_activity</span>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (newPassword && newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Les mots de passe ne correspondent pas.' });
      return;
    }

    setIsLoading(true);
    try {
      const body: Record<string, string> = {};
      if (name.trim() && name.trim() !== user.name) body.name = name.trim();
      if (newPassword) {
        body.currentPassword = currentPassword;
        body.newPassword = newPassword;
      }

      if (Object.keys(body).length === 0) {
        setMessage({ type: 'error', text: 'Aucune modification à enregistrer.' });
        setIsLoading(false);
        return;
      }

      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || 'Erreur lors de la mise à jour.' });
        return;
      }

      setUser({ ...user, name: data.user.name });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setMessage({ type: 'success', text: 'Profil mis à jour avec succès !' });
    } catch {
      setMessage({ type: 'error', text: 'Erreur de connexion au serveur.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex flex-col min-h-screen w-full bg-background-light dark:bg-background-dark font-display">
      <Header />
      <main className="flex-1 py-12 px-4">
        <div className="max-w-lg mx-auto">
          {/* Avatar */}
          <div className="text-center mb-8">
            <div className="size-20 mx-auto bg-gradient-to-br from-primary/20 to-emerald-100 dark:from-primary/20 dark:to-emerald-900/30 rounded-2xl flex items-center justify-center text-primary text-3xl font-black border-4 border-white dark:border-gray-700 shadow-lg mb-4">
              {user.avatar || user.name.charAt(0).toUpperCase()}
            </div>
            <h1 className="text-2xl font-black text-text-main dark:text-white">{user.name}</h1>
            <p className="text-sm text-text-muted">{user.email}</p>
            <span className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wide bg-primary/10 text-primary">
              {user.role || 'user'}
            </span>
          </div>

          <form onSubmit={handleSubmit} className="bg-white dark:bg-surface-dark rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 space-y-6">
            <h2 className="text-lg font-black text-text-main dark:text-white">Modifier le profil</h2>

            {message && (
              <div className={`p-3 rounded-xl text-sm font-bold flex items-center gap-2 ${message.type === 'success' ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                <span className="material-symbols-outlined text-base">{message.type === 'success' ? 'check_circle' : 'error'}</span>
                {message.text}
              </div>
            )}

            {/* Name */}
            <div>
              <label className="block text-sm font-bold text-text-main dark:text-white mb-1.5">Nom complet</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-4 py-3 text-sm text-text-main dark:text-white placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                placeholder="Votre nom"
              />
            </div>

            {/* Divider */}
            <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
              <h3 className="text-sm font-black text-text-muted uppercase tracking-widest mb-4">Changer le mot de passe</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-text-main dark:text-white mb-1.5">Mot de passe actuel</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-4 py-3 text-sm text-text-main dark:text-white placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-text-main dark:text-white mb-1.5">Nouveau mot de passe</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-4 py-3 text-sm text-text-main dark:text-white placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    placeholder="Min. 6 caractères"
                    autoComplete="new-password"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-text-main dark:text-white mb-1.5">Confirmer le nouveau mot de passe</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-4 py-3 text-sm text-text-main dark:text-white placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    placeholder="Répétez le nouveau mot de passe"
                    autoComplete="new-password"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 rounded-xl h-12 bg-gradient-to-r from-text-main to-gray-800 dark:from-white dark:to-gray-100 text-white dark:text-black text-sm font-black hover:opacity-90 transition-all active:scale-95 shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
              ) : (
                <>
                  <span className="material-symbols-outlined text-base">save</span>
                  Enregistrer les modifications
                </>
              )}
            </button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}
