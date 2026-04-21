'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigation } from '../contexts/NavigationContext';
import AdminModal from './AdminModal';
import { Field, inputCls } from './SuperAdminDashboard';

interface Departure {
  id: string;
  departureAt: string;
  arrivalAt: string;
  priceCents: number;
  seatsAvailable: number;
  seatsTotal: number;
  status?: string;
  route: {
    originCity: { id?: string; name: string };
    destinationCity: { id?: string; name: string };
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
  const [activeTab, setActiveTab] = useState<'departures' | 'vehicles'>('departures');
  const [depModalOpen, setDepModalOpen] = useState(false);
  const [activeAgencyDetail, setActiveAgencyDetail] = useState<Agency | null>(null);

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

        <div className="flex justify-between items-center mb-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex gap-2">
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
          {activeTab === 'departures' && activeAgencyDetail && (
            <button onClick={() => setDepModalOpen(true)} className="mb-2 px-4 py-2 rounded-lg bg-primary text-text-main font-black text-sm flex items-center gap-2 hover:bg-[#0fd651]">
              <span className="material-symbols-outlined text-[18px]">add</span>
              Nouveau départ
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="text-center py-16"><span className="material-symbols-outlined animate-spin text-5xl text-primary">progress_activity</span></div>
        ) : activeTab === 'departures' ? (
          <div className="space-y-3">
            {departures.map((d) => (
              <div key={d.id} className={`bg-white dark:bg-surface-dark rounded-xl border p-4 flex items-center justify-between flex-wrap gap-3 ${d.status === 'INACTIVE' ? 'border-gray-300 opacity-60' : 'border-gray-100 dark:border-gray-800'}`}>
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
                  <button onClick={() => deleteDeparture(d.id)} className="text-red-600 hover:text-red-800 p-1" aria-label="Désactiver">
                    <span className="material-symbols-outlined text-[20px]">delete</span>
                  </button>
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

      {depModalOpen && activeAgencyDetail && (
        <DepartureForm
          agency={activeAgencyDetail}
          cities={cities}
          vehicles={vehicles}
          onClose={() => setDepModalOpen(false)}
          onSaved={async () => { setDepModalOpen(false); await reload(); }}
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
        <div className="grid grid-cols-2 gap-3">
          <Field label="Origine (ville)">
            <input disabled value={agency.city.name} className={inputCls + ' opacity-70 cursor-not-allowed'} />
          </Field>
          <Field label="Destination (ville)">
            <select required value={destinationCityId} onChange={(e) => setDestinationCityId(e.target.value)} className={inputCls}>
              {cities.filter((c) => c.id !== originCityId).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
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
          <div className="flex items-center gap-2">
            <input type="number" min={0} value={durationH} onChange={(e) => setDurationH(Number(e.target.value))} className={inputCls} />
            <span className="text-xs font-black text-text-muted">h</span>
            <input type="number" min={0} max={59} value={durationM} onChange={(e) => setDurationM(Number(e.target.value))} className={inputCls} />
            <span className="text-xs font-black text-text-muted">min</span>
          </div>
        </Field>
        <div className="grid grid-cols-2 gap-3">
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

export default AgencyAdminDashboard;
