import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigation } from '../contexts/NavigationContext';

const Header: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { t, language, setLanguage } = useLanguage();
  const { navigateTo, user, logout } = useNavigation();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'fr' : 'en');
  };

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between border-b border-[#f0f4f2] dark:border-[#1e3a29] bg-surface-light dark:bg-background-dark px-6 py-4 lg:px-10 transition-colors duration-200">
      <div 
        className="flex items-center gap-4 cursor-pointer"
        onClick={() => navigateTo('home')}
      >
        <div className="size-8 flex items-center justify-center rounded-lg bg-primary text-text-main">
          <span className="material-symbols-outlined text-2xl">directions_bus</span>
        </div>
        <h2 className="text-text-main dark:text-white text-xl font-bold tracking-tight">CamBus</h2>
      </div>
      
      <nav className="hidden md:flex items-center gap-8">
        <a href="#" onClick={(e) => { e.preventDefault(); navigateTo('home'); }} className="text-text-main dark:text-gray-200 text-sm font-medium hover:text-primary transition-colors">{t('nav.routes')}</a>
        <a href="#" className="text-text-main dark:text-gray-200 text-sm font-medium hover:text-primary transition-colors">{t('nav.service')}</a>
        <a href="#" className="text-text-main dark:text-gray-200 text-sm font-medium hover:text-primary transition-colors">{t('nav.help')}</a>
        {user && (
          <a href="#" onClick={(e) => { e.preventDefault(); navigateTo('bookings'); }} className="text-text-main dark:text-gray-200 text-sm font-medium hover:text-primary transition-colors">{t('nav.bookings')}</a>
        )}
      </nav>
      
      <div className="flex items-center gap-4">
        <button 
          onClick={toggleLanguage}
          className="text-text-muted hover:text-primary text-sm font-bold uppercase"
        >
          {language}
        </button>
        <div className="hidden md:block w-px h-4 bg-gray-300 dark:bg-gray-700"></div>
        
        {user ? (
            <div className="hidden md:flex items-center gap-3">
                <div className="text-right">
                    <div className="text-xs font-bold text-text-main dark:text-white">{user.name}</div>
                    <button onClick={logout} className="text-[10px] font-bold text-red-500 hover:text-red-600 uppercase tracking-wide">{t('nav.logout')}</button>
                </div>
                <div className="size-10 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center text-primary font-black border-2 border-white dark:border-gray-700 shadow-sm">
                    {user.name.charAt(0)}
                </div>
            </div>
        ) : (
            <button 
              onClick={() => navigateTo('login')}
              className="hidden md:flex items-center justify-center rounded-lg h-10 px-6 bg-primary text-text-main text-sm font-bold hover:bg-primary/90 transition-colors"
            >
            {t('nav.login')}
            </button>
        )}

        <button 
          className="md:hidden p-2 text-text-main dark:text-white"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <span className="material-symbols-outlined">menu</span>
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="absolute top-full left-0 w-full bg-surface-light dark:bg-background-dark border-b border-gray-200 dark:border-gray-800 md:hidden flex flex-col p-4 shadow-lg">
           <a href="#" onClick={(e) => { e.preventDefault(); navigateTo('home'); setIsMobileMenuOpen(false); }} className="py-3 px-4 text-text-main dark:text-gray-200 font-medium hover:bg-gray-100 dark:hover:bg-gray-800 rounded">{t('nav.routes')}</a>
           <a href="#" className="py-3 px-4 text-text-main dark:text-gray-200 font-medium hover:bg-gray-100 dark:hover:bg-gray-800 rounded">{t('nav.service')}</a>
           <a href="#" className="py-3 px-4 text-text-main dark:text-gray-200 font-medium hover:bg-gray-100 dark:hover:bg-gray-800 rounded">{t('nav.help')}</a>
           {user && (
              <a href="#" onClick={(e) => { e.preventDefault(); navigateTo('bookings'); setIsMobileMenuOpen(false); }} className="py-3 px-4 text-text-main dark:text-gray-200 font-medium hover:bg-gray-100 dark:hover:bg-gray-800 rounded">{t('nav.bookings')}</a>
           )}
           <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 flex flex-col gap-3">
             {user ? (
                 <button onClick={logout} className="w-full flex items-center justify-center rounded-lg h-10 px-6 bg-red-100 text-red-600 text-sm font-bold hover:bg-red-200 transition-colors">
                    {t('nav.logout')}
                 </button>
             ) : (
                 <button 
                   onClick={() => { navigateTo('login'); setIsMobileMenuOpen(false); }}
                   className="w-full flex items-center justify-center rounded-lg h-10 px-6 bg-primary text-text-main text-sm font-bold hover:bg-primary/90 transition-colors"
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