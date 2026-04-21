'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigation, Trip } from '../contexts/NavigationContext';
import { TripCardSkeleton } from './Skeleton';

// Leaflet global declaration
declare const L: any;

interface TripExtended extends Trip {
  amenities: string[];
  distanceToUser?: number;
}

// Coordonnées des gares pour la démo
const stationLocations: Record<string, { lat: number, lng: number, address: string }> = {
  "Douala - Gare Centrale": { lat: 4.0511, lng: 9.7679, address: "Bd de la Liberté, Douala (Express Voyage)" },
  "Yaoundé - Mvan": { lat: 3.8480, lng: 11.5021, address: "Mvan, Yaoundé (Express Voyage)" },
  "Douala - Akwa": { lat: 4.0520, lng: 9.7000, address: "Akwa Nord, Douala (GreenLines)" },
  "Yaoundé - Biyem-Assi": { lat: 3.8300, lng: 11.4800, address: "Biyem-Assi, Yaoundé (GreenLines)" },
  "Douala - Bonabéri": { lat: 4.0700, lng: 9.6600, address: "Bonabéri, Douala (Royal Road)" },
  "Yaoundé - Centre Ville": { lat: 3.8667, lng: 11.5167, address: "Poste Centrale, Yaoundé (Royal Road)" },
  "Douala - Bali": { lat: 4.0400, lng: 9.6900, address: "Bali, Douala (CityLink)" },
  "Yaoundé - Nsam": { lat: 3.8200, lng: 11.5000, address: "Nsam, Yaoundé (CityLink)" }
};

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // Rayon de la terre en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const SearchResultsPage: React.FC = () => {
  const { t } = useLanguage();
  const { searchParams, navigateTo, setBookingDetails } = useNavigation();
  const [sortOption, setSortOption] = useState<'price' | 'time' | 'duration' | 'arrival'>('time');

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedTimes, setSelectedTimes] = useState<string[]>([]);
  const [selectedAgencies, setSelectedAgencies] = useState<string[]>([]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [maxDurationMin, setMaxDurationMin] = useState<number | null>(null);

  const [selectedOutbound, setSelectedOutbound] = useState<TripExtended | null>(null);
  const [selectedReturn, setSelectedReturn] = useState<TripExtended | null>(null);
  const [hoveredTripId, setHoveredTripId] = useState<number | string | null>(null);
  
  // New: Geolocation & Mobile View switcher
  const [userCoords, setUserCoords] = useState<{lat: number, lng: number} | null>(null);
  const [mobileView, setMobileView] = useState<'list' | 'map'>('list');

  const [fetchedTrips, setFetchedTrips] = useState<TripExtended[]>([]);
  const [isLoadingTrips, setIsLoadingTrips] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const mapLayerGroupRef = useRef<any>(null);

  // Initialize Geolocation
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.warn("Geolocation denied or unavailable", err),
        { enableHighAccuracy: true }
      );
    }
  }, []);

  if (!searchParams) {
    setTimeout(() => navigateTo('home'), 100);
    return null;
  }

  const isRoundTrip = searchParams.tripType === 'round-trip';
  let currentStep: 'outbound' | 'return' | 'summary' = 'outbound';
  if (selectedOutbound) {
    if (isRoundTrip && !selectedReturn) currentStep = 'return';
    else currentStep = 'summary';
  }

  useEffect(() => {
    const fetchTrips = async () => {
      setIsLoadingTrips(true);
      try {
        const origin = currentStep === 'outbound' ? searchParams.from : searchParams.to;
        const destination = currentStep === 'outbound' ? searchParams.to : searchParams.from;
        const date = currentStep === 'outbound' ? searchParams.date : (searchParams.returnDate || searchParams.date);

        const res = await fetch(`/api/departures?from=${encodeURIComponent(origin)}&to=${encodeURIComponent(destination)}&date=${encodeURIComponent(date)}`);
        const json = await res.json();
        setFetchedTrips(Array.isArray(json.data) ? (json.data as TripExtended[]) : []);
      } catch (error) {
        console.error("Error fetching trips:", error);
        setFetchedTrips([]);
      } finally {
        setIsLoadingTrips(false);
      }
    };

    if (currentStep !== 'summary') {
      fetchTrips();
    }
  }, [currentStep, searchParams]);

  const initialTrips = useMemo(() => {
    if (userCoords) {
      return fetchedTrips.map(trip => {
        const station = stationLocations[trip.departureLocation];
        const dist = station ? calculateDistance(userCoords.lat, userCoords.lng, station.lat, station.lng) : undefined;
        return { ...trip, distanceToUser: dist };
      });
    }
    return fetchedTrips;
  }, [fetchedTrips, userCoords]);

  const priceBounds = useMemo(() => {
    if (initialTrips.length === 0) return { min: 0, max: 50000 };
    const prices = initialTrips.map(t => t.price);
    return { min: Math.floor(Math.min(...prices) / 500) * 500, max: Math.ceil(Math.max(...prices) / 500) * 500 };
  }, [initialTrips]);

  const durationBounds = useMemo(() => {
    if (initialTrips.length === 0) return { min: 0, max: 720 };
    const durations = initialTrips.map(t => t.durationMin ?? 0).filter(d => d > 0);
    if (durations.length === 0) return { min: 0, max: 720 };
    return { min: Math.min(...durations), max: Math.max(...durations) };
  }, [initialTrips]);

  const availableAgencies = useMemo(() => {
    return Array.from(new Set(initialTrips.map(t => t.agencyName))).sort();
  }, [initialTrips]);

  const filteredTrips = useMemo(() => {
    return initialTrips.filter(trip => {
      if (selectedAgencies.length > 0 && !selectedAgencies.includes(trip.agencyName)) return false;
      if (selectedAmenities.length > 0 && !selectedAmenities.every(a => trip.amenities.includes(a))) return false;
      if (selectedTimes.length > 0) {
        const hour = parseInt(trip.departureTime.split(':')[0]);
        const period = hour >= 6 && hour < 12 ? 'morning' : hour >= 12 && hour < 18 ? 'afternoon' : 'evening';
        if (!selectedTimes.includes(period)) return false;
      }
      if (maxPrice !== null && trip.price > maxPrice) return false;
      if (maxDurationMin !== null && (trip.durationMin ?? 0) > maxDurationMin) return false;
      return true;
    });
  }, [initialTrips, selectedAgencies, selectedAmenities, selectedTimes, maxPrice, maxDurationMin]);

  const sortedTrips = useMemo(() => {
    return [...filteredTrips].sort((a, b) => {
      if (sortOption === 'price') return a.price - b.price;
      if (sortOption === 'time') return a.departureTime.localeCompare(b.departureTime);
      if (sortOption === 'arrival') return a.arrivalTime.localeCompare(b.arrivalTime);
      if (sortOption === 'duration') return (a.durationMin ?? 0) - (b.durationMin ?? 0);
      return 0;
    });
  }, [filteredTrips, sortOption]);

  const activeFilterCount =
    selectedTimes.length +
    selectedAgencies.length +
    selectedAmenities.length +
    (maxPrice !== null ? 1 : 0) +
    (maxDurationMin !== null ? 1 : 0);

  const resetFilters = () => {
    setSelectedTimes([]);
    setSelectedAgencies([]);
    setSelectedAmenities([]);
    setMaxPrice(null);
    setMaxDurationMin(null);
  };

  // Handle selection from map
  const selectFromMap = (tripId: string | number) => {
    const trip = initialTrips.find(t => String(t.id) === String(tripId));
    if (trip) {
      handleTripSelect(trip);
      if (window.innerWidth < 1024) setMobileView('list');
    }
  };

  // Initialisation Map
  useEffect(() => {
    if (mapContainerRef.current && typeof L !== 'undefined' && !mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, { zoomControl: false }).setView([4.0511, 9.7679], 7);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
      L.control.zoom({ position: 'bottomright' }).addTo(map);
      mapInstanceRef.current = map;
      mapLayerGroupRef.current = L.featureGroup().addTo(map);
      
      // Global click handler to allow selection from popup
      window.addEventListener('click', (e: any) => {
        if (e.target && e.target.classList.contains('map-select-btn')) {
          const tid = e.target.dataset.tripId;
          selectFromMap(tid);
        }
      });
    }
  }, []);

  // Update Map Markers based on trips & User Position
  useEffect(() => {
    if (mapInstanceRef.current && mapLayerGroupRef.current) {
      mapLayerGroupRef.current.clearLayers();
      const bounds: any[] = [];

      // User Position Marker
      if (userCoords) {
        L.circleMarker([userCoords.lat, userCoords.lng], { 
          radius: 8, 
          color: '#2563eb', 
          fillColor: '#3b82f6', 
          fillOpacity: 1,
          weight: 4
        }).addTo(mapLayerGroupRef.current).bindPopup("Vous êtes ici");
        bounds.push([userCoords.lat, userCoords.lng]);
      }

      const tripsToMark = hoveredTripId 
        ? sortedTrips.filter(t => t.id === hoveredTripId) 
        : sortedTrips.slice(0, 15);

      tripsToMark.forEach(trip => {
        const start = stationLocations[trip.departureLocation];
        const end = stationLocations[trip.arrivalLocation];

        if (start) {
          const distText = trip.distanceToUser ? `<div class="text-[10px] text-primary font-bold">À ${trip.distanceToUser.toFixed(1)} km de vous</div>` : '';
          
          const marker = L.circleMarker([start.lat, start.lng], { 
            radius: hoveredTripId === trip.id ? 10 : 7, 
            color: '#13ec5b', 
            fillOpacity: 1,
            weight: 2
          }).addTo(mapLayerGroupRef.current);
          
          marker.bindPopup(`
            <div class="p-2 font-display min-w-[150px]">
              <div class="text-[9px] uppercase font-black text-gray-500 mb-1">${trip.agencyName}</div>
              <div class="font-bold text-sm text-text-main">${trip.departureLocation}</div>
              ${distText}
              <div class="mt-2 flex items-center justify-between border-t border-gray-100 pt-2">
                <span class="font-black text-primary">${trip.price} <span class="text-[10px]">CFA</span></span>
                <button 
                  data-trip-id="${trip.id}"
                  class="map-select-btn bg-black text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-black transition-all"
                >
                  Choisir
                </button>
              </div>
            </div>
          `, { className: 'custom-map-popup' });

          if (end) {
            L.polyline([[start.lat, start.lng], [end.lat, end.lng]], { 
              color: hoveredTripId === trip.id ? '#13ec5b' : '#cbd5e1', 
              weight: hoveredTripId === trip.id ? 4 : 2,
              dashArray: hoveredTripId === trip.id ? '' : '5, 10'
            }).addTo(mapLayerGroupRef.current);
            bounds.push([end.lat, end.lng]);
          }
          bounds.push([start.lat, start.lng]);
        }
      });

      if (bounds.length > 0) {
        mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
      }
    }
  }, [sortedTrips, hoveredTripId, userCoords]);

  const toggleFilter = (state: string[], setState: (v: string[]) => void, value: string) => {
    if (state.includes(value)) setState(state.filter(v => v !== value));
    else setState([...state, value]);
  };

  const handleTripSelect = (trip: TripExtended) => {
    if (currentStep === 'outbound') setSelectedOutbound(trip);
    else if (currentStep === 'return') setSelectedReturn(trip);
  };

  const handleProceedToCheckout = () => {
    if (!selectedOutbound) return;
    const totalPassengers = searchParams.passengers.adults + searchParams.passengers.children;
    setBookingDetails({
      outbound: selectedOutbound,
      returnTrip: selectedReturn,
      totalPrice: (selectedOutbound.price + (selectedReturn?.price || 0)) * totalPassengers,
      passengers: searchParams.passengers
    });
    navigateTo('checkout');
  };

  const getAmenityIcon = (type: string) => {
    switch (type) {
      case 'wifi': return 'wifi';
      case 'ac': return 'ac_unit';
      case 'power': return 'power';
      case 'snack': return 'lunch_dining';
      case 'tv': return 'tv';
      default: return 'check_circle';
    }
  };

  const renderTripCard = (trip: TripExtended, isSummary = false) => (
    <div 
      key={trip.id} 
      onMouseEnter={() => !isSummary && setHoveredTripId(trip.id)}
      onMouseLeave={() => !isSummary && setHoveredTripId(null)}
      className={`bg-white dark:bg-surface-dark rounded-2xl border transition-all overflow-hidden flex flex-col md:flex-row mb-4 ${
        hoveredTripId === trip.id ? 'border-primary shadow-xl scale-[1.01]' : 'border-gray-100 dark:border-gray-800 shadow-sm'
      }`}
    >
      <div className="p-5 md:w-1/4 flex flex-row md:flex-col items-center gap-3 border-b md:border-b-0 md:border-r border-gray-50 dark:border-gray-800 bg-gray-50/30 dark:bg-white/5">
        <div className={`size-12 rounded-2xl ${trip.color} flex items-center justify-center text-white shadow-lg`}>
          <span className="material-symbols-outlined text-2xl">{trip.agencyLogo}</span>
        </div>
        <div className="text-left md:text-center">
          <h3 className="font-black text-text-main dark:text-white">{trip.agencyName}</h3>
          {isSummary && <div className="text-[10px] font-bold text-text-muted mt-1 uppercase tracking-widest">{trip.date}</div>}
          {!isSummary && trip.distanceToUser && (
            <div className="text-[9px] font-black text-primary mt-1 flex items-center gap-1 md:justify-center">
              <span className="material-symbols-outlined text-[12px]">my_location</span>
              À {trip.distanceToUser.toFixed(1)} km
            </div>
          )}
        </div>
      </div>

      <div className="p-6 md:w-1/2 flex flex-col justify-center">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="text-center w-1/3">
            <div className="text-2xl font-black text-text-main dark:text-white">{trip.departureTime}</div>
            <div className="text-[10px] font-bold text-text-muted uppercase tracking-tighter truncate" title={trip.departureLocation}>{trip.departureLocation}</div>
          </div>
          <div className="flex-1 flex flex-col items-center">
            <div className="text-[10px] font-black text-primary mb-1">{trip.duration}</div>
            <div className="w-full h-0.5 bg-gray-100 dark:bg-gray-800 relative">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 size-1.5 rounded-full bg-primary"></div>
              <div className="absolute right-0 top-1/2 -translate-y-1/2 size-1.5 rounded-full bg-amber-500"></div>
            </div>
          </div>
          <div className="text-center w-1/3">
            <div className="text-2xl font-black text-text-main dark:text-white">{trip.arrivalTime}</div>
            <div className="text-[10px] font-bold text-text-muted uppercase tracking-tighter truncate" title={trip.arrivalLocation}>{trip.arrivalLocation}</div>
          </div>
        </div>
        {!isSummary && (
          <div className="flex items-center gap-3">
            {trip.amenities.map(a => (
              <span key={a} className="material-symbols-outlined text-gray-400 text-lg hover:text-primary transition-colors">{getAmenityIcon(a)}</span>
            ))}
          </div>
        )}
      </div>

      <div className="p-6 md:w-1/4 flex flex-row md:flex-col items-center justify-between md:justify-center gap-3 bg-gray-50/20 dark:bg-black/10 border-t md:border-t-0 md:border-l border-gray-50 dark:border-gray-800">
        <div className="text-right md:text-center">
          <div className="text-2xl font-black text-primary">{trip.price.toLocaleString()} <span className="text-xs font-bold text-gray-400">FCFA</span></div>
          <div className="text-[10px] text-text-muted uppercase font-black">{t('results.per_person')}</div>
        </div>
        {!isSummary && (
          <button onClick={() => handleTripSelect(trip)} className="px-6 py-2.5 bg-text-main dark:bg-white text-white dark:text-black rounded-xl font-black text-xs uppercase tracking-widest hover:bg-primary hover:text-black transition-all">
            {t('results.select')}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-[calc(100vh-72px)] bg-background-light dark:bg-background-dark overflow-hidden font-display relative">
      
      {/* Mobile Switcher FAB */}
      <button 
        onClick={() => setMobileView(mobileView === 'list' ? 'map' : 'list')}
        className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] bg-black dark:bg-white text-white dark:text-black h-12 px-6 rounded-full font-black shadow-2xl flex items-center gap-2 border border-white/20 active:scale-95 transition-transform uppercase tracking-widest text-[10px]"
      >
        <span className="material-symbols-outlined text-lg">
          {mobileView === 'list' ? 'map' : 'list'}
        </span>
        {mobileView === 'list' ? 'Voir Carte' : 'Voir Liste'}
      </button>

      {/* Dynamic Header */}
      <div className="bg-white dark:bg-surface-dark border-b border-gray-100 dark:border-gray-800 z-20 px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="flex flex-col">
          <div className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-1">{currentStep === 'summary' ? 'Récapitulatif' : t(`results.step.${currentStep}`)}</div>
          <div className="flex items-center gap-3 font-black text-lg text-text-main dark:text-white">
            <span>{currentStep === 'return' ? searchParams.to : searchParams.from}</span>
            <span className="material-symbols-outlined text-text-muted">arrow_forward</span>
            <span>{currentStep === 'return' ? searchParams.from : searchParams.to}</span>
          </div>
        </div>
        <div className="flex items-center gap-6">
           <div className="text-right hidden sm:block">
              <div className="text-xs font-bold text-text-main dark:text-white">{searchParams.date}</div>
              <div className="text-[10px] text-text-muted font-black uppercase">{searchParams.passengers.adults + searchParams.passengers.children} passagers</div>
           </div>
           <button onClick={() => navigateTo('home')} className="text-xs font-black text-primary uppercase border border-primary/20 px-4 py-2 rounded-lg hover:bg-primary/5 transition-all">{t('results.edit_search')}</button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Side: Results & Filters */}
        <div className={`w-full lg:w-[600px] xl:w-[700px] flex flex-col border-r border-gray-100 dark:border-gray-800 bg-white dark:bg-background-dark z-10 overflow-y-auto custom-scrollbar transition-all ${mobileView === 'map' ? 'hidden lg:flex' : 'flex'}`}>
           <div className="p-6 md:p-8">
              {currentStep === 'summary' ? (
                <div className="space-y-8 animate-fadeIn">
                   <h2 className="text-2xl font-black mb-6">{t('results.summary.title')}</h2>
                   {selectedOutbound && (
                     <div>
                       <div className="text-xs font-black text-text-muted uppercase tracking-widest mb-3 flex items-center gap-2">
                         <span className="material-symbols-outlined text-sm">flight_takeoff</span> {t('results.summary.outbound')}
                       </div>
                       {renderTripCard(selectedOutbound, true)}
                     </div>
                   )}
                   {selectedReturn && (
                     <div>
                       <div className="text-xs font-black text-text-muted uppercase tracking-widest mb-3 flex items-center gap-2">
                         <span className="material-symbols-outlined text-sm">flight_land</span> {t('results.summary.return')}
                       </div>
                       {renderTripCard(selectedReturn, true)}
                     </div>
                   )}
                   <div className="bg-primary/10 border border-primary/20 rounded-3xl p-8 mt-10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
                      <div>
                        <div className="text-xs font-black text-text-muted uppercase tracking-widest mb-1">{t('results.summary.total')}</div>
                        <div className="text-4xl font-black text-text-main dark:text-white">
                          {((selectedOutbound?.price || 0) + (selectedReturn?.price || 0)) * (searchParams.passengers.adults + searchParams.passengers.children)} <span className="text-sm">FCFA</span>
                        </div>
                      </div>
                      <button onClick={handleProceedToCheckout} className="w-full md:w-auto px-10 py-5 bg-primary text-text-main font-black rounded-2xl shadow-xl shadow-primary/20 hover:scale-105 transition-transform uppercase tracking-widest text-sm">
                        {t('results.summary.checkout')}
                      </button>
                   </div>
                </div>
              ) : (
                <div className="space-y-6">
                   <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <button 
                          onClick={() => setIsFilterOpen(!isFilterOpen)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase transition-all ${isFilterOpen ? 'bg-primary text-black' : 'bg-gray-100 dark:bg-gray-800 text-text-muted'}`}
                        >
                          <span className="material-symbols-outlined text-lg">tune</span>
                          {t('results.filter.open')}
                          {activeFilterCount > 0 && (
                            <span className="size-5 rounded-full bg-black/10 dark:bg-white/10 flex items-center justify-center text-[10px]">
                              {activeFilterCount}
                            </span>
                          )}
                        </button>
                        <h2 className="text-sm font-black text-text-main dark:text-white uppercase tracking-tighter hidden sm:block">
                          {sortedTrips.length} {t('results.found')}
                        </h2>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase text-gray-500">{t('results.sort_by')} :</span>
                        <select value={sortOption} onChange={(e) => setSortOption(e.target.value as 'price' | 'time' | 'duration' | 'arrival')} className="bg-transparent border-none text-xs font-black uppercase focus:ring-0 cursor-pointer text-primary">
                           <option value="time">{t('results.sort.departure')}</option>
                           <option value="arrival">Arrivée la plus tôt</option>
                           <option value="price">{t('results.sort.price')}</option>
                           <option value="duration">{t('results.sort.duration')}</option>
                        </select>
                      </div>
                   </div>

                   {isFilterOpen && (
                     <div className="bg-gray-50 dark:bg-white/5 rounded-3xl p-6 mb-8 border border-gray-100 dark:border-gray-800 animate-slideDown overflow-hidden">
                        {priceBounds.max > priceBounds.min && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6 pb-6 border-b border-gray-100 dark:border-gray-800">
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Prix max</h4>
                                <span className="text-xs font-black text-primary">
                                  {(maxPrice ?? priceBounds.max).toLocaleString()} FCFA
                                </span>
                              </div>
                              <input
                                type="range"
                                min={priceBounds.min}
                                max={priceBounds.max}
                                step={500}
                                value={maxPrice ?? priceBounds.max}
                                onChange={(e) => setMaxPrice(Number(e.target.value) >= priceBounds.max ? null : Number(e.target.value))}
                                className="w-full accent-primary"
                              />
                              <div className="flex justify-between text-[10px] text-text-muted font-bold mt-1">
                                <span>{priceBounds.min.toLocaleString()}</span>
                                <span>{priceBounds.max.toLocaleString()}</span>
                              </div>
                            </div>
                            {durationBounds.max > durationBounds.min && (
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Durée max</h4>
                                  <span className="text-xs font-black text-primary">
                                    {Math.floor((maxDurationMin ?? durationBounds.max) / 60)}h {String((maxDurationMin ?? durationBounds.max) % 60).padStart(2, '0')}
                                  </span>
                                </div>
                                <input
                                  type="range"
                                  min={durationBounds.min}
                                  max={durationBounds.max}
                                  step={15}
                                  value={maxDurationMin ?? durationBounds.max}
                                  onChange={(e) => setMaxDurationMin(Number(e.target.value) >= durationBounds.max ? null : Number(e.target.value))}
                                  className="w-full accent-primary"
                                />
                                <div className="flex justify-between text-[10px] text-text-muted font-bold mt-1">
                                  <span>{Math.floor(durationBounds.min / 60)}h{String(durationBounds.min % 60).padStart(2, '0')}</span>
                                  <span>{Math.floor(durationBounds.max / 60)}h{String(durationBounds.max % 60).padStart(2, '0')}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                          <div>
                            <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-4">{t('results.filter.departure_time')}</h4>
                            <div className="space-y-2">
                              {['morning', 'afternoon', 'evening'].map(time => (
                                <label key={time} className="flex items-center gap-3 cursor-pointer group">
                                  <input 
                                    type="checkbox" 
                                    checked={selectedTimes.includes(time)}
                                    onChange={() => toggleFilter(selectedTimes, setSelectedTimes, time)}
                                    className="size-5 rounded-lg border-gray-300 dark:border-gray-700 text-primary focus:ring-primary bg-transparent"
                                  />
                                  <span className="text-xs font-bold text-text-muted group-hover:text-text-main dark:group-hover:text-white transition-colors">
                                    {t(`results.filter.${time}`)}
                                  </span>
                                </label>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-4">{t('results.filter.agencies')}</h4>
                            <div className="space-y-2">
                              {(availableAgencies.length > 0 ? availableAgencies : ['Express Voyage', 'GreenLines', 'Royal Road', 'CityLink']).map(agency => (
                                <label key={agency} className="flex items-center gap-3 cursor-pointer group">
                                  <input 
                                    type="checkbox" 
                                    checked={selectedAgencies.includes(agency)}
                                    onChange={() => toggleFilter(selectedAgencies, setSelectedAgencies, agency)}
                                    className="size-5 rounded-lg border-gray-300 dark:border-gray-700 text-primary focus:ring-primary bg-transparent"
                                  />
                                  <span className="text-xs font-bold text-text-muted group-hover:text-text-main dark:group-hover:text-white transition-colors">{agency}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-4">{t('results.filter.amenities')}</h4>
                            <div className="space-y-2">
                              {['wifi', 'ac', 'power', 'snack', 'tv'].map(amenity => (
                                <label key={amenity} className="flex items-center gap-3 cursor-pointer group">
                                  <input 
                                    type="checkbox" 
                                    checked={selectedAmenities.includes(amenity)}
                                    onChange={() => toggleFilter(selectedAmenities, setSelectedAmenities, amenity)}
                                    className="size-5 rounded-lg border-gray-300 dark:border-gray-700 text-primary focus:ring-primary bg-transparent"
                                  />
                                  <span className="text-xs font-bold text-text-muted group-hover:text-text-main dark:group-hover:text-white transition-colors uppercase tracking-tight">
                                    {t(`amenity.${amenity}`)}
                                  </span>
                                </label>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                           <button
                             onClick={resetFilters}
                             className="text-[10px] font-black uppercase text-red-500 hover:underline"
                           >
                             {t('results.filter.clear')}
                           </button>
                           <button onClick={() => setIsFilterOpen(false)} className="px-6 py-2 bg-text-main dark:bg-white text-white dark:text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-90">
                             {t('results.filter.apply')}
                           </button>
                        </div>
                     </div>
                   )}

                   <div className="flex flex-col gap-2">
                      {isLoadingTrips ? (
                        <>
                          <TripCardSkeleton />
                          <TripCardSkeleton />
                          <TripCardSkeleton />
                          <TripCardSkeleton />
                        </>
                      ) : sortedTrips.length > 0 ? (
                        sortedTrips.map(trip => renderTripCard(trip))
                      ) : (
                        <div className="text-center py-20 bg-gray-50 dark:bg-white/5 rounded-[2rem] border-2 border-dashed border-gray-100 dark:border-gray-800">
                           <span className="material-symbols-outlined text-6xl text-gray-300 dark:text-gray-700 mb-4">search_off</span>
                           <h3 className="text-lg font-black text-text-muted">Aucun trajet disponible</h3>
                        </div>
                      )}
                   </div>
                </div>
              )}
           </div>
        </div>

        {/* Right Side: Interactive Map */}
        <div className={`flex-1 relative bg-gray-100 dark:bg-gray-900 z-0 transition-all ${mobileView === 'list' ? 'hidden lg:block' : 'block'}`}>
           <div ref={mapContainerRef} className="absolute inset-0 z-0" />
           <div className="absolute top-6 left-6 z-10 flex flex-col gap-3">
              <div className="bg-white/90 dark:bg-black/90 backdrop-blur-md px-5 py-3 rounded-2xl shadow-2xl border border-white/20 flex items-center gap-3">
                 <div className="size-3 rounded-full bg-primary animate-pulse"></div>
                 <span className="text-[10px] font-black uppercase tracking-widest text-text-main dark:text-white">Réseau EasyTravel Live</span>
              </div>
           </div>
           {userCoords && (
             <div className="absolute bottom-6 right-6 lg:bottom-12 lg:right-12 z-10">
                <button 
                  onClick={() => mapInstanceRef.current.flyTo([userCoords.lat, userCoords.lng], 13)}
                  className="size-12 bg-white dark:bg-surface-dark rounded-full shadow-2xl flex items-center justify-center text-primary border border-gray-100 dark:border-gray-800 active:scale-95 transition-transform"
                >
                  <span className="material-symbols-outlined">my_location</span>
                </button>
             </div>
           )}
        </div>

      </div>
    </div>
  );
};

export default SearchResultsPage;
