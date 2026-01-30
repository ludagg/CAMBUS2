import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigation, SelectedTrip } from '../contexts/NavigationContext';

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

// Generate trips dynamically ensuring station consistency
const generateTrips = (from: string, to: string, date: string): Trip[] => {
  const getStations = (agency: string) => {
    // Default configuration assuming Douala <-> Yaoundé route primary context
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
       // Offset times slightly for different agencies to make it look organic
       // (Keeping simple for now to ensure matching logic is clear)
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
  
  // Selection State
  const [selectedOutbound, setSelectedOutbound] = useState<Trip | null>(null);
  const [selectedReturn, setSelectedReturn] = useState<Trip | null>(null);

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

  // Determine trips to display based on step
  let tripsToDisplay: Trip[] = [];
  let stepTitle = "";
  let routeFrom = "";
  let routeTo = "";
  let routeDate = "";

  if (currentStep === 'outbound') {
    tripsToDisplay = generateTrips(searchParams.from, searchParams.to, searchParams.date);
    stepTitle = t('results.step.outbound');
    routeFrom = searchParams.from;
    routeTo = searchParams.to;
    routeDate = searchParams.date;
  } else if (currentStep === 'return') {
    // Return step logic
    const returnDateStr = searchParams.returnDate || searchParams.date;
    const allReturnTrips = generateTrips(searchParams.to, searchParams.from, returnDateStr);

    // Filter to match strict requirements
    if (selectedOutbound) {
      tripsToDisplay = allReturnTrips.filter(trip => 
        trip.agencyName === selectedOutbound.agencyName &&
        trip.departureLocation === selectedOutbound.arrivalLocation
      );
    } else {
      tripsToDisplay = allReturnTrips;
    }

    stepTitle = t('results.step.return');
    routeFrom = searchParams.to;
    routeTo = searchParams.from;
    routeDate = returnDateStr;
  }

  // Sort trips
  const sortedTrips = [...tripsToDisplay].sort((a, b) => {
    if (sortOption === 'price') return a.price - b.price;
    if (sortOption === 'time') return a.departureTime.localeCompare(b.departureTime);
    if (sortOption === 'duration') return a.duration.localeCompare(b.duration);
    return 0;
  });

  const handleTripSelect = (trip: Trip) => {
    window.scrollTo(0, 0);
    if (currentStep === 'outbound') {
      setSelectedOutbound(trip);
    } else if (currentStep === 'return') {
      setSelectedReturn(trip);
    }
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

  const getAmenityName = (type: string) => {
    return t(`amenity.${type}`);
  };

  const formatDate = (dateString: string) => {
      try {
        const date = new Date(dateString);
        return date.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
      } catch (e) {
        return dateString;
      }
  };

  const renderTripCard = (trip: Trip, isSummary = false) => (
    <div key={trip.id} className={`bg-white dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm ${!isSummary ? 'hover:shadow-md transition-shadow' : ''} overflow-hidden flex flex-col md:flex-row mb-4`}>
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
                <div className="text-center w-1/3">
                    <div className="text-2xl font-black text-text-main dark:text-white">{trip.departureTime}</div>
                    <div className="text-xs text-text-muted truncate max-w-full" title={trip.departureLocation}>{trip.departureLocation}</div>
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
            {/* Outbound Card */}
            <div>
              <div className="flex items-center gap-2 mb-2 text-text-muted font-bold text-sm uppercase tracking-wide">
                <span className="material-symbols-outlined text-lg">flight_takeoff</span>
                {t('results.summary.outbound')}
              </div>
              {selectedOutbound && renderTripCard(selectedOutbound, true)}
            </div>

            {/* Return Card (if applicable) */}
            {selectedReturn && (
              <div>
                <div className="flex items-center gap-2 mb-2 text-text-muted font-bold text-sm uppercase tracking-wide">
                  <span className="material-symbols-outlined text-lg">flight_land</span>
                  {t('results.summary.return')}
                </div>
                {renderTripCard(selectedReturn, true)}
              </div>
            )}

            {/* Total & Checkout */}
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
      </div>
    );
  }

  // VIEW: LIST (Outbound or Return)
  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen pb-20">
      
      {/* Search Summary Header */}
      <div className="bg-surface-light dark:bg-surface-dark border-b border-gray-200 dark:border-gray-800 shadow-sm sticky top-[72px] z-30">
        <div className="max-w-5xl mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
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
      <div className="max-w-5xl mx-auto px-4 py-8">
        
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
                <div className="text-center py-12">
                   <div className="material-symbols-outlined text-6xl text-gray-300 dark:text-gray-700 mb-4">search_off</div>
                   <h3 className="text-xl font-bold text-text-main dark:text-white mb-2">No return trips found</h3>
                   <p className="text-text-muted">
                      No trips available from the same agency and station.
                   </p>
                </div>
            )}
        </div>

      </div>
    </div>
  );
};

export default SearchResultsPage;