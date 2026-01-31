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
import { NavigationProvider, useNavigation } from './contexts/NavigationContext';

const AppContent: React.FC = () => {
  const { currentPage } = useNavigation();

  // Routeur Principal
  // Note: Les Dashboards Admin n'utilisent pas le Header/Footer standard pour une immersion totale.
  
  if (currentPage === 'super_admin') {
    return <SuperAdminDashboard />;
  }
  
  if (currentPage === 'agency_admin') {
    return <AgencyAdminDashboard />;
  }

  if (currentPage === 'station_manager') {
    return <StationManagerDashboard />;
  }

  // Layout Standard pour les utilisateurs publics
  return (
    <div className="relative flex flex-col min-h-screen w-full">
      <Header />
      <main className="flex-1">
        {currentPage === 'home' ? (
          <>
            <Hero />
            <Features />
            <Destinations />
            <CTA />
          </>
        ) : currentPage === 'agencies' ? (
          <AgenciesPage />
        ) : currentPage === 'results' ? (
          <SearchResultsPage />
        ) : currentPage === 'checkout' ? (
          <CheckoutPage />
        ) : currentPage === 'bookings' ? (
          <BookingsPage />
        ) : currentPage === 'login' ? (
          <LoginPage />
        ) : (
          <SignupPage />
        )}
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