'use client';
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigation } from '../contexts/NavigationContext';

const Header: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { t, language, setLanguage } = useLanguage();
  const { navigateTo, user, logout, authLoading } = useNavigation();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'fr' : 'en');
  };

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 flex items-center justify-between px-6 lg:px-10 py-3 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/80 dark:bg-background-dark/80 backdrop-blur-xl border-b border-ink-100/80 dark:border-white/10 shadow-subtle'
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      <div
        className="flex items-center gap-2.5 cursor-pointer group"
        onClick={() => navigateTo('home')}
      >
        <div className="relative size-9 flex items-center justify-center rounded-xl bg-text-main dark:bg-white text-white dark:text-text-main shadow-subtle transition-transform group-hover:scale-105">
          <span className="material-symbols-outlined text-[20px]">directions_bus</span>
          <span className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full bg-primary ring-2 ring-white dark:ring-background-dark" />
        </div>
        <div className="leading-none">
          <div className="font-display text-[17px] font-semibold tracking-tight text-text-main dark:text-white">
            EasyTravel
          </div>
          <div className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.18em] text-text-muted dark:text-gray-500">
            Cameroun
          </div>
        </div>
      </div>

      <nav className="hidden md:flex items-center gap-7">
        <a href="#" onClick={(e) => { e.preventDefault(); navigateTo('home'); }} className="text-sm font-medium tracking-tight text-text-main dark:text-gray-200 hover:text-teal-accent dark:hover:text-primary transition-colors">{t('nav.routes')}</a>
        <a href="#" className="text-sm font-medium tracking-tight text-text-main dark:text-gray-200 hover:text-teal-accent dark:hover:text-primary transition-colors">{t('nav.service')}</a>
        <a href="#" className="text-sm font-medium tracking-tight text-text-main dark:text-gray-200 hover:text-teal-accent dark:hover:text-primary transition-colors">{t('nav.help')}</a>
        {user && (
          <a href="#" onClick={(e) => { e.preventDefault(); navigateTo('bookings'); }} className="inline-flex items-center gap-1.5 text-sm font-semibold tracking-tight text-teal-accent dark:text-primary hover:opacity-80 transition-opacity">
            <span className="material-symbols-outlined text-[18px]">confirmation_number</span>
            {t('nav.bookings')}
          </a>
        )}
      </nav>

      <div className="flex items-center gap-3">
        <button
          onClick={toggleLanguage}
          className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted hover:text-teal-accent dark:hover:text-primary border border-ink-200 dark:border-white/15 rounded-full px-2.5 py-1 transition-colors"
        >
          {language}
        </button>

        {authLoading ? (
          <div className="size-10 flex items-center justify-center">
            <span className="material-symbols-outlined animate-spin text-text-muted">progress_activity</span>
          </div>
        ) : user ? (
          <div className="hidden md:flex items-center gap-3">
            <div className="text-right leading-tight">
              <div className="text-xs font-semibold tracking-tight text-text-main dark:text-white truncate max-w-[140px]">{user.name}</div>
              <button onClick={logout} className="text-[10px] font-semibold text-text-muted hover:text-red-500 uppercase tracking-[0.14em] mt-0.5">{t('nav.logout')}</button>
            </div>
            <div
              onClick={() => {
                if (user.role === 'SUPER_ADMIN') navigateTo('super_admin');
                else if (user.role === 'COMPANY_ADMIN') navigateTo('company_admin');
                else if (user.role === 'AGENCY_ADMIN') navigateTo('agency_admin');
                else if (user.role === 'STATION_MANAGER') navigateTo('station_manager');
                else navigateTo('bookings');
              }}
              className="size-9 rounded-full bg-primary/15 text-teal-accent dark:text-primary font-display font-semibold flex items-center justify-center ring-1 ring-inset ring-primary/30 cursor-pointer hover:ring-primary transition-all"
            >
              {user.avatar || user.name.charAt(0).toUpperCase()}
            </div>
          </div>
        ) : (
          <button
            onClick={() => navigateTo('login')}
            className="hidden md:inline-flex items-center justify-center rounded-full h-9 px-5 bg-text-main dark:bg-white text-white dark:text-text-main text-sm font-semibold tracking-tight shadow-subtle hover:shadow-card active:scale-[0.98] transition-all"
          >
            {t('nav.login')}
          </button>
        )}

        <button
          className="md:hidden p-2 text-text-main dark:text-white rounded-lg hover:bg-ink-50 dark:hover:bg-white/5 transition-colors"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <span className="material-symbols-outlined text-2xl">{isMobileMenuOpen ? 'close' : 'menu'}</span>
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="absolute top-full left-0 w-full bg-white dark:bg-background-dark border-b border-ink-100 dark:border-white/10 md:hidden flex flex-col p-6 shadow-elevated animate-slideDown">
          <a href="#" onClick={(e) => { e.preventDefault(); navigateTo('home'); setIsMobileMenuOpen(false); }} className="py-3 px-4 text-text-main dark:text-gray-200 font-medium tracking-tight hover:bg-ink-50 dark:hover:bg-white/5 rounded-xl">{t('nav.routes')}</a>
          <a href="#" className="py-3 px-4 text-text-main dark:text-gray-200 font-medium tracking-tight hover:bg-ink-50 dark:hover:bg-white/5 rounded-xl">{t('nav.service')}</a>
          <a href="#" className="py-3 px-4 text-text-main dark:text-gray-200 font-medium tracking-tight hover:bg-ink-50 dark:hover:bg-white/5 rounded-xl">{t('nav.help')}</a>
          {user && (
            <a href="#" onClick={(e) => { e.preventDefault(); navigateTo('bookings'); setIsMobileMenuOpen(false); }} className="py-3 px-4 text-teal-accent dark:text-primary font-semibold hover:bg-primary/5 rounded-xl flex items-center gap-2">
              <span className="material-symbols-outlined">confirmation_number</span>
              {t('nav.bookings')}
            </a>
          )}
          <div className="mt-6 pt-6 border-t border-ink-100 dark:border-white/10 flex flex-col gap-3">
            {authLoading ? (
              <div className="flex justify-center py-2"><span className="material-symbols-outlined animate-spin">progress_activity</span></div>
            ) : user ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 px-4 mb-2">
                  <div className="size-10 rounded-full bg-primary/15 ring-1 ring-inset ring-primary/30 flex items-center justify-center font-display font-semibold text-teal-accent dark:text-primary">
                    {user.avatar || user.name.charAt(0)}
                  </div>
                  <div className="leading-tight">
                    <div className="text-sm font-semibold tracking-tight dark:text-white">{user.name}</div>
                    <div className="text-[10px] font-medium text-text-muted uppercase tracking-[0.14em] mt-0.5">{user.role}</div>
                  </div>
                </div>
                <button onClick={() => { logout(); setIsMobileMenuOpen(false); }} className="w-full flex items-center justify-center rounded-full h-11 bg-red-50 text-red-600 text-sm font-semibold hover:bg-red-100 transition-colors">
                  {t('nav.logout')}
                </button>
              </div>
            ) : (
              <button
                onClick={() => { navigateTo('login'); setIsMobileMenuOpen(false); }}
                className="w-full flex items-center justify-center rounded-full h-11 bg-text-main text-white text-sm font-semibold tracking-tight shadow-subtle transition-all active:scale-[0.98]"
              >
                {t('nav.login')}
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
