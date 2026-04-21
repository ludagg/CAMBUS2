'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigation } from '../contexts/NavigationContext';

type PrimaryLink = {
  key: string;
  href?: string;
  navigate?: Parameters<ReturnType<typeof useNavigation>['navigateTo']>[0];
};

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { t, language, setLanguage } = useLanguage();
  const { navigateTo, user, logout, authLoading } = useNavigation();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock body scroll while the overlay menu is open.
  useEffect(() => {
    if (isMenuOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [isMenuOpen]);

  // Close on Escape.
  useEffect(() => {
    if (!isMenuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isMenuOpen]);

  const closeMenu = useCallback(() => setIsMenuOpen(false), []);

  const goto = useCallback(
    (page: Parameters<ReturnType<typeof useNavigation>['navigateTo']>[0]) => {
      navigateTo(page);
      closeMenu();
    },
    [navigateTo, closeMenu],
  );

  const primaryLinks: PrimaryLink[] = [
    { key: 'nav.home', navigate: 'home' },
    { key: 'nav.agencies', navigate: 'agencies' },
    { key: 'nav.help', href: '#how' },
  ];

  const dashboardForRole = () => {
    if (!user) return 'bookings' as const;
    if (user.role === 'SUPER_ADMIN') return 'super_admin' as const;
    if (user.role === 'COMPANY_ADMIN') return 'company_admin' as const;
    if (user.role === 'AGENCY_ADMIN') return 'agency_admin' as const;
    if (user.role === 'STATION_MANAGER') return 'station_manager' as const;
    return 'bookings' as const;
  };

  return (
    <>
      <header
        className={`sticky top-0 z-40 flex items-center justify-between px-5 sm:px-8 lg:px-12 py-3 transition-all duration-300 ${
          isScrolled || isMenuOpen
            ? 'bg-white/85 dark:bg-background-dark/85 backdrop-blur-xl border-b border-ink-100/80 dark:border-white/10 shadow-subtle'
            : 'bg-transparent border-b border-transparent'
        }`}
      >
        {/* Brand */}
        <button
          type="button"
          onClick={() => navigateTo('home')}
          className="flex items-center gap-2.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-xl"
          aria-label="EasyTravel"
        >
          <div className="relative size-9 flex items-center justify-center rounded-xl bg-text-main dark:bg-white text-white dark:text-text-main shadow-subtle transition-transform group-hover:scale-105">
            <span className="material-symbols-outlined text-[20px]">directions_bus</span>
            <span className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full bg-primary ring-2 ring-white dark:ring-background-dark" />
          </div>
          <div className="leading-none text-left">
            <div className="font-display text-[17px] font-semibold tracking-tight text-text-main dark:text-white">
              EasyTravel
            </div>
            <div className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.18em] text-text-muted dark:text-gray-500">
              Cameroun
            </div>
          </div>
        </button>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-7">
          {primaryLinks.map((l) => (
            <button
              key={l.key}
              type="button"
              onClick={() => (l.navigate ? navigateTo(l.navigate) : l.href ? (window.location.hash = l.href) : undefined)}
              className="text-sm font-medium tracking-tight text-text-main dark:text-gray-200 hover:text-teal-accent dark:hover:text-primary transition-colors"
            >
              {t(l.key)}
            </button>
          ))}
          {user && (
            <button
              type="button"
              onClick={() => navigateTo('bookings')}
              className="inline-flex items-center gap-1.5 text-sm font-semibold tracking-tight text-teal-accent dark:text-primary hover:opacity-80 transition-opacity"
            >
              <span className="material-symbols-outlined text-[18px]">confirmation_number</span>
              {t('nav.bookings')}
            </button>
          )}
        </nav>

        {/* Right cluster */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Language segmented control */}
          <div
            role="group"
            aria-label={t('nav.language')}
            className="hidden sm:inline-flex items-center rounded-full border border-ink-200 dark:border-white/15 bg-white/70 dark:bg-white/5 backdrop-blur p-0.5"
          >
            {(['fr', 'en'] as const).map((lng) => (
              <button
                key={lng}
                type="button"
                onClick={() => setLanguage(lng)}
                aria-pressed={language === lng}
                className={`px-2.5 h-7 rounded-full text-[11px] font-semibold uppercase tracking-[0.14em] transition-all ${
                  language === lng
                    ? 'bg-text-main dark:bg-white text-white dark:text-text-main shadow-subtle'
                    : 'text-text-muted hover:text-text-main dark:hover:text-white'
                }`}
              >
                {lng}
              </button>
            ))}
          </div>

          {authLoading ? (
            <div className="size-10 flex items-center justify-center">
              <span className="material-symbols-outlined animate-spin text-text-muted">progress_activity</span>
            </div>
          ) : user ? (
            <button
              type="button"
              onClick={() => navigateTo(user.role === 'USER' ? 'account' : dashboardForRole())}
              className="hidden md:inline-flex items-center gap-2.5 pl-1 pr-3 h-10 rounded-full border border-ink-200 dark:border-white/15 hover:border-ink-300 dark:hover:border-white/25 bg-white/70 dark:bg-white/5 backdrop-blur transition-colors"
              aria-label={t('nav.account')}
            >
              <span className="size-8 rounded-full bg-primary/15 text-teal-accent dark:text-primary font-display font-semibold flex items-center justify-center ring-1 ring-inset ring-primary/30">
                {user.avatar || user.name.charAt(0).toUpperCase()}
              </span>
              <span className="text-xs font-semibold tracking-tight text-text-main dark:text-white truncate max-w-[120px]">
                {user.name.split(' ')[0]}
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => navigateTo('login')}
              className="hidden sm:inline-flex items-center justify-center rounded-full h-10 px-5 bg-text-main dark:bg-white text-white dark:text-text-main text-sm font-semibold tracking-tight shadow-subtle hover:shadow-card active:scale-[0.98] transition-all"
            >
              {t('nav.login')}
            </button>
          )}

          {/* Sandwich toggle (always shown, even on desktop for the full menu) */}
          <button
            type="button"
            onClick={() => setIsMenuOpen((v) => !v)}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-menu"
            aria-label={isMenuOpen ? t('nav.close') : t('nav.menu')}
            className="relative size-10 inline-flex items-center justify-center rounded-full border border-ink-200 dark:border-white/15 bg-white/70 dark:bg-white/5 backdrop-blur hover:border-ink-300 dark:hover:border-white/25 active:scale-[0.96] transition-all md:hidden"
          >
            <span className="sr-only">{isMenuOpen ? t('nav.close') : t('nav.menu')}</span>
            <span
              className={`absolute block h-[1.5px] w-4 bg-text-main dark:bg-white rounded-full transition-all duration-300 ${
                isMenuOpen ? 'rotate-45 translate-y-0' : '-translate-y-1'
              }`}
            />
            <span
              className={`absolute block h-[1.5px] w-4 bg-text-main dark:bg-white rounded-full transition-all duration-300 ${
                isMenuOpen ? '-rotate-45 translate-y-0' : 'translate-y-1'
              }`}
            />
          </button>
        </div>
      </header>

      {/* Sandwich overlay — full screen on mobile, panel on desktop */}
      <div
        id="mobile-menu"
        className={`fixed inset-0 z-30 md:hidden pointer-events-none transition-opacity duration-200 ${
          isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0'
        }`}
        aria-hidden={!isMenuOpen}
      >
        <div
          onClick={closeMenu}
          className={`absolute inset-0 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-xl transition-opacity duration-300 ${
            isMenuOpen ? 'opacity-100' : 'opacity-0'
          }`}
        />

        <div
          className={`relative h-full w-full flex flex-col pt-20 pb-10 px-6 overflow-y-auto transition-transform duration-300 ${
            isMenuOpen ? 'translate-y-0' : '-translate-y-4'
          }`}
        >
          {/* User card OR CTA */}
          {user ? (
            <div className="rounded-3xl bg-white dark:bg-white/[0.03] border border-ink-100 dark:border-white/10 shadow-subtle p-5 flex items-center gap-4 mb-8">
              <div className="size-14 rounded-2xl bg-primary/15 ring-1 ring-inset ring-primary/30 flex items-center justify-center font-display text-lg font-semibold text-teal-accent dark:text-primary">
                {user.avatar || user.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[15px] font-semibold tracking-tight text-text-main dark:text-white truncate">
                  {user.name}
                </div>
                <div className="text-[11px] uppercase tracking-[0.14em] text-text-muted mt-0.5">
                  {t(
                    user.role === 'SUPER_ADMIN'
                      ? 'nav.admin.super'
                      : user.role === 'COMPANY_ADMIN'
                        ? 'nav.admin.company'
                        : user.role === 'AGENCY_ADMIN'
                          ? 'nav.admin.agency'
                          : user.role === 'STATION_MANAGER'
                            ? 'nav.admin.station'
                            : 'nav.account',
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => goto(dashboardForRole())}
                className="inline-flex items-center gap-1 rounded-full h-9 px-3 bg-text-main dark:bg-white text-white dark:text-text-main text-[12px] font-semibold"
              >
                {t('admin.dashboard')}
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>
          ) : (
            <div className="mb-8 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => goto('login')}
                className="inline-flex items-center justify-center rounded-full h-11 bg-text-main dark:bg-white text-white dark:text-text-main text-sm font-semibold tracking-tight shadow-subtle"
              >
                {t('nav.login')}
              </button>
              <button
                type="button"
                onClick={() => goto('signup')}
                className="inline-flex items-center justify-center rounded-full h-11 border border-ink-200 dark:border-white/15 text-text-main dark:text-white text-sm font-semibold tracking-tight"
              >
                {t('nav.signup')}
              </button>
            </div>
          )}

          {/* Primary links */}
          <nav className="flex-1">
            <ul className="space-y-1">
              <MenuLink icon="home" label={t('nav.home')} onClick={() => goto('home')} />
              <MenuLink icon="route" label={t('nav.agencies')} onClick={() => goto('agencies')} />
              {user && (
                <MenuLink icon="confirmation_number" label={t('nav.bookings')} onClick={() => goto('bookings')} accent />
              )}
              {user && (
                <MenuLink icon="person" label={t('nav.account')} onClick={() => goto('account')} />
              )}
              <MenuLink icon="help" label={t('nav.help')} onClick={() => { window.location.hash = '#how'; closeMenu(); }} />
            </ul>

            <div className="mt-6 pt-6 border-t border-ink-100 dark:border-white/10">
              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted mb-3 px-3">
                {t('nav.language')}
              </div>
              <div className="grid grid-cols-2 gap-2 px-1">
                {(['fr', 'en'] as const).map((lng) => (
                  <button
                    key={lng}
                    type="button"
                    onClick={() => setLanguage(lng)}
                    aria-pressed={language === lng}
                    className={`h-11 rounded-2xl text-sm font-semibold tracking-tight transition-all ${
                      language === lng
                        ? 'bg-text-main dark:bg-white text-white dark:text-text-main shadow-subtle'
                        : 'border border-ink-200 dark:border-white/15 text-text-main dark:text-gray-200 hover:border-ink-300 dark:hover:border-white/25'
                    }`}
                  >
                    {lng === 'fr' ? 'Français' : 'English'}
                  </button>
                ))}
              </div>
            </div>

            {user && (
              <div className="mt-6 pt-6 border-t border-ink-100 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => { logout(); closeMenu(); }}
                  className="w-full flex items-center justify-center gap-2 rounded-full h-11 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-sm font-semibold hover:bg-red-100 dark:hover:bg-red-500/15 transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">logout</span>
                  {t('nav.logout')}
                </button>
              </div>
            )}
          </nav>

          <div className="mt-8 text-[11px] text-text-muted text-center">
            © EasyTravel — {t('footer.rights')}
          </div>
        </div>
      </div>
    </>
  );
};

const MenuLink: React.FC<{ icon: string; label: string; onClick: () => void; accent?: boolean }> = ({
  icon,
  label,
  onClick,
  accent,
}) => (
  <li>
    <button
      type="button"
      onClick={onClick}
      className={`group w-full flex items-center gap-4 px-3 py-4 rounded-2xl transition-colors ${
        accent
          ? 'bg-primary/10 text-teal-accent dark:text-primary hover:bg-primary/15'
          : 'hover:bg-ink-50 dark:hover:bg-white/5'
      }`}
    >
      <span
        className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${
          accent
            ? 'bg-primary/20 text-teal-accent dark:text-primary'
            : 'bg-ink-50 dark:bg-white/5 text-text-main dark:text-gray-200'
        }`}
      >
        <span className="material-symbols-outlined text-[20px]">{icon}</span>
      </span>
      <span
        className={`flex-1 text-left font-display text-[17px] font-semibold tracking-tight ${
          accent ? 'text-teal-accent dark:text-primary' : 'text-text-main dark:text-white'
        }`}
      >
        {label}
      </span>
      <span
        className={`material-symbols-outlined text-[20px] transition-transform group-hover:translate-x-0.5 ${
          accent ? 'text-teal-accent dark:text-primary' : 'text-text-muted'
        }`}
      >
        arrow_forward
      </span>
    </button>
  </li>
);

export default Header;
