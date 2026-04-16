'use client';

import React, { useState, useEffect } from 'react';
import { useNavigation, UserRole } from '../contexts/NavigationContext';

interface City {
  id: string;
  name: string;
  region: string;
  status: 'active' | 'inactive';
}

interface Agency {
  id: string;
  name: string;
  logo: string;
  email: string;
  color: string;
  status: 'active' | 'inactive';
}

interface PlatformUser {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  createdAt?: any;
}

const SuperAdminDashboard: React.FC = () => {
  const { user, logout } = useNavigation();
  const [activeTab, setActiveTab] = useState('overview');
  const [cities, setCities] = useState<City[]>([]);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal States
  const [isAgencyModalOpen, setIsAgencyModalOpen] = useState(false);
  const [editingAgency, setEditingAgency] = useState<Agency | null>(null);

  // Form States
  const [newCity, setNewCity] = useState({ name: '', region: 'Centre' });
  const [agencyForm, setAgencyForm] = useState({ name: '', email: '', color: '#13ec5b' });

  const fetchAll = async () => {
    setIsLoading(true);
    try {
      const [citiesRes, agenciesRes, usersRes] = await Promise.all([
        fetch('/api/cities'),
        fetch('/api/agencies'),
        fetch('/api/users'),
      ]);

      if (citiesRes.ok) {
        const data = await citiesRes.json();
        setCities(data.cities.map((c: any) => ({ id: c.id, name: c.name, region: c.region || '', status: c.status as 'active' | 'inactive' })));
      }
      if (agenciesRes.ok) {
        const data = await agenciesRes.json();
        setAgencies(data.agencies.map((a: any) => ({ id: a.id, name: a.name, logo: a.logo || 'directions_bus', email: a.contactEmail || '', color: a.colorHex || '#2563eb', status: a.status as 'active' | 'inactive' })));
      }
      if (usersRes.ok) {
        const data = await usersRes.json();
        setUsers(data.users.map((u: any) => ({ uid: u.id, name: u.name, email: u.email, role: u.role.toLowerCase() as UserRole, avatar: u.avatar, createdAt: u.createdAt })));
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  // --- ACTIONS ---

  const handleSeedData = async () => {
    if (!confirm("Voulez-vous injecter les données de démonstration (Agences, Villes, Trajets) ?")) return;

    const demoCities = [
      { name: "Douala", region: "Littoral" },
      { name: "Yaoundé", region: "Centre" },
      { name: "Bafoussam", region: "Ouest" },
    ];

    const demoAgencies = [
      { name: "Express Voyage", logo: "directions_bus", colorHex: "#2563eb", contactEmail: "contact@express.cm" },
      { name: "GreenLines", logo: "eco", colorHex: "#16a34a", contactEmail: "contact@greenlines.cm" },
      { name: "Royal Road", logo: "diamond", colorHex: "#d97706", contactEmail: "contact@royalroad.cm" },
    ];

    for (const city of demoCities) {
      await fetch('/api/cities', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(city) });
    }
    for (const agency of demoAgencies) {
      await fetch('/api/agencies', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(agency) });
    }

    alert("Données injectées avec succès !");
    fetchAll();
  };

  const addCity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCity.name) return;
    const res = await fetch('/api/cities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newCity.name, region: newCity.region }),
    });
    if (res.ok) {
      setNewCity({ name: '', region: 'Centre' });
      fetchAll();
    }
  };

  const saveAgency = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAgency) {
      await fetch(`/api/agencies/${editingAgency.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: agencyForm.name, contactEmail: agencyForm.email, colorHex: agencyForm.color }),
      });
    } else {
      await fetch('/api/agencies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: agencyForm.name, contactEmail: agencyForm.email, colorHex: agencyForm.color, logo: 'directions_bus' }),
      });
    }
    setAgencyForm({ name: '', email: '', color: '#13ec5b' });
    setEditingAgency(null);
    setIsAgencyModalOpen(false);
    fetchAll();
  };

  const updateUserRole = async (uid: string, newRole: UserRole) => {
    await fetch(`/api/users/${uid}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: newRole.toUpperCase() }),
    });
    fetchAll();
  };

  const deleteDocItem = async (col: string, id: string) => {
    if (!confirm("Supprimer définitivement ?")) return;
    if (col === 'cities') {
      await fetch(`/api/cities/${id}`, { method: 'DELETE' });
    } else if (col === 'agencies') {
      await fetch(`/api/agencies/${id}`, { method: 'DELETE' });
    }
    fetchAll();
  };

  const SidebarItem = ({ id, icon, label }: any) => (
    <button 
      onClick={() => setActiveTab(id)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
        activeTab === id 
          ? 'bg-primary text-black font-black shadow-lg shadow-primary/20' 
          : 'text-gray-400 hover:bg-white/5 hover:text-white'
      }`}
    >
      <span className="material-symbols-outlined">{icon}</span>
      <span className="text-sm font-bold">{label}</span>
    </button>
  );

  return (
    <div className="flex h-screen bg-[#050505] text-white overflow-hidden font-display">
      <aside className="w-64 bg-black border-r border-white/5 flex flex-col p-6">
        <div className="flex items-center gap-3 mb-10 px-2">
           <div className="size-10 bg-primary rounded-xl flex items-center justify-center text-black shadow-lg">
              <span className="material-symbols-outlined font-black">shield_person</span>
           </div>
           <div>
              <div className="font-black text-lg tracking-tight leading-none">EasyTravel</div>
              <div className="text-[10px] text-primary font-black uppercase tracking-widest mt-1">Super Admin</div>
           </div>
        </div>

        <nav className="flex-1 space-y-2">
           <SidebarItem id="overview" icon="grid_view" label="Vue d'ensemble" />
           <SidebarItem id="agencies" icon="business_center" label="Agences" />
           <SidebarItem id="cities" icon="map" label="Villes & Réseau" />
           <SidebarItem id="users" icon="group" label="Utilisateurs" />
        </nav>

        <div className="mt-auto pt-6 border-t border-white/5 space-y-4">
           <div className="flex items-center gap-3 px-2">
              <div className="size-10 rounded-full bg-gray-800 border border-white/10 flex items-center justify-center font-black text-primary">
                 {user?.avatar || 'SA'}
              </div>
              <div className="min-w-0">
                 <div className="text-sm font-bold truncate">{user?.name}</div>
                 <div className="text-[10px] text-gray-500 truncate">{user?.email}</div>
              </div>
           </div>
           <button onClick={logout} className="w-full py-3 bg-red-500/10 text-red-500 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all">
              Déconnexion
           </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-8 lg:p-12 custom-scrollbar">
        <header className="flex justify-between items-center mb-10">
           <div>
              <h1 className="text-3xl font-black uppercase tracking-tighter">
                 {activeTab === 'overview' && "Console de Commande"}
                 {activeTab === 'agencies' && "Gestion des Partenaires"}
                 {activeTab === 'cities' && "Configuration du Réseau"}
                 {activeTab === 'users' && "Contrôle des Accès"}
              </h1>
              <p className="text-gray-500 text-sm font-medium">Tableau de bord centralisé Firebase.</p>
           </div>
           <div className="flex gap-4">
              {cities.length === 0 && (
                <button onClick={handleSeedData} className="px-4 py-2 border border-primary/30 text-primary text-xs font-black rounded-lg hover:bg-primary/10 transition-colors">
                  Initialiser les données
                </button>
              )}
           </div>
        </header>

        {activeTab === 'overview' && (
           <div className="space-y-10 animate-fadeIn">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                 {[
                   { label: "Agences", value: agencies.length, sub: "Actives", icon: "business", color: "text-blue-500" },
                   { label: "Villes", value: cities.length, sub: "Desservies", icon: "location_city", color: "text-primary" },
                   { label: "Membres", value: users.length, sub: "Inscrits", icon: "person", color: "text-purple-500" }
                 ].map((stat, i) => (
                    <div key={i} className="bg-white/5 border border-white/10 p-6 rounded-2xl hover:border-primary/50 transition-colors group">
                       <div className="flex justify-between items-start mb-4">
                          <span className={`material-symbols-outlined ${stat.color} text-3xl`}>{stat.icon}</span>
                       </div>
                       <div className="text-3xl font-black mb-1">{stat.value}</div>
                       <div className="text-xs text-gray-500 font-bold">{stat.label}</div>
                    </div>
                 ))}
              </div>
           </div>
        )}

        {activeTab === 'agencies' && (
           <div className="space-y-8 animate-fadeIn">
              <div className="flex justify-between items-center">
                 <h2 className="text-xl font-black text-gray-400">Partenaires ({agencies.length})</h2>
                 <button onClick={() => { setEditingAgency(null); setIsAgencyModalOpen(true); }} className="px-6 py-3 bg-primary text-black font-black text-sm rounded-xl">Ajouter Agence</button>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {agencies.map(agency => (
                    <div key={agency.id} className="bg-white/5 border border-white/10 p-6 rounded-3xl relative overflow-hidden group">
                       <h4 className="text-xl font-black mb-1">{agency.name}</h4>
                       <p className="text-xs text-gray-500 font-bold">{agency.email}</p>
                       <button onClick={() => deleteDocItem('agencies', agency.id)} className="mt-4 text-red-500 text-xs font-black">Supprimer</button>
                    </div>
                 ))}
              </div>
           </div>
        )}

        {activeTab === 'cities' && (
           <div className="grid lg:grid-cols-3 gap-10 animate-fadeIn">
              <div className="lg:col-span-1">
                 <form onSubmit={addCity} className="bg-white/5 p-8 rounded-3xl space-y-4">
                    <input type="text" required value={newCity.name} onChange={e => setNewCity({...newCity, name: e.target.value})} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm" placeholder="Nom Ville" />
                    <button type="submit" className="w-full py-4 bg-primary text-black font-black uppercase text-xs rounded-xl">Ajouter</button>
                 </form>
              </div>
              <div className="lg:col-span-2">
                 <div className="grid sm:grid-cols-2 gap-4">
                    {cities.map(city => (
                       <div key={city.id} className="bg-white/5 border border-white/10 p-5 rounded-2xl flex items-center justify-between">
                          <div className="font-bold">{city.name}</div>
                          <button onClick={() => deleteDocItem('cities', city.id)} className="text-red-500 material-symbols-outlined">delete</button>
                       </div>
                    ))}
                 </div>
              </div>
           </div>
        )}
      </main>

      {isAgencyModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
           <div className="bg-[#111] border border-white/10 w-full max-w-md rounded-3xl p-8">
              <h3 className="text-2xl font-black mb-6 uppercase">Nouvelle Agence</h3>
              <form onSubmit={saveAgency} className="space-y-6">
                 <input type="text" required value={agencyForm.name} onChange={e => setAgencyForm({...agencyForm, name: e.target.value})} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3" placeholder="Nom Agence" />
                 <input type="email" required value={agencyForm.email} onChange={e => setAgencyForm({...agencyForm, email: e.target.value})} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3" placeholder="Email" />
                 <div className="flex gap-4">
                    <button type="button" onClick={() => setIsAgencyModalOpen(false)} className="flex-1 py-4 text-gray-500">Annuler</button>
                    <button type="submit" className="flex-1 py-4 bg-primary text-black font-black rounded-xl">Enregistrer</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminDashboard;
