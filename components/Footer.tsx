'use client';
import React, { useState } from 'react';
import { useNavigation } from '../contexts/NavigationContext';
import { useLanguage } from '../contexts/LanguageContext';

const Footer: React.FC = () => {
  const { navigateTo } = useNavigation();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubscribed(true);
    setTimeout(() => setSubscribed(false), 4000);
    setEmail('');
  };

  return (
    <footer className="bg-ink-950 text-gray-400 border-t border-white/5">
      {/* Newsletter band */}
      <div className="border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-14 grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h3 className="font-display text-2xl md:text-3xl font-semibold text-white tracking-tightest leading-tight">
              {t('footer.newsletter.title')}
              <span className="font-serif-italic text-primary italic font-normal"> {t('footer.newsletter.title.accent')}</span>
            </h3>
            <p className="text-sm text-gray-400 mt-3 leading-relaxed max-w-md">
              {t('footer.newsletter.subtitle')}
            </p>
          </div>
          <form onSubmit={handleSubscribe} className="flex gap-2">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('footer.newsletter.placeholder')}
              className="flex-1 h-12 px-4 bg-white/5 border border-white/10 rounded-full text-white placeholder-gray-500 focus:ring-2 focus:ring-primary/40 focus:border-primary/40 outline-none text-sm"
            />
            <button
              type="submit"
              className="h-12 px-5 rounded-full bg-primary hover:bg-primary-600 text-text-main font-semibold text-sm tracking-tight whitespace-nowrap transition-all"
            >
              {subscribed ? t('footer.newsletter.thanks') : t('footer.newsletter.subscribe')}
            </button>
          </form>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 md:px-10 pt-16 pb-10">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-12">
          <div className="col-span-2">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="size-9 flex items-center justify-center rounded-xl bg-white text-text-main shadow-subtle">
                <span className="material-symbols-outlined text-[20px]">directions_bus</span>
              </div>
              <div className="leading-none">
                <div className="font-display text-lg font-semibold text-white tracking-tight">EasyTravel</div>
                <div className="mt-0.5 text-[10px] font-medium text-gray-500 uppercase tracking-[0.18em]">Cameroun</div>
              </div>
            </div>
            <p className="text-sm text-gray-400 mb-6 leading-relaxed max-w-sm">
              {t('footer.slogan')}
            </p>
            <div className="space-y-2.5 text-sm mb-6">
              <a href="tel:+237670000000" className="flex items-center gap-2 hover:text-primary transition-colors">
                <span className="material-symbols-outlined text-primary text-[18px]">call</span>
                +237 670 000 000
              </a>
              <a href="mailto:contact@easytravel.cm" className="flex items-center gap-2 hover:text-primary transition-colors">
                <span className="material-symbols-outlined text-primary text-[18px]">mail</span>
                contact@easytravel.cm
              </a>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[18px]">location_on</span>
                Bonanjo, Douala, Cameroun
              </div>
            </div>
            <div className="flex gap-2">
              {[
                { icon: 'public', label: 'Facebook' },
                { icon: 'alternate_email', label: 'X' },
                { icon: 'photo_camera', label: 'Instagram' },
                { icon: 'play_circle', label: 'YouTube' },
                { icon: 'chat', label: 'WhatsApp' },
              ].map((s) => (
                <a
                  key={s.label}
                  href="#"
                  aria-label={s.label}
                  className="size-9 bg-white/5 hover:bg-primary border border-white/10 hover:border-primary hover:text-text-main rounded-full flex items-center justify-center text-gray-400 transition-all"
                >
                  <span className="material-symbols-outlined text-[18px]">{s.icon}</span>
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-display font-semibold text-white mb-5 text-[11px] uppercase tracking-[0.16em]">{t('footer.travel')}</h4>
            <ul className="space-y-2.5 text-sm">
              <li><button onClick={() => navigateTo('home')} className="hover:text-primary transition-colors">{t('footer.link.search_bus')}</button></li>
              <li><button onClick={() => navigateTo('agencies')} className="hover:text-primary transition-colors">{t('footer.link.agencies')}</button></li>
              <li><a href="#" className="hover:text-primary transition-colors">{t('footer.link.partners')}</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">{t('footer.link.popular')}</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">{t('footer.link.manage_booking')}</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display font-semibold text-white mb-5 text-[11px] uppercase tracking-[0.16em]">{t('footer.support')}</h4>
            <ul className="space-y-2.5 text-sm">
              <li><a href="#" className="hover:text-primary transition-colors">{t('footer.link.help_center')}</a></li>
              <li><a href="https://wa.me/237670000000" target="_blank" rel="noreferrer" className="hover:text-primary transition-colors">{t('footer.link.whatsapp')}</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">{t('footer.link.faqs')}</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">{t('footer.link.report')}</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">{t('footer.link.lost_found')}</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display font-semibold text-white mb-5 text-[11px] uppercase tracking-[0.16em]">{t('footer.company')}</h4>
            <ul className="space-y-2.5 text-sm">
              <li><a href="#" className="hover:text-primary transition-colors">{t('footer.link.about')}</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">{t('footer.link.partner_with_us')}</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">{t('footer.link.careers')}</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">{t('footer.link.press')}</a></li>
              <li><button onClick={() => navigateTo('login')} className="hover:text-primary transition-colors">{t('footer.link.pro_space')}</button></li>
            </ul>
          </div>
        </div>

        {/* Payment + compliance row */}
        <div className="flex flex-wrap justify-between items-center gap-6 py-6 border-y border-white/5">
          <div className="text-[11px] text-gray-500 font-medium uppercase tracking-[0.16em]">
            {t('footer.payments')}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {[
              { name: 'Orange Money', className: 'bg-orange-500 text-white' },
              { name: 'MTN MoMo', className: 'bg-yellow-400 text-black' },
              { name: 'Visa', className: 'bg-blue-700 text-white' },
              { name: 'Mastercard', className: 'bg-red-600 text-white' },
            ].map((p) => (
              <span
                key={p.name}
                className={`${p.className} text-[10px] font-semibold px-3 py-1.5 rounded-full uppercase tracking-[0.12em]`}
              >
                {p.name}
              </span>
            ))}
          </div>
        </div>

        <div className="pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-500">
          <p>© 2026 EasyTravel Cameroun. {t('footer.rights')}</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-gray-300 transition-colors">{t('footer.link.terms')}</a>
            <a href="#" className="hover:text-gray-300 transition-colors">{t('footer.link.privacy')}</a>
            <a href="#" className="hover:text-gray-300 transition-colors">{t('footer.link.cookies')}</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
