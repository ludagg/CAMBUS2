'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigation } from '../contexts/NavigationContext';
import AdminModal from './AdminModal';
import { Field, inputCls } from './SuperAdminDashboard';
import SeatLayoutEditor from './SeatLayoutEditor';
import AnalyticsPanel from './AnalyticsPanel';
import DepartureControlPanel from './DepartureControlPanel';
import CounterSalePanel from './CounterSalePanel';
import DriverPanel from './DriverPanel';
import StationPanel from './StationPanel';
import IncidentPanel from './IncidentPanel';
import WaitlistPanel from './WaitlistPanel';
import type { SeatLayout } from '../lib/seat-layout';

interface Departure {
  id: string;
  departureAt: string;
  arrivalAt: string;
  priceCents: number;
  seatsAvailable: number;
  seatsTotal: number;
  status?: string;
  vehicleId?: string | null;
  driverId?: string | null;
  route: {
    originCity: { id?: string; name: string };
    destinationCity: { id?: string; name: string };
  };
  vehicle?: { plate: string; model: string; capacity: number } | null;
  driver?: { id: string; fullName: string } | null;
}

interface Vehicle {
  id: string;
  plate: string;
  model: string;
  capacity: number;
  amenities: string[];
  seatLayout?: SeatLayout | null;
}

interface Agency {
  id: string;
  name: string;
  companyId: string;
  company: { name: string; brandColor: string };
  city: { id: string; name: string };
  stations: { id: string; name: string; cityId: string }[];
}

interface City {
  id: string;
  name: string;
  region: string;
}

interface Station {
  id: string;
  name: string;
  city: { id: string; name: string };
  agency: { id: string; name: string };
}

const AgencyAdminDashboard: React.FC = () => {
  const { user, logout } = useNavigation();
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [activeAgencyId, setActiveAgencyId] = useState<string | null>(null);
  const [departures, setDepartures] = useState<Departure[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'departures' | 'vehicles' | 'operations' | 'counter' | 'analytics' | 'drivers' | 'stations' | 'incidents' | 'waitlist'>('departures');
  const [depModalOpen, setDepModalOpen] = useState(false);
  const [activeAgencyDetail, setActiveAgencyDetail] = useState<Agency | null>(null);
  const [layoutVehicle, setLayoutVehicle] = useState<Vehicle | null>(null);
  const [editingDeparture, setEditingDeparture] = useState<Departure | null>(null);
  const [vehicleModalOpen, setVehicleModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const url = user?.companyId ? `/api/agencies?companyId=${user.companyId}` : '/api/agencies';
        const [agRes, ciRes] = await Promise.all([
          fetch(url).then((r) => r.json()),
          fetch('/api/cities').then((r) => r.json()),
        ]);
        const list: Agency[] = agRes.data ?? [];
        setAgencies(list);
        setCities(ciRes.data ?? []);
        const selected = user?.agencyId ?? list[0]?.id ?? null;
        setActiveAgencyId(selected);
      } catch (e) {
        console.error(e);
      }
    };
    init();
  }, [user?.agencyId, user?.companyId]);

  const reload = useCallback(async () => {
    if (!activeAgencyId) return;
    setIsLoading(true);
    try {
      const [dep, veh, detail] = await Promise.all([
        fetch(`/api/agencies/${activeAgencyId}/departures`).then((r) => r.json()),
        fetch(`/api/agencies/${activeAgencyId}/vehicles`).then((r) => r.json()),
        fetch(`/api/agencies/${activeAgencyId}`).then((r) => r.json()),
      ]);
      setDepartures(dep.data ?? []);
      setVehicles(veh.data ?? []);
      setActiveAgencyDetail(detail.data ?? null);
    } finally {
      setIsLoading(false);
    }
  }, [activeAgencyId]);

  useEffect(() => { reload(); }, [reload]);

  const activeAgency = useMemo(() => agencies.find((a) => a.id === activeAgencyId), [agencies, activeAgencyId]);

  const deleteDeparture = async (id: string) => {
    if (!confirm('Désactiver ce départ ?')) return;
    await fetch(`/api/departures/${id}`, { method: 'DELETE' });
    await reload();
  };

  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen">
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-4 py-6 md:p-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="text-[10px] font-black tracking-widest uppercase opacity-80">Agency Admin</div>
            <h1 className="text-2xl md:text-3xl font-black">{activeAgency?.name ?? 'Mon agence'}</h1>
            <p className="opacity-80 text-sm mt-1">{activeAgency?.company.name} • {activeAgency?.city.name}</p>
          </div>
          <button onClick={logout} className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 font-black text-sm">Déconnexion</button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
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

         <div className="flex justify-between items-center flex-wrap gap-3 mb-4 border-b border-gray-200 dark:border-gray-800 pb-2">
           <div className="flex gap-2 overflow-x-auto">
            {(['departures', 'vehicles', 'drivers', 'stations', 'incidents', 'waitlist', 'operations', 'counter', 'analytics'] as const).map((t) => {
              const labels: Record<typeof t, string> = {
                departures: 'Départs',
                vehicles: 'Véhicules',
                drivers: 'Chauffeurs',
                stations: 'Stations',
                incidents: 'Incidents',
                waitlist: 'Liste d\'attente',
                operations: 'Opérations',
                counter: 'Guichet',
                analytics: 'Analytics',
              };
              return (
                <button
                  key={t}
                  onClick={() => setActiveTab(t)}
                  className={`px-4 py-2 font-black text-sm ${
                    activeTab === t ? 'text-primary border-b-2 border-primary' : 'text-text-muted'
                  }`}
                >
                  {labels[t]}
                </button>
              );
            })}
          </div>
          {activeTab === 'departures' && activeAgencyDetail && (
            <button onClick={() => setDepModalOpen(true)} className="mb-2 px-4 py-2 rounded-lg bg-primary text-text-main font-black text-sm flex items-center gap-2 hover:bg-[#0fd651]">
              <span className="material-symbols-outlined text-[18px]">add</span>
              Nouveau départ
            </button>
          )}
          {activeTab === 'vehicles' && activeAgencyId && (
            <button onClick={() => setVehicleModalOpen(true)} className="mb-2 px-4 py-2 rounded-lg bg-primary text-text-main font-black text-sm flex items-center gap-2 hover:bg-[#0fd651]">
              <span className="material-symbols-outlined text-[18px]">add</span>
              Nouveau véhicule
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="text-center py-16"><span className="material-symbols-outlined animate-spin text-5xl text-primary">progress_activity</span></div>
        ) : activeTab === 'departures' ? (
          <div className="space-y-3">
            {departures.map((d) => (
               <div key={d.id} className={`bg-white dark:bg-surface-dark rounded-xl border shadow-subtle p-4 flex items-center justify-between flex-wrap gap-3 ${d.status === 'INACTIVE' ? 'border-gray-300 opacity-60' : 'border-gray-100 dark:border-gray-800'}`}>
                 <div className="flex items-center gap-4 md:gap-6 flex-wrap">
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
                  <button onClick={() => setEditingDeparture(d)} className="text-text-muted hover:bg-gray-100 dark:hover:bg-gray-800 p-1 rounded" aria-label="Éditer">
                    <span className="material-symbols-outlined text-[20px]">edit</span>
                  </button>
                  <button onClick={() => deleteDeparture(d.id)} className="text-red-600 hover:text-red-800 p-1" aria-label="Désactiver">
                    <span className="material-symbols-outlined text-[20px]">delete</span>
                  </button>
                </div>
              </div>
            ))}
            {departures.length === 0 && <p className="text-text-muted text-center py-10">Aucun départ programmé.</p>}
          </div>
        ) : activeTab === 'operations' ? (
          <DepartureControlPanel />
        ) : activeTab === 'counter' ? (
          <CounterSalePanel />
        ) : activeTab === 'analytics' ? (
          <AnalyticsPanel />
        ) : activeTab === 'drivers' && activeAgencyId ? (
          <DriverPanel agencyId={activeAgencyId} />
        ) : activeTab === 'stations' && activeAgencyId ? (
          <StationPanel agencyId={activeAgencyId} cities={cities} />
        ) : activeTab === 'incidents' && activeAgencyId ? (
          <IncidentPanel agencyId={activeAgencyId} />
        ) : activeTab === 'waitlist' && activeAgencyId ? (
          <WaitlistPanel agencyId={activeAgencyId} />
        ) : (
          <div className="grid md:grid-cols-2 gap-3">
            {vehicles.map((v) => (
               <div key={v.id} className="bg-white dark:bg-surface-dark rounded-xl border border-gray-100 dark:border-gray-800 shadow-subtle p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center"><span className="material-symbols-outlined">directions_bus</span></div>
                  <div className="flex-1 min-w-0">
                    <div className="font-black text-text-main dark:text-white">{v.plate}</div>
                    <div className="text-xs text-text-muted">{v.model} • {v.capacity} places</div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => setLayoutVehicle(v)}
                      className="text-primary hover:bg-primary/10 p-2 rounded-lg"
                      aria-label="Configurer le plan"
                      title="Configurer le plan de sièges"
                    >
                      <span className="material-symbols-outlined text-[20px]">event_seat</span>
                    </button>
                    <button onClick={() => setEditingVehicle(v)} className="text-text-muted hover:bg-gray-100 dark:hover:bg-gray-800 p-2 rounded-lg" aria-label="Éditer">
                      <span className="material-symbols-outlined text-[20px]">edit</span>
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${v.seatLayout ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 dark:bg-gray-800 text-text-muted'}`}>
                    {v.seatLayout ? `Plan ${v.seatLayout.label ?? 'personnalisé'}` : 'Plan auto'}
                  </span>
                  {v.amenities.map((a) => (
                    <span key={a} className="text-[10px] font-black px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-text-muted rounded-full uppercase">{a}</span>
                  ))}
                </div>
              </div>
            ))}
            {vehicles.length === 0 && <p className="text-text-muted text-center py-10 col-span-2">Aucun véhicule enregistré.</p>}
          </div>
        )}
      </div>

      {depModalOpen && activeAgencyDetail && (
        <DepartureForm
          agency={activeAgencyDetail}
          cities={cities}
          vehicles={vehicles}
          onClose={() => setDepModalOpen(false)}
          onSaved={async () => { setDepModalOpen(false); await reload(); }}
        />
      )}
      {layoutVehicle && (
        <SeatLayoutEditor
          vehicleId={layoutVehicle.id}
          initialLayout={layoutVehicle.seatLayout ?? null}
          capacity={layoutVehicle.capacity}
          onClose={() => setLayoutVehicle(null)}
          onSaved={async () => { await reload(); }}
        />
      )}
      {editingDeparture && activeAgencyId && (
        <DepartureEditForm
          departure={editingDeparture}
          agencyId={activeAgencyId}
          vehicles={vehicles}
          onClose={() => setEditingDeparture(null)}
          onSaved={async () => { setEditingDeparture(null); await reload(); }}
        />
      )}
      {vehicleModalOpen && activeAgencyId && (
        <AgencyVehicleForm
          agencyId={activeAgencyId}
          onClose={() => setVehicleModalOpen(false)}
          onSaved={async () => { setVehicleModalOpen(false); await reload(); }}
        />
      )}
      {editingVehicle && (
        <AgencyVehicleEditForm
          vehicle={editingVehicle}
          onClose={() => setEditingVehicle(null)}
          onSaved={async () => { setEditingVehicle(null); await reload(); }}
        />
      )}
    </div>
  );
};

const DepartureForm: React.FC<{ agency: Agency; cities: City[]; vehicles: Vehicle[]; onClose: () => void; onSaved: () => void }> = ({ agency, cities, vehicles, onClose, onSaved }) => {
  const [originCityId] = useState(agency.city.id);
  const [destinationCityId, setDestinationCityId] = useState<string>(cities.find((c) => c.id !== agency.city.id)?.id ?? '');
  const [originStationId, setOriginStationId] = useState<string>(agency.stations[0]?.id ?? '');
  const [destStationId, setDestStationId] = useState<string>('');
  const [destStations, setDestStations] = useState<Station[]>([]);
  const [vehicleId, setVehicleId] = useState<string>('');
  const [dateTime, setDateTime] = useState<string>('');
  const [durationH, setDurationH] = useState<number>(4);
  const [durationM, setDurationM] = useState<number>(0);
  const [priceXAF, setPriceXAF] = useState<number>(6000);
  const [seats, setSeats] = useState<number>(30);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!destinationCityId) { setDestStations([]); return; }
    fetch(`/api/stations?cityId=${destinationCityId}`).then((r) => r.json()).then((j) => {
      const list: Station[] = j.data ?? [];
      setDestStations(list);
      setDestStationId((prev) => list.find((s) => s.id === prev) ? prev : list[0]?.id ?? '');
    });
  }, [destinationCityId]);

  useEffect(() => {
    const v = vehicles.find((x) => x.id === vehicleId);
    if (v) setSeats(v.capacity);
  }, [vehicleId, vehicles]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!destStationId) { setError('Sélectionnez une station de destination.'); return; }
    if (!dateTime) { setError('Sélectionnez une date et heure.'); return; }
    setSaving(true); setError(null);
    try {
      const res = await fetch(`/api/agencies/${agency.id}/departures`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originCityId,
          destinationCityId,
          originStationId,
          destStationId,
          vehicleId: vehicleId || undefined,
          departureAt: new Date(dateTime).toISOString(),
          durationMin: durationH * 60 + durationM,
          priceCents: priceXAF,
          seatsTotal: seats,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erreur');
      onSaved();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally { setSaving(false); }
  };

  return (
    <AdminModal title="Nouveau départ" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid md:grid-cols-2 gap-3">
          <Field label="Origine (ville)">
            <input disabled value={agency.city.name} className={inputCls + ' opacity-70 cursor-not-allowed'} />
          </Field>
          <Field label="Destination (ville)">
            <select required value={destinationCityId} onChange={(e) => setDestinationCityId(e.target.value)} className={inputCls}>
              {cities.filter((c) => c.id !== originCityId).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          <Field label="Station de départ">
            <select required value={originStationId} onChange={(e) => setOriginStationId(e.target.value)} className={inputCls}>
              {agency.stations.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </Field>
          <Field label="Station d'arrivée">
            <select required value={destStationId} onChange={(e) => setDestStationId(e.target.value)} className={inputCls}>
              {destStations.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.agency.name})</option>)}
              {destStations.length === 0 && <option value="">Aucune station disponible</option>}
            </select>
          </Field>
        </div>
        <Field label="Date & heure de départ">
          <input required type="datetime-local" value={dateTime} onChange={(e) => setDateTime(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Durée estimée">
          <div className="grid grid-cols-[1fr_auto_1fr_auto] gap-2 items-center">
            <input type="number" min={0} value={durationH} onChange={(e) => setDurationH(Number(e.target.value))} className={inputCls} />
            <span className="text-xs font-black text-text-muted">h</span>
            <input type="number" min={0} max={59} value={durationM} onChange={(e) => setDurationM(Number(e.target.value))} className={inputCls} />
            <span className="text-xs font-black text-text-muted">min</span>
          </div>
        </Field>
        <div className="grid md:grid-cols-2 gap-3">
          <Field label="Prix (XAF)">
            <input required type="number" min={100} value={priceXAF} onChange={(e) => setPriceXAF(Number(e.target.value))} className={inputCls} />
          </Field>
          <Field label="Véhicule">
            <select value={vehicleId} onChange={(e) => setVehicleId(e.target.value)} className={inputCls}>
              <option value="">— Aucun —</option>
              {vehicles.map((v) => <option key={v.id} value={v.id}>{v.plate} • {v.model}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Nombre de places">
          <input required type="number" min={1} value={seats} onChange={(e) => setSeats(Number(e.target.value))} className={inputCls} />
        </Field>
        {error && <div className="text-red-600 text-xs font-bold bg-red-50 p-2 rounded">{error}</div>}
        <div className="flex gap-2 justify-end pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-text-muted font-black text-sm">Annuler</button>
          <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-primary text-text-main font-black text-sm disabled:opacity-50">{saving ? 'Enregistrement…' : 'Créer'}</button>
        </div>
      </form>
    </AdminModal>
  );
};

interface DriverOption { id: string; fullName: string; status: string }

const DepartureEditForm: React.FC<{ departure: Departure; agencyId: string; vehicles: Vehicle[]; onClose: () => void; onSaved: () => void }> = ({ departure, agencyId, vehicles, onClose, onSaved }) => {
  const [priceCents, setPriceCents] = useState(departure.priceCents);
  const [seatsTotal, setSeatsTotal] = useState(departure.seatsTotal);
  const [vehicleId, setVehicleId] = useState<string>(departure.vehicleId ?? '');
  const [driverId, setDriverId] = useState<string>(departure.driverId ?? '');
  const [drivers, setDrivers] = useState<DriverOption[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/drivers?agencyId=${agencyId}`).then((r) => r.json()).then((j) => setDrivers(j.data ?? []));
  }, [agencyId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError(null);
    try {
      const res = await fetch(`/api/departures/${departure.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceCents,
          seatsTotal,
          vehicleId: vehicleId || null,
          driverId: driverId || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erreur');
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally { setSaving(false); }
  };

  return (
    <AdminModal title={`Éditer le départ ${departure.route.originCity.name} → ${departure.route.destinationCity.name}`} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid md:grid-cols-2 gap-3">
          <Field label="Prix (XAF)">
            <input required type="number" min={100} value={priceCents} onChange={(e) => setPriceCents(Number(e.target.value))} className={inputCls} />
          </Field>
          <Field label="Nombre de places">
            <input required type="number" min={1} value={seatsTotal} onChange={(e) => setSeatsTotal(Number(e.target.value))} className={inputCls} />
          </Field>
        </div>
        <Field label="Véhicule">
          <select value={vehicleId} onChange={(e) => setVehicleId(e.target.value)} className={inputCls}>
            <option value="">— Aucun —</option>
            {vehicles.map((v) => <option key={v.id} value={v.id}>{v.plate} • {v.model}</option>)}
          </select>
        </Field>
        <Field label="Chauffeur">
          <select value={driverId} onChange={(e) => setDriverId(e.target.value)} className={inputCls}>
            <option value="">— Aucun —</option>
            {drivers.filter((d) => d.status === 'ACTIVE').map((d) => <option key={d.id} value={d.id}>{d.fullName}</option>)}
          </select>
        </Field>
        {error && <div className="text-red-600 text-xs font-bold bg-red-50 p-2 rounded">{error}</div>}
        <div className="flex gap-2 justify-end pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-text-muted font-black text-sm">Annuler</button>
          <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-primary text-text-main font-black text-sm disabled:opacity-50">
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </form>
    </AdminModal>
  );
};

const AMENITY_OPTIONS = ['AC', 'WIFI', 'USB', 'VIP', 'TV'];

const AgencyVehicleForm: React.FC<{ agencyId: string; onClose: () => void; onSaved: () => void }> = ({ agencyId, onClose, onSaved }) => {
  const [plate, setPlate] = useState('');
  const [model, setModel] = useState('');
  const [capacity, setCapacity] = useState(30);
  const [amenities, setAmenities] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toggle = (a: string) => setAmenities((arr) => arr.includes(a) ? arr.filter((x) => x !== a) : [...arr, a]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError(null);
    try {
      const res = await fetch(`/api/agencies/${agencyId}/vehicles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plate, model, capacity, amenities }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erreur');
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally { setSaving(false); }
  };

  return (
    <AdminModal title="Nouveau véhicule" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Plaque">
          <input required value={plate} onChange={(e) => setPlate(e.target.value.toUpperCase())} className={inputCls + ' font-mono uppercase'} placeholder="LT 123 AB" />
        </Field>
        <div className="grid md:grid-cols-2 gap-3">
          <Field label="Modèle">
            <input required value={model} onChange={(e) => setModel(e.target.value)} className={inputCls} placeholder="Toyota Coaster" />
          </Field>
          <Field label="Capacité">
            <input required type="number" min={1} value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} className={inputCls} />
          </Field>
        </div>
        <Field label="Équipements">
          <div className="flex flex-wrap gap-2">
            {AMENITY_OPTIONS.map((a) => (
              <button type="button" key={a} onClick={() => toggle(a)} className={`px-3 py-1 rounded-full text-xs font-black border-2 transition-all ${amenities.includes(a) ? 'border-primary bg-primary/10 text-primary' : 'border-gray-200 dark:border-gray-700 text-text-muted'}`}>{a}</button>
            ))}
          </div>
        </Field>
        {error && <div className="text-red-600 text-xs font-bold bg-red-50 p-2 rounded">{error}</div>}
        <div className="flex gap-2 justify-end pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-text-muted font-black text-sm">Annuler</button>
          <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-primary text-text-main font-black text-sm disabled:opacity-50">
            {saving ? 'Enregistrement…' : 'Créer'}
          </button>
        </div>
      </form>
    </AdminModal>
  );
};

const AgencyVehicleEditForm: React.FC<{ vehicle: Vehicle; onClose: () => void; onSaved: () => void }> = ({ vehicle, onClose, onSaved }) => {
  const [plate, setPlate] = useState(vehicle.plate);
  const [model, setModel] = useState(vehicle.model);
  const [capacity, setCapacity] = useState(vehicle.capacity);
  const [amenities, setAmenities] = useState<string[]>(vehicle.amenities);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toggle = (a: string) => setAmenities((arr) => arr.includes(a) ? arr.filter((x) => x !== a) : [...arr, a]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError(null);
    try {
      const res = await fetch(`/api/vehicles/${vehicle.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plate, model, capacity, amenities }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erreur');
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally { setSaving(false); }
  };

  return (
    <AdminModal title={`Éditer ${vehicle.plate}`} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Plaque">
          <input required value={plate} onChange={(e) => setPlate(e.target.value.toUpperCase())} className={inputCls + ' font-mono uppercase'} />
        </Field>
        <div className="grid md:grid-cols-2 gap-3">
          <Field label="Modèle">
            <input required value={model} onChange={(e) => setModel(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Capacité">
            <input required type="number" min={1} value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} className={inputCls} />
          </Field>
        </div>
        <Field label="Équipements">
          <div className="flex flex-wrap gap-2">
            {AMENITY_OPTIONS.map((a) => (
              <button type="button" key={a} onClick={() => toggle(a)} className={`px-3 py-1 rounded-full text-xs font-black border-2 transition-all ${amenities.includes(a) ? 'border-primary bg-primary/10 text-primary' : 'border-gray-200 dark:border-gray-700 text-text-muted'}`}>{a}</button>
            ))}
          </div>
        </Field>
        {error && <div className="text-red-600 text-xs font-bold bg-red-50 p-2 rounded">{error}</div>}
        <div className="flex gap-2 justify-end pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-text-muted font-black text-sm">Annuler</button>
          <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-primary text-text-main font-black text-sm disabled:opacity-50">
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </form>
    </AdminModal>
  );
};

export default AgencyAdminDashboard;
