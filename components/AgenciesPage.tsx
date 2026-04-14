'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

// Defining types for typescript since we're using CDN for Leaflet
declare const L: any;

interface Station {
  id: number;
  name: string;
  address: string;
  lat: number;
  lng: number;
}

interface Agency {
  id: number;
  name: string;
  logo: string;
  since: string;
  rating: number;
  color: string;
  colorHex: string;
  image: string;
  stations: Station[];
}

const agenciesData: Agency[] = [
  {
    id: 1,
    name: "Express Voyage",
    logo: "directions_bus",
    since: "2010",
    rating: 4.8,
    color: "bg-blue-600",
    colorHex: "#2563eb",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuC7k0_R_QYVqz5w-0uB6j7w_1L5e_9X4nB8Y2xG_5vT1sH0rN_4zM7pL6k3oJ5iV8aU9bC2dE4fH7jI6lK9mO0pQ3rS2tU5vW8xY1aZ4bC7dE3fG9hJ2kL5mN0oP3qR6sT9uV1wX4yZ7aB8cD2eF5gH1jI4kL6mN9oP2qR5sT8uV1wX4yZ7aB8cD2eF5gH1jI4kL6mN9oP2qR5sT8uV1wX4yZ7aB8cD2eF5gH1jI4kL6mN9oP2qR5sT8uV1wX4yZ7aB8cD2eF5gH1jI4kL6mN9oP2qR5sT8uV1wX4yZ7aB8cD2eF5gH1jI4kL6mN9oP2qR5sT8uV1wX4yZ7aB8c",
    stations: [
      { id: 101, name: "Gare Centrale Douala", address: "Bd de la Liberté, Douala", lat: 4.0511, lng: 9.7679 },
      { id: 102, name: "Terminus Yaoundé", address: "Mvan, Yaoundé", lat: 3.8480, lng: 11.5021 },
      { id: 103, name: "Agence Bafoussam", address: "Carrefour Auberge, Bafoussam", lat: 5.4778, lng: 10.4176 }
    ]
  },
  {
    id: 2,
    name: "GreenLines",
    logo: "eco",
    since: "2015",
    rating: 4.9,
    color: "bg-green-600",
    colorHex: "#16a34a",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuD9yX1sV4wZ7tU0rN3qP6jM9kL2oJ5iH8aG4bC7dE1fH0jI3lK6mN9oP2qR5sT8uV1wX4yZ7aB8cD2eF5gH1jI4kL6mN9oP2qR5sT8uV1wX4yZ7aB8cD2eF5gH1jI4kL6mN9oP2qR5sT8uV1wX4yZ7aB8cD2eF5gH1jI4kL6mN9oP2qR5sT8uV1wX4yZ7aB8cD2eF5gH1jI4kL6mN9oP2qR5sT8uV1wX4yZ7aB8cD2eF5gH1jI4kL6mN9oP2qR5sT8",
    stations: [
      { id: 201, name: "Green Park Bamenda", address: "Commercial Avenue, Bamenda", lat: 5.9631, lng: 10.1591 },
      { id: 202, name: "EcoStation Buea", address: "Molyko, Buea", lat: 4.1550, lng: 9.2412 }
    ]
  },
  {
    id: 3,
    name: "CityLink",
    logo: "apartment",
    since: "2008",
    rating: 4.6,
    color: "bg-purple-600",
    colorHex: "#9333ea",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuB2vW5xZ8tU1rN4qP7jM0kL3oJ6iH9aG5bC8dE2fH1jI4lK7mN0oP3qR6sT9uV2wX5yZ8aB9cD3eF6gH2jI5kL7mN0oP3qR6sT9uV2wX5yZ8aB9cD3eF6gH2jI5kL7mN0oP3qR6sT9uV2wX5yZ8aB9cD3eF6gH2jI5kL7mN0oP3qR6sT9uV2wX5yZ8aB9cD3eF6gH2jI5kL7mN0oP3qR6sT9uV2wX5yZ8aB9cD3eF6gH2jI5kL7mN0oP3qR6sT9uV2wX5yZ8aB9",
    stations: [
      { id: 301, name: "City Center Limbe", address: "Down Beach, Limbe", lat: 4.0163, lng: 9.2195 },
      { id: 302, name: "Kribi Plage", address: "Route des Chutes, Kribi", lat: 2.9376, lng: 9.9152 },
      { id: 303, name: "Ebolowa Main", address: "Centre Ville, Ebolowa", lat: 2.9000, lng: 11.1500 }
    ]
  },
  {
    id: 4,
    name: "Royal Road",
    logo: "diamond",
    since: "2005",
    rating: 4.7,
    color: "bg-amber-600",
    colorHex: "#d97706",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuE5yX8sV1wZ4tU7rN0qP3jM6kL9oJ2iH5aG1bC4dE8fH5jI1lK4mN7oP0qR3sT6uV9wX2yZ5aB6cD9eF2gH5jI1lK4mN7oP0qR3sT6uV9wX2yZ5aB6cD9eF2gH5jI1lK4mN7oP0qR3sT6uV9wX2yZ5aB6cD9eF2gH5jI1lK4mN7oP0qR3sT6uV9wX2yZ5aB6cD9eF2gH5jI1lK4mN7oP0qR3sT6uV9wX2yZ5aB6cD9eF2gH5jI1lK4mN7oP0qR3sT6",
    stations: [
      { id: 401, name: "Royal Nord Garoua", address: "Plateau, Garoua", lat: 9.3000, lng: 13.4000 },
      { id: 402, name: "Maroua Center", address: "Pont Vert, Maroua", lat: 10.5912, lng: 14.3159 },
      { id: 403, name: "Ngaoundéré Gare", address: "Rail Station, Ngaoundéré", lat: 7.3190, lng: 13.5765 }
    ]
  }
];

const AgenciesPage: React.FC = () => {
  const { t } = useLanguage();
  const [selectedAgency, setSelectedAgency] = useState<Agency | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  // Initialize Map when an agency is selected
  useEffect(() => {
    if (selectedAgency && mapContainerRef.current) {
      if (typeof L === 'undefined') {
        console.error("Leaflet not loaded");
        return;
      }

      // If map exists, remove it to re-initialize
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      // Determine center: average of stations or first station
      const centerLat = selectedAgency.stations.length > 0 ? selectedAgency.stations[0].lat : 4.0511;
      const centerLng = selectedAgency.stations.length > 0 ? selectedAgency.stations[0].lng : 9.7679;

      const map = L.map(mapContainerRef.current).setView([centerLat, centerLng], 6);

      // Add OpenStreetMap Tile Layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);

      // Add Markers
      const bounds: any[] = [];
      selectedAgency.stations.forEach(station => {
        // Create custom circle marker
        const circle = L.circleMarker([station.lat, station.lng], {
          color: selectedAgency.colorHex,
          fillColor: selectedAgency.colorHex,
          fillOpacity: 0.8,
          radius: 10
        }).addTo(map);

        circle.bindPopup(`<b>${station.name}</b><br>${station.address}`);
        bounds.push([station.lat, station.lng]);
      });

      // Fit bounds if multiple stations
      if (bounds.length > 1) {
        map.fitBounds(bounds, { padding: [50, 50] });
      }

      mapInstanceRef.current = map;
    }

    return () => {
      // Cleanup map on unmount or agency switch
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
                  <div className={`size-16 rounded-xl ${selectedAgency.color} flex items-center justify-center text-white shadow-lg`}>
                    <span className="material-symbols-outlined text-3xl">{selectedAgency.logo}</span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-text-main dark:text-white">{selectedAgency.name}</h2>
                    <div className="flex items-center gap-2 text-sm text-text-muted">
                       <span>{t('agencies.since')} {selectedAgency.since}</span>
                       <span>•</span>
                       <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm text-yellow-500 fill-1">star</span> {selectedAgency.rating}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stations List */}
              <div className="bg-white dark:bg-surface-dark rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 flex-1">
                <h3 className="text-xl font-bold text-text-main dark:text-white mb-1">{t('agencies.stations')}</h3>
                <p className="text-sm text-text-muted dark:text-gray-400 mb-6">{t('agencies.stations_subtitle')}</p>
                
                <div className="space-y-4">
                  {selectedAgency.stations.map((station, idx) => (
                    <div 
                      key={station.id} 
                      className="flex gap-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-[#102216] transition-colors cursor-pointer group"
                      onClick={() => {
                         if(mapInstanceRef.current) {
                           mapInstanceRef.current.flyTo([station.lat, station.lng], 13);
                         }
                      }}
                    >
                      <div className="flex flex-col items-center gap-1 pt-1">
                        <div className={`size-3 rounded-full ${selectedAgency.color}`}></div>
                        {idx !== selectedAgency.stations.length - 1 && (
                          <div className="w-0.5 h-full bg-gray-200 dark:bg-gray-700"></div>
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-text-main dark:text-white group-hover:text-primary transition-colors">{station.name}</h4>
                        <div className="flex items-center gap-1 text-xs text-text-muted mt-0.5">
                           <span className="material-symbols-outlined text-sm">location_on</span>
                           {station.address}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Map */}
            <div className="lg:w-2/3 h-[500px] lg:h-auto min-h-[500px] bg-gray-200 dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700 relative z-0">
               <div ref={mapContainerRef} className="absolute inset-0 z-0" />
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
          {agenciesData.map((agency) => (
            <div key={agency.id} className="bg-surface-light dark:bg-surface-dark rounded-2xl overflow-hidden shadow-lg border border-gray-100 dark:border-gray-800 hover:shadow-xl transition-shadow group">
              <div className={`h-24 ${agency.color} relative flex items-center justify-center`}>
                <div className="absolute -bottom-10 size-20 rounded-2xl bg-white dark:bg-surface-dark p-1 shadow-md">
                   <div className={`size-full rounded-xl ${agency.color} bg-opacity-20 flex items-center justify-center text-text-main dark:text-white`}>
                      <span className="material-symbols-outlined text-4xl">{agency.logo}</span>
                   </div>
                </div>
              </div>
              <div className="pt-12 pb-6 px-6 text-center">
                <h3 className="text-2xl font-bold text-text-main dark:text-white mb-2">{agency.name}</h3>
                
                <div className="flex items-center justify-center gap-4 text-sm text-text-muted dark:text-gray-400 mb-6">
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-lg">calendar_month</span>
                    {t('agencies.since')} {agency.since}
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-lg text-yellow-500 fill-1">star</span>
                    <span className="font-bold text-text-main dark:text-white">{agency.rating}</span>
                  </div>
                </div>

                <button 
                  onClick={() => setSelectedAgency(agency)}
                  className="w-full py-3 rounded-lg border-2 border-primary text-primary font-bold hover:bg-primary hover:text-text-main transition-all"
                >
                  {t('agencies.view_profile')}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AgenciesPage;