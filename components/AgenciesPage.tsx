
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

// Types pour Leaflet
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
    image: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80&w=800",
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
    image: "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&q=80&w=800",
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
    image: "https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&q=80&w=800",
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
    image: "https://images.unsplash.com/photo-1541888946425-d81bb19480c5?auto=format&fit=crop&q=80&w=800",
    stations: [
      { id: 401, name: "Royal Nord Garoua", address: "Plateau, Garoua", lat: 9.3000, lng: 13.4000 },
      { id: 402, name: "Maroua Center", address: "Pont Vert, Maroua", lat: 10.5912, lng: 14.3159 },
      { id: 403, name: "Ngaoundéré Gare", address: "Rail Station, Ngaoundéré", lat: 7.3190, lng: 13.5765 }
    ]
  }
];

const AgenciesPage: React.FC = () => {
  const { t } = useLanguage();
  const [selectedAgencyId, setSelectedAgencyId] = useState<number | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  // Initialisation de la carte globale
  useEffect(() => {
    if (mapContainerRef.current && typeof L !== 'undefined') {
      if (!mapInstanceRef.current) {
        // Coordonnées centrales approximatives du Cameroun
        const map = L.map(mapContainerRef.current, {
          zoomControl: false,
          scrollWheelZoom: true
        }).setView([7.3697, 12.3547], 6);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);

        L.control.zoom({ position: 'bottomright' }).addTo(map);
        mapInstanceRef.current = map;
      }

      // Nettoyer les anciens marqueurs
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];

      // Ajouter tous les marqueurs de toutes les agences
      const allBounds: any[] = [];
      agenciesData.forEach(agency => {
        agency.stations.forEach(station => {
          const marker = L.circleMarker([station.lat, station.lng], {
            radius: 8,
            fillColor: agency.colorHex,
            color: '#fff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.9
          }).addTo(mapInstanceRef.current);

          marker.bindPopup(`
            <div class="p-2 font-display">
              <div class="text-[10px] font-black uppercase text-gray-500 mb-1">${agency.name}</div>
              <div class="font-bold text-sm text-gray-900">${station.name}</div>
              <div class="text-[10px] text-gray-400 mt-1">${station.address}</div>
            </div>
          `);

          markersRef.current.push(marker);
          allBounds.push([station.lat, station.lng]);
        });
      });

      if (allBounds.length > 0 && !selectedAgencyId) {
        mapInstanceRef.current.fitBounds(allBounds, { padding: [50, 50] });
      }
    }

    return () => {
      // Pas de suppression systématique ici pour garder l'instance vivante lors des re-renders UI simples
    };
  }, []);

  // Centrer sur une agence spécifique quand elle est sélectionnée
  useEffect(() => {
    if (selectedAgencyId && mapInstanceRef.current) {
      const agency = agenciesData.find(a => a.id === selectedAgencyId);
      if (agency && agency.stations.length > 0) {
        const bounds = agency.stations.map(s => [s.lat, s.lng]);
        mapInstanceRef.current.flyToBounds(bounds, { 
          padding: [100, 100],
          duration: 1.5
        });
      }
    } else if (!selectedAgencyId && mapInstanceRef.current) {
      const allBounds = agenciesData.flatMap(a => a.stations.map(s => [s.lat, s.lng]));
      if (allBounds.length > 0) {
        mapInstanceRef.current.flyToBounds(allBounds, { padding: [50, 50] });
      }
    }
  }, [selectedAgencyId]);

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-72px)] bg-background-light dark:bg-background-dark overflow-hidden font-display">
      
      {/* Colonne Gauche: Liste des Agences */}
      <div className="w-full lg:w-[450px] flex flex-col border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-surface-dark z-10 shadow-xl overflow-y-auto custom-scrollbar">
        <div className="p-8">
          <h1 className="text-3xl font-black text-text-main dark:text-white mb-2 tracking-tight">
            {t('agencies.title')}
          </h1>
          <p className="text-sm text-text-muted dark:text-gray-400 mb-8 leading-relaxed">
            {t('agencies.subtitle')}
          </p>

          <div className="space-y-6">
            {agenciesData.map((agency) => (
              <div 
                key={agency.id}
                onMouseEnter={() => setSelectedAgencyId(agency.id)}
                onMouseLeave={() => setSelectedAgencyId(null)}
                className={`group relative bg-gray-50 dark:bg-black/20 rounded-[2rem] border-2 transition-all cursor-pointer overflow-hidden ${
                  selectedAgencyId === agency.id 
                  ? 'border-primary shadow-2xl scale-[1.02]' 
                  : 'border-transparent hover:border-gray-200 dark:hover:border-gray-700'
                }`}
              >
                {/* Image de fond avec overlay */}
                <div className="h-32 w-full overflow-hidden relative">
                   <img src={agency.image} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" alt={agency.name} />
                   <div className={`absolute inset-0 opacity-40 ${agency.color}`}></div>
                   <div className="absolute top-4 right-4 bg-white/90 dark:bg-black/90 px-3 py-1 rounded-full flex items-center gap-1 shadow-lg">
                      <span className="material-symbols-outlined text-sm text-yellow-500 fill-1">star</span>
                      <span className="text-[10px] font-black">{agency.rating}</span>
                   </div>
                </div>

                <div className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`size-12 rounded-2xl ${agency.color} flex items-center justify-center text-white shadow-xl rotate-3 group-hover:rotate-0 transition-transform`}>
                      <span className="material-symbols-outlined text-2xl">{agency.logo}</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-text-main dark:text-white">{agency.name}</h3>
                      <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Membre depuis {agency.since}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-6">
                    <div className="flex -space-x-2">
                       {agency.stations.slice(0, 3).map((s, i) => (
                         <div key={i} className="size-8 rounded-full border-2 border-white dark:border-gray-900 bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-[10px] font-black text-gray-400" title={s.name}>
                            {s.name.charAt(0)}
                         </div>
                       ))}
                       {agency.stations.length > 3 && (
                         <div className="size-8 rounded-full border-2 border-white dark:border-gray-900 bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-[8px] font-black">
                            +{agency.stations.length - 3}
                         </div>
                       )}
                    </div>
                    
                    <button 
                      className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                        selectedAgencyId === agency.id 
                        ? 'bg-primary text-text-main shadow-lg shadow-primary/30' 
                        : 'bg-white dark:bg-gray-800 text-gray-500 border border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      {t('agencies.view_profile')}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-auto p-8 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-black/10">
           <div className="flex items-center gap-4">
              <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                 <span className="material-symbols-outlined">help</span>
              </div>
              <div>
                 <div className="text-xs font-black text-text-main dark:text-white">Besoin d'aide ?</div>
                 <div className="text-[10px] text-text-muted">Consultez notre guide des gares.</div>
              </div>
           </div>
        </div>
      </div>

      {/* Colonne Droite: Carte Interactive */}
      <div className="flex-1 relative bg-gray-100 dark:bg-gray-900 z-0">
        <div ref={mapContainerRef} className="absolute inset-0 z-0" />
        
        {/* Overlays sur la carte */}
        <div className="absolute top-6 left-6 z-10 flex flex-col gap-2">
           <div className="bg-white/90 dark:bg-black/90 backdrop-blur-md px-4 py-3 rounded-2xl shadow-2xl border border-white/20 flex items-center gap-3">
              <div className="size-3 rounded-full bg-primary animate-pulse"></div>
              <span className="text-[10px] font-black uppercase tracking-widest text-text-main dark:text-white">Système Live : {agenciesData.reduce((acc, a) => acc + a.stations.length, 0)} terminaux</span>
           </div>
        </div>

        {/* Legend */}
        <div className="absolute bottom-10 left-10 z-10 hidden md:block">
           <div className="bg-white/80 dark:bg-black/80 backdrop-blur-md p-6 rounded-[2rem] shadow-2xl border border-white/10">
              <div className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-4">Légende du Réseau</div>
              <div className="space-y-3">
                 {agenciesData.map(a => (
                   <div key={a.id} className="flex items-center gap-3">
                      <div className={`size-3 rounded-full ${a.color}`}></div>
                      <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{a.name}</span>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default AgenciesPage;
