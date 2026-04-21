'use client';
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigation } from '../contexts/NavigationContext';
import { BookingCardSkeleton } from './Skeleton';
import TicketModal from './TicketModal';

interface BookingLeg {
  id: string;
  leg: 'OUTBOUND' | 'RETURN';
  seats: string[];
  price: number;
  status: string;
  qrCode: string;
  agencyName: string;
  agencyLogo: string;
  color: string;
  from: string;
  to: string;
  fromCity: string;
  toCity: string;
  departureTime: string;
  arrivalTime: string;
  date: string;
  passengers: { fullName: string; idNumber?: string | null; seat?: string | null }[];
}

interface Booking {
  id: string;
  tripType: 'ONE_WAY' | 'ROUND_TRIP';
  totalPrice: number;
  currency: string;
  status: string;
  contactEmail: string;
  contactPhone: string;
  createdAt: string;
  bookings: BookingLeg[];
  payment: { method: string; status: string } | null;
}

const BookingsPage: React.FC = () => {
  const { t } = useLanguage();
  const { user, navigateTo } = useNavigation();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [ticketLeg, setTicketLeg] = useState<BookingLeg | null>(null);
  const [ticketGroupId, setTicketGroupId] = useState<string | null>(null);

  const openTicket = (group: Booking, leg: BookingLeg) => {
    setTicketGroupId(group.id);
    setTicketLeg(leg);
  };
  const closeTicket = () => {
    setTicketLeg(null);
    setTicketGroupId(null);
  };
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [cancelSuccess, setCancelSuccess] = useState<string | null>(null);

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      navigateTo('login');
    }
  }, [user, navigateTo]);

  useEffect(() => {
    const fetchBookings = async () => {
      if (!user) return;
      setIsLoading(true);
      try {
        const res = await fetch('/api/bookings', { cache: 'no-store' });
        const json = await res.json();
        setBookings(Array.isArray(json.data) ? json.data : []);
      } catch (error) {
        console.error('Error fetching bookings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookings();
  }, [user]);

  if (!user) return null;

  const now = new Date();
  const earliestDate = (b: Booking) => {
    const dates = b.bookings.map((l) => new Date(l.date).getTime());
    return dates.length ? Math.max(...dates) : Date.now();
  };
  const upcomingBookings = bookings.filter((b) => earliestDate(b) > now.getTime() || b.status === 'CONFIRMED');
  const pastBookings = bookings.filter((b) => earliestDate(b) <= now.getTime() && b.status !== 'CONFIRMED');

  const displayedBookings = activeTab === 'upcoming' ? upcomingBookings : pastBookings;

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    } catch (e) {
      return dateString;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'CONFIRMED': return 'bg-primary/10 text-teal-accent dark:text-primary border-primary/20';
      case 'BOARDED':
      case 'COMPLETED': return 'bg-ink-50 text-text-muted border-ink-200 dark:bg-white/[0.04] dark:text-gray-400 dark:border-white/10';
      case 'CANCELLED': return 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/40';
      default: return 'bg-ink-50 text-text-muted border-ink-200 dark:bg-white/[0.04] dark:text-gray-400 dark:border-white/10';
    }
  };

  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen pt-10 md:pt-14 pb-20 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-ink-200 dark:border-white/15 px-2.5 py-1 mb-4">
            <span className="size-1.5 rounded-full bg-primary" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-muted">Mes voyages</span>
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tightest text-text-main dark:text-white mb-2 leading-tight">
            {t('bookings.title')}
            <span className="font-serif-italic text-teal-accent dark:text-primary italic font-normal"> en un clic.</span>
          </h1>
          <p className="text-text-muted dark:text-gray-400 text-sm md:text-base leading-relaxed max-w-xl">{t('bookings.subtitle')}</p>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 p-1 bg-white dark:bg-white/[0.03] rounded-full border border-ink-100 dark:border-white/10 mb-8 w-fit shadow-subtle">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`px-5 py-2 text-sm font-semibold tracking-tight transition-all rounded-full ${
              activeTab === 'upcoming'
                ? 'bg-text-main dark:bg-white text-white dark:text-text-main shadow-subtle'
                : 'text-text-muted hover:text-text-main dark:hover:text-white'
            }`}
          >
            {t('bookings.tab.upcoming')}
          </button>
          <button
            onClick={() => setActiveTab('past')}
            className={`px-5 py-2 text-sm font-semibold tracking-tight transition-all rounded-full ${
              activeTab === 'past'
                ? 'bg-text-main dark:bg-white text-white dark:text-text-main shadow-subtle'
                : 'text-text-muted hover:text-text-main dark:hover:text-white'
            }`}
          >
            {t('bookings.tab.past')}
          </button>
        </div>

        {/* List */}
        <div className="space-y-4">
          {isLoading ? (
            <>
              <BookingCardSkeleton />
              <BookingCardSkeleton />
              <BookingCardSkeleton />
            </>
          ) : displayedBookings.length > 0 ? (
            displayedBookings.map((group) => {
              const primary = group.bookings[0];
              if (!primary) return null;
              return (
                <div key={group.id} className="bg-white dark:bg-surface-dark rounded-2xl border border-ink-100 dark:border-white/10 shadow-subtle p-6 md:p-7 flex flex-col gap-5 hover:shadow-card hover:-translate-y-0.5 transition-all">
                  <div className="flex items-start justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-4">
                      <div className={`size-12 rounded-2xl ${primary.color} flex items-center justify-center text-white shadow-subtle`}>
                        <span className="material-symbols-outlined">{primary.agencyLogo}</span>
                      </div>
                      <div>
                        <div className="font-display font-semibold tracking-tight text-text-main dark:text-white">{primary.agencyName}</div>
                        <div className="text-xs text-text-muted mt-1 flex items-center gap-2 flex-wrap">
                          <span>{t('bookings.ticket_id')}: <span className="font-mono text-text-main dark:text-white">{group.id.slice(0, 8).toUpperCase()}</span></span>
                          {group.tripType === 'ROUND_TRIP' && <span className="px-2 py-0.5 bg-primary/10 text-teal-accent dark:text-primary rounded-full text-[10px] font-semibold uppercase tracking-[0.14em]">A/R</span>}
                        </div>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-[11px] font-semibold border ${getStatusColor(group.status)} uppercase tracking-[0.14em]`}>
                      {group.status}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    {group.bookings.map((leg) => (
                      <button
                        key={leg.id}
                        onClick={() => openTicket(group, leg)}
                        className="text-left border border-ink-100 dark:border-white/10 rounded-2xl p-4 hover:border-text-main/40 dark:hover:border-white/25 hover:shadow-subtle transition-all group bg-white dark:bg-white/[0.02]"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-[10px] font-semibold uppercase text-teal-accent dark:text-primary tracking-[0.16em]">{leg.leg === 'OUTBOUND' ? t('checkout.outbound') || 'Aller' : t('checkout.return') || 'Retour'}</div>
                          <span className="material-symbols-outlined text-lg text-text-muted group-hover:text-text-main dark:group-hover:text-white transition-colors">qr_code_2</span>
                        </div>
                        <div className="text-xs font-medium text-text-muted mb-2 tabular-nums">{formatDate(leg.date)}</div>
                        <div className="flex items-center gap-3 mb-3">
                          <span className="font-display text-xl font-semibold text-text-main dark:text-white tabular-nums">{leg.departureTime}</span>
                          <span className="material-symbols-outlined text-text-muted text-base">arrow_forward</span>
                          <span className="font-display text-xl font-semibold text-text-main dark:text-white tabular-nums">{leg.arrivalTime}</span>
                        </div>
                        <div className="text-xs font-medium text-text-main dark:text-gray-200">{leg.fromCity} → {leg.toCity}</div>
                        <div className="text-[11px] text-text-muted mt-1 truncate">{leg.from}</div>
                        {leg.seats.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1">
                            {leg.seats.map((s) => (
                              <span key={s} className="text-[10px] font-mono font-semibold px-1.5 py-0.5 bg-ink-50 dark:bg-white/5 text-text-main dark:text-white rounded">{s}</span>
                            ))}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-5 border-t border-ink-100 dark:border-white/10 flex-wrap gap-3">
                    <div className="font-display text-2xl font-semibold tracking-tightest text-text-main dark:text-white tabular-nums">
                      {group.totalPrice.toLocaleString()}
                      <span className="text-xs font-medium text-text-muted ml-1">{group.currency}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {(group.status === 'CONFIRMED' || group.status === 'PENDING') && (
                        <button
                          type="button"
                          onClick={() => {
                            setCancelTarget(group);
                            setCancelError(null);
                          }}
                          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-ink-200 dark:border-white/15 text-sm font-semibold tracking-tight text-text-muted hover:text-red-700 dark:hover:text-red-300 hover:border-red-300 transition-colors"
                        >
                          <span className="material-symbols-outlined text-[18px]">cancel</span>
                          {t('bookings.cancel.action')}
                        </button>
                      )}
                      {group.status === 'CONFIRMED' && group.bookings[0] && (
                        <button onClick={() => openTicket(group, group.bookings[0])} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-text-main dark:bg-white text-white dark:text-text-main text-sm font-semibold tracking-tight shadow-subtle hover:shadow-card hover:-translate-y-0.5 transition-all">
                          <span className="material-symbols-outlined text-[18px]">qr_code_2</span>
                          {t('bookings.view')}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-16 bg-white dark:bg-surface-dark rounded-3xl border border-ink-100 dark:border-white/10 shadow-subtle">
               <div className="size-16 bg-ink-50 dark:bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-5 text-text-muted">
                  <span className="material-symbols-outlined text-3xl">confirmation_number</span>
               </div>
               <h3 className="font-display text-xl font-semibold tracking-tight text-text-main dark:text-white mb-4">{t('bookings.empty')}</h3>
               <button
                 onClick={() => navigateTo('home')}
                 className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-text-main dark:bg-white text-white dark:text-text-main text-sm font-semibold tracking-tight shadow-subtle hover:shadow-card hover:-translate-y-0.5 transition-all"
               >
                 <span className="material-symbols-outlined text-[18px]">search</span>
                 {t('search.button')}
               </button>
            </div>
          )}
        </div>
      </div>

      <TicketModal leg={ticketLeg} groupId={ticketGroupId} onClose={closeTicket} />

      {cancelSuccess && (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 rounded-full border border-primary/30 bg-primary/10 text-teal-accent dark:text-primary px-5 py-2.5 text-sm font-semibold shadow-card"
        >
          {cancelSuccess}
        </div>
      )}

      {cancelTarget && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="cancel-title"
          className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50 backdrop-blur-sm"
          onClick={() => {
            if (!cancelLoading) setCancelTarget(null);
          }}
        >
          <div
            className="bg-white dark:bg-surface-dark rounded-3xl border border-ink-100 dark:border-white/10 shadow-card max-w-md w-full p-7"
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              id="cancel-title"
              className="font-display text-2xl font-semibold tracking-tight text-text-main dark:text-white mb-2"
            >
              {t('bookings.cancel.confirm.title')}
            </h3>
            <p className="text-sm text-text-muted dark:text-gray-400 leading-relaxed mb-5">
              {t('bookings.cancel.confirm.body')}
            </p>
            {cancelError && (
              <div className="mb-4 rounded-lg border border-red-300 bg-red-50 dark:bg-red-900/20 px-3.5 py-2.5 text-sm text-red-700 dark:text-red-300">
                {cancelError}
              </div>
            )}
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={cancelLoading}
                onClick={() => setCancelTarget(null)}
                className="inline-flex items-center gap-2 h-11 px-5 rounded-full border border-ink-200 dark:border-white/15 text-text-main dark:text-white font-semibold tracking-tight hover:border-ink-300 transition-colors disabled:opacity-60"
              >
                {t('bookings.cancel.confirm.no')}
              </button>
              <button
                type="button"
                disabled={cancelLoading}
                onClick={async () => {
                  if (!cancelTarget) return;
                  setCancelLoading(true);
                  setCancelError(null);
                  try {
                    const res = await fetch(
                      `/api/bookings/${cancelTarget.id}/cancel`,
                      {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({}),
                      },
                    );
                    const json = await res.json();
                    if (!res.ok) throw new Error(json.error || 'Annulation impossible.');
                    setBookings((prev) =>
                      prev.map((b) =>
                        b.id === cancelTarget.id
                          ? {
                              ...b,
                              status: 'CANCELLED',
                              bookings: b.bookings.map((leg) => ({
                                ...leg,
                                status: 'CANCELLED',
                              })),
                            }
                          : b,
                      ),
                    );
                    setCancelTarget(null);
                    setCancelSuccess(t('bookings.cancel.success'));
                    setTimeout(() => setCancelSuccess(null), 3500);
                  } catch (err) {
                    setCancelError(
                      err instanceof Error ? err.message : 'Erreur inconnue.',
                    );
                  } finally {
                    setCancelLoading(false);
                  }
                }}
                className="inline-flex items-center gap-2 h-11 px-5 rounded-full bg-red-600 text-white font-semibold tracking-tight shadow-subtle hover:bg-red-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {cancelLoading ? (
                  <span className="material-symbols-outlined animate-spin text-[18px]">
                    progress_activity
                  </span>
                ) : (
                  <span className="material-symbols-outlined text-[18px]">cancel</span>
                )}
                {t('bookings.cancel.confirm.yes')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingsPage;