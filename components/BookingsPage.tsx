'use client';
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigation } from '../contexts/NavigationContext';
import { BookingCardSkeleton } from './Skeleton';

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
      case 'CONFIRMED': return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800';
      case 'BOARDED':
      case 'COMPLETED': return 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700';
      case 'CANCELLED': return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen pt-8 pb-20 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-text-main dark:text-white mb-2">{t('bookings.title')}</h1>
          <p className="text-text-muted dark:text-gray-400">{t('bookings.subtitle')}</p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 mb-8">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`px-6 py-3 font-bold text-sm transition-all border-b-2 ${
              activeTab === 'upcoming'
                ? 'border-primary text-primary'
                : 'border-transparent text-text-muted hover:text-text-main dark:hover:text-white'
            }`}
          >
            {t('bookings.tab.upcoming')}
          </button>
          <button
            onClick={() => setActiveTab('past')}
            className={`px-6 py-3 font-bold text-sm transition-all border-b-2 ${
              activeTab === 'past'
                ? 'border-primary text-primary'
                : 'border-transparent text-text-muted hover:text-text-main dark:hover:text-white'
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
                <div key={group.id} className="bg-white dark:bg-surface-dark rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm p-6 flex flex-col gap-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-4">
                      <div className={`size-12 rounded-xl ${primary.color} flex items-center justify-center text-white`}>
                        <span className="material-symbols-outlined">{primary.agencyLogo}</span>
                      </div>
                      <div>
                        <div className="font-black text-text-main dark:text-white">{primary.agencyName}</div>
                        <div className="text-xs text-text-muted mt-1 flex items-center gap-2">
                          <span>{t('bookings.ticket_id')}: <span className="font-mono text-text-main dark:text-white">{group.id.slice(0, 8).toUpperCase()}</span></span>
                          {group.tripType === 'ROUND_TRIP' && <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-[10px] font-black uppercase">A/R</span>}
                        </div>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(group.status)} uppercase tracking-wide`}>
                      {group.status}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    {group.bookings.map((leg) => (
                      <div key={leg.id} className="border border-gray-100 dark:border-gray-800 rounded-lg p-4">
                        <div className="text-[10px] font-black uppercase text-primary mb-2 tracking-widest">{leg.leg === 'OUTBOUND' ? t('checkout.outbound') || 'Aller' : t('checkout.return') || 'Retour'}</div>
                        <div className="text-sm font-bold text-primary mb-2">{formatDate(leg.date)}</div>
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-xl font-black text-text-main dark:text-white">{leg.departureTime}</span>
                          <span className="material-symbols-outlined text-text-muted">arrow_forward</span>
                          <span className="text-xl font-black text-text-main dark:text-white">{leg.arrivalTime}</span>
                        </div>
                        <div className="text-xs text-text-muted">{leg.fromCity} → {leg.toCity}</div>
                        <div className="text-xs text-text-muted mt-1">{leg.from}</div>
                        {leg.seats.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {leg.seats.map((s) => (
                              <span key={s} className="text-[10px] font-black px-1.5 py-0.5 bg-primary/10 text-primary rounded">{s}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                    <div className="font-black text-xl text-text-main dark:text-white">{group.totalPrice.toLocaleString()} <span className="text-xs font-normal text-text-muted">{group.currency}</span></div>
                    {group.status === 'CONFIRMED' && (
                      <button className="px-4 py-2 bg-primary/10 text-primary hover:bg-primary hover:text-text-main rounded-lg text-sm font-bold transition-colors flex items-center gap-2">
                        <span className="material-symbols-outlined text-lg">qr_code_2</span>
                        QR
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-16 bg-white dark:bg-surface-dark rounded-xl border border-gray-100 dark:border-gray-800">
               <div className="size-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                  <span className="material-symbols-outlined text-4xl">confirmation_number</span>
               </div>
               <h3 className="text-lg font-bold text-text-main dark:text-white mb-2">{t('bookings.empty')}</h3>
               <button onClick={() => navigateTo('home')} className="text-primary font-bold hover:underline">
                 {t('search.button')}
               </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingsPage;