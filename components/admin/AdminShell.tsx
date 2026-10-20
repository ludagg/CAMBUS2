'use client';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigation } from '../../contexts/NavigationContext';
import { Avatar, ROLE_LABELS, ToastProvider, cx } from './ui';

export interface NavItem {
  key: string;
  label: string;
  icon: string;
  /** Small section title shown above the first item of a group. */
  group?: string;
  badge?: string | number;
}

interface Props {
  /** Shown under the logo, e.g. "Compagnie · Express Voyage". */
  context?: string;
  nav: NavItem[];
  active: string;
  onNavigate: (key: string) => void;
  /** Right side of the top bar (date picker, primary action…). */
  actions?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Common frame for every management interface: deep-green sidebar with grouped
 * navigation, sticky top bar, mobile drawer. The active section is mirrored in
 * the URL hash so refresh / back / shared links land on the same screen.
 */
const AdminShell: React.FC<Props> = ({ context, nav, active, onNavigate, actions, children }) => {
  const { user, logout, navigateTo } = useNavigation();
  const [drawer, setDrawer] = useState(false);
  const mainRef = useRef<HTMLElement>(null);

  const keys = useMemo(() => nav.map((n) => n.key), [nav]);
  const current = nav.find((n) => n.key === active) ?? nav[0];

  // URL hash <-> active section.
  useEffect(() => {
    const read = () => {
      const h = window.location.hash.replace('#', '');
      if (h && keys.includes(h)) onNavigate(h);
    };
    read();
    window.addEventListener('hashchange', read);
    return () => window.removeEventListener('hashchange', read);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keys]);

  const go = useCallback(
    (key: string) => {
      onNavigate(key);
      if (window.location.hash !== `#${key}`) window.history.replaceState(null, '', `#${key}`);
      setDrawer(false);
      mainRef.current?.scrollTo?.({ top: 0 });
      window.scrollTo({ top: 0 });
    },
    [onNavigate],
  );

  // Drawer: Escape + body scroll lock.
  useEffect(() => {
    if (!drawer) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setDrawer(false);
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [drawer]);

  const sidebar = (
    <div className="flex h-full flex-col bg-ink-950 text-ink-300">
      {/* brand */}
      <div className="px-5 pt-5 pb-4">
        <button
          onClick={() => navigateTo('home')}
          className="group flex items-center gap-3 rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
          aria-label="Retour au site Easy Travel"
        >
          <span className="relative inline-flex size-10 items-center justify-center rounded-xl bg-primary text-ink-950 shadow-[0_0_0_4px_rgba(19,236,91,0.15)]">
            <span className="material-symbols-outlined text-[22px]">directions_bus</span>
          </span>
          <span>
            <span className="block font-display text-[17px] font-semibold leading-tight tracking-tight text-white">
              Easy<span className="text-primary">Travel</span>
            </span>
            <span className="block text-[10px] font-medium uppercase tracking-[0.2em] text-ink-400">Espace pro</span>
          </span>
        </button>
        {user && (
          <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5">
            <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary/90">
              {ROLE_LABELS[user.role] ?? user.role}
            </div>
            {context && <div className="mt-0.5 truncate text-[13px] font-medium text-white">{context}</div>}
          </div>
        )}
      </div>

      {/* navigation */}
      <nav aria-label="Navigation principale" className="flex-1 overflow-y-auto px-3 pb-4">
        {nav.map((item, i) => {
          const showGroup = item.group && item.group !== nav[i - 1]?.group;
          const isActive = item.key === current?.key;
          return (
            <React.Fragment key={item.key}>
              {showGroup && (
                <div className="px-3 pb-1.5 pt-5 text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-500">
                  {item.group}
                </div>
              )}
              <button
                onClick={() => go(item.key)}
                aria-current={isActive ? 'page' : undefined}
                className={cx(
                  'group relative mb-0.5 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[14px] font-medium transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60',
                  isActive ? 'bg-white/[0.08] text-white' : 'text-ink-300 hover:bg-white/[0.05] hover:text-white',
                )}
              >
                {isActive && <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-primary" />}
                <span
                  className={cx(
                    'material-symbols-outlined text-[20px] transition-colors',
                    isActive ? 'text-primary' : 'text-ink-400 group-hover:text-ink-200',
                  )}
                >
                  {item.icon}
                </span>
                <span className="flex-1 truncate">{item.label}</span>
                {item.badge !== undefined && (
                  <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold tabular-nums text-primary">
                    {item.badge}
                  </span>
                )}
              </button>
            </React.Fragment>
          );
        })}
      </nav>

      {/* user */}
      {user && (
        <div className="border-t border-white/10 p-3">
          <div className="flex items-center gap-3 rounded-xl px-2 py-2">
            <Avatar name={user.name} size="sm" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-medium text-white">{user.name}</div>
              <div className="truncate text-[11px] text-ink-400">{user.email}</div>
            </div>
            <button
              onClick={logout}
              aria-label="Se déconnecter"
              title="Se déconnecter"
              className="inline-flex size-9 items-center justify-center rounded-lg text-ink-400 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
            >
              <span className="material-symbols-outlined text-[20px]">logout</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <ToastProvider>
      <div className="min-h-screen bg-ink-50 dark:bg-background-dark">
        {/* desktop sidebar */}
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-[264px] lg:block">{sidebar}</aside>

        {/* mobile drawer */}
        {drawer && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-ink-950/60 backdrop-blur-sm animate-fadeIn" onClick={() => setDrawer(false)} />
            <aside className="absolute inset-y-0 left-0 w-[280px] max-w-[85vw] shadow-elevated" role="dialog" aria-modal="true" aria-label="Menu">
              {sidebar}
            </aside>
          </div>
        )}

        <div className="lg:pl-[264px]">
          {/* top bar */}
          <header className="sticky top-0 z-20 border-b border-ink-100 dark:border-white/10 bg-white/80 dark:bg-background-dark/80 backdrop-blur-xl">
            <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-3 px-4 md:px-8">
              <button
                onClick={() => setDrawer(true)}
                className="inline-flex size-10 items-center justify-center rounded-xl text-text-main dark:text-white hover:bg-ink-100/70 dark:hover:bg-white/10 lg:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                aria-label="Ouvrir le menu"
              >
                <span className="material-symbols-outlined">menu</span>
              </button>
              <div className="flex min-w-0 items-center gap-2 text-sm">
                <span className="hidden text-text-muted sm:inline">Espace pro</span>
                <span className="material-symbols-outlined hidden text-[16px] text-ink-300 sm:inline">chevron_right</span>
                <span className="truncate font-display font-semibold tracking-tight text-text-main dark:text-white">
                  {current?.label}
                </span>
              </div>
              <div className="ml-auto flex items-center gap-2">{actions}</div>
            </div>
          </header>

          <main ref={mainRef} className="mx-auto max-w-[1400px] px-4 py-6 md:px-8 md:py-8">
            {children}
          </main>
        </div>
      </div>
    </ToastProvider>
  );
};

export default AdminShell;
