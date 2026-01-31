import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigation } from '../contexts/NavigationContext';

// Leaflet global declaration
declare const L: any;

interface Trip {
  id: number;
  agencyName: string;
  agencyLogo: string;
  departureTime: string;
  departureLocation: string;
  arrivalTime: string;
  arrivalLocation: string;
  duration: string;
  price: number;
  currency: string;
  amenities: string[];
  color: string;
  date: string;
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

// Generate trips dynamically ensuring station consistency
const generateTrips = (from: string, to: string, date: string): Trip[] => {
  const getStations = (agency: string) => {
    switch (agency) {
      case "Express Voyage": return { douala: "Gare Centrale", yaounde: "Mvan" };
      case "GreenLines": return { douala: "Akwa", yaounde: "Biyem-Assi" };
      case "Royal Road": return { douala: "Bonabéri", yaounde: "Centre Ville" };
      case "CityLink": return { douala: "Bali", yaounde: "Nsam" };
      default: return { douala: "Gare", yaounde: "Station" };
    }
  };

  const getStationName = (city: string, agency: string) => {
    const stations = getStations(agency);
    const cityLower = city.toLowerCase();
    if (cityLower.includes("douala")) return `${city} - ${stations.douala}`;
    if (cityLower.includes("yaoundé") || cityLower.includes("yaounde")) return `${city} - ${stations.yaounde}`;
    return `${city} - Agence`; // Fallback
  };

  const agencies = [
    { name: "Express Voyage", logo: "directions_bus", color: "bg-blue-600", price: 4500, amenities: ["wifi", "ac", "power"] },
    { name: "GreenLines", logo: "eco", color: "bg-green-600", price: 3500, amenities: ["ac", "snack"] },
    { name: "Royal Road", logo: "diamond", color: "bg-amber-600", price: 6000, amenities: ["wifi", "ac", "power", "tv", "snack"] },
    { name: "CityLink", logo: "apartment", color: "bg-purple-600", price: 4000, amenities: ["ac", "tv"] }
  ];

  const times = [
    { dep: "07:30", arr: "11:30", dur: "4h 00m" },
    { dep: "09:00", arr: "13:15", dur: "4h 15m" },
    { dep: "13:00", arr: "17:00", dur: "4h 00m" },
    { dep: "15:30", arr: "19:45", dur: "4h 15m" }
  ];

  let trips: Trip[] = [];
  let idCounter = 1;
  const dateStr = date ? date.replace(/-/g, '') : '20240101';

  agencies.forEach((agency, index) => {
    times.forEach((time, timeIndex) => {
       trips.push({
         id: parseInt(`${dateStr}${index}${timeIndex}${idCounter++}`),
         agencyName: agency.name,
         agencyLogo: agency.logo,
         departureTime: time.dep,
         departureLocation: getStationName(from, agency.name),
         arrivalTime: time.arr,
         arrivalLocation: getStationName(to, agency.name),
         duration: time.dur,
         price: agency.price,
         currency: "FCFA",
         amenities: agency.amenities,
         color: agency.color,
         date: date || new Date().toISOString().split('T')[0]
       });
    });
  });

  return trips;
};

const SearchResultsPage: React.FC = () => {
  const { t } = useLanguage();
  const { searchParams, navigateTo, setBookingDetails } = useNavigation();
  const [sortOption, setSortOption] = useState<'price' | 'time' | 'duration'>('time');
  
  // Filter State
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedTimes, setSelectedTimes] = useState<string[]>([]);
  const [selectedAgencies, setSelectedAgencies] = useState<string[]>([]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);

  // Selection State
  const [selectedOutbound, setSelectedOutbound] = useState<Trip | null>(null);
  const [selectedReturn, setSelectedReturn] = useState<Trip | null>(null);

  // Map Modal State
  const [mapStation, setMapStation] = useState<{name: string, lat: number, lng: number, address: string} | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  // Effect for Map Initialization
  useEffect(() => {
    if (mapStation && mapRef.current) {
        if (typeof L === 'undefined') return;

        // Cleanup existing map
        if (mapInstanceRef.current) {
            mapInstanceRef.current.remove();
            mapInstanceRef.current = null;
        }

        const map = L.map(mapRef.current).setView([mapStation.lat, mapStation.lng], 15);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);

        L.marker([mapStation.lat, mapStation.lng])
            .addTo(map)
            .bindPopup(`<b>${mapStation.name}</b><br>${mapStation.address}`)
            .openPopup();

        mapInstanceRef.current = map;
    }

    return () => {
        if (mapInstanceRef.current) {
            mapInstanceRef.current.remove();
            mapInstanceRef.current = null;
        }
    };
  }, [mapStation]);

  if (!searchParams) {
    setTimeout(() => navigateTo('home'), 100);
    return null;
  }

  // Determine Current Step
  const isRoundTrip = searchParams.tripType === 'round-trip';
  let currentStep: 'outbound' | 'return' | 'summary' = 'outbound';

  if (selectedOutbound) {
    if (isRoundTrip && !selectedReturn) {
      currentStep = 'return';
    } else {
      currentStep = 'summary';
    }
  }

  // Determine trips to display
  let initialTrips: Trip[] = [];
  let stepTitle = "";
  let routeFrom = "";
  let routeTo = "";
  let routeDate = "";

  if (currentStep === 'outbound') {
    initialTrips = generateTrips(searchParams.from, searchParams.to, searchParams.date);
    stepTitle = t('results.step.outbound');
    routeFrom = searchParams.from;
    routeTo = searchParams.to;
    routeDate = searchParams.date;
  } else if (currentStep === 'return') {
    const returnDateStr = searchParams.returnDate || searchParams.date;
    const allReturnTrips = generateTrips(searchParams.to, searchParams.from, returnDateStr);

    if (selectedOutbound) {
      initialTrips = allReturnTrips.filter(trip => 
        trip.agencyName === selectedOutbound.agencyName
      );
      if (initialTrips.length === 0) initialTrips = allReturnTrips;
    } else {
      initialTrips = allReturnTrips;
    }

    stepTitle = t('results.step.return');
    routeFrom = searchParams.to;
    routeTo = searchParams.from;
    routeDate = returnDateStr;
  }

  // Extract unique filter options
  const availableAgencies = useMemo(() => Array.from(new Set(initialTrips.map(t => t.agencyName))), [initialTrips]);
  const availableAmenities = useMemo(() => Array.from(new Set(initialTrips.flatMap(t => t.amenities))), [initialTrips]);

  // Filter Logic
  const filteredTrips = useMemo(() => {
    return initialTrips.filter(trip => {
      if (selectedAgencies.length > 0 && !selectedAgencies.includes(trip.agencyName)) return false;
      if (selectedAmenities.length > 0) {
        const hasAllAmenities = selectedAmenities.every(a => trip.amenities.includes(a));
        if (!hasAllAmenities) return false;
      }
      if (selectedTimes.length > 0) {
        const hour = parseInt(trip.departureTime.split(':')[0]);
        let period = '';
        if (hour >= 6 && hour < 12) period = 'morning';
        else if (hour >= 12 && hour < 18) period = 'afternoon';
        else period = 'evening';
        if (!selectedTimes.includes(period)) return false;
      }
      return true;
    });
  }, [initialTrips, selectedAgencies, selectedAmenities, selectedTimes]);

  const sortedTrips = [...filteredTrips].sort((a, b) => {
    if (sortOption === 'price') return a.price - b.price;
    if (sortOption === 'time') return a.departureTime.localeCompare(b.departureTime);
    if (sortOption === 'duration') return a.duration.localeCompare(b.duration);
    return 0;
  });

  const handleTripSelect = (trip: Trip) => {
    window.scrollTo(0, 0);
    clearFilters();
    if (currentStep === 'outbound') setSelectedOutbound(trip);
    else if (currentStep === 'return') setSelectedReturn(trip);
  };

  const handleFilterChange = (type: 'time' | 'agency' | 'amenity', value: string) => {
    const updateList = (prev: string[]) => {
      if (prev.includes(value)) return prev.filter(item => item !== value);
      return [...prev, value];
    };
    if (type === 'time') setSelectedTimes(prev => updateList(prev));
    if (type === 'agency') setSelectedAgencies(prev => updateList(prev));
    if (type === 'amenity') setSelectedAmenities(prev => updateList(prev));
  };

  const clearFilters = () => {
    setSelectedTimes([]);
    setSelectedAgencies([]);
    setSelectedAmenities([]);
  };
  
  const handleProceedToCheckout = () => {
      if (!selectedOutbound) return;
      const totalPassengers = searchParams.passengers.adults + searchParams.passengers.children;
      const outboundTotal = selectedOutbound.price * totalPassengers;
      const returnTotal = selectedReturn ? selectedReturn.price * totalPassengers : 0;
      const grandTotal = outboundTotal + returnTotal;

      setBookingDetails({
          outbound: selectedOutbound,
          returnTrip: selectedReturn,
          totalPrice: grandTotal,
          passengers: searchParams.passengers
      });
      navigateTo('checkout');
  };

  const openMapForStation = (e: React.MouseEvent, stationName: string) => {
    e.stopPropagation();
    const location = stationLocations[stationName];
    if (location) {
        setMapStation({
            name: stationName,
            lat: location.lat,
            lng: location.lng,
            address: location.address
        });
    } else {
        // Fallback or alert if coordinates missing
        alert("Carte non disponible pour cette gare.");
    }
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

  const getAmenityName = (type: string) => t(`amenity.${type}`);

  const formatDate = (dateString: string) => {
      try {
        const date = new Date(dateString);
        return date.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
      } catch (e) {
        return dateString;
      }
  };

  const renderTripCard = (trip: Trip, isSummary = false) => (
    <div key={trip.id} className={`bg-white dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm ${!isSummary ? 'hover:shadow-md transition-shadow' : ''} overflow-hidden flex flex-col md:flex-row mb-4 animate-fadeIn`}>
        {/* Left: Agency Info */}
        <div className="p-4 md:w-1/4 flex flex-row md:flex-col items-center gap-3 border-b md:border-b-0 md:border-r border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-black/10">
            <div className={`size-10 md:size-12 rounded-full ${trip.color} flex items-center justify-center text-white`}>
                  <span className="material-symbols-outlined text-xl">{trip.agencyLogo}</span>
            </div>
            <div className="text-left md:text-center">
                <h3 className="font-bold text-text-main dark:text-white">{trip.agencyName}</h3>
                {isSummary && <div className="text-xs text-text-muted mt-1">{formatDate(trip.date)}</div>}
            </div>
        </div>

        {/* Middle: Trip Details */}
        <div className="p-4 md:w-1/2 flex flex-col justify-center">
            <div className="flex items-center justify-between gap-4 mb-4">
                <div className="text-center w-1/3 group relative">
                    <div className="text-2xl font-black text-text-main dark:text-white">{trip.departureTime}</div>
                    <div className="flex items-center justify-center gap-1 text-xs text-text-muted cursor-pointer hover:text-primary transition-colors"
                         onClick={(e) => openMapForStation(e, trip.departureLocation)}>
                         <span className="truncate max-w-full" title={trip.departureLocation}>{trip.departureLocation}</span>
                         <span className="material-symbols-outlined text-sm">map</span>
                    </div>
                </div>
                <div className="flex-1 flex flex-col items-center">
                    <div className="text-xs text-text-muted mb-1">{trip.duration}</div>
                    <div className="w-full h-px bg-gray-300 dark:bg-gray-600 relative">
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 size-2 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 size-2 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                    </div>
                </div>
                <div className="text-center w-1/3">
                    <div className="text-2xl font-black text-text-main dark:text-white">{trip.arrivalTime}</div>
                    <div className="text-xs text-text-muted truncate max-w-full" title={trip.arrivalLocation}>{trip.arrivalLocation}</div>
                </div>
            </div>
            
            {/* Amenities */}
            {!isSummary && (
              <div className="flex items-center justify-center md:justify-start gap-3 mt-2">
                    {trip.amenities.map(amenity => (
                        <div key={amenity} className="group relative">
                          <span className="material-symbols-outlined text-gray-400 text-[18px] hover:text-primary cursor-help">
                              {getAmenityIcon(amenity)}
                          </span>
                          <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-gray-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                              {getAmenityName(amenity)}
                          </span>
                        </div>
                    ))}
              </div>
            )}
        </div>

        {/* Right: Price & CTA */}
        <div className="p-4 md:w-1/4 flex flex-row md:flex-col items-center justify-between md:justify-center gap-2 bg-gray-50/30 dark:bg-white/5 border-t md:border-t-0 md:border-l border-gray-100 dark:border-gray-800">
            <div className="text-right md:text-center">
                <div className="text-xl font-black text-primary">{trip.price.toLocaleString()} {trip.currency}</div>
                <div className="text-[10px] text-text-muted uppercase">{t('results.per_person')}</div>
            </div>
            {!isSummary && (
              <button 
                onClick={() => handleTripSelect(trip)}
                className="px-6 py-2 bg-text-main dark:bg-white text-white dark:text-black rounded-lg font-bold text-sm hover:opacity-90 transition-opacity"
              >
                  {t('results.select')}
              </button>
            )}
        </div>
    </div>
  );

  // VIEW: SUMMARY
  if (currentStep === 'summary') {
    const totalPassengers = searchParams.passengers.adults + searchParams.passengers.children;
    const outboundTotal = selectedOutbound ? selectedOutbound.price * totalPassengers : 0;
    const returnTotal = selectedReturn ? selectedReturn.price * totalPassengers : 0;
    const grandTotal = outboundTotal + returnTotal;

    return (
      <div className="bg-background-light dark:bg-background-dark min-h-screen pb-20 pt-8 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-black text-text-main dark:text-white mb-8 text-center">{t('results.summary.title')}</h1>
          
          <div className="flex flex-col gap-8">
            <div>
              <div className="flex items-center gap-2 mb-2 text-text-muted font-bold text-sm uppercase tracking-wide">
                <span className="material-symbols-outlined text-lg">flight_takeoff</span>
                {t('results.summary.outbound')}
              </div>
              {selectedOutbound && renderTripCard(selectedOutbound, true)}
            </div>

            {selectedReturn && (
              <div>
                <div className="flex items-center gap-2 mb-2 text-text-muted font-bold text-sm uppercase tracking-wide">
                  <span className="material-symbols-outlined text-lg">flight_land</span>
                  {t('results.summary.return')}
                </div>
                {renderTripCard(selectedReturn, true)}
              </div>
            )}

            <div className="bg-white dark:bg-surface-dark rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-800 flex flex-col md:flex-row items-center justify-between gap-6">
               <div className="text-center md:text-left">
                  <div className="text-sm text-text-muted mb-1">{t('results.summary.total')} ({totalPassengers} passengers)</div>
                  <div className="text-4xl font-black text-primary">{grandTotal.toLocaleString()} FCFA</div>
               </div>
               <button 
                 onClick={handleProceedToCheckout}
                 className="w-full md:w-auto px-8 py-4 bg-primary text-text-main font-bold text-lg rounded-xl hover:bg-[#0fd651] shadow-lg hover:shadow-xl transition-all"
               >
                  {t('results.summary.checkout')}
               </button>
            </div>

            <button onClick={() => navigateTo('home')} className="text-text-muted hover:text-text-main text-sm font-medium text-center mt-4">
               {t('results.edit_search')}
            </button>
          </div>
        </div>
        
        {/* Map Modal (Shared for Summary view too if needed, though buttons hidden in summary usually) */}
        {mapStation && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
                <div className="bg-white dark:bg-surface-dark w-full max-w-3xl rounded-2xl overflow-hidden shadow-2xl relative">
                    <div className="p-4 flex justify-between items-center border-b border-gray-100 dark:border-gray-800">
                        <div>
                            <h3 className="font-bold text-lg text-text-main dark:text-white">{mapStation.name}</h3>
                            <p className="text-xs text-text-muted">{mapStation.address}</p>
                        </div>
                        <button onClick={() => setMapStation(null)} className="size-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-red-100 hover:text-red-500 transition-colors">
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>
                    <div className="h-[400px] w-full bg-gray-100 relative">
                        <div ref={mapRef} className="absolute inset-0 z-0" />
                    </div>
                </div>
            </div>
        )}
      </div>
    );
  }

  // Filter Sidebar Component
  const FilterSidebar = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
         <h3 className="text-lg font-bold text-text-main dark:text-white">{t('results.filter.title')}</h3>
         {(selectedTimes.length > 0 || selectedAgencies.length > 0 || selectedAmenities.length > 0) && (
           <button onClick={clearFilters} className="text-xs text-primary font-bold hover:underline">
             {t('results.filter.clear')}
           </button>
         )}
      </div>

      <div>
        <h4 className="text-xs font-bold text-text-muted uppercase mb-3">{t('results.filter.departure_time')}</h4>
        <div className="space-y-2">
          {['morning', 'afternoon', 'evening'].map(period => (
            <label key={period} className="flex items-center gap-3 cursor-pointer group">
              <div className="relative flex items-center">
                <input 
                  type="checkbox" 
                  checked={selectedTimes.includes(period)}
                  onChange={() => handleFilterChange('time', period)}
                  className="peer size-4 border-2 border-gray-300 dark:border-gray-600 rounded checked:bg-primary checked:border-primary transition-all appearance-none cursor-pointer"
                />
                <span className="absolute inset-0 text-white material-symbols-outlined text-[12px] flex items-center justify-center opacity-0 peer-checked:opacity-100 pointer-events-none">check</span>
              </div>
              <span className={`text-sm ${selectedTimes.includes(period) ? 'font-medium text-text-main dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                {t(`results.filter.${period}`)}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="w-full h-px bg-gray-100 dark:bg-gray-800"></div>

      <div>
        <h4 className="text-xs font-bold text-text-muted uppercase mb-3">{t('results.filter.agencies')}</h4>
        <div className="space-y-2">
          {availableAgencies.map(agency => (
             <label key={agency} className="flex items-center gap-3 cursor-pointer group">
               <div className="relative flex items-center">
                <input 
                  type="checkbox" 
                  checked={selectedAgencies.includes(agency)}
                  onChange={() => handleFilterChange('agency', agency)}
                  className="peer size-4 border-2 border-gray-300 dark:border-gray-600 rounded checked:bg-primary checked:border-primary transition-all appearance-none cursor-pointer"
                />
                <span className="absolute inset-0 text-white material-symbols-outlined text-[12px] flex items-center justify-center opacity-0 peer-checked:opacity-100 pointer-events-none">check</span>
              </div>
               <span className={`text-sm ${selectedAgencies.includes(agency) ? 'font-medium text-text-main dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                 {agency}
               </span>
             </label>
          ))}
        </div>
      </div>

      <div className="w-full h-px bg-gray-100 dark:bg-gray-800"></div>

      <div>
        <h4 className="text-xs font-bold text-text-muted uppercase mb-3">{t('results.filter.amenities')}</h4>
        <div className="space-y-2">
          {availableAmenities.map(amenity => (
             <label key={amenity} className="flex items-center gap-3 cursor-pointer group">
               <div className="relative flex items-center">
                <input 
                  type="checkbox" 
                  checked={selectedAmenities.includes(amenity)}
                  onChange={() => handleFilterChange('amenity', amenity)}
                  className="peer size-4 border-2 border-gray-300 dark:border-gray-600 rounded checked:bg-primary checked:border-primary transition-all appearance-none cursor-pointer"
                />
                <span className="absolute inset-0 text-white material-symbols-outlined text-[12px] flex items-center justify-center opacity-0 peer-checked:opacity-100 pointer-events-none">check</span>
              </div>
               <span className={`text-sm ${selectedAmenities.includes(amenity) ? 'font-medium text-text-main dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                 {getAmenityName(amenity)}
               </span>
             </label>
          ))}
        </div>
      </div>

      <div className="lg:hidden pt-4">
        <button 
          onClick={() => setIsFilterOpen(false)}
          className="w-full py-3 bg-primary text-text-main font-bold rounded-lg"
        >
          {t('results.filter.apply')}
        </button>
      </div>
    </div>
  );

  // VIEW: LIST (Outbound or Return)
  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen pb-20">
      
      {/* Search Summary Header */}
      <div className="bg-surface-light dark:bg-surface-dark border-b border-gray-200 dark:border-gray-800 shadow-sm sticky top-[72px] z-30">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
             <div className="flex flex-col">
                <div className="flex items-center gap-2 text-sm font-bold text-primary uppercase tracking-wider mb-1">
                    {stepTitle}
                </div>
                <div className="flex items-center gap-2 text-text-main dark:text-white font-bold text-lg">
                    <span>{routeFrom}</span>
                    <span className="material-symbols-outlined text-text-muted">arrow_forward</span>
                    <span>{routeTo}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-text-muted mt-1">
                    <span>{formatDate(routeDate)}</span>
                    <span>•</span>
                    <span>{searchParams.passengers.adults + searchParams.passengers.children} {t('search.label.passengers')}</span>
                </div>
             </div>
          </div>
          <button 
            onClick={() => navigateTo('home')}
            className="text-text-muted hover:text-primary font-bold text-sm hover:underline"
          >
            {t('results.edit_search')}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Mobile Filter Toggle */}
        <div className="lg:hidden flex gap-4 mb-4">
           <button 
             onClick={() => setIsFilterOpen(true)}
             className="flex-1 py-3 bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-lg font-bold text-text-main dark:text-white flex items-center justify-center gap-2 shadow-sm"
           >
             <span className="material-symbols-outlined">tune</span>
             {t('results.filter.open')}
             {(selectedTimes.length > 0 || selectedAgencies.length > 0 || selectedAmenities.length > 0) && (
               <span className="size-2 rounded-full bg-primary"></span>
             )}
           </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
            
            {/* Sidebar Filters (Desktop) */}
            <div className="hidden lg:block w-64 flex-shrink-0">
               <div className="bg-white dark:bg-surface-dark p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm sticky top-48">
                  <FilterSidebar />
               </div>
            </div>

            {/* Results Column */}
            <div className="flex-1">
                {/* Filter & Sort Bar */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-text-main dark:text-white">
                        {sortedTrips.length} {t('results.found')}
                    </h2>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-text-muted hidden sm:inline">{t('results.sort_by')}:</span>
                        <select 
                            value={sortOption}
                            onChange={(e) => setSortOption(e.target.value as any)}
                            className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-lg text-sm px-3 py-2 text-text-main dark:text-white focus:ring-2 focus:ring-primary outline-none"
                        >
                            <option value="time">{t('results.sort.departure')}</option>
                            <option value="price">{t('results.sort.price')}</option>
                            <option value="duration">{t('results.sort.duration')}</option>
                        </select>
                    </div>
                </div>

                {/* Results List */}
                <div className="flex flex-col">
                    {sortedTrips.length > 0 ? (
                        sortedTrips.map(trip => renderTripCard(trip))
                    ) : (
                        <div className="text-center py-12 bg-white dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-gray-800">
                           <div className="material-symbols-outlined text-6xl text-gray-300 dark:text-gray-700 mb-4">search_off</div>
                           <h3 className="text-xl font-bold text-text-main dark:text-white mb-2">No trips found</h3>
                           <p className="text-text-muted mb-4">
                              Try adjusting your filters or search criteria.
                           </p>
                           <button onClick={clearFilters} className="text-primary font-bold hover:underline">
                             {t('results.filter.clear')}
                           </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>

      {/* Map Modal */}
      {mapStation && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white dark:bg-surface-dark w-full max-w-3xl rounded-2xl overflow-hidden shadow-2xl relative">
                <div className="p-4 flex justify-between items-center border-b border-gray-100 dark:border-gray-800">
                    <div>
                        <h3 className="font-bold text-lg text-text-main dark:text-white">{mapStation.name}</h3>
                        <p className="text-xs text-text-muted">{mapStation.address}</p>
                    </div>
                    <button onClick={() => setMapStation(null)} className="size-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-red-100 hover:text-red-500 transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>
                <div className="h-[400px] w-full bg-gray-100 relative">
                    <div ref={mapRef} className="absolute inset-0 z-0" />
                </div>
            </div>
        </div>
      )}

      {/* Mobile Filter Modal */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn">
           <div className="w-full sm:w-[400px] bg-white dark:bg-surface-dark rounded-t-2xl sm:rounded-2xl p-6 max-h-[85vh] overflow-y-auto shadow-2xl animate-slideUp">
              <div className="flex items-center justify-between mb-6">
                 <h3 className="text-xl font-bold text-text-main dark:text-white">{t('results.filter.title')}</h3>
                 <button onClick={() => setIsFilterOpen(false)} className="size-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <span className="material-symbols-outlined">close</span>
                 </button>
              </div>
              <FilterSidebar />
           </div>
        </div>
      )}
    </div>
  );
};

export default SearchResultsPage;