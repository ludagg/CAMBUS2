'use client';
import React from 'react';
import { useNavigation } from '../contexts/NavigationContext';

const AuthGuard: React.FC<{ children: React.ReactNode; requiredRole?: string }> = ({ children, requiredRole }) => {
  const { user, authLoading, navigateTo } = useNavigation();

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="flex flex-col items-center gap-4">
          <span className="material-symbols-outlined text-5xl text-primary animate-spin">progress_activity</span>
          <p className="font-bold text-text-muted animate-pulse">Chargement sécurisé...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    navigateTo('login');
    return null;
  }

  if (requiredRole && user.role !== requiredRole) {
    navigateTo('home');
    return null;
  }

  return <>{children}</>;
};

export default AuthGuard;
