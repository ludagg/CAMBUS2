'use client';
import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigation } from '../contexts/NavigationContext';

const FALLBACK_CITIES = ["Douala", "Yaoundé", "Bafoussam", "Bamenda", "Kribi", "Garoua", "Maroua", "Ngaoundéré"];

const SearchWidget: React.FC = () => {
  const { t } = useLanguage();
  const { navigateTo, setSearchParams } = useNavigation();
  
  // Trip Configuration State
  const todayISO = new Date().toISOString().split('T')[0];
  const tomorrowISO = new Date(Date.now() + 86_400_000).toISOString().split('T')[0];
  const [tripType, setTripType] = useState<'one-way' | 'round-trip'>('one-way');
  const [fromLocation, setFromLocation] = useState('');
  const [toLocation, setToLocation] = useState('');
  const [departureDate, setDepartureDate] = useState(todayISO);
  const [returnDate, setReturnDate] = useState(tomorrowISO);
  
  // Passenger State
  const [passengers, setPassengers] = useState({ adults: 1, children: 0 });
  const [isPassengerMenuOpen, setIsPassengerMenuOpen] = useState(false);
  const passengerMenuRef = useRef<HTMLDivElement>(null);

  // Firestore Cities
  const [availableCities, setAvailableCities] = useState<string[]>(FALLBACK_CITIES);

  // Fetch Cities from API
  useEffect(() => {
    const fetchCities = async () => {
      try {
        const res = await fetch('/api/cities');
        const json = await res.json();
        if (Array.isArray(json.data) && json.data.length) {
          setAvailableCities(json.data.map((c: { name: string }) => c.name).sort());
        } else {
          setAvailableCities(FALLBACK_CITIES);
        }
      } catch (error) {
        console.warn('Could not fetch cities, using fallback:', error);
        setAvailableCities(FALLBACK_CITIES);
      }
    };
    fetchCities();
  }, []);

  // Close passenger menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (passengerMenuRef.current && !passengerMenuRef.current.contains(event.target as Node)) {
        setIsPassengerMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSwap = () => {
    const temp = fromLocation;
    setFromLocation(toLocation);
    setToLocation(temp);
  };

  const toIso = (raw: string) => {
    if (!raw) return todayISO;
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? todayISO : d.toISOString().split('T')[0];
  };

  const handleSearch = () => {
    const from = fromLocation.trim() || availableCities[0];
    const to = toLocation.trim() || availableCities[1];
    if (from.toLowerCase() === to.toLowerCase()) return;
    setSearchParams({
      from,
      to,
      date: toIso(departureDate),
      returnDate: tripType === 'round-trip' ? toIso(returnDate) : undefined,
      passengers,
      tripType
    });
    navigateTo('results');
  };

  const updatePassengers = (type: 'adults' | 'children', operation: 'increment' | 'decrement') => {
    setPassengers(prev => {
      const current = prev[type];
      if (operation === 'decrement' && current === 0) return prev;
      if (operation === 'decrement' && type === 'adults' && current === 1) return prev; // Min 1 adult
      
      return {
        ...prev,
        [type]: operation === 'increment' ? current + 1 : current - 1
      };
    });
  };

  const getPassengerSummary = () => {
    const parts = [];
    if (passengers.adults > 0) parts.push(`${passengers.adults} ${t('search.passenger.adults')}`);
    if (passengers.children > 0) parts.push(`${passengers.children} ${t('search.passenger.children')}`);
    return parts.join(', ');
  };

  return (
    <div className="relative z-20 -mt-16 px-4 pb-12 w-full flex justify-center">
      <div className="w-full max-w-6xl bg-white dark:bg-surface-dark rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-gray-800">
        
        {/* Top Header: Tabs and Trip Type */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-gray-100 dark:border-gray-700 pb-2">
          <div className="flex gap-6">
            <button 
              className="flex items-center gap-2 pb-2 font-semibold transition-colors text-teal-accent dark:text-primary border-b-2 border-teal-accent dark:border-primary"
            >
              <span className="material-symbols-outlined text-[20px]">directions_bus</span>
              {t('search.tab.trip')}
            </button>
            <button 
              onClick={() => navigateTo('agencies')}
              className="flex items-center gap-2 pb-2 font-medium transition-colors text-text-muted dark:text-gray-400 hover:text-text-main dark:hover:text-gray-200"
            >
              <span className="material-symbols-outlined text-[20px]">business</span>
              {t('search.tab.agencies')}
            </button>
          </div>

          <div className="flex bg-gray-100 dark:bg-[#102216] p-1 rounded-lg self-start sm:self-auto">
            <button 
              onClick={() => setTripType('one-way')}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                tripType === 'one-way' 
                  ? 'bg-white dark:bg-surface-dark text-text-main dark:text-white shadow-sm' 
                  : 'text-text-muted dark:text-gray-400 hover:text-text-main'
              }`}
            >
              {t('search.trip_type.one_way')}
            </button>
            <button 
                onClick={() => setTripType('round-trip')}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                tripType === 'round-trip' 
                  ? 'bg-white dark:bg-surface-dark text-text-main dark:text-white shadow-sm' 
                  : 'text-text-muted dark:text-gray-400 hover:text-text-main'
              }`}
            >
              {t('search.trip_type.round_trip')}
            </button>
          </div>
        </div>

        {/* Search Form */}
        <div className="flex flex-col lg:flex-row gap-4 items-end">
          
          <div className="flex flex-col md:flex-row flex-1 w-full gap-2 relative">
            <datalist id="cities-list">
                {availableCities.map(city => <option key={city} value={city} />)}
            </datalist>

            <div className="flex-1 relative group">
              <label className="block text-xs font-semibold text-text-muted dark:text-gray-400 mb-1.5 ml-1">{t('search.label.from')}</label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-4 text-gray-400">trip_origin</span>
                <input 
                  type="text" 
                  list="cities-list"
                  value={fromLocation}
                  onChange={(e) => setFromLocation(e.target.value)}
                  className="w-full h-12 pl-12 pr-4 bg-gray-50 dark:bg-[#102216] border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-text-main dark:text-white font-medium transition-all" 
                  placeholder={t('search.placeholder.city')}
                />
              </div>
            </div>

            <button 
              onClick={handleSwap}
              className="absolute top-[34px] left-1/2 -translate-x-1/2 z-10 hidden md:flex items-center justify-center size-8 rounded-full bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-600 shadow-sm text-primary hover:bg-gray-50 transition-colors"
              title="Swap locations"
            >
              <span className="material-symbols-outlined text-lg">swap_horiz</span>
            </button>

            <div className="flex-1 relative group">
              <label className="block text-xs font-semibold text-text-muted dark:text-gray-400 mb-1.5 ml-1">{t('search.label.to')}</label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-4 text-gray-400">location_on</span>
                <input 
                  type="text" 
                  list="cities-list"
                  value={toLocation}
                  onChange={(e) => setToLocation(e.target.value)}
                  className="w-full h-12 pl-12 pr-4 bg-gray-50 dark:bg-[#102216] border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-text-main dark:text-white font-medium transition-all" 
                  placeholder={t('search.placeholder.city')}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4 w-full lg:w-auto">
            <div className={`${tripType === 'round-trip' ? 'w-full md:w-36' : 'w-full md:w-48'} relative`}>
              <label className="block text-xs font-semibold text-text-muted dark:text-gray-400 mb-1.5 ml-1">{t('search.label.departure')}</label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3 text-gray-400">calendar_month</span>
                <input 
                  type="date"
                  min={todayISO}
                  value={departureDate}
                  onChange={(e) => setDepartureDate(e.target.value)}
                  className="w-full h-12 pl-10 pr-2 bg-gray-50 dark:bg-[#102216] border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-text-main dark:text-white font-medium transition-all cursor-pointer text-sm" 
                />
              </div>
            </div>

            {tripType === 'round-trip' && (
              <div className="w-full md:w-36 relative animate-fadeIn">
                <label className="block text-xs font-semibold text-text-muted dark:text-gray-400 mb-1.5 ml-1">{t('search.label.return')}</label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3 text-gray-400">event_upcoming</span>
                  <input 
                    type="date"
                    min={departureDate || todayISO}
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                    className="w-full h-12 pl-10 pr-2 bg-gray-50 dark:bg-[#102216] border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-text-main dark:text-white font-medium transition-all cursor-pointer text-sm" 
                  />
                </div>
              </div>
            )}

            <div className="w-full md:w-48 relative" ref={passengerMenuRef}>
              <label className="block text-xs font-semibold text-text-muted dark:text-gray-400 mb-1.5 ml-1">{t('search.label.passengers')}</label>
              <button 
                onClick={() => setIsPassengerMenuOpen(!isPassengerMenuOpen)}
                className="relative flex items-center w-full h-12 pl-10 pr-8 bg-gray-50 dark:bg-[#102216] border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-text-main dark:text-white font-medium transition-all text-left truncate"
              >
                <span className="material-symbols-outlined absolute left-3 text-gray-400">person</span>
                <span className="text-sm truncate">{getPassengerSummary()}</span>
                <span className="material-symbols-outlined absolute right-3 text-gray-400 text-sm pointer-events-none">expand_more</span>
              </button>

              {isPassengerMenuOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 p-4 bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl z-50 w-full min-w-[240px]">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-text-main dark:text-white text-sm">{t('search.passenger.adults')}</span>
                      <span className="text-xs text-text-muted">18+</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => updatePassengers('adults', 'decrement')}
                        className={`size-8 flex items-center justify-center rounded-full border ${passengers.adults <= 1 ? 'border-gray-200 text-gray-300 cursor-not-allowed' : 'border-gray-300 text-primary hover:border-primary'}`}
                        disabled={passengers.adults <= 1}
                      >
                        <span className="material-symbols-outlined text-sm">remove</span>
                      </button>
                      <span className="w-4 text-center font-bold text-text-main dark:text-white">{passengers.adults}</span>
                      <button 
                        onClick={() => updatePassengers('adults', 'increment')}
                        className="size-8 flex items-center justify-center rounded-full border border-gray-300 text-primary hover:border-primary"
                      >
                        <span className="material-symbols-outlined text-sm">add</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-text-main dark:text-white text-sm">{t('search.passenger.children')}</span>
                      <span className="text-xs text-text-muted">0-17</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => updatePassengers('children', 'decrement')}
                         className={`size-8 flex items-center justify-center rounded-full border ${passengers.children <= 0 ? 'border-gray-200 text-gray-300 cursor-not-allowed' : 'border-gray-300 text-primary hover:border-primary'}`}
                         disabled={passengers.children <= 0}
                      >
                        <span className="material-symbols-outlined text-sm">remove</span>
                      </button>
                      <span className="w-4 text-center font-bold text-text-main dark:text-white">{passengers.children}</span>
                      <button 
                        onClick={() => updatePassengers('children', 'increment')}
                        className="size-8 flex items-center justify-center rounded-full border border-gray-300 text-primary hover:border-primary"
                      >
                        <span className="material-symbols-outlined text-sm">add</span>
                      </button>
                    </div>
                  </div>

                  <button 
                    onClick={() => setIsPassengerMenuOpen(false)}
                    className="w-full py-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg text-sm font-bold transition-colors"
                  >
                    {t('search.passenger.done')}
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="w-full lg:w-auto">
            <button 
              onClick={handleSearch}
              className="w-full h-12 px-6 bg-primary hover:bg-[#0fd651] text-text-main text-base font-bold rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined">search</span>
              {t('search.button')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchWidget;