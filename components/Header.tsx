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
    <header className={`sticky top-0 z-50 flex items-center justify-between border-b bg-white/95 dark:bg-background-dark/95 backdrop-blur-md px-6 py-3 lg:px-10 transition-all duration-300 ${isScrolled ? 'border-gray-200 dark:border-gray-800 shadow-lg shadow-black/5' : 'border-transparent'}`}>
      <div 
        className="flex items-center gap-3 cursor-pointer group"
        onClick={() => navigateTo('home')}
      >
        <div className="size-9 flex items-center justify-center rounded-xl bg-gradient-to-br from-primary to-emerald-400 text-text-main shadow-lg shadow-primary/30 transition-all group-hover:shadow-primary/50 group-hover:scale-105">
          <span className="material-symbols-outlined text-xl font-black">directions_bus</span>
        </div>
        <div>
          <h2 className="text-text-main dark:text-white text-xl font-black tracking-tight leading-none">EasyTravel</h2>
          <div className="text-[9px] font-bold text-primary/70 uppercase tracking-[0.2em] leading-none mt-0.5"></div>
        </div>
      </div>
      
      <nav className="hidden md:flex items-center gap-8">
        <a href="#" onClick={(e) => { e.preventDefault(); navigateTo('home'); }} className="text-text-main dark:text-gray-200 text-sm font-bold hover:text-primary transition-colors tracking-wide">{t('nav.routes')}</a>
        <a href="#" className="text-text-main dark:text-gray-200 text-sm font-bold hover:text-primary transition-colors tracking-wide">{t('nav.service')}</a>
        <a href="#" className="text-text-main dark:text-gray-200 text-sm font-bold hover:text-primary transition-colors tracking-wide">{t('nav.help')}</a>
        {user && (
          <a href="#" onClick={(e) => { e.preventDefault(); navigateTo('bookings'); }} className="text-primary dark:text-primary text-sm font-black hover:opacity-80 transition-opacity flex items-center gap-1">
            <span className="material-symbols-outlined text-lg">confirmation_number</span>
            {t('nav.bookings')}
          </a>
        )}
      </nav>
      
      <div className="flex items-center gap-4">
        <button 
          onClick={toggleLanguage}
          className="text-text-muted hover:text-primary text-xs font-black uppercase border border-gray-200 dark:border-gray-700 px-2.5 py-1.5 rounded-lg hover:border-primary/30 transition-all"
        >
          {language}
        </button>
        <div className="hidden md:block w-px h-4 bg-gray-300 dark:bg-gray-700"></div>
        
        {authLoading ? (
            <div className="size-10 flex items-center justify-center">
                 <span className="material-symbols-outlined animate-spin text-gray-300">progress_activity</span>
            </div>
        ) : user ? (
            <div className="hidden md:flex items-center gap-3">
                <div className="text-right">
                    <div className="text-xs font-black text-text-main dark:text-white truncate max-w-[120px]">{user.name}</div>
                    <button onClick={logout} className="text-[10px] font-black text-red-500 hover:text-red-600 uppercase tracking-widest">{t('nav.logout')}</button>
                </div>
                <div 
                  onClick={() => {
                    if (user.role === 'SUPER_ADMIN') navigateTo('super_admin');
                    else if (user.role === 'COMPANY_ADMIN') navigateTo('company_admin');
                    else if (user.role === 'AGENCY_ADMIN') navigateTo('agency_admin');
                    else if (user.role === 'STATION_MANAGER') navigateTo('station_manager');
                    else navigateTo('bookings');
                  }}
                  className="size-10 bg-gradient-to-br from-primary/20 to-emerald-100 dark:from-primary/20 dark:to-emerald-900/30 rounded-xl flex items-center justify-center text-primary font-black border-2 border-white dark:border-gray-700 shadow-sm cursor-pointer hover:border-primary transition-all hover:shadow-md"
                >
                    {user.avatar || user.name.charAt(0).toUpperCase()}
                </div>
            </div>
        ) : (
            <button 
              onClick={() => navigateTo('login')}
              className="hidden md:flex items-center justify-center rounded-xl h-10 px-6 bg-gradient-to-r from-text-main to-gray-800 dark:from-white dark:to-gray-100 text-white dark:text-black text-sm font-black hover:opacity-90 transition-all active:scale-95 shadow-lg shadow-black/10"
            >
            {t('nav.login')}
            </button>
        )}

        <button 
          className="md:hidden p-2 text-text-main dark:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <span className="material-symbols-outlined text-2xl">{isMobileMenuOpen ? 'close' : 'menu'}</span>
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="absolute top-full left-0 w-full bg-white dark:bg-background-dark border-b border-gray-200 dark:border-gray-800 md:hidden flex flex-col p-6 shadow-2xl animate-slideDown">
           <a href="#" onClick={(e) => { e.preventDefault(); navigateTo('home'); setIsMobileMenuOpen(false); }} className="py-3 px-4 text-text-main dark:text-gray-200 font-bold hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl mb-1">{t('nav.routes')}</a>
           <a href="#" className="py-3 px-4 text-text-main dark:text-gray-200 font-bold hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl mb-1">{t('nav.service')}</a>
           <a href="#" className="py-3 px-4 text-text-main dark:text-gray-200 font-bold hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl mb-1">{t('nav.help')}</a>
           {user && (
              <a href="#" onClick={(e) => { e.preventDefault(); navigateTo('bookings'); setIsMobileMenuOpen(false); }} className="py-3 px-4 text-primary font-black hover:bg-primary/5 rounded-xl flex items-center gap-2">
                <span className="material-symbols-outlined">confirmation_number</span>
                {t('nav.bookings')}
              </a>
           )}
           <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800 flex flex-col gap-3">
             {authLoading ? (
               <div className="flex justify-center py-2"><span className="material-symbols-outlined animate-spin">progress_activity</span></div>
             ) : user ? (
               <div className="space-y-3">
                 <div className="flex items-center gap-3 px-4 mb-2">
                    <div className="size-10 bg-primary/10 rounded-xl flex items-center justify-center font-black text-primary">{user.avatar || user.name.charAt(0)}</div>
                    <div>
                      <div className="text-sm font-black dark:text-white">{user.name}</div>
                      <div className="text-[10px] text-text-muted uppercase font-bold tracking-tighter">{user.role}</div>
                    </div>
                 </div>
                 <button onClick={() => { logout(); setIsMobileMenuOpen(false); }} className="w-full flex items-center justify-center rounded-xl h-12 bg-red-50 text-red-600 text-sm font-black hover:bg-red-100 transition-colors">
                    {t('nav.logout')}
                 </button>
               </div>
             ) : (
               <button 
                 onClick={() => { navigateTo('login'); setIsMobileMenuOpen(false); }}
                 className="w-full flex items-center justify-center rounded-xl h-12 bg-primary text-text-main text-sm font-black hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-95"
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
