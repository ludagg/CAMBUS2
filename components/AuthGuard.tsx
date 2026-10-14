'use client';
import React, { useEffect } from 'react';
import { useNavigation, UserRole } from '../contexts/NavigationContext';

const AuthGuard: React.FC<{ children: React.ReactNode; requiredRole?: UserRole | UserRole[] }> = ({ children, requiredRole }) => {
  const { user, authLoading, navigateTo } = useNavigation();

  const allowed =
    !!user &&
    (!requiredRole || (Array.isArray(requiredRole) ? requiredRole.includes(user.role) : user.role === requiredRole));

  useEffect(() => {
    if (authLoading) return;
    if (!user) navigateTo('login');
    else if (!allowed) navigateTo('home');
  }, [authLoading, user, allowed, navigateTo]);

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

  if (!user || !allowed) return null;

  return <>{children}</>;
};

export default AuthGuard;
