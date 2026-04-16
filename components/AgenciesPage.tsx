'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { AgencyCardSkeleton } from './Skeleton';

// Defining types for typescript since we're using CDN for Leaflet
declare const L: any;

interface Station {
  id: string;
  name: string;
  address: string;
  lat: number | null;
  lng: number | null;
  city: string;
}

interface Agency {
  id: string;
  name: string;
  logo: string;
  colorHex: string;
  contactEmail: string | null;
  status: string;
  stations: Station[];
}

const AgenciesPage: React.FC = () => {
  const { t } = useLanguage();
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [selectedAgency, setSelectedAgency] = useState<Agency | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    const fetchAgencies = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/agencies');
        if (!res.ok) throw new Error('Failed to fetch agencies');
        const data = await res.json();
        setAgencies(data.agencies || []);
      } catch (err) {
        console.error('Error fetching agencies:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAgencies();
  }, []);

  // Color helper: colorHex → Tailwind-compatible inline style
  const agencyBgStyle = (agency: Agency) => ({ backgroundColor: agency.colorHex });

  // Initialize Map when an agency is selected
  useEffect(() => {
    if (selectedAgency && mapContainerRef.current) {
      if (typeof L === 'undefined') {
        console.error("Leaflet not loaded");
        return;
      }

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const stationsWithCoords = selectedAgency.stations.filter(
        (s) => s.lat != null && s.lng != null
      );

      const centerLat = stationsWithCoords.length > 0 ? stationsWithCoords[0].lat! : 4.0511;
      const centerLng = stationsWithCoords.length > 0 ? stationsWithCoords[0].lng! : 9.7679;

      const map = L.map(mapContainerRef.current).setView([centerLat, centerLng], 6);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);

      const bounds: any[] = [];
      stationsWithCoords.forEach(station => {
        const circle = L.circleMarker([station.lat, station.lng], {
          color: selectedAgency.colorHex,
          fillColor: selectedAgency.colorHex,
          fillOpacity: 0.8,
          radius: 10
        }).addTo(map);

        circle.bindPopup(`<b>${station.name}</b><br>${station.address || station.city}`);
        bounds.push([station.lat, station.lng]);
      });

      if (bounds.length > 1) {
        map.fitBounds(bounds, { padding: [50, 50] });
      }

      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [selectedAgency]);

  if (selectedAgency) {
    return (
      <div className="bg-background-light dark:bg-background-dark min-h-screen pt-6 pb-20 px-4 md:px-6 animate-fadeIn">
        <div className="max-w-7xl mx-auto">
          {/* Back Button */}
          <button 
            onClick={() => setSelectedAgency(null)}
            className="flex items-center gap-2 text-text-muted hover:text-primary transition-colors mb-6 font-bold"
          >
            <span className="material-symbols-outlined">arrow_back</span>
            {t('agencies.back')}
          </button>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left Column: Info & Stations List */}
            <div className="lg:w-1/3 flex flex-col gap-6">
              {/* Header Card */}
              <div className="bg-white dark:bg-surface-dark rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-4 mb-4">
                  <div
                    className="size-16 rounded-xl flex items-center justify-center text-white shadow-lg"
                    style={agencyBgStyle(selectedAgency)}
                  >
                    <span className="material-symbols-outlined text-3xl">{selectedAgency.logo || 'directions_bus'}</span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-text-main dark:text-white">{selectedAgency.name}</h2>
                    {selectedAgency.contactEmail && (
                      <div className="text-sm text-text-muted">{selectedAgency.contactEmail}</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Stations List */}
              <div className="bg-white dark:bg-surface-dark rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 flex-1">
                <h3 className="text-xl font-bold text-text-main dark:text-white mb-1">{t('agencies.stations')}</h3>
                <p className="text-sm text-text-muted dark:text-gray-400 mb-6">{t('agencies.stations_subtitle')}</p>
                
                {selectedAgency.stations.length === 0 ? (
                  <p className="text-sm text-text-muted italic">Aucune gare enregistrée.</p>
                ) : (
                  <div className="space-y-4">
                    {selectedAgency.stations.map((station, idx) => (
                      <div 
                        key={station.id} 
                        className="flex gap-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-[#102216] transition-colors cursor-pointer group"
                        onClick={() => {
                           if(mapInstanceRef.current && station.lat != null && station.lng != null) {
                             mapInstanceRef.current.flyTo([station.lat, station.lng], 13);
                           }
                        }}
                      >
                        <div className="flex flex-col items-center gap-1 pt-1">
                          <div className="size-3 rounded-full" style={agencyBgStyle(selectedAgency)}></div>
                          {idx !== selectedAgency.stations.length - 1 && (
                            <div className="w-0.5 h-full bg-gray-200 dark:bg-gray-700"></div>
                          )}
                        </div>
                        <div>
                          <h4 className="font-bold text-text-main dark:text-white group-hover:text-primary transition-colors">{station.name}</h4>
                          <div className="flex items-center gap-1 text-xs text-text-muted mt-0.5">
                             <span className="material-symbols-outlined text-sm">location_on</span>
                             {station.address || station.city}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Map */}
            <div className="lg:w-2/3 h-[500px] lg:h-auto min-h-[500px] bg-gray-200 dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700 relative z-0">
               <div ref={mapContainerRef} className="absolute inset-0 z-0" />
               {selectedAgency.stations.filter(s => s.lat != null).length === 0 && (
                 <div className="absolute inset-0 flex items-center justify-center text-gray-400 flex-col gap-2">
                   <span className="material-symbols-outlined text-4xl">location_off</span>
                   <p className="text-sm">Coordonnées GPS non disponibles</p>
                 </div>
               )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen pt-10 pb-20 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 pt-8">
          <h1 className="text-4xl md:text-5xl font-black text-text-main dark:text-white mb-6">
            {t('agencies.title')}
          </h1>
          <p className="text-lg text-text-muted dark:text-gray-400 max-w-2xl mx-auto">
            {t('agencies.subtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {isLoading ? (
            <>
              <AgencyCardSkeleton />
              <AgencyCardSkeleton />
              <AgencyCardSkeleton />
              <AgencyCardSkeleton />
            </>
          ) : agencies.length === 0 ? (
            <div className="col-span-3 text-center py-16 text-text-muted">
              <span className="material-symbols-outlined text-5xl mb-4 block">directions_bus</span>
              <p className="font-bold text-lg">Aucune agence disponible pour l'instant.</p>
            </div>
          ) : (
            agencies.map((agency) => (
              <div key={agency.id} className="bg-surface-light dark:bg-surface-dark rounded-2xl overflow-hidden shadow-lg border border-gray-100 dark:border-gray-800 hover:shadow-xl transition-shadow group">
                <div className="h-24 relative flex items-center justify-center" style={agencyBgStyle(agency)}>
                  <div className="absolute -bottom-10 size-20 rounded-2xl bg-white dark:bg-surface-dark p-1 shadow-md">
                     <div className="size-full rounded-xl flex items-center justify-center text-white" style={agencyBgStyle(agency)}>
                        <span className="material-symbols-outlined text-4xl">{agency.logo || 'directions_bus'}</span>
                     </div>
                  </div>
                </div>
                <div className="pt-12 pb-6 px-6 text-center">
                  <h3 className="text-2xl font-bold text-text-main dark:text-white mb-2">{agency.name}</h3>
                  
                  <div className="flex items-center justify-center gap-4 text-sm text-text-muted dark:text-gray-400 mb-6">
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-lg">location_on</span>
                      {agency.stations.length} gare{agency.stations.length !== 1 ? 's' : ''}
                    </div>
                    {agency.contactEmail && (
                      <div className="flex items-center gap-1 truncate max-w-[160px]">
                        <span className="material-symbols-outlined text-lg">mail</span>
                        <span className="truncate">{agency.contactEmail}</span>
                      </div>
                    )}
                  </div>

                  <button 
                    onClick={() => setSelectedAgency(agency)}
                    className="w-full py-3 rounded-lg border-2 border-primary text-primary font-bold hover:bg-primary hover:text-text-main transition-all"
                  >
                    {t('agencies.view_profile')}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AgenciesPage;