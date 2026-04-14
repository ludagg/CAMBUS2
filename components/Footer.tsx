'use client';
import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigation } from '../contexts/NavigationContext';

const Footer: React.FC = () => {
  const { t } = useLanguage();
  const { setUser, navigateTo } = useNavigation();

  const handleAdminAccess = (e: React.MouseEvent) => {
    e.preventDefault();
    // Default to Super Admin for the "Admin Access" link. 
    // The user can switch roles inside the dashboard.
    setUser({ 
        uid: 'demo-super-admin', 
        name: 'Super Admin', 
        email: 'admin@easytravel.cm', 
        role: 'super_admin', 
        avatar: 'SA' 
    });
    navigateTo('super_admin');
  };

  return (
    <footer className="bg-gray-950 dark:bg-background-dark border-t border-gray-800 pt-16 pb-8 px-6 md:px-10">
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
        <div className="col-span-2 md:col-span-1">
          <div className="flex items-center gap-3 mb-5">
            <div className="size-8 flex items-center justify-center rounded-xl bg-gradient-to-br from-primary to-emerald-400 text-text-main">
              <span className="material-symbols-outlined text-lg">directions_bus</span>
            </div>
            <div>
              <span className="font-black text-lg text-white leading-none">EasyTravel</span>
              <div className="text-[9px] font-bold text-primary/70 uppercase tracking-[0.2em]">Bus Tickets</div>
            </div>
          </div>
          <p className="text-sm text-gray-500 mb-6 leading-relaxed">
            {t('footer.slogan')}
          </p>
          <div className="flex gap-3">
            <a href="#" className="size-9 bg-gray-800 hover:bg-primary hover:text-text-main rounded-xl flex items-center justify-center text-gray-400 transition-all">
              <span className="material-symbols-outlined text-lg">public</span>
            </a>
            <a href="#" className="size-9 bg-gray-800 hover:bg-primary hover:text-text-main rounded-xl flex items-center justify-center text-gray-400 transition-all">
              <span className="material-symbols-outlined text-lg">alternate_email</span>
            </a>
            <a href="#" className="size-9 bg-gray-800 hover:bg-primary hover:text-text-main rounded-xl flex items-center justify-center text-gray-400 transition-all">
              <span className="material-symbols-outlined text-lg">share</span>
            </a>
          </div>
        </div>
        
        <div>
          <h4 className="font-bold text-gray-300 mb-5 text-sm uppercase tracking-wider">{t('footer.plan')}</h4>
          <ul className="space-y-3 text-sm text-gray-500">
            <li><a href="#" className="hover:text-primary transition-colors">{t('footer.link.route_map')}</a></li>
            <li><a href="#" className="hover:text-primary transition-colors">{t('footer.link.bus_stops')}</a></li>
            <li><a href="#" className="hover:text-primary transition-colors">{t('footer.link.manage_booking')}</a></li>
            <li><a href="#" className="hover:text-primary transition-colors">{t('footer.link.real_time')}</a></li>
          </ul>
        </div>
        
        <div>
          <h4 className="font-bold text-gray-300 mb-5 text-sm uppercase tracking-wider">{t('footer.support')}</h4>
          <ul className="space-y-3 text-sm text-gray-500">
            <li><a href="#" className="hover:text-primary transition-colors">{t('footer.link.help_center')}</a></li>
            <li><a href="#" className="hover:text-primary transition-colors">{t('footer.link.lost_found')}</a></li>
            <li><a href="#" className="hover:text-primary transition-colors">{t('footer.link.faqs')}</a></li>
            <li><a href="#" className="hover:text-primary transition-colors">{t('footer.link.contact')}</a></li>
          </ul>
        </div>
        
        <div>
          <h4 className="font-bold text-gray-300 mb-5 text-sm uppercase tracking-wider">{t('footer.company')}</h4>
          <ul className="space-y-3 text-sm text-gray-500">
            <li><a href="#" className="hover:text-primary transition-colors">{t('footer.link.about')}</a></li>
            <li><a href="#" className="hover:text-primary transition-colors">{t('footer.link.careers')}</a></li>
            <li><a href="#" className="hover:text-primary transition-colors">{t('footer.link.press')}</a></li>
            <li><a href="#" className="hover:text-primary transition-colors">{t('footer.link.sustainability')}</a></li>
            <li><a href="#" onClick={handleAdminAccess} className="hover:text-primary transition-colors font-bold text-xs mt-5 block text-gray-600">Accès Administration (Demo)</a></li>
          </ul>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-600">
        <p>&copy; 2024 {t('footer.rights')}</p>
        <div className="flex gap-6">
          <a href="#" className="hover:text-gray-300 transition-colors">{t('footer.privacy')}</a>
          <a href="#" className="hover:text-gray-300 transition-colors">{t('footer.terms')}</a>
          <a href="#" className="hover:text-gray-300 transition-colors">{t('footer.cookies')}</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;