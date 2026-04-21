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

interface NearbyDate {
  date: string;
  count: number;
  minPrice: number | null;
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
  const { searchParams, navigateTo, setBookingDetails, setSearchParams } = useNavigation();
  const [sortOption, setSortOption] = useState<'price' | 'time' | 'duration' | 'arrival'>('time');

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedTimes, setSelectedTimes] = useState<string[]>([]);
  const [selectedAgencies, setSelectedAgencies] = useState<string[]>([]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState<number | null>(null);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [maxDurationMin, setMaxDurationMin] = useState<number | null>(null);
  const [hourRange, setHourRange] = useState<[number, number]>([0, 24]);

  const [selectedOutbound, setSelectedOutbound] = useState<TripExtended | null>(null);
  const [selectedReturn, setSelectedReturn] = useState<TripExtended | null>(null);
  const [hoveredTripId, setHoveredTripId] = useState<number | string | null>(null);

  // Comparator (up to 3 trips side-by-side)
  const [compareTripIds, setCompareTripIds] = useState<Array<string | number>>([]);
  const [showCompare, setShowCompare] = useState(false);

  // New: Geolocation & Mobile View switcher
  const [userCoords, setUserCoords] = useState<{lat: number, lng: number} | null>(null);
  const [mobileView, setMobileView] = useState<'list' | 'map'>('list');

  const [fetchedTrips, setFetchedTrips] = useState<TripExtended[]>([]);
  const [isLoadingTrips, setIsLoadingTrips] = useState(false);
  const [nearbyDates, setNearbyDates] = useState<NearbyDate[]>([]);
  const [isLoadingNearby, setIsLoadingNearby] = useState(false);

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
      setNearbyDates([]);
      try {
        const origin = currentStep === 'outbound' ? searchParams.from : searchParams.to;
        const destination = currentStep === 'outbound' ? searchParams.to : searchParams.from;
        const date = currentStep === 'outbound' ? searchParams.date : (searchParams.returnDate || searchParams.date);

        const res = await fetch(`/api/departures?from=${encodeURIComponent(origin)}&to=${encodeURIComponent(destination)}&date=${encodeURIComponent(date)}`);
        const json = await res.json();
        const trips = Array.isArray(json.data) ? (json.data as TripExtended[]) : [];
        setFetchedTrips(trips);

        if (trips.length === 0) {
          setIsLoadingNearby(true);
          try {
            const base = new Date(`${date}T00:00:00`);
            const offsets = [-3, -2, -1, 1, 2, 3];
            const results = await Promise.all(
              offsets.map(async (offset) => {
                const d = new Date(base);
                d.setDate(d.getDate() + offset);
                const iso = d.toISOString().slice(0, 10);
                try {
                  const r = await fetch(`/api/departures?from=${encodeURIComponent(origin)}&to=${encodeURIComponent(destination)}&date=${encodeURIComponent(iso)}`);
                  const j = await r.json();
                  const t = Array.isArray(j.data) ? (j.data as TripExtended[]) : [];
                  const minPrice = t.length > 0 ? Math.min(...t.map(x => x.price)) : null;
                  return { date: iso, count: t.length, minPrice } as NearbyDate;
                } catch {
                  return { date: iso, count: 0, minPrice: null } as NearbyDate;
                }
              })
            );
            setNearbyDates(results.filter(r => r.count > 0));
          } finally {
            setIsLoadingNearby(false);
          }
        }
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
      const hour = parseInt(trip.departureTime.split(':')[0]);
      if (selectedTimes.length > 0) {
        const period = hour >= 6 && hour < 12 ? 'morning' : hour >= 12 && hour < 18 ? 'afternoon' : 'evening';
        if (!selectedTimes.includes(period)) return false;
      }
      if (hourRange[0] > 0 || hourRange[1] < 24) {
        if (hour < hourRange[0] || hour >= hourRange[1]) return false;
      }
      if (minPrice !== null && trip.price < minPrice) return false;
      if (maxPrice !== null && trip.price > maxPrice) return false;
      if (maxDurationMin !== null && (trip.durationMin ?? 0) > maxDurationMin) return false;
      return true;
    });
  }, [initialTrips, selectedAgencies, selectedAmenities, selectedTimes, hourRange, minPrice, maxPrice, maxDurationMin]);

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
    (minPrice !== null ? 1 : 0) +
    (maxPrice !== null ? 1 : 0) +
    (maxDurationMin !== null ? 1 : 0) +
    ((hourRange[0] > 0 || hourRange[1] < 24) ? 1 : 0);

  const resetFilters = () => {
    setSelectedTimes([]);
    setSelectedAgencies([]);
    setSelectedAmenities([]);
    setMinPrice(null);
    setMaxPrice(null);
    setMaxDurationMin(null);
    setHourRange([0, 24]);
  };

  const toggleCompare = (tripId: string | number) => {
    setCompareTripIds(prev => {
      if (prev.includes(tripId)) return prev.filter(id => id !== tripId);
      if (prev.length >= 3) return prev;
      return [...prev, tripId];
    });
  };

  const compareTrips = useMemo(
    () => compareTripIds
      .map(id => sortedTrips.find(t => t.id === id))
      .filter((t): t is TripExtended => Boolean(t)),
    [compareTripIds, sortedTrips]
  );

  const retrySearchWithDate = (newDate: string) => {
    if (!searchParams) return;
    const next = currentStep === 'outbound'
      ? { ...searchParams, date: newDate }
      : { ...searchParams, returnDate: newDate };
    setSearchParams(next);
  };

  const formatNearbyDate = (iso: string) => {
    try {
      const d = new Date(`${iso}T00:00:00`);
      return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
    } catch {
      return iso;
    }
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
      className={`bg-white dark:bg-surface-dark rounded-2xl border transition-all overflow-hidden flex flex-col md:flex-row mb-3 ${
        hoveredTripId === trip.id
          ? 'border-primary/50 shadow-card -translate-y-0.5'
          : 'border-ink-100 dark:border-white/10 shadow-subtle'
      }`}
    >
      <div className="p-5 md:w-1/4 flex flex-row md:flex-col items-center gap-3 border-b md:border-b-0 md:border-r border-ink-100/70 dark:border-white/10 bg-ink-50/40 dark:bg-white/[0.03]">
        <div className={`size-11 rounded-xl ${trip.color} flex items-center justify-center text-white shadow-subtle`}>
          <span className="material-symbols-outlined text-xl">{trip.agencyLogo}</span>
        </div>
        <div className="text-left md:text-center">
          <h3 className="font-display font-semibold tracking-tight text-text-main dark:text-white">{trip.agencyName}</h3>
          {isSummary && <div className="text-[11px] font-medium text-text-muted mt-1 tracking-tight">{trip.date}</div>}
          {!isSummary && trip.distanceToUser && (
            <div className="text-[11px] font-medium text-teal-accent dark:text-primary mt-1 flex items-center gap-1 md:justify-center">
              <span className="material-symbols-outlined text-[14px]">my_location</span>
              À {trip.distanceToUser.toFixed(1)} km
            </div>
          )}
        </div>
      </div>

      <div className="p-6 md:w-1/2 flex flex-col justify-center">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="text-center w-1/3">
            <div className="font-display text-2xl font-semibold tabular-nums tracking-tight text-text-main dark:text-white">{trip.departureTime}</div>
            <div className="text-[11px] font-medium text-text-muted mt-1 tracking-tight truncate" title={trip.departureLocation}>{trip.departureLocation}</div>
          </div>
          <div className="flex-1 flex flex-col items-center">
            <div className="text-[11px] font-medium text-text-muted mb-1.5 tabular-nums">{trip.duration}</div>
            <div className="w-full h-px bg-ink-200 dark:bg-white/15 relative">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 size-1.5 rounded-full bg-primary"></div>
              <div className="absolute right-0 top-1/2 -translate-y-1/2 size-1.5 rounded-full bg-teal-accent dark:bg-primary/60"></div>
            </div>
          </div>
          <div className="text-center w-1/3">
            <div className="font-display text-2xl font-semibold tabular-nums tracking-tight text-text-main dark:text-white">{trip.arrivalTime}</div>
            <div className="text-[11px] font-medium text-text-muted mt-1 tracking-tight truncate" title={trip.arrivalLocation}>{trip.arrivalLocation}</div>
          </div>
        </div>
        {!isSummary && (
          <div className="flex items-center gap-3">
            {trip.amenities.map(a => (
              <span key={a} className="material-symbols-outlined text-text-muted/80 text-[18px] hover:text-teal-accent dark:hover:text-primary transition-colors">{getAmenityIcon(a)}</span>
            ))}
          </div>
        )}
      </div>

      <div className="p-6 md:w-1/4 flex flex-row md:flex-col items-center justify-between md:justify-center gap-3 bg-ink-50/30 dark:bg-black/10 border-t md:border-t-0 md:border-l border-ink-100/70 dark:border-white/10">
        <div className="text-right md:text-center">
          <div className="font-display text-2xl font-semibold text-text-main dark:text-white tracking-tight tabular-nums">
            {trip.price.toLocaleString()}
            <span className="text-[11px] font-medium text-text-muted ml-1">FCFA</span>
          </div>
          <div className="text-[11px] text-text-muted mt-0.5">{t('results.per_person')}</div>
        </div>
        {!isSummary && (
          <div className="flex flex-col items-end md:items-center gap-2">
            <button
              onClick={() => handleTripSelect(trip)}
              className="inline-flex items-center gap-1.5 rounded-full bg-text-main dark:bg-white text-white dark:text-text-main px-5 py-2 text-xs font-semibold tracking-tight shadow-subtle hover:shadow-card active:translate-y-[1px] transition-all"
            >
              {t('results.select')}
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
            <label
              className={`inline-flex items-center gap-1.5 text-[11px] font-medium tracking-tight cursor-pointer select-none transition-colors ${
                compareTripIds.includes(trip.id)
                  ? 'text-teal-accent dark:text-primary'
                  : 'text-text-muted hover:text-text-main dark:hover:text-white'
              }`}
              title={
                !compareTripIds.includes(trip.id) && compareTripIds.length >= 3
                  ? 'Maximum 3 trajets à comparer'
                  : 'Ajouter à la comparaison'
              }
            >
              <input
                type="checkbox"
                checked={compareTripIds.includes(trip.id)}
                disabled={!compareTripIds.includes(trip.id) && compareTripIds.length >= 3}
                onChange={() => toggleCompare(trip.id)}
                className="size-3.5 rounded border-ink-300 dark:border-white/25 text-primary focus:ring-primary/40 bg-transparent"
              />
              <span className="material-symbols-outlined text-[14px]">compare_arrows</span>
              Comparer
            </label>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-[calc(100vh-72px)] bg-background-light dark:bg-background-dark overflow-hidden relative">

      {/* Mobile Switcher FAB */}
      <button
        onClick={() => setMobileView(mobileView === 'list' ? 'map' : 'list')}
        className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] bg-text-main dark:bg-white text-white dark:text-text-main h-11 px-5 rounded-full font-semibold shadow-elevated flex items-center gap-2 active:scale-95 transition-transform text-sm tracking-tight"
      >
        <span className="material-symbols-outlined text-[18px]">
          {mobileView === 'list' ? 'map' : 'list'}
        </span>
        {mobileView === 'list' ? 'Carte' : 'Liste'}
      </button>

      {/* Dynamic Header */}
      <div className="bg-white/90 dark:bg-surface-dark/90 backdrop-blur-xl border-b border-ink-100 dark:border-white/10 z-20 px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex flex-col">
          <div className="text-[11px] font-semibold text-teal-accent dark:text-primary uppercase tracking-[0.18em] mb-1">
            {currentStep === 'summary' ? 'Récapitulatif' : t(`results.step.${currentStep}`)}
          </div>
          <div className="flex items-center gap-2.5 font-display font-semibold text-xl tracking-tight text-text-main dark:text-white">
            <span>{currentStep === 'return' ? searchParams.to : searchParams.from}</span>
            <span className="material-symbols-outlined text-text-muted text-lg">arrow_forward</span>
            <span>{currentStep === 'return' ? searchParams.from : searchParams.to}</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:flex items-center gap-4 pr-4 border-r border-ink-100 dark:border-white/10">
            <div>
              <div className="text-[11px] text-text-muted uppercase tracking-[0.14em] font-medium">Date</div>
              <div className="text-sm font-semibold tracking-tight text-text-main dark:text-white">{searchParams.date}</div>
            </div>
            <div>
              <div className="text-[11px] text-text-muted uppercase tracking-[0.14em] font-medium">Passagers</div>
              <div className="text-sm font-semibold tracking-tight text-text-main dark:text-white">{searchParams.passengers.adults + searchParams.passengers.children}</div>
            </div>
          </div>
          <button
            onClick={() => navigateTo('home')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-tight text-text-main dark:text-white border border-ink-200 dark:border-white/15 hover:border-primary/40 px-3.5 py-2 rounded-full transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">edit</span>
            {t('results.edit_search')}
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Side: Results & Filters */}
        <div className={`w-full lg:w-[600px] xl:w-[700px] flex flex-col border-r border-gray-100 dark:border-gray-800 bg-white dark:bg-background-dark z-10 overflow-y-auto custom-scrollbar transition-all ${mobileView === 'map' ? 'hidden lg:flex' : 'flex'}`}>
           <div className="p-6 md:p-8">
              {currentStep === 'summary' ? (
                <div className="space-y-8 animate-fadeIn">
                   <h2 className="font-display text-2xl md:text-3xl font-semibold tracking-tightest text-text-main dark:text-white mb-2">{t('results.summary.title')}</h2>
                   <p className="text-sm text-text-muted dark:text-gray-400 mb-8 leading-relaxed">Relisez vos trajets avant de finaliser votre paiement.</p>
                   {selectedOutbound && (
                     <div>
                       <div className="text-[11px] font-semibold text-text-muted uppercase tracking-[0.16em] mb-3 flex items-center gap-2">
                         <span className="material-symbols-outlined text-[16px] text-teal-accent dark:text-primary">flight_takeoff</span> {t('results.summary.outbound')}
                       </div>
                       {renderTripCard(selectedOutbound, true)}
                     </div>
                   )}
                   {selectedReturn && (
                     <div>
                       <div className="text-[11px] font-semibold text-text-muted uppercase tracking-[0.16em] mb-3 flex items-center gap-2">
                         <span className="material-symbols-outlined text-[16px] text-teal-accent dark:text-primary">flight_land</span> {t('results.summary.return')}
                       </div>
                       {renderTripCard(selectedReturn, true)}
                     </div>
                   )}
                   <div className="bg-ink-950 text-white rounded-3xl p-8 mt-10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-elevated">
                      <div>
                        <div className="text-[11px] font-semibold text-white/60 uppercase tracking-[0.16em] mb-1">{t('results.summary.total')}</div>
                        <div className="font-display text-4xl md:text-5xl font-semibold text-white tracking-tightest tabular-nums">
                          {(((selectedOutbound?.price || 0) + (selectedReturn?.price || 0)) * (searchParams.passengers.adults + searchParams.passengers.children)).toLocaleString()}
                          <span className="text-sm font-medium text-white/60 ml-2">FCFA</span>
                        </div>
                      </div>
                      <button
                        onClick={handleProceedToCheckout}
                        className="group w-full md:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-primary hover:bg-primary-600 text-text-main font-semibold px-7 py-3.5 text-sm tracking-tight shadow-card transition-all hover:-translate-y-0.5"
                      >
                        {t('results.summary.checkout')}
                        <span className="material-symbols-outlined text-base group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
                      </button>
                   </div>
                </div>
              ) : (
                <div className="space-y-6">
                   <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => setIsFilterOpen(!isFilterOpen)}
                          className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-semibold tracking-tight transition-all border ${
                            isFilterOpen
                              ? 'bg-text-main text-white border-text-main'
                              : 'bg-white dark:bg-white/5 text-text-main dark:text-gray-200 border-ink-200 dark:border-white/15 hover:border-primary/40'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[18px]">tune</span>
                          {t('results.filter.open')}
                          {activeFilterCount > 0 && (
                            <span className="size-5 rounded-full bg-primary text-text-main flex items-center justify-center text-[10px] font-semibold">
                              {activeFilterCount}
                            </span>
                          )}
                        </button>
                        <h2 className="text-sm font-medium tracking-tight text-text-muted hidden sm:block">
                          <span className="text-text-main dark:text-white font-semibold">{sortedTrips.length}</span> {t('results.found')}
                        </h2>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-text-muted">{t('results.sort_by')}</span>
                        <select
                          value={sortOption}
                          onChange={(e) => setSortOption(e.target.value as 'price' | 'time' | 'duration' | 'arrival')}
                          className="bg-transparent border-0 text-xs font-semibold tracking-tight focus:ring-0 cursor-pointer text-text-main dark:text-white hover:text-teal-accent dark:hover:text-primary"
                        >
                           <option value="time">{t('results.sort.departure')}</option>
                           <option value="arrival">Arrivée la plus tôt</option>
                           <option value="price">{t('results.sort.price')}</option>
                           <option value="duration">{t('results.sort.duration')}</option>
                        </select>
                      </div>
                   </div>

                   {isFilterOpen && (
                     <div className="bg-white dark:bg-white/[0.03] rounded-2xl p-6 mb-8 border border-ink-100 dark:border-white/10 animate-slideDown overflow-hidden shadow-subtle">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6 pb-6 border-b border-ink-100 dark:border-white/10">
                          {priceBounds.max > priceBounds.min && (
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="text-[11px] font-semibold uppercase text-text-muted tracking-[0.16em]">Fourchette de prix</h4>
                                <span className="text-xs font-semibold tabular-nums text-text-main dark:text-white">
                                  {(minPrice ?? priceBounds.min).toLocaleString()} – {(maxPrice ?? priceBounds.max).toLocaleString()} FCFA
                                </span>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <input
                                  type="range"
                                  aria-label="Prix minimum"
                                  min={priceBounds.min}
                                  max={priceBounds.max}
                                  step={500}
                                  value={minPrice ?? priceBounds.min}
                                  onChange={(e) => {
                                    const v = Number(e.target.value);
                                    setMinPrice(v <= priceBounds.min ? null : v);
                                  }}
                                  className="w-full accent-primary"
                                />
                                <input
                                  type="range"
                                  aria-label="Prix maximum"
                                  min={priceBounds.min}
                                  max={priceBounds.max}
                                  step={500}
                                  value={maxPrice ?? priceBounds.max}
                                  onChange={(e) => {
                                    const v = Number(e.target.value);
                                    setMaxPrice(v >= priceBounds.max ? null : v);
                                  }}
                                  className="w-full accent-primary"
                                />
                              </div>
                              <div className="flex justify-between text-[11px] text-text-muted font-medium mt-1 tabular-nums">
                                <span>{priceBounds.min.toLocaleString()}</span>
                                <span>{priceBounds.max.toLocaleString()}</span>
                              </div>
                            </div>
                          )}
                          {durationBounds.max > durationBounds.min && (
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="text-[11px] font-semibold uppercase text-text-muted tracking-[0.16em]">Durée max</h4>
                                <span className="text-xs font-semibold tabular-nums text-text-main dark:text-white">
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
                              <div className="flex justify-between text-[11px] text-text-muted font-medium mt-1 tabular-nums">
                                <span>{Math.floor(durationBounds.min / 60)}h{String(durationBounds.min % 60).padStart(2, '0')}</span>
                                <span>{Math.floor(durationBounds.max / 60)}h{String(durationBounds.max % 60).padStart(2, '0')}</span>
                              </div>
                            </div>
                          )}
                          <div className="sm:col-span-2">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-[11px] font-semibold uppercase text-text-muted tracking-[0.16em]">Heure de départ</h4>
                              <span className="text-xs font-semibold tabular-nums text-text-main dark:text-white">
                                {String(hourRange[0]).padStart(2, '0')}h – {String(hourRange[1]).padStart(2, '0')}h
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <input
                                type="range"
                                aria-label="Heure min"
                                min={0}
                                max={23}
                                step={1}
                                value={hourRange[0]}
                                onChange={(e) => {
                                  const v = Math.min(Number(e.target.value), hourRange[1] - 1);
                                  setHourRange([v, hourRange[1]]);
                                }}
                                className="w-full accent-primary"
                              />
                              <input
                                type="range"
                                aria-label="Heure max"
                                min={1}
                                max={24}
                                step={1}
                                value={hourRange[1]}
                                onChange={(e) => {
                                  const v = Math.max(Number(e.target.value), hourRange[0] + 1);
                                  setHourRange([hourRange[0], v]);
                                }}
                                className="w-full accent-primary"
                              />
                            </div>
                            <div className="flex justify-between text-[11px] text-text-muted font-medium mt-1 tabular-nums">
                              <span>00h</span>
                              <span>24h</span>
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                          <div>
                            <h4 className="text-[11px] font-semibold uppercase text-text-muted tracking-[0.16em] mb-4">{t('results.filter.departure_time')}</h4>
                            <div className="space-y-2">
                              {['morning', 'afternoon', 'evening'].map(time => (
                                <label key={time} className="flex items-center gap-3 cursor-pointer group">
                                  <input 
                                    type="checkbox" 
                                    checked={selectedTimes.includes(time)}
                                    onChange={() => toggleFilter(selectedTimes, setSelectedTimes, time)}
                                    className="size-5 rounded-lg border-gray-300 dark:border-gray-700 text-primary focus:ring-primary bg-transparent"
                                  />
                                  <span className="text-sm font-medium text-text-main dark:text-gray-300 transition-colors">
                                    {t(`results.filter.${time}`)}
                                  </span>
                                </label>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h4 className="text-[11px] font-semibold uppercase text-text-muted tracking-[0.16em] mb-4">{t('results.filter.agencies')}</h4>
                            <div className="space-y-2">
                              {(availableAgencies.length > 0 ? availableAgencies : ['Express Voyage', 'GreenLines', 'Royal Road', 'CityLink']).map(agency => (
                                <label key={agency} className="flex items-center gap-3 cursor-pointer group">
                                  <input 
                                    type="checkbox" 
                                    checked={selectedAgencies.includes(agency)}
                                    onChange={() => toggleFilter(selectedAgencies, setSelectedAgencies, agency)}
                                    className="size-5 rounded-lg border-gray-300 dark:border-gray-700 text-primary focus:ring-primary bg-transparent"
                                  />
                                  <span className="text-sm font-medium text-text-main dark:text-gray-300">{agency}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h4 className="text-[11px] font-semibold uppercase text-text-muted tracking-[0.16em] mb-4">{t('results.filter.amenities')}</h4>
                            <div className="space-y-2">
                              {['wifi', 'ac', 'power', 'snack', 'tv'].map(amenity => (
                                <label key={amenity} className="flex items-center gap-3 cursor-pointer group">
                                  <input 
                                    type="checkbox" 
                                    checked={selectedAmenities.includes(amenity)}
                                    onChange={() => toggleFilter(selectedAmenities, setSelectedAmenities, amenity)}
                                    className="size-5 rounded-lg border-gray-300 dark:border-gray-700 text-primary focus:ring-primary bg-transparent"
                                  />
                                  <span className="text-sm font-medium text-text-main dark:text-gray-300">
                                    {t(`amenity.${amenity}`)}
                                  </span>
                                </label>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="mt-8 pt-6 border-t border-ink-100 dark:border-white/10 flex items-center justify-between">
                           <button
                             onClick={resetFilters}
                             className="text-xs font-semibold tracking-tight text-red-500 hover:underline"
                           >
                             {t('results.filter.clear')}
                           </button>
                           <button
                             onClick={() => setIsFilterOpen(false)}
                             className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-text-main dark:bg-white text-white dark:text-text-main text-xs font-semibold tracking-tight shadow-subtle hover:shadow-card transition-all"
                           >
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
                        <div className="bg-white dark:bg-white/[0.03] rounded-2xl border border-dashed border-ink-200 dark:border-white/10 p-8 md:p-10">
                          <div className="text-center mb-6">
                            <div className="inline-flex size-14 rounded-2xl bg-ink-50 dark:bg-white/5 items-center justify-center mb-4">
                              <span className="material-symbols-outlined text-3xl text-text-muted">search_off</span>
                            </div>
                            <h3 className="font-display text-xl font-semibold text-text-main dark:text-white tracking-tightest mb-1">
                              Aucun trajet ce jour-là
                            </h3>
                            <p className="text-sm text-text-muted leading-relaxed max-w-md mx-auto">
                              {activeFilterCount > 0
                                ? 'Essayez d\'élargir vos filtres, ou regardez les dates proches ci-dessous.'
                                : 'Voici les dates proches où des trajets sont disponibles.'}
                            </p>
                          </div>

                          {isLoadingNearby ? (
                            <div className="flex justify-center py-4">
                              <div className="size-5 rounded-full border-2 border-ink-200 border-t-text-main dark:border-white/15 dark:border-t-white animate-spin" />
                            </div>
                          ) : nearbyDates.length > 0 ? (
                            <div>
                              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-muted text-center mb-3">
                                Dates proches disponibles
                              </div>
                              <div className="flex flex-wrap justify-center gap-2">
                                {nearbyDates.map(nd => (
                                  <button
                                    key={nd.date}
                                    onClick={() => retrySearchWithDate(nd.date)}
                                    className="group inline-flex flex-col items-start gap-0.5 rounded-xl border border-ink-200 dark:border-white/15 bg-white dark:bg-white/5 px-3.5 py-2 hover:border-text-main/40 hover:shadow-subtle transition-all"
                                  >
                                    <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted group-hover:text-text-main dark:group-hover:text-white">
                                      {formatNearbyDate(nd.date)}
                                    </span>
                                    <span className="text-xs font-medium tracking-tight text-text-main dark:text-white tabular-nums">
                                      {nd.count} trajet{nd.count > 1 ? 's' : ''}
                                      {nd.minPrice !== null && (
                                        <> · dès {nd.minPrice.toLocaleString()} FCFA</>
                                      )}
                                    </span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs text-center text-text-muted">
                              Aucun trajet trouvé dans les 3 jours alentours.
                            </p>
                          )}
                        </div>
                      )}
                   </div>
                </div>
              )}
           </div>
        </div>

        {/* Right Side: Interactive Map */}
        <div className={`flex-1 relative bg-ink-100 dark:bg-ink-900 z-0 transition-all ${mobileView === 'list' ? 'hidden lg:block' : 'block'}`}>
           <div ref={mapContainerRef} className="absolute inset-0 z-0" />
           <div className="absolute top-6 left-6 z-10 flex flex-col gap-3">
              <div className="bg-white/90 dark:bg-surface-dark/90 backdrop-blur-xl px-4 py-2.5 rounded-full shadow-elevated border border-ink-100 dark:border-white/10 flex items-center gap-2.5">
                 <span className="relative flex items-center justify-center">
                   <span className="absolute size-2.5 rounded-full bg-primary/50 animate-ping" />
                   <span className="relative size-2 rounded-full bg-primary" />
                 </span>
                 <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-main dark:text-white">Réseau EasyTravel · Live</span>
              </div>
           </div>
           {userCoords && (
             <div className="absolute bottom-6 right-6 lg:bottom-12 lg:right-12 z-10">
                <button
                  onClick={() => mapInstanceRef.current.flyTo([userCoords.lat, userCoords.lng], 13)}
                  className="size-11 bg-white dark:bg-surface-dark rounded-full shadow-elevated flex items-center justify-center text-teal-accent dark:text-primary border border-ink-100 dark:border-white/10 hover:scale-105 active:scale-95 transition-transform"
                >
                  <span className="material-symbols-outlined">my_location</span>
                </button>
             </div>
           )}
        </div>

      </div>

      {/* Compare bar (floating) */}
      {compareTrips.length > 0 && currentStep !== 'summary' && (
        <div className="fixed bottom-0 left-0 right-0 z-[90] px-4 pb-4 pointer-events-none">
          <div className="pointer-events-auto mx-auto max-w-4xl bg-text-main dark:bg-white text-white dark:text-text-main rounded-full shadow-elevated border border-white/10 dark:border-ink-100 px-4 py-2.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <span className="material-symbols-outlined text-primary text-[18px]">compare_arrows</span>
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/60 dark:text-text-muted hidden sm:inline">Comparer</span>
              <div className="flex items-center gap-1.5 min-w-0 overflow-hidden">
                {compareTrips.map(trip => (
                  <span
                    key={trip.id}
                    className="inline-flex items-center gap-1 rounded-full bg-white/10 dark:bg-ink-100 text-xs font-semibold tracking-tight px-2.5 py-1 whitespace-nowrap"
                  >
                    {trip.agencyName} · {trip.departureTime}
                    <button
                      type="button"
                      onClick={() => toggleCompare(trip.id)}
                      aria-label="Retirer"
                      className="ml-0.5 size-4 rounded-full hover:bg-white/20 dark:hover:bg-ink-200 flex items-center justify-center"
                    >
                      <span className="material-symbols-outlined text-[14px]">close</span>
                    </button>
                  </span>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setCompareTripIds([])}
                className="text-[11px] font-semibold tracking-tight text-white/60 dark:text-text-muted hover:text-white dark:hover:text-text-main transition-colors hidden sm:inline"
              >
                Vider
              </button>
              <button
                type="button"
                disabled={compareTrips.length < 2}
                onClick={() => setShowCompare(true)}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary text-text-main text-xs font-semibold tracking-tight px-4 py-2 shadow-subtle hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0"
              >
                Comparer {compareTrips.length}
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Compare modal */}
      {showCompare && compareTrips.length >= 2 && (
        <div
          className="fixed inset-0 z-[120] bg-ink-950/70 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-6 animate-fadeIn"
          onClick={() => setShowCompare(false)}
        >
          <div
            className="bg-white dark:bg-surface-dark w-full max-w-5xl max-h-[92vh] md:max-h-[88vh] rounded-t-3xl md:rounded-3xl shadow-elevated border border-ink-100 dark:border-white/10 flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 md:px-8 py-5 border-b border-ink-100 dark:border-white/10">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-teal-accent dark:text-primary mb-1">Comparaison</div>
                <h3 className="font-display text-xl md:text-2xl font-semibold tracking-tightest text-text-main dark:text-white">
                  {compareTrips.length} trajets <span className="font-serif-italic italic font-normal text-teal-accent dark:text-primary">côte à côte</span>
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCompare(false)}
                aria-label="Fermer"
                className="size-9 rounded-full bg-ink-50 dark:bg-white/5 hover:bg-ink-100 dark:hover:bg-white/10 flex items-center justify-center transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="flex-1 overflow-auto p-4 md:p-6">
              <div className={`grid gap-4 ${compareTrips.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3'}`}>
                {compareTrips.map(trip => {
                  const cheapest = Math.min(...compareTrips.map(t => t.price));
                  const fastest = Math.min(...compareTrips.map(t => t.durationMin ?? Infinity));
                  const earliest = compareTrips.reduce((a, b) => (a.departureTime < b.departureTime ? a : b)).id;
                  return (
                    <div
                      key={trip.id}
                      className="relative rounded-2xl border border-ink-100 dark:border-white/10 bg-white dark:bg-white/[0.03] shadow-subtle p-5 flex flex-col gap-4"
                    >
                      <button
                        type="button"
                        onClick={() => toggleCompare(trip.id)}
                        aria-label="Retirer de la comparaison"
                        className="absolute top-3 right-3 size-7 rounded-full bg-ink-50 dark:bg-white/5 hover:bg-ink-100 dark:hover:bg-white/10 flex items-center justify-center text-text-muted"
                      >
                        <span className="material-symbols-outlined text-[16px]">close</span>
                      </button>

                      <div className="flex items-center gap-3">
                        <div className={`size-10 rounded-xl ${trip.color} flex items-center justify-center text-white shadow-subtle`}>
                          <span className="material-symbols-outlined text-lg">{trip.agencyLogo}</span>
                        </div>
                        <div className="min-w-0">
                          <div className="font-display font-semibold tracking-tight text-text-main dark:text-white truncate">{trip.agencyName}</div>
                          <div className="text-[11px] text-text-muted tracking-tight">{trip.date}</div>
                        </div>
                      </div>

                      <div>
                        <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted mb-1.5">Prix total</div>
                        <div className="font-display text-2xl font-semibold tracking-tightest tabular-nums text-text-main dark:text-white inline-flex items-baseline gap-1.5">
                          {trip.price.toLocaleString()}
                          <span className="text-xs font-medium text-text-muted">FCFA</span>
                          {trip.price === cheapest && (
                            <span className="ml-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-teal-accent dark:text-primary">· Le + bas</span>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted mb-1">Départ</div>
                          <div className="font-display text-lg font-semibold tabular-nums text-text-main dark:text-white">{trip.departureTime}</div>
                          <div className="text-[11px] text-text-muted truncate mt-0.5">{trip.departureLocation}</div>
                          {trip.id === earliest && (
                            <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-teal-accent dark:text-primary mt-0.5">Plus tôt</div>
                          )}
                        </div>
                        <div>
                          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted mb-1">Arrivée</div>
                          <div className="font-display text-lg font-semibold tabular-nums text-text-main dark:text-white">{trip.arrivalTime}</div>
                          <div className="text-[11px] text-text-muted truncate mt-0.5">{trip.arrivalLocation}</div>
                        </div>
                      </div>

                      <div>
                        <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted mb-1">Durée</div>
                        <div className="font-display text-base font-semibold tabular-nums text-text-main dark:text-white inline-flex items-baseline gap-2">
                          {trip.duration}
                          {(trip.durationMin ?? Infinity) === fastest && (
                            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-teal-accent dark:text-primary">· Le + rapide</span>
                          )}
                        </div>
                      </div>

                      <div>
                        <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted mb-2">Services</div>
                        {trip.amenities.length === 0 ? (
                          <div className="text-xs text-text-muted">Aucun service renseigné</div>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {trip.amenities.map(a => (
                              <span
                                key={a}
                                className="inline-flex items-center gap-1 rounded-full bg-ink-50 dark:bg-white/5 border border-ink-100 dark:border-white/10 px-2 py-0.5 text-[11px] font-medium text-text-main dark:text-white tracking-tight"
                              >
                                <span className="material-symbols-outlined text-[12px]">{getAmenityIcon(a)}</span>
                                {t(`amenity.${a}`)}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div>
                        <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted mb-1">Places</div>
                        <div className="text-sm font-medium text-text-main dark:text-white tabular-nums">
                          {trip.seatsAvailable} / {trip.seatsTotal} disponibles
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => { handleTripSelect(trip); setShowCompare(false); }}
                        className="mt-auto inline-flex items-center justify-center gap-1.5 w-full rounded-full bg-text-main dark:bg-white text-white dark:text-text-main px-5 py-2.5 text-xs font-semibold tracking-tight shadow-subtle hover:shadow-card hover:-translate-y-0.5 transition-all"
                      >
                        Choisir ce trajet
                        <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchResultsPage;
