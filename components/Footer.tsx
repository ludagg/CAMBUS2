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
        email: 'admin@cambus.cm', 
        role: 'super_admin', 
        avatar: 'SA' 
    });
    navigateTo('super_admin');
  };

  return (
    <footer className="bg-background-light dark:bg-background-dark border-t border-gray-200 dark:border-gray-800 pt-16 pb-8 px-6 md:px-10">
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
        <div className="col-span-2 md:col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <div className="size-6 flex items-center justify-center rounded bg-primary text-text-main">
              <span className="material-symbols-outlined text-lg">directions_bus</span>
            </div>
            <span className="font-bold text-lg dark:text-white">CamBus</span>
          </div>
          <p className="text-sm text-text-muted dark:text-gray-500 mb-6">
            {t('footer.slogan')}
          </p>
          <div className="flex gap-4">
            <a href="#" className="text-gray-400 hover:text-primary transition-colors"><span className="material-symbols-outlined">public</span></a>
            <a href="#" className="text-gray-400 hover:text-primary transition-colors"><span className="material-symbols-outlined">alternate_email</span></a>
            <a href="#" className="text-gray-400 hover:text-primary transition-colors"><span className="material-symbols-outlined">share</span></a>
          </div>
        </div>
        
        <div>
          <h4 className="font-bold text-text-main dark:text-white mb-4">{t('footer.plan')}</h4>
          <ul className="space-y-2 text-sm text-text-muted dark:text-gray-400">
            <li><a href="#" className="hover:text-primary">{t('footer.link.route_map')}</a></li>
            <li><a href="#" className="hover:text-primary">{t('footer.link.bus_stops')}</a></li>
            <li><a href="#" className="hover:text-primary">{t('footer.link.manage_booking')}</a></li>
            <li><a href="#" className="hover:text-primary">{t('footer.link.real_time')}</a></li>
          </ul>
        </div>
        
        <div>
          <h4 className="font-bold text-text-main dark:text-white mb-4">{t('footer.support')}</h4>
          <ul className="space-y-2 text-sm text-text-muted dark:text-gray-400">
            <li><a href="#" className="hover:text-primary">{t('footer.link.help_center')}</a></li>
            <li><a href="#" className="hover:text-primary">{t('footer.link.lost_found')}</a></li>
            <li><a href="#" className="hover:text-primary">{t('footer.link.faqs')}</a></li>
            <li><a href="#" className="hover:text-primary">{t('footer.link.contact')}</a></li>
          </ul>
        </div>
        
        <div>
          <h4 className="font-bold text-text-main dark:text-white mb-4">{t('footer.company')}</h4>
          <ul className="space-y-2 text-sm text-text-muted dark:text-gray-400">
            <li><a href="#" className="hover:text-primary">{t('footer.link.about')}</a></li>
            <li><a href="#" className="hover:text-primary">{t('footer.link.careers')}</a></li>
            <li><a href="#" className="hover:text-primary">{t('footer.link.press')}</a></li>
            <li><a href="#" className="hover:text-primary">{t('footer.link.sustainability')}</a></li>
            <li><a href="#" onClick={handleAdminAccess} className="hover:text-primary font-bold text-xs mt-4 block text-gray-500">Accès Administration (Demo)</a></li>
          </ul>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto pt-8 border-t border-gray-200 dark:border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-text-muted dark:text-gray-500">
        <p>&copy; 2024 {t('footer.rights')}</p>
        <div className="flex gap-6">
          <a href="#" className="hover:text-text-main dark:hover:text-white">{t('footer.privacy')}</a>
          <a href="#" className="hover:text-text-main dark:hover:text-white">{t('footer.terms')}</a>
          <a href="#" className="hover:text-text-main dark:hover:text-white">{t('footer.cookies')}</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;