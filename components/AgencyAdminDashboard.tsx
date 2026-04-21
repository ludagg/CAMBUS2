'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigation } from '../contexts/NavigationContext';

interface Departure {
  id: string;
  departureAt: string;
  arrivalAt: string;
  priceCents: number;
  seatsAvailable: number;
  seatsTotal: number;
  route: {
    originCity: { name: string };
    destinationCity: { name: string };
  };
  vehicle?: { plate: string; model: string; capacity: number } | null;
}

interface Vehicle {
  id: string;
  plate: string;
  model: string;
  capacity: number;
  amenities: string[];
}

interface Agency {
  id: string;
  name: string;
  company: { name: string; brandColor: string };
  city: { name: string };
  stations: { id: string; name: string }[];
}

const AgencyAdminDashboard: React.FC = () => {
  const { user, logout } = useNavigation();
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [activeAgencyId, setActiveAgencyId] = useState<string | null>(null);
  const [departures, setDepartures] = useState<Departure[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'departures' | 'vehicles'>('departures');

  useEffect(() => {
    const init = async () => {
      try {
        const url = user?.companyId ? `/api/agencies?companyId=${user.companyId}` : '/api/agencies';
        const res = await fetch(url);
        const json = await res.json();
        const list: Agency[] = json.data ?? [];
        setAgencies(list);
        const selected = user?.agencyId ?? list[0]?.id ?? null;
        setActiveAgencyId(selected);
      } catch (e) {
        console.error(e);
      }
    };
    init();
  }, [user?.agencyId, user?.companyId]);

  useEffect(() => {
    if (!activeAgencyId) return;
    setIsLoading(true);
    Promise.all([
      fetch(`/api/agencies/${activeAgencyId}/departures`).then((r) => r.json()),
      fetch(`/api/agencies/${activeAgencyId}/vehicles`).then((r) => r.json()),
    ])
      .then(([dep, veh]) => {
        setDepartures(dep.data ?? []);
        setVehicles(veh.data ?? []);
      })
      .finally(() => setIsLoading(false));
  }, [activeAgencyId]);

  const activeAgency = useMemo(() => agencies.find((a) => a.id === activeAgencyId), [agencies, activeAgencyId]);

  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen">
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="text-[10px] font-black tracking-widest uppercase opacity-80">Agency Admin</div>
            <h1 className="text-3xl font-black">{activeAgency?.name ?? 'Mon agence'}</h1>
            <p className="opacity-80 text-sm mt-1">{activeAgency?.company.name} • {activeAgency?.city.name}</p>
          </div>
          <button onClick={logout} className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 font-black text-sm">Déconnexion</button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {agencies.length > 1 && !user?.agencyId && (
          <div className="mb-6 flex flex-wrap gap-2">
            {agencies.map((a) => (
              <button
                key={a.id}
                onClick={() => setActiveAgencyId(a.id)}
                className={`px-4 py-2 rounded-lg text-sm font-black ${
                  activeAgencyId === a.id ? 'bg-primary text-text-main' : 'bg-white dark:bg-surface-dark border border-gray-100 dark:border-gray-800 text-text-muted hover:bg-gray-100'
                }`}
              >
                {a.name}
              </button>
            ))}
          </div>
        )}

        <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-800">
          {(['departures', 'vehicles'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-4 py-2 font-black text-sm capitalize ${
                activeTab === t ? 'text-primary border-b-2 border-primary' : 'text-text-muted'
              }`}
            >
              {t === 'departures' ? 'Départs' : 'Véhicules'}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="text-center py-16"><span className="material-symbols-outlined animate-spin text-5xl text-primary">progress_activity</span></div>
        ) : activeTab === 'departures' ? (
          <div className="space-y-3">
            {departures.map((d) => (
              <div key={d.id} className="bg-white dark:bg-surface-dark rounded-xl border border-gray-100 dark:border-gray-800 p-4 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-6">
                  <div>
                    <div className="text-lg font-black text-text-main dark:text-white">{new Date(d.departureAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>
                    <div className="text-xs text-text-muted">{new Date(d.departureAt).toLocaleDateString('fr-FR')}</div>
                  </div>
                  <div>
                    <div className="font-black text-text-main dark:text-white">{d.route.originCity.name} → {d.route.destinationCity.name}</div>
                    {d.vehicle && <div className="text-xs text-text-muted">{d.vehicle.plate} • {d.vehicle.model}</div>}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-xs font-black">
                    <span className={d.seatsAvailable < 10 ? 'text-orange-600' : 'text-green-600'}>{d.seatsAvailable}</span>
                    <span className="text-text-muted">/{d.seatsTotal} places</span>
                  </div>
                  <div className="font-black text-primary">{d.priceCents.toLocaleString()} XAF</div>
                </div>
              </div>
            ))}
            {departures.length === 0 && <p className="text-text-muted text-center py-10">Aucun départ programmé.</p>}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-3">
            {vehicles.map((v) => (
              <div key={v.id} className="bg-white dark:bg-surface-dark rounded-xl border border-gray-100 dark:border-gray-800 p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center"><span className="material-symbols-outlined">directions_bus</span></div>
                  <div>
                    <div className="font-black text-text-main dark:text-white">{v.plate}</div>
                    <div className="text-xs text-text-muted">{v.model} • {v.capacity} places</div>
                  </div>
                </div>
                {v.amenities.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {v.amenities.map((a) => (
                      <span key={a} className="text-[10px] font-black px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-text-muted rounded-full uppercase">{a}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {vehicles.length === 0 && <p className="text-text-muted text-center py-10 col-span-2">Aucun véhicule enregistré.</p>}
          </div>
        )}
      </div>
    </div>
  );
};

export default AgencyAdminDashboard;
