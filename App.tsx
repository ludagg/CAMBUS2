import React from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import Features from './components/Features';
import Destinations from './components/Destinations';
import CTA from './components/CTA';
import Footer from './components/Footer';
import AgenciesPage from './components/AgenciesPage';
import SearchResultsPage from './components/SearchResultsPage';
import CheckoutPage from './components/CheckoutPage';
import SuperAdminDashboard from './components/SuperAdminDashboard';
import AgencyAdminDashboard from './components/AgencyAdminDashboard';
import StationManagerDashboard from './components/StationManagerDashboard';
import BookingsPage from './components/BookingsPage';
import { LoginPage, SignupPage } from './components/AuthPages';
import { LanguageProvider } from './contexts/LanguageContext';
import { NavigationProvider, useNavigation, Page } from './contexts/NavigationContext';

const AuthGuard: React.FC<{ children: React.ReactNode, requiredRole?: string }> = ({ children, requiredRole }) => {
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
    // Si l'utilisateur n'a pas le bon rôle admin, on le renvoie à l'accueil
    navigateTo('home');
    return null;
  }

  return <>{children}</>;
};

const AppContent: React.FC = () => {
  const { currentPage, authLoading } = useNavigation();

  // Pages publiques qui ne nécessitent pas de Layout (ou layout spécial)
  if (currentPage === 'super_admin') {
    return <AuthGuard requiredRole="super_admin"><SuperAdminDashboard /></AuthGuard>;
  }
  if (currentPage === 'agency_admin') {
    return <AuthGuard requiredRole="agency_admin"><AgencyAdminDashboard /></AuthGuard>;
  }
  if (currentPage === 'station_manager') {
    return <AuthGuard requiredRole="station_manager"><StationManagerDashboard /></AuthGuard>;
  }

  // Spinner global si l'auth est en train de se charger pour éviter les flashes de contenu privé
  if (authLoading && (currentPage === 'bookings' || currentPage === 'checkout')) {
      return (
        <div className="min-h-screen flex items-center justify-center">
            <span className="material-symbols-outlined text-4xl text-primary animate-spin">progress_activity</span>
        </div>
      );
  }

  return (
    <div className="relative flex flex-col min-h-screen w-full">
      <Header />
      <main className="flex-1">
        {currentPage === 'home' && (
          <>
            <Hero />
            <Features />
            <Destinations />
            <CTA />
          </>
        )}
        {currentPage === 'agencies' && <AgenciesPage />}
        {currentPage === 'results' && <SearchResultsPage />}
        {currentPage === 'checkout' && <AuthGuard><CheckoutPage /></AuthGuard>}
        {currentPage === 'bookings' && <AuthGuard><BookingsPage /></AuthGuard>}
        {currentPage === 'login' && <LoginPage />}
        {currentPage === 'signup' && <SignupPage />}
      </main>
      <Footer />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <LanguageProvider>
      <NavigationProvider>
        <AppContent />
      </NavigationProvider>
    </LanguageProvider>
  );
};

export default App;