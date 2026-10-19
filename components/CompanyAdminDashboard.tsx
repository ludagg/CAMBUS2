'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigation } from '../contexts/NavigationContext';
import AdminModal from './AdminModal';
import { Field, inputCls, StatCard } from './SuperAdminDashboard';
import SeatLayoutEditor from './SeatLayoutEditor';
import AnalyticsPanel from './AnalyticsPanel';
import DepartureControlPanel from './DepartureControlPanel';
import type { SeatLayout } from '../lib/seat-layout';

interface Company {
  id: string;
  name: string;
  logo: string;
  brandColor: string;
  description?: string | null;
  _count?: { agencies: number; routes: number };
  agencies?: Agency[];
  routes?: RouteRow[];
}

interface Agency {
  id: string;
  name: string;
  city: { id?: string; name: string; region?: string };
  _count?: { departures: number; vehicles: number };
}

interface RouteRow {
  id: string;
  originCity: { id?: string; name: string };
  destinationCity: { id?: string; name: string };
  defaultDurationMin: number;
  distanceKm?: number | null;
  _count?: { departures: number };
}

interface City {
  id: string;
  name: string;
  region: string;
}

interface Vehicle {
  id: string;
  plate: string;
  model: string;
  capacity: number;
  amenities: string[];
  status?: string;
  seatLayout?: SeatLayout | null;
}

const LOAD_ERROR = 'Impossible de charger les données de la compagnie. Vérifiez votre connexion puis réessayez.';

const fetchJson = async (url: string) => {
  const res = await fetch(url);
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || 'Erreur');
  return json;
};

const CompanyAdminDashboard: React.FC = () => {
  const { user, logout } = useNavigation();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [tab, setTab] = useState<'overview' | 'routes' | 'vehicles' | 'operations' | 'analytics'>('overview');
  const [routes, setRoutes] = useState<RouteRow[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [routeModalOpen, setRouteModalOpen] = useState(false);
  const [vehicleModalOpen, setVehicleModalOpen] = useState(false);
  const [selectedAgencyId, setSelectedAgencyId] = useState<string>('');
  const [agencyVehicles, setAgencyVehicles] = useState<Vehicle[]>([]);
  const [layoutVehicle, setLayoutVehicle] = useState<Vehicle | null>(null);

  const loadCompanies = useCallback(async () => {
    setIsLoading(true);
    try {
      if (user?.companyId) {
        const json = await fetchJson(`/api/companies/${user.companyId}`);
        setCompanies(json.data ? [json.data] : []);
        setActiveId(user.companyId);
      } else {
        const json = await fetchJson('/api/companies');
        const list: Company[] = json.data ?? [];
        setCompanies(list);
        setActiveId(list[0]?.id ?? null);
      }
    } catch (err) {
      console.error(err);
      setLoadError(LOAD_ERROR);
    } finally {
      setIsLoading(false);
    }
  }, [user?.companyId]);

  useEffect(() => { loadCompanies(); }, [loadCompanies, reloadKey]);

  useEffect(() => {
    fetchJson('/api/cities')
      .then((j) => setCities(j.data ?? []))
      .catch((err) => { console.error(err); setLoadError(LOAD_ERROR); });
  }, [reloadKey]);

  const reloadActiveCompany = useCallback(async () => {
    if (!activeId) return;
    try {
      const json = await fetchJson(`/api/companies/${activeId}`);
      setCompanies((prev) => prev.map((c) => (c.id === activeId ? { ...c, ...json.data } : c)));
    } catch (err) {
      console.error(err);
      setLoadError(LOAD_ERROR);
    }
  }, [activeId]);

  useEffect(() => {
    if (!activeId || companies.find((c) => c.id === activeId)?.agencies) return;
    reloadActiveCompany();
  }, [activeId, companies, reloadActiveCompany]);

  const reloadRoutes = useCallback(async () => {
    if (!activeId) return;
    try {
      const json = await fetchJson(`/api/routes?companyId=${activeId}`);
      setRoutes(json.data ?? []);
    } catch (err) {
      console.error(err);
      setLoadError(LOAD_ERROR);
    }
  }, [activeId]);

  useEffect(() => { if (tab === 'routes') reloadRoutes(); }, [tab, reloadRoutes, reloadKey]);

  const reloadVehicles = useCallback(async () => {
    if (!selectedAgencyId) return;
    try {
      const json = await fetchJson(`/api/agencies/${selectedAgencyId}/vehicles`);
      setAgencyVehicles(json.data ?? []);
    } catch (err) {
      console.error(err);
      setLoadError(LOAD_ERROR);
    }
  }, [selectedAgencyId]);

  useEffect(() => {
    if (tab !== 'vehicles' || !selectedAgencyId) { setAgencyVehicles([]); return; }
    reloadVehicles();
  }, [tab, selectedAgencyId, reloadVehicles, reloadKey]);

  const retry = () => {
    setLoadError(null);
    setReloadKey((k) => k + 1);
  };

  const active = useMemo(() => companies.find((c) => c.id === activeId), [companies, activeId]);

  useEffect(() => {
    if (!selectedAgencyId && active?.agencies?.[0]) setSelectedAgencyId(active.agencies[0].id);
  }, [active, selectedAgencyId]);

  const deleteRoute = async (id: string) => {
    if (!confirm('Supprimer cette route ?')) return;
    const res = await fetch(`/api/routes/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      alert(j.error || 'Suppression impossible.');
      return;
    }
    await reloadRoutes();
    await reloadActiveCompany();
  };

  const deleteVehicle = async (id: string) => {
    if (!confirm('Désactiver ce véhicule ?')) return;
    const del = await fetch(`/api/vehicles/${id}`, { method: 'DELETE' });
    if (!del.ok) {
      const j = await del.json().catch(() => ({}));
      alert(j.error || 'Désactivation impossible.');
      return;
    }
    await reloadVehicles();
    await reloadActiveCompany();
  };

  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen">
      <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white px-4 py-6 md:p-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="text-[10px] font-black tracking-widest uppercase opacity-80">Administrateur compagnie</div>
            <h1 className="text-2xl md:text-3xl font-black">{active?.name ?? 'Ma compagnie'}</h1>
            <p className="opacity-80 text-sm mt-1">{user?.name}</p>
          </div>
          <button onClick={logout} className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 font-black text-sm">Déconnexion</button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6">
        {loadError && (
          <div role="alert" className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-xl p-4 flex items-center justify-between gap-3 flex-wrap">
            <span className="text-sm font-bold">{loadError}</span>
            <button onClick={retry} className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-black hover:bg-red-700">Réessayer</button>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-16"><span className="material-symbols-outlined animate-spin text-5xl text-primary">progress_activity</span></div>
        ) : active ? (
          <>
            <div role="tablist" className="flex gap-2 overflow-x-auto pb-2 border-b border-gray-200 dark:border-gray-800">
              {(['overview', 'routes', 'vehicles', 'operations', 'analytics'] as const).map((t) => {
                const labels: Record<typeof t, string> = {
                  overview: "Vue d'ensemble",
                  routes: 'Routes',
                  vehicles: 'Véhicules',
                  operations: 'Opérations',
                  analytics: 'Analytics',
                };
                return (
                  <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={`px-4 py-2 font-black text-sm ${tab === t ? 'text-primary border-b-2 border-primary' : 'text-text-muted'}`}>
                    {labels[t]}
                  </button>
                );
              })}
            </div>

            {!loadError && tab === 'overview' && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard label="Agences" value={active._count?.agencies ?? active.agencies?.length ?? 0} icon="store" />
                  <StatCard label="Routes" value={active._count?.routes ?? active.routes?.length ?? 0} icon="route" />
                  <StatCard label="Villes desservies" value={new Set(active.agencies?.map((a) => a.city.name) ?? []).size} icon="location_city" />
                  <StatCard label="Départs actifs" value={active.agencies?.reduce((sum, a) => sum + (a._count?.departures ?? 0), 0) ?? 0} icon="directions_bus" />
                </div>

                <section>
                  <h2 className="font-black text-lg mb-3 text-text-main dark:text-white">Agences</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {(active.agencies ?? []).map((a) => (
                      <div key={a.id} className="bg-white dark:bg-surface-dark rounded-xl border border-gray-100 dark:border-gray-800 shadow-subtle p-4">
                        <div className="font-black text-text-main dark:text-white">{a.name}</div>
                        <div className="text-xs text-text-muted mt-1">{a.city.name}</div>
                        <div className="flex items-center gap-4 text-xs text-text-muted mt-2">
                          <span><strong className="text-text-main dark:text-white">{a._count?.departures ?? 0}</strong> départs</span>
                          <span><strong className="text-text-main dark:text-white">{a._count?.vehicles ?? 0}</strong> véhicules</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </>
            )}

            {!loadError && tab === 'routes' && (
              <section>
                <div className="flex justify-between items-center flex-wrap gap-3 mb-3">
                  <h2 className="font-black text-lg text-text-main dark:text-white">Routes ({routes.length})</h2>
                  <button onClick={() => setRouteModalOpen(true)} className="px-4 py-2 rounded-lg bg-primary text-text-main font-black text-sm flex items-center gap-2 hover:bg-[#0fd651]">
                    <span className="material-symbols-outlined text-[18px]">add</span>
                    Nouvelle route
                  </button>
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {routes.map((r) => (
                     <div key={r.id} className="bg-white dark:bg-surface-dark rounded-xl border border-gray-100 dark:border-gray-800 shadow-subtle p-4 flex items-center justify-between gap-3 flex-wrap">
                      <div>
                        <div className="font-black text-text-main dark:text-white">{r.originCity.name} → {r.destinationCity.name}</div>
                        <div className="text-xs text-text-muted">{Math.floor(r.defaultDurationMin / 60)}h{r.defaultDurationMin % 60 ? String(r.defaultDurationMin % 60).padStart(2, '0') : ''} • {r.distanceKm ?? '–'} km • {r._count?.departures ?? 0} départ(s)</div>
                      </div>
                      <button onClick={() => deleteRoute(r.id)} className="text-red-600 hover:text-red-800 p-2" aria-label="Supprimer">
                        <span className="material-symbols-outlined text-[20px]">delete</span>
                      </button>
                    </div>
                  ))}
                  {routes.length === 0 && <p className="text-text-muted col-span-2 text-center py-10">Aucune route.</p>}
                </div>
              </section>
            )}

            {!loadError && tab === 'vehicles' && (
              <section>
                <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
                  <div className="flex items-center gap-2">
                    <label htmlFor="vehicle-agency-select" className="text-xs font-black text-text-muted uppercase tracking-wider">Agence:</label>
                    <select id="vehicle-agency-select" value={selectedAgencyId} onChange={(e) => setSelectedAgencyId(e.target.value)} className={inputCls + ' w-auto'}>
                      {(active.agencies ?? []).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                  </div>
                  <button onClick={() => setVehicleModalOpen(true)} disabled={!selectedAgencyId} className="px-4 py-2 rounded-lg bg-primary text-text-main font-black text-sm flex items-center gap-2 hover:bg-[#0fd651] disabled:opacity-50">
                    <span className="material-symbols-outlined text-[18px]">add</span>
                    Nouveau véhicule
                  </button>
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {agencyVehicles.map((v) => (
                     <div key={v.id} className="bg-white dark:bg-surface-dark rounded-xl border border-gray-100 dark:border-gray-800 shadow-subtle p-4 flex justify-between gap-3 flex-wrap">
                      <div className="min-w-0">
                        <div className="font-black text-text-main dark:text-white">{v.plate}</div>
                        <div className="text-xs text-text-muted">{v.model} • {v.capacity} places</div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${v.seatLayout ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 dark:bg-gray-800 text-text-muted'}`}>
                            {v.seatLayout ? `Plan ${v.seatLayout.label ?? 'personnalisé'}` : 'Plan auto'}
                          </span>
                          {v.amenities.map((a) => <span key={a} className="text-[10px] font-black px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-text-muted rounded-full uppercase">{a}</span>)}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <button
                          onClick={() => setLayoutVehicle(v)}
                          className="text-primary hover:bg-primary/10 p-2 rounded-lg"
                          aria-label="Configurer le plan"
                          title="Configurer le plan de sièges"
                        >
                          <span className="material-symbols-outlined text-[20px]">event_seat</span>
                        </button>
                        <button onClick={() => deleteVehicle(v.id)} className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-lg" aria-label="Supprimer">
                          <span className="material-symbols-outlined text-[20px]">delete</span>
                        </button>
                      </div>
                    </div>
                  ))}
                  {agencyVehicles.length === 0 && <p className="text-text-muted col-span-2 text-center py-10">Aucun véhicule.</p>}
                </div>
              </section>
            )}

            {tab === 'operations' && <DepartureControlPanel />}
            {tab === 'analytics' && <AnalyticsPanel />}
          </>
        ) : loadError ? null : (
          <p className="text-center text-text-muted py-16">Aucune compagnie assignée.</p>
        )}
      </div>

      {routeModalOpen && activeId && (
        <RouteForm
          companyId={activeId}
          cities={cities}
          onClose={() => setRouteModalOpen(false)}
          onSaved={async () => { setRouteModalOpen(false); await reloadRoutes(); await reloadActiveCompany(); }}
        />
      )}
      {vehicleModalOpen && selectedAgencyId && (
        <VehicleForm
          agencyId={selectedAgencyId}
          onClose={() => setVehicleModalOpen(false)}
          onSaved={async () => {
            setVehicleModalOpen(false);
            await reloadVehicles();
            await reloadActiveCompany();
          }}
        />
      )}
      {layoutVehicle && (
        <SeatLayoutEditor
          vehicleId={layoutVehicle.id}
          initialLayout={layoutVehicle.seatLayout ?? null}
          capacity={layoutVehicle.capacity}
          onClose={() => setLayoutVehicle(null)}
          onSaved={async () => { await reloadVehicles(); }}
        />
      )}
    </div>
  );
};

const RouteForm: React.FC<{ companyId: string; cities: City[]; onClose: () => void; onSaved: () => void }> = ({ companyId, cities, onClose, onSaved }) => {
  const [originCityId, setOriginCityId] = useState(cities[0]?.id ?? '');
  const [destinationCityId, setDestinationCityId] = useState(cities[1]?.id ?? '');
  const [durationH, setDurationH] = useState<number>(4);
  const [durationM, setDurationM] = useState<number>(0);
  const [distanceKm, setDistanceKm] = useState<number | ''>('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cities may arrive after the modal opens: fill empty selections once they are loaded.
  useEffect(() => {
    if (cities.length === 0) return;
    setOriginCityId((prev) => prev || cities[0].id);
    setDestinationCityId((prev) => prev || (cities[1] ?? cities[0]).id);
  }, [cities]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!originCityId || !destinationCityId) { setError('Sélectionnez une origine et une destination.'); return; }
    if (originCityId === destinationCityId) { setError("L'origine et la destination doivent être différentes."); return; }
    setSaving(true); setError(null);
    try {
      const res = await fetch('/api/routes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId, originCityId, destinationCityId,
          defaultDurationMin: durationH * 60 + durationM,
          distanceKm: distanceKm === '' ? undefined : Number(distanceKm),
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
    <AdminModal title="Nouvelle route" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid md:grid-cols-2 gap-3">
          <Field label="Origine">
            <select required value={originCityId} onChange={(e) => setOriginCityId(e.target.value)} className={inputCls}>
              {cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Destination">
            <select required value={destinationCityId} onChange={(e) => setDestinationCityId(e.target.value)} className={inputCls}>
              {cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Durée par défaut">
          <div className="flex gap-2 items-center">
            <input type="number" min={0} value={durationH} onChange={(e) => setDurationH(Number(e.target.value))} className={inputCls} />
            <span className="text-xs font-black text-text-muted">h</span>
            <input type="number" min={0} max={59} value={durationM} onChange={(e) => setDurationM(Number(e.target.value))} className={inputCls} />
            <span className="text-xs font-black text-text-muted">min</span>
          </div>
        </Field>
        <Field label="Distance (km)">
          <input type="number" min={0} value={distanceKm} onChange={(e) => setDistanceKm(e.target.value === '' ? '' : Number(e.target.value))} className={inputCls} placeholder="240" />
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

const VehicleForm: React.FC<{ agencyId: string; onClose: () => void; onSaved: () => void }> = ({ agencyId, onClose, onSaved }) => {
  const [plate, setPlate] = useState('');
  const [model, setModel] = useState('Coaster');
  const [capacity, setCapacity] = useState(30);
  const [amenities, setAmenities] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const options = ['AC', 'WIFI', 'USB', 'VIP', 'TV'];

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
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally { setSaving(false); }
  };

  return (
    <AdminModal title="Nouveau véhicule" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Plaque d'immatriculation">
          <input required value={plate} onChange={(e) => setPlate(e.target.value.toUpperCase())} className={inputCls + ' font-mono uppercase'} placeholder="LT-1234-AB" />
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
            {options.map((a) => (
              <button type="button" key={a} onClick={() => toggle(a)} className={`px-3 py-1 rounded-full text-xs font-black border-2 transition-all ${amenities.includes(a) ? 'border-primary bg-primary/10 text-primary' : 'border-gray-200 dark:border-gray-700 text-text-muted'}`}>{a}</button>
            ))}
          </div>
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

export default CompanyAdminDashboard;
