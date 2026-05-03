'use client';

import React, { useState, useEffect } from 'react';
import { useNavigation } from '../contexts/NavigationContext';
import AdminModal from './AdminModal';
import AnalyticsPanel from './AnalyticsPanel';
import DepartureControlPanel from './DepartureControlPanel';
import DriverPanel from './DriverPanel';
import StationPanel from './StationPanel';
import IncidentPanel from './IncidentPanel';
import AuditLogPanel from './AuditLogPanel';

interface Company {
  id: string;
  name: string;
  slug: string;
  logo: string;
  brandColor: string;
  status: string;
  description?: string | null;
  email?: string | null;
  phone?: string | null;
  _count?: { agencies: number; routes: number };
}

interface Agency {
  id: string;
  name: string;
  status: string;
  cityId?: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  company: { name: string; brandColor: string };
  city: { id?: string; name: string; region: string };
  _count?: { departures: number; vehicles: number };
}

interface City {
  id: string;
  name: string;
  region: string;
  lat?: number | null;
  lng?: number | null;
}

interface PlatformUser {
  id: string;
  name: string;
  email: string;
  role: string;
  companyId?: string | null;
  agencyId?: string | null;
  stationId?: string | null;
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
  const [activeTab, setActiveTab] = useState<'overview' | 'companies' | 'agencies' | 'cities' | 'users' | 'drivers' | 'stations' | 'incidents' | 'audit' | 'operations' | 'analytics'>('overview');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [companyModalOpen, setCompanyModalOpen] = useState(false);
  const [agencyModalOpen, setAgencyModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [editingAgency, setEditingAgency] = useState<Agency | null>(null);
  const [cityModalOpen, setCityModalOpen] = useState(false);
  const [editingCity, setEditingCity] = useState<City | null>(null);
  const [adminUserModalOpen, setAdminUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<PlatformUser | null>(null);

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

  const toggleCompanyStatus = async (c: Company) => {
    await fetch(`/api/companies/${c.id}`, {
      method: c.status === 'ACTIVE' ? 'DELETE' : 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: c.status === 'ACTIVE' ? undefined : JSON.stringify({ status: 'ACTIVE' }),
    });
    await refetch();
  };

  const deleteCity = async (c: City) => {
    if (!confirm(`Désactiver la ville ${c.name} ?`)) return;
    const res = await fetch(`/api/cities/${c.id}`, { method: 'DELETE' });
    if (!res.ok) { alert('Erreur'); return; }
    await refetch();
  };

  const deleteAgency = async (a: Agency) => {
    if (!confirm(`Désactiver l'agence ${a.name} ?`)) return;
    const res = await fetch(`/api/agencies/${a.id}`, { method: 'DELETE' });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      alert(j.error || 'Erreur');
      return;
    }
    await refetch();
  };

  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-6 md:p-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="text-[10px] font-black tracking-widest uppercase opacity-80">Super Admin</div>
            <h1 className="text-2xl md:text-3xl font-black">Administration Easy Travel</h1>
            <p className="opacity-80 text-sm mt-1">{user?.name} • {user?.email}</p>
          </div>
          <button onClick={logout} className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 font-black text-sm">Déconnexion</button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-6 border-b border-gray-200 dark:border-gray-800">
          {(['overview', 'companies', 'agencies', 'cities', 'users', 'drivers', 'stations', 'incidents', 'audit', 'operations', 'analytics'] as const).map((tab) => {
            const labels: Record<typeof tab, string> = {
              overview: "Vue d'ensemble",
              companies: 'Compagnies',
              agencies: 'Agences',
              cities: 'Villes',
              users: 'Utilisateurs',
              drivers: 'Chauffeurs',
              stations: 'Stations',
              incidents: 'Incidents',
              audit: 'Audit',
              operations: 'Opérations',
              analytics: 'Analytics',
            };
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg font-black text-sm whitespace-nowrap transition-colors ${
                  activeTab === tab ? 'bg-primary text-text-main' : 'text-text-muted hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                {labels[tab]}
              </button>
            );
          })}
        </div>

        {isLoading && <div className="text-center py-20"><span className="material-symbols-outlined animate-spin text-5xl text-primary">progress_activity</span></div>}

        {!isLoading && activeTab === 'overview' && stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
            <div className="flex justify-end mb-2">
              <button onClick={() => setCompanyModalOpen(true)} className="px-4 py-2 rounded-lg bg-primary text-text-main font-black text-sm flex items-center gap-2 hover:bg-[#0fd651]">
                <span className="material-symbols-outlined text-[18px]">add</span>
                Nouvelle compagnie
              </button>
            </div>
            {companies.map((c) => (
               <div key={c.id} className="bg-white dark:bg-surface-dark rounded-xl border border-gray-100 dark:border-gray-800 shadow-subtle p-4 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-4">
                  <div className="size-12 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: c.brandColor }}>
                    <span className="material-symbols-outlined">{c.logo || 'business'}</span>
                  </div>
                  <div>
                    <div className="font-black text-text-main dark:text-white">{c.name}</div>
                    <div className="text-xs text-text-muted">{c._count?.agencies ?? 0} agences • {c._count?.routes ?? 0} routes</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-black uppercase ${c.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>{c.status}</span>
                  <button onClick={() => setEditingCompany(c)} className="px-3 py-1 rounded-lg text-xs font-black bg-gray-100 dark:bg-gray-800 text-text-main dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700">
                    Éditer
                  </button>
                  <button onClick={() => toggleCompanyStatus(c)} className="px-3 py-1 rounded-lg text-xs font-black bg-gray-100 dark:bg-gray-800 text-text-main dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700">
                    {c.status === 'ACTIVE' ? 'Désactiver' : 'Réactiver'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && activeTab === 'agencies' && (
          <div>
            <div className="flex justify-end mb-4">
              <button onClick={() => setAgencyModalOpen(true)} className="px-4 py-2 rounded-lg bg-primary text-text-main font-black text-sm flex items-center gap-2 hover:bg-[#0fd651]">
                <span className="material-symbols-outlined text-[18px]">add</span>
                Nouvelle agence
              </button>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {agencies.map((a) => (
                 <div key={a.id} className="bg-white dark:bg-surface-dark rounded-xl border border-gray-100 dark:border-gray-800 shadow-subtle p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <div className="font-black text-text-main dark:text-white">{a.name}</div>
                      <div className="text-xs text-text-muted">{a.company.name} • {a.city.name}</div>
                    </div>
                    <span className="size-3 rounded-full" style={{ backgroundColor: a.company.brandColor }} />
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-2">
                    <div className="flex items-center gap-4 text-xs text-text-muted">
                      <span><strong className="text-text-main dark:text-white">{a._count?.departures ?? 0}</strong> départs</span>
                      <span><strong className="text-text-main dark:text-white">{a._count?.vehicles ?? 0}</strong> véhicules</span>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => setEditingAgency(a)} className="px-3 py-1 rounded-lg text-xs font-black bg-gray-100 dark:bg-gray-800 text-text-main dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700">Éditer</button>
                      {a.status === 'ACTIVE' && (
                        <button onClick={() => deleteAgency(a)} className="px-3 py-1 rounded-lg text-xs font-black bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/20">Désactiver</button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!isLoading && activeTab === 'cities' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button onClick={() => setCityModalOpen(true)} className="px-4 py-2 rounded-lg bg-primary text-text-main font-black text-sm flex items-center gap-2 hover:bg-[#0fd651]">
                <span className="material-symbols-outlined text-[18px]">add</span>
                Nouvelle ville
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {cities.map((c) => (
                 <div key={c.id} className="bg-white dark:bg-surface-dark rounded-xl border border-gray-100 dark:border-gray-800 shadow-subtle p-4">
                  <div className="font-black text-text-main dark:text-white">{c.name}</div>
                  <div className="text-xs text-text-muted">{c.region}</div>
                  <div className="flex gap-1 justify-end mt-2">
                    <button onClick={() => setEditingCity(c)} className="px-3 py-1 rounded-lg text-xs font-black bg-gray-100 dark:bg-gray-800 text-text-main dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700">Éditer</button>
                    <button onClick={() => deleteCity(c)} className="px-3 py-1 rounded-lg text-xs font-black bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/20">Suppr.</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!isLoading && activeTab === 'users' && (
          <div className="space-y-3">
            <div className="flex justify-end">
              <button onClick={() => setAdminUserModalOpen(true)} className="px-4 py-2 rounded-lg bg-primary text-text-main font-black text-sm flex items-center gap-2 hover:bg-[#0fd651]">
                <span className="material-symbols-outlined text-[18px]">person_add</span>
                Nouvel utilisateur admin
              </button>
            </div>
            {users.map((u) => (
               <div key={u.id} className="bg-white dark:bg-surface-dark rounded-xl border border-gray-100 dark:border-gray-800 shadow-subtle p-4 flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black">{u.name.charAt(0)}</div>
                  <div>
                    <div className="font-black text-sm text-text-main dark:text-white">{u.name}</div>
                    <div className="text-xs text-text-muted">{u.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-black uppercase tracking-widest">{u.role}</span>
                  <button onClick={() => setEditingUser(u)} className="px-3 py-1 rounded-lg text-xs font-black bg-gray-100 dark:bg-gray-800 text-text-main dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700">Éditer</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && activeTab === 'drivers' && <DriverPanel />}
        {!isLoading && activeTab === 'stations' && <StationPanel cities={cities} />}
        {!isLoading && activeTab === 'incidents' && <IncidentPanel />}
        {!isLoading && activeTab === 'audit' && <AuditLogPanel />}
        {!isLoading && activeTab === 'operations' && <DepartureControlPanel />}
        {!isLoading && activeTab === 'analytics' && <AnalyticsPanel />}
      </div>

      {companyModalOpen && (
        <CompanyForm
          onClose={() => setCompanyModalOpen(false)}
          onSaved={async () => { setCompanyModalOpen(false); await refetch(); }}
        />
      )}
      {agencyModalOpen && (
        <AgencyForm
          companies={companies}
          cities={cities}
          onClose={() => setAgencyModalOpen(false)}
          onSaved={async () => { setAgencyModalOpen(false); await refetch(); }}
        />
      )}
      {editingCompany && (
        <CompanyEditForm
          company={editingCompany}
          onClose={() => setEditingCompany(null)}
          onSaved={async () => { setEditingCompany(null); await refetch(); }}
        />
      )}
      {editingAgency && (
        <AgencyEditForm
          agency={editingAgency}
          cities={cities}
          onClose={() => setEditingAgency(null)}
          onSaved={async () => { setEditingAgency(null); await refetch(); }}
        />
      )}
      {(cityModalOpen || editingCity) && (
        <CityForm
          city={editingCity ?? undefined}
          onClose={() => { setCityModalOpen(false); setEditingCity(null); }}
          onSaved={async () => { setCityModalOpen(false); setEditingCity(null); await refetch(); }}
        />
      )}
      {adminUserModalOpen && (
        <AdminUserCreateForm
          companies={companies}
          agencies={agencies}
          onClose={() => setAdminUserModalOpen(false)}
          onSaved={async () => { setAdminUserModalOpen(false); await refetch(); }}
        />
      )}
      {editingUser && (
        <AdminUserEditForm
          user={editingUser}
          companies={companies}
          agencies={agencies}
          onClose={() => setEditingUser(null)}
          onSaved={async () => { setEditingUser(null); await refetch(); }}
        />
      )}
    </div>
  );
};

const CompanyForm: React.FC<{ onClose: () => void; onSaved: () => void }> = ({ onClose, onSaved }) => {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [brandColor, setBrandColor] = useState('#13ec5b');
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
          brandColor,
          description: description || undefined,
          email: email || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erreur');
      onSaved();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminModal title="Nouvelle compagnie" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Nom commercial">
          <input required value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="Ex: Express Union" />
        </Field>
        <Field label="Slug (URL)">
          <input value={slug} onChange={(e) => setSlug(e.target.value)} className={inputCls} placeholder="express-union" />
        </Field>
        <Field label="Email">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} placeholder="contact@express.cm" />
        </Field>
        <Field label="Couleur de marque">
          <div className="flex gap-2 items-center">
            <input type="color" value={brandColor} onChange={(e) => setBrandColor(e.target.value)} className="h-10 w-14 rounded cursor-pointer bg-transparent border-none" />
            <input value={brandColor} onChange={(e) => setBrandColor(e.target.value)} className={inputCls + ' font-mono'} />
          </div>
        </Field>
        <Field label="Description">
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className={inputCls} />
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

const AgencyForm: React.FC<{ companies: Company[]; cities: City[]; onClose: () => void; onSaved: () => void }> = ({ companies, cities, onClose, onSaved }) => {
  const [companyId, setCompanyId] = useState(companies[0]?.id ?? '');
  const [cityId, setCityId] = useState(cities[0]?.id ?? '');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/agencies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId, cityId, name,
          address: address || undefined,
          phone: phone || undefined,
          email: email || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erreur');
      onSaved();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminModal title="Nouvelle agence" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Compagnie">
          <select required value={companyId} onChange={(e) => setCompanyId(e.target.value)} className={inputCls}>
            {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
        <Field label="Ville">
          <select required value={cityId} onChange={(e) => setCityId(e.target.value)} className={inputCls}>
            {cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
        <Field label="Nom de l'agence">
          <input required value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="Ex: Express Douala Bonaberi" />
        </Field>
        <Field label="Adresse">
          <input value={address} onChange={(e) => setAddress(e.target.value)} className={inputCls} />
        </Field>
        <div className="grid md:grid-cols-2 gap-3">
          <Field label="Téléphone">
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} placeholder="+237 6..." />
          </Field>
          <Field label="Email">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
          </Field>
        </div>
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

const CompanyEditForm: React.FC<{ company: Company; onClose: () => void; onSaved: () => void }> = ({ company, onClose, onSaved }) => {
  const [name, setName] = useState(company.name);
  const [brandColor, setBrandColor] = useState(company.brandColor);
  const [description, setDescription] = useState(company.description ?? '');
  const [email, setEmail] = useState(company.email ?? '');
  const [phone, setPhone] = useState(company.phone ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError(null);
    try {
      const res = await fetch(`/api/companies/${company.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          brandColor,
          description: description || null,
          email: email || null,
          phone: phone || null,
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
    <AdminModal title={`Éditer ${company.name}`} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Nom commercial">
          <input required value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Slug (URL)">
          <input value={company.slug} readOnly disabled className={inputCls + ' opacity-60 cursor-not-allowed'} />
        </Field>
        <Field label="Couleur de marque">
          <div className="flex gap-2 items-center">
            <input type="color" value={brandColor} onChange={(e) => setBrandColor(e.target.value)} className="h-10 w-14 rounded cursor-pointer bg-transparent border-none" />
            <input value={brandColor} onChange={(e) => setBrandColor(e.target.value)} className={inputCls + ' font-mono'} />
          </div>
        </Field>
        <div className="grid md:grid-cols-2 gap-3">
          <Field label="Email">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Téléphone">
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} />
          </Field>
        </div>
        <Field label="Description">
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className={inputCls + ' h-auto py-2'} />
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

const AgencyEditForm: React.FC<{ agency: Agency; cities: City[]; onClose: () => void; onSaved: () => void }> = ({ agency, cities, onClose, onSaved }) => {
  const [name, setName] = useState(agency.name);
  const [address, setAddress] = useState(agency.address ?? '');
  const [phone, setPhone] = useState(agency.phone ?? '');
  const [email, setEmail] = useState(agency.email ?? '');
  const [cityId, setCityId] = useState(agency.cityId ?? agency.city.id ?? cities[0]?.id ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError(null);
    try {
      const res = await fetch(`/api/agencies/${agency.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          address: address || null,
          phone: phone || null,
          email: email || null,
          cityId,
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
    <AdminModal title={`Éditer ${agency.name}`} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Nom">
          <input required value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Ville">
          <select required value={cityId} onChange={(e) => setCityId(e.target.value)} className={inputCls}>
            {cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
        <Field label="Adresse">
          <input value={address} onChange={(e) => setAddress(e.target.value)} className={inputCls} />
        </Field>
        <div className="grid md:grid-cols-2 gap-3">
          <Field label="Téléphone">
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Email">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
          </Field>
        </div>
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

const CityForm: React.FC<{ city?: City; onClose: () => void; onSaved: () => void }> = ({ city, onClose, onSaved }) => {
  const [name, setName] = useState(city?.name ?? '');
  const [region, setRegion] = useState(city?.region ?? '');
  const [lat, setLat] = useState<string>(city?.lat != null ? String(city.lat) : '');
  const [lng, setLng] = useState<string>(city?.lng != null ? String(city.lng) : '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError(null);
    try {
      const url = city ? `/api/cities/${city.id}` : '/api/cities';
      const method = city ? 'PATCH' : 'POST';
      const body: { name: string; region: string; lat?: number | null; lng?: number | null } = {
        name,
        region,
      };
      if (lat !== '') body.lat = Number(lat); else if (city) body.lat = null;
      if (lng !== '') body.lng = Number(lng); else if (city) body.lng = null;
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erreur');
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally { setSaving(false); }
  };

  return (
    <AdminModal title={city ? `Éditer ${city.name}` : 'Nouvelle ville'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Nom">
          <input required value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="Yaoundé" />
        </Field>
        <Field label="Région">
          <input required value={region} onChange={(e) => setRegion(e.target.value)} className={inputCls} placeholder="Centre" />
        </Field>
        <div className="grid md:grid-cols-2 gap-3">
          <Field label="Latitude">
            <input type="number" step="any" value={lat} onChange={(e) => setLat(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Longitude">
            <input type="number" step="any" value={lng} onChange={(e) => setLng(e.target.value)} className={inputCls} />
          </Field>
        </div>
        {error && <div className="text-red-600 text-xs font-bold bg-red-50 p-2 rounded">{error}</div>}
        <div className="flex gap-2 justify-end pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-text-muted font-black text-sm">Annuler</button>
          <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-primary text-text-main font-black text-sm disabled:opacity-50">
            {saving ? 'Enregistrement…' : (city ? 'Enregistrer' : 'Créer')}
          </button>
        </div>
      </form>
    </AdminModal>
  );
};

type AdminRole = 'COMPANY_ADMIN' | 'AGENCY_ADMIN' | 'STATION_MANAGER';

const AdminUserCreateForm: React.FC<{ companies: Company[]; agencies: Agency[]; onClose: () => void; onSaved: () => void }> = ({ companies, agencies, onClose, onSaved }) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<AdminRole>('COMPANY_ADMIN');
  const [companyId, setCompanyId] = useState<string>('');
  const [agencyId, setAgencyId] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError(null);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name,
          password,
          role,
          companyId: companyId || null,
          agencyId: agencyId || null,
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
    <AdminModal title="Nouvel utilisateur admin" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid md:grid-cols-2 gap-3">
          <Field label="Email">
            <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Nom complet">
            <input required value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
          </Field>
        </div>
        <Field label="Mot de passe (min. 8 caractères)">
          <input required type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Rôle">
          <select value={role} onChange={(e) => setRole(e.target.value as AdminRole)} className={inputCls}>
            <option value="COMPANY_ADMIN">COMPANY_ADMIN</option>
            <option value="AGENCY_ADMIN">AGENCY_ADMIN</option>
            <option value="STATION_MANAGER">STATION_MANAGER</option>
          </select>
        </Field>
        {role === 'COMPANY_ADMIN' && (
          <Field label="Compagnie">
            <select required value={companyId} onChange={(e) => setCompanyId(e.target.value)} className={inputCls}>
              <option value="">— Sélectionner —</option>
              {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
        )}
        {(role === 'AGENCY_ADMIN' || role === 'STATION_MANAGER') && (
          <Field label="Agence">
            <select required value={agencyId} onChange={(e) => setAgencyId(e.target.value)} className={inputCls}>
              <option value="">— Sélectionner —</option>
              {agencies.map((a) => <option key={a.id} value={a.id}>{a.name} ({a.company.name})</option>)}
            </select>
          </Field>
        )}
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

const AdminUserEditForm: React.FC<{ user: PlatformUser; companies: Company[]; agencies: Agency[]; onClose: () => void; onSaved: () => void }> = ({ user, companies, agencies, onClose, onSaved }) => {
  const [name, setName] = useState(user.name);
  const [role, setRole] = useState<string>(user.role);
  const [companyId, setCompanyId] = useState<string>(user.companyId ?? '');
  const [agencyId, setAgencyId] = useState<string>(user.agencyId ?? '');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError(null);
    try {
      const body: Record<string, unknown> = {
        name,
        role,
        companyId: companyId || null,
        agencyId: agencyId || null,
      };
      if (newPassword) body.newPassword = newPassword;
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erreur');
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally { setSaving(false); }
  };

  return (
    <AdminModal title={`Éditer ${user.name}`} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Nom">
          <input required value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Email">
          <input value={user.email} readOnly disabled className={inputCls + ' opacity-60 cursor-not-allowed'} />
        </Field>
        <Field label="Rôle">
          <select value={role} onChange={(e) => setRole(e.target.value)} className={inputCls}>
            {(['USER', 'COMPANY_ADMIN', 'AGENCY_ADMIN', 'STATION_MANAGER', 'SUPER_ADMIN'] as const).map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </Field>
        <Field label="Compagnie">
          <select value={companyId} onChange={(e) => setCompanyId(e.target.value)} className={inputCls}>
            <option value="">— Aucune —</option>
            {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
        <Field label="Agence">
          <select value={agencyId} onChange={(e) => setAgencyId(e.target.value)} className={inputCls}>
            <option value="">— Aucune —</option>
            {agencies.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </Field>
        <Field label="Réinitialiser le mot de passe (optionnel, min 8)">
          <input type="password" minLength={8} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={inputCls} placeholder="Laisser vide pour conserver" />
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

export const inputCls = 'w-full h-10 px-3 bg-gray-50 dark:bg-[#102216] border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-text-main dark:text-white transition-all text-sm';

export const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <label className="block">
    <span className="block text-xs font-black text-text-muted mb-1 uppercase tracking-wider">{label}</span>
    {children}
  </label>
);

const StatCard: React.FC<{ label: string; value: string | number; icon: string }> = ({ label, value, icon }) => (
  <div className="bg-white dark:bg-surface-dark rounded-xl border border-gray-100 dark:border-gray-800 shadow-subtle p-5">
    <div className="flex items-center justify-between mb-3">
      <span className="text-xs font-black uppercase tracking-wider text-text-muted">{label}</span>
      <span className="material-symbols-outlined text-primary">{icon}</span>
    </div>
    <div className="text-2xl font-black text-text-main dark:text-white">{value}</div>
  </div>
);

export default SuperAdminDashboard;
