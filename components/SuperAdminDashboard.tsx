'use client';

import React, { useState, useEffect } from 'react';
import { useNavigation } from '../contexts/NavigationContext';

interface Company {
  id: string;
  name: string;
  slug: string;
  logo: string;
  brandColor: string;
  status: string;
  _count?: { agencies: number; routes: number };
}

interface Agency {
  id: string;
  name: string;
  status: string;
  company: { name: string; brandColor: string };
  city: { name: string; region: string };
  _count?: { departures: number; vehicles: number };
}

interface City {
  id: string;
  name: string;
  region: string;
}

interface PlatformUser {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

interface Stats {
  companies: number;
  agencies: number;
  cities: number;
  users: number;
  bookings: number;
  departures: number;
  totalRevenue: number;
}

const SuperAdminDashboard: React.FC = () => {
  const { user, logout } = useNavigation();
  const [activeTab, setActiveTab] = useState<'overview' | 'companies' | 'agencies' | 'cities' | 'users'>('overview');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refetch = async () => {
    setIsLoading(true);
    try {
      const [companiesRes, agenciesRes, citiesRes, usersRes, statsRes] = await Promise.all([
        fetch('/api/companies').then((r) => r.json()),
        fetch('/api/agencies').then((r) => r.json()),
        fetch('/api/cities').then((r) => r.json()),
        fetch('/api/admin/users').then((r) => r.json()),
        fetch('/api/admin/stats').then((r) => r.json()),
      ]);
      setCompanies(companiesRes.data ?? []);
      setAgencies(agenciesRes.data ?? []);
      setCities(citiesRes.data ?? []);
      setUsers(usersRes.data ?? []);
      setStats(statsRes.data ?? null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refetch();
  }, []);

  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="text-[10px] font-black tracking-widest uppercase opacity-80">Super Admin</div>
            <h1 className="text-3xl font-black">Administration Easy Travel</h1>
            <p className="opacity-80 text-sm mt-1">{user?.name} • {user?.email}</p>
          </div>
          <button onClick={logout} className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 font-black text-sm">Déconnexion</button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-6 border-b border-gray-200 dark:border-gray-800">
          {(['overview', 'companies', 'agencies', 'cities', 'users'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg font-black text-sm capitalize whitespace-nowrap transition-colors ${
                activeTab === tab ? 'bg-primary text-text-main' : 'text-text-muted hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              {tab === 'overview' ? 'Vue d\'ensemble' : tab}
            </button>
          ))}
        </div>

        {isLoading && <div className="text-center py-20"><span className="material-symbols-outlined animate-spin text-5xl text-primary">progress_activity</span></div>}

        {!isLoading && activeTab === 'overview' && stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Compagnies" value={stats.companies} icon="business" />
            <StatCard label="Agences" value={stats.agencies} icon="store" />
            <StatCard label="Villes" value={stats.cities} icon="location_city" />
            <StatCard label="Utilisateurs" value={stats.users} icon="group" />
            <StatCard label="Départs" value={stats.departures} icon="directions_bus" />
            <StatCard label="Réservations" value={stats.bookings} icon="confirmation_number" />
            <StatCard label="Revenus" value={`${(stats.totalRevenue).toLocaleString()} XAF`} icon="payments" />
          </div>
        )}

        {!isLoading && activeTab === 'companies' && (
          <div className="space-y-3">
            {companies.map((c) => (
              <div key={c.id} className="bg-white dark:bg-surface-dark rounded-xl border border-gray-100 dark:border-gray-800 p-4 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-4">
                  <div className="size-12 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: c.brandColor }}>
                    <span className="material-symbols-outlined">{c.logo || 'business'}</span>
                  </div>
                  <div>
                    <div className="font-black text-text-main dark:text-white">{c.name}</div>
                    <div className="text-xs text-text-muted">{c._count?.agencies ?? 0} agences • {c._count?.routes ?? 0} routes</div>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-black uppercase ${c.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>{c.status}</span>
              </div>
            ))}
          </div>
        )}

        {!isLoading && activeTab === 'agencies' && (
          <div className="grid md:grid-cols-2 gap-3">
            {agencies.map((a) => (
              <div key={a.id} className="bg-white dark:bg-surface-dark rounded-xl border border-gray-100 dark:border-gray-800 p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <div className="font-black text-text-main dark:text-white">{a.name}</div>
                    <div className="text-xs text-text-muted">{a.company.name} • {a.city.name}</div>
                  </div>
                  <span className="size-3 rounded-full" style={{ backgroundColor: a.company.brandColor }} />
                </div>
                <div className="flex items-center gap-4 text-xs text-text-muted">
                  <span><strong className="text-text-main dark:text-white">{a._count?.departures ?? 0}</strong> départs</span>
                  <span><strong className="text-text-main dark:text-white">{a._count?.vehicles ?? 0}</strong> véhicules</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && activeTab === 'cities' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {cities.map((c) => (
              <div key={c.id} className="bg-white dark:bg-surface-dark rounded-xl border border-gray-100 dark:border-gray-800 p-4">
                <div className="font-black text-text-main dark:text-white">{c.name}</div>
                <div className="text-xs text-text-muted">{c.region}</div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && activeTab === 'users' && (
          <div className="space-y-2">
            {users.map((u) => (
              <div key={u.id} className="bg-white dark:bg-surface-dark rounded-xl border border-gray-100 dark:border-gray-800 p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black">{u.name.charAt(0)}</div>
                  <div>
                    <div className="font-black text-sm text-text-main dark:text-white">{u.name}</div>
                    <div className="text-xs text-text-muted">{u.email}</div>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-black uppercase tracking-widest">{u.role}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const StatCard: React.FC<{ label: string; value: string | number; icon: string }> = ({ label, value, icon }) => (
  <div className="bg-white dark:bg-surface-dark rounded-xl border border-gray-100 dark:border-gray-800 p-5">
    <div className="flex items-center justify-between mb-3">
      <span className="text-xs font-black uppercase tracking-wider text-text-muted">{label}</span>
      <span className="material-symbols-outlined text-primary">{icon}</span>
    </div>
    <div className="text-2xl font-black text-text-main dark:text-white">{value}</div>
  </div>
);

export default SuperAdminDashboard;
