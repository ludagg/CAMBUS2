import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigation } from '../contexts/NavigationContext';

interface Booking {
  id: string;
  agencyName: string;
  agencyLogo: string;
  color: string;
  from: string;
  to: string;
  departureTime: string;
  date: string;
  price: number;
  currency: string;
  passengers: number;
  status: 'confirmed' | 'completed' | 'cancelled';
}

const BookingsPage: React.FC = () => {
  const { t } = useLanguage();
  const { user, navigateTo } = useNavigation();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      navigateTo('login');
    }
  }, [user, navigateTo]);

  if (!user) return null;

  // Mock Data
  const bookings: Booking[] = [
    {
      id: 'CB-94821',
      agencyName: 'Express Voyage',
      agencyLogo: 'directions_bus',
      color: 'bg-blue-600',
      from: 'Douala - Gare Centrale',
      to: 'Yaoundé - Mvan',
      departureTime: '07:30',
      date: new Date(Date.now() + 86400000 * 2).toISOString(), // 2 days from now
      price: 9000,
      currency: 'FCFA',
      passengers: 2,
      status: 'confirmed'
    },
    {
      id: 'CB-88210',
      agencyName: 'GreenLines',
      agencyLogo: 'eco',
      color: 'bg-green-600',
      from: 'Yaoundé - Biyem-Assi',
      to: 'Bamenda - Green Park',
      departureTime: '09:00',
      date: '2023-11-15',
      price: 3500,
      currency: 'FCFA',
      passengers: 1,
      status: 'completed'
    },
    {
      id: 'CB-77432',
      agencyName: 'CityLink',
      agencyLogo: 'apartment',
      color: 'bg-purple-600',
      from: 'Douala - Bali',
      to: 'Kribi - Plage',
      departureTime: '13:00',
      date: '2023-10-22',
      price: 8000,
      currency: 'FCFA',
      passengers: 2,
      status: 'completed'
    }
  ];

  const now = new Date();
  const upcomingBookings = bookings.filter(b => new Date(b.date) > now || b.status === 'confirmed');
  const pastBookings = bookings.filter(b => new Date(b.date) <= now && b.status !== 'confirmed');

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
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800';
      case 'completed': return 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700';
      case 'cancelled': return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800';
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
          {displayedBookings.length > 0 ? (
            displayedBookings.map(booking => (
              <div key={booking.id} className="bg-white dark:bg-surface-dark rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm p-6 flex flex-col md:flex-row gap-6 hover:shadow-md transition-shadow">
                
                {/* Logo & Agency */}
                <div className="flex items-center md:flex-col md:items-start gap-4 md:w-48 md:border-r border-gray-100 dark:border-gray-700">
                   <div className={`size-12 rounded-xl ${booking.color} flex items-center justify-center text-white`}>
                      <span className="material-symbols-outlined">{booking.agencyLogo}</span>
                   </div>
                   <div>
                      <div className="font-bold text-text-main dark:text-white">{booking.agencyName}</div>
                      <div className="text-xs text-text-muted mt-1">{t('bookings.ticket_id')}: <span className="font-mono text-text-main dark:text-white">{booking.id}</span></div>
                   </div>
                </div>

                {/* Details */}
                <div className="flex-1">
                   <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                      <div>
                         <div className="text-sm font-bold text-primary mb-1">{formatDate(booking.date)}</div>
                         <div className="flex items-center gap-3">
                            <span className="text-2xl font-black text-text-main dark:text-white">{booking.departureTime}</span>
                            <div className="h-px w-12 bg-gray-300 dark:bg-gray-600"></div>
                            <span className="text-sm text-text-muted">{booking.passengers} Pass.</span>
                         </div>
                      </div>
                      <div className={`self-start md:self-center px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(booking.status)} uppercase tracking-wide`}>
                         {t(`bookings.status.${booking.status}`)}
                      </div>
                   </div>

                   <div className="flex items-start gap-3">
                      <div className="flex flex-col items-center gap-1 pt-1">
                         <div className="size-2 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                         <div className="w-0.5 h-6 bg-gray-200 dark:bg-gray-700"></div>
                         <div className="size-2 rounded-full bg-primary"></div>
                      </div>
                      <div className="flex-1">
                         <div className="text-sm text-text-muted mb-4">{booking.from}</div>
                         <div className="text-sm font-bold text-text-main dark:text-white">{booking.to}</div>
                      </div>
                   </div>
                </div>

                {/* Price & Action */}
                <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-2 border-t md:border-t-0 md:border-l border-gray-100 dark:border-gray-700 pt-4 md:pt-0 pl-0 md:pl-6">
                    <div className="font-black text-xl text-text-main dark:text-white">{booking.price.toLocaleString()} <span className="text-xs font-normal text-text-muted">{booking.currency}</span></div>
                    {booking.status === 'confirmed' && (
                      <button className="px-4 py-2 bg-primary/10 text-primary hover:bg-primary hover:text-text-main rounded-lg text-sm font-bold transition-colors flex items-center gap-2">
                        <span className="material-symbols-outlined text-lg">download</span>
                        {t('bookings.download')}
                      </button>
                    )}
                </div>

              </div>
            ))
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