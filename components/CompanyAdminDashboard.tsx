'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigation } from '../contexts/NavigationContext';

interface Company {
  id: string;
  name: string;
  logo: string;
  brandColor: string;
  description?: string | null;
  _count?: { agencies: number; routes: number };
  agencies?: Agency[];
  routes?: Route[];
}

interface Agency {
  id: string;
  name: string;
  city: { name: string; region: string } | { name: string };
  _count?: { departures: number; vehicles: number };
}

interface Route {
  id: string;
  originCity: { name: string };
  destinationCity: { name: string };
  defaultDurationMin: number;
}

const CompanyAdminDashboard: React.FC = () => {
  const { user, logout } = useNavigation();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      setIsLoading(true);
      try {
        if (user?.companyId) {
          const res = await fetch(`/api/companies/${user.companyId}`);
          const json = await res.json();
          setCompanies(json.data ? [json.data] : []);
          setActiveId(user.companyId);
        } else {
          const res = await fetch('/api/companies');
          const json = await res.json();
          const list: Company[] = json.data ?? [];
          setCompanies(list);
          setActiveId(list[0]?.id ?? null);
        }
      } finally {
        setIsLoading(false);
      }
    };
    run();
  }, [user?.companyId]);

  useEffect(() => {
    if (!activeId || companies.find((c) => c.id === activeId)?.agencies) return;
    fetch(`/api/companies/${activeId}`)
      .then((r) => r.json())
      .then((json) => {
        setCompanies((prev) => prev.map((c) => (c.id === activeId ? { ...c, ...json.data } : c)));
      });
  }, [activeId, companies]);

  const active = useMemo(() => companies.find((c) => c.id === activeId), [companies, activeId]);

  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen">
      <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white p-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="text-[10px] font-black tracking-widest uppercase opacity-80">Company Admin</div>
            <h1 className="text-3xl font-black">{active?.name ?? 'Ma compagnie'}</h1>
            <p className="opacity-80 text-sm mt-1">{user?.name}</p>
          </div>
          <button onClick={logout} className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 font-black text-sm">Déconnexion</button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {isLoading ? (
          <div className="text-center py-16"><span className="material-symbols-outlined animate-spin text-5xl text-primary">progress_activity</span></div>
        ) : active ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Stat label="Agences" value={active._count?.agencies ?? active.agencies?.length ?? 0} icon="store" />
              <Stat label="Routes" value={active._count?.routes ?? active.routes?.length ?? 0} icon="route" />
              <Stat label="Villes desservies" value={new Set(active.agencies?.map((a) => (a.city as { name: string }).name) ?? []).size} icon="location_city" />
              <Stat label="Départs actifs" value={active.agencies?.reduce((sum, a) => sum + (a._count?.departures ?? 0), 0) ?? 0} icon="directions_bus" />
            </div>

            <section>
              <h2 className="font-black text-lg mb-3 text-text-main dark:text-white">Agences</h2>
              <div className="grid md:grid-cols-2 gap-3">
                {(active.agencies ?? []).map((a) => (
                  <div key={a.id} className="bg-white dark:bg-surface-dark rounded-xl border border-gray-100 dark:border-gray-800 p-4">
                    <div className="font-black text-text-main dark:text-white">{a.name}</div>
                    <div className="text-xs text-text-muted mt-1">{(a.city as { name: string }).name}</div>
                    <div className="flex items-center gap-4 text-xs text-text-muted mt-2">
                      <span><strong className="text-text-main dark:text-white">{a._count?.departures ?? 0}</strong> départs</span>
                      <span><strong className="text-text-main dark:text-white">{a._count?.vehicles ?? 0}</strong> véhicules</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="font-black text-lg mb-3 text-text-main dark:text-white">Routes</h2>
              <div className="grid md:grid-cols-3 gap-3">
                {(active.routes ?? []).slice(0, 24).map((r) => (
                  <div key={r.id} className="bg-white dark:bg-surface-dark rounded-xl border border-gray-100 dark:border-gray-800 p-3 flex items-center justify-between text-xs">
                    <span className="font-black text-text-main dark:text-white">{r.originCity.name} → {r.destinationCity.name}</span>
                    <span className="text-text-muted">{Math.round(r.defaultDurationMin / 60)}h</span>
                  </div>
                ))}
              </div>
            </section>
          </>
        ) : (
          <p className="text-center text-text-muted py-16">Aucune compagnie assignée.</p>
        )}
      </div>
    </div>
  );
};

const Stat: React.FC<{ label: string; value: number | string; icon: string }> = ({ label, value, icon }) => (
  <div className="bg-white dark:bg-surface-dark rounded-xl border border-gray-100 dark:border-gray-800 p-5">
    <div className="flex items-center justify-between mb-3">
      <span className="text-xs font-black uppercase tracking-wider text-text-muted">{label}</span>
      <span className="material-symbols-outlined text-primary">{icon}</span>
    </div>
    <div className="text-2xl font-black text-text-main dark:text-white">{value}</div>
  </div>
);

export default CompanyAdminDashboard;
