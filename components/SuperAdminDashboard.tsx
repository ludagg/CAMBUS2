import React, { useState, useEffect } from 'react';
import { useNavigation, UserRole } from '../contexts/NavigationContext';
import { db } from '../firebase/config';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp,
  getDocs,
  writeBatch
} from 'firebase/firestore';

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

  useEffect(() => {
    setIsLoading(true);
    
    // Listeners Temps Réel
    const unsubCities = onSnapshot(query(collection(db, 'cities'), orderBy('name')), (snap) => {
      setCities(snap.docs.map(d => ({ id: d.id, ...d.data() } as City)));
    });

    const unsubAgencies = onSnapshot(query(collection(db, 'agencies'), orderBy('name')), (snap) => {
      setAgencies(snap.docs.map(d => ({ id: d.id, ...d.data() } as Agency)));
    });

    const unsubUsers = onSnapshot(query(collection(db, 'users')), (snap) => {
      setUsers(snap.docs.map(d => ({ uid: d.id, ...d.data() } as PlatformUser)));
      setIsLoading(false);
    });

    return () => {
      unsubCities();
      unsubAgencies();
      unsubUsers();
    };
  }, []);

  // --- ACTIONS ---

  const handleSeedData = async () => {
    if (!confirm("Voulez-vous injecter les données de démonstration ?")) return;
    const batch = writeBatch(db);
    
    const demoCities = [
      { name: "Douala", region: "Littoral", status: "active" },
      { name: "Yaoundé", region: "Centre", status: "active" },
      { name: "Bafoussam", region: "Ouest", status: "active" }
    ];

    demoCities.forEach(city => {
      const ref = doc(collection(db, 'cities'));
      batch.set(ref, { ...city, createdAt: serverTimestamp() });
    });

    await batch.commit();
    alert("Données injectées avec succès !");
  };

  const addCity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCity.name) return;
    await addDoc(collection(db, 'cities'), { ...newCity, status: 'active', createdAt: serverTimestamp() });
    setNewCity({ name: '', region: 'Centre' });
  };

  const saveAgency = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAgency) {
      await updateDoc(doc(db, 'agencies', editingAgency.id), { ...agencyForm });
    } else {
      await addDoc(collection(db, 'agencies'), { 
        ...agencyForm, 
        logo: 'directions_bus', 
        status: 'active', 
        createdAt: serverTimestamp() 
      });
    }
    setAgencyForm({ name: '', email: '', color: '#13ec5b' });
    setEditingAgency(null);
    setIsAgencyModalOpen(false);
  };

  const updateUserRole = async (uid: string, newRole: UserRole) => {
    await updateDoc(doc(db, 'users', uid), { role: newRole });
  };

  const deleteDocItem = async (col: string, id: string) => {
    if (confirm("Supprimer définitivement ?")) {
      await deleteDoc(doc(db, col, id));
    }
  };

  // --- RENDERS ---

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
    <div className="flex h-screen bg-[#050505] text-white overflow-hidden">
      
      {/* Sidebar */}
      <aside className="w-64 bg-black border-r border-white/5 flex flex-col p-6">
        <div className="flex items-center gap-3 mb-10 px-2">
           <div className="size-10 bg-primary rounded-xl flex items-center justify-center text-black shadow-lg">
              <span className="material-symbols-outlined font-black">shield_person</span>
           </div>
           <div>
              <div className="font-black text-lg tracking-tight leading-none">CamBus</div>
              <div className="text-[10px] text-primary font-black uppercase tracking-widest mt-1">Super Admin</div>
           </div>
        </div>

        <nav className="flex-1 space-y-2">
           <SidebarItem id="overview" icon="grid_view" label="Vue d'ensemble" />
           <SidebarItem id="agencies" icon="business_center" label="Agences" />
           <SidebarItem id="cities" icon="map" label="Villes & Réseau" />
           <SidebarItem id="users" icon="group" label="Utilisateurs" />
           <SidebarItem id="revenue" icon="payments" label="Finances" />
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

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8 lg:p-12 custom-scrollbar">
        
        {/* Header */}
        <header className="flex justify-between items-center mb-10">
           <div>
              <h1 className="text-3xl font-black uppercase tracking-tighter">
                 {activeTab === 'overview' && "Console de Commande"}
                 {activeTab === 'agencies' && "Gestion des Partenaires"}
                 {activeTab === 'cities' && "Configuration du Réseau"}
                 {activeTab === 'users' && "Contrôle des Accès"}
                 {activeTab === 'revenue' && "Analyses Financières"}
              </h1>
              <p className="text-gray-500 text-sm font-medium">Tableau de bord centralisé pour CamBus Inc.</p>
           </div>
           <div className="flex gap-4">
              {cities.length === 0 && (
                <button onClick={handleSeedData} className="px-4 py-2 border border-primary/30 text-primary text-xs font-black rounded-lg hover:bg-primary/10 transition-colors">
                  Initialiser les données
                </button>
              )}
              <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 flex items-center gap-3">
                 <div className="size-2 rounded-full bg-green-500 animate-pulse"></div>
                 <span className="text-xs font-bold text-gray-400">Services Cloud Actifs</span>
              </div>
           </div>
        </header>

        {/* OVERVIEW */}
        {activeTab === 'overview' && (
           <div className="space-y-10 animate-fadeIn">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                 {[
                   { label: "Revenu Total", value: "1.4M", sub: "FCFA", icon: "payments", color: "text-green-500" },
                   { label: "Agences", value: agencies.length, sub: "Actives", icon: "business", color: "text-blue-500" },
                   { label: "Villes", value: cities.length, sub: "Desservies", icon: "location_city", color: "text-primary" },
                   { label: "Membres", value: users.length, sub: "Inscrits", icon: "person", color: "text-purple-500" }
                 ].map((stat, i) => (
                    <div key={i} className="bg-white/5 border border-white/10 p-6 rounded-2xl hover:border-primary/50 transition-colors group">
                       <div className="flex justify-between items-start mb-4">
                          <span className={`material-symbols-outlined ${stat.color} text-3xl`}>{stat.icon}</span>
                          <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Global</span>
                       </div>
                       <div className="text-3xl font-black mb-1">{stat.value} <span className="text-sm font-normal text-gray-500">{stat.sub}</span></div>
                       <div className="text-xs text-gray-500 font-bold">{stat.label}</div>
                    </div>
                 ))}
              </div>

              <div className="grid lg:grid-cols-3 gap-8">
                 <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-3xl p-8">
                    <h3 className="text-lg font-black mb-6 flex items-center gap-2">
                       <span className="material-symbols-outlined text-primary">analytics</span>
                       Croissance des Réservations
                    </h3>
                    <div className="h-64 flex items-end gap-2 px-2">
                       {[40, 65, 30, 85, 45, 90, 70, 55, 80, 95, 60, 75].map((h, i) => (
                          <div key={i} className="flex-1 bg-primary/20 rounded-t-lg relative group hover:bg-primary transition-all" style={{ height: `${h}%` }}>
                             <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white text-black text-[10px] font-black px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                {h}k
                             </div>
                          </div>
                       ))}
                    </div>
                    <div className="flex justify-between mt-4 text-[10px] font-black text-gray-600 uppercase tracking-widest px-2">
                       <span>Jan</span><span>Mar</span><span>Juin</span><span>Sep</span><span>Déc</span>
                    </div>
                 </div>

                 <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
                    <h3 className="text-lg font-black mb-6">Activités Récentes</h3>
                    <div className="space-y-6">
                       {users.slice(0, 5).map((u, i) => (
                          <div key={i} className="flex items-center gap-4">
                             <div className="size-10 rounded-xl bg-white/5 flex items-center justify-center font-bold text-gray-500">
                                {u.avatar || u.name.charAt(0)}
                             </div>
                             <div className="flex-1 min-w-0">
                                <div className="text-sm font-bold truncate">{u.name}</div>
                                <div className="text-[10px] text-gray-500 uppercase tracking-tighter">Nouveau compte • {u.role}</div>
                             </div>
                             <div className="text-[10px] font-black text-primary">NOW</div>
                          </div>
                       ))}
                    </div>
                 </div>
              </div>
           </div>
        )}

        {/* AGENCIES */}
        {activeTab === 'agencies' && (
           <div className="space-y-8 animate-fadeIn">
              <div className="flex justify-between items-center">
                 <h2 className="text-xl font-black text-gray-400">Liste des Partenaires ({agencies.length})</h2>
                 <button 
                  onClick={() => { setEditingAgency(null); setIsAgencyModalOpen(true); }}
                  className="px-6 py-3 bg-primary text-black font-black text-sm rounded-xl hover:bg-white transition-all flex items-center gap-2"
                 >
                    <span className="material-symbols-outlined">add_business</span>
                    Ajouter une Agence
                 </button>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {agencies.map(agency => (
                    <div key={agency.id} className="bg-white/5 border border-white/10 p-6 rounded-3xl relative overflow-hidden group">
                       <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-100 transition-opacity flex gap-2">
                          <button onClick={() => { setEditingAgency(agency); setAgencyForm({name: agency.name, email: agency.email, color: agency.color}); setIsAgencyModalOpen(true); }} className="size-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-primary hover:text-black">
                             <span className="material-symbols-outlined text-sm">edit</span>
                          </button>
                          <button onClick={() => deleteDocItem('agencies', agency.id)} className="size-8 rounded-lg bg-red-500/20 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white">
                             <span className="material-symbols-outlined text-sm">delete</span>
                          </button>
                       </div>
                       <div className="size-16 rounded-2xl flex items-center justify-center mb-6 shadow-xl" style={{ backgroundColor: agency.color + '20', color: agency.color }}>
                          <span className="material-symbols-outlined text-4xl">{agency.logo}</span>
                       </div>
                       <h4 className="text-xl font-black mb-1">{agency.name}</h4>
                       <p className="text-xs text-gray-500 font-bold mb-6">{agency.email}</p>
                       <div className="flex justify-between items-center pt-4 border-t border-white/5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${agency.status === 'active' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                             {agency.status}
                          </span>
                          <span className="text-xs font-bold text-gray-500">14 Trajets</span>
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        )}

        {/* CITIES */}
        {activeTab === 'cities' && (
           <div className="grid lg:grid-cols-3 gap-10 animate-fadeIn">
              <div className="lg:col-span-1">
                 <div className="bg-white/5 border border-white/10 p-8 rounded-3xl sticky top-8">
                    <h3 className="text-lg font-black mb-6">Ajouter une Ville</h3>
                    <form onSubmit={addCity} className="space-y-4">
                       <div>
                          <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5">Nom de la Ville</label>
                          <input 
                            type="text" required value={newCity.name} onChange={e => setNewCity({...newCity, name: e.target.value})}
                            className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-primary outline-none"
                            placeholder="ex: Kribi"
                          />
                       </div>
                       <div>
                          <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5">Région</label>
                          <select 
                            value={newCity.region} onChange={e => setNewCity({...newCity, region: e.target.value})}
                            className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-primary outline-none"
                          >
                             {["Centre", "Littoral", "Ouest", "Nord", "Sud", "Adamaoua", "Est", "Extrême-Nord", "Nord-Ouest", "Sud-Ouest"].map(r => (
                               <option key={r} value={r}>{r}</option>
                             ))}
                          </select>
                       </div>
                       <button type="submit" className="w-full py-4 bg-primary text-black font-black uppercase text-xs tracking-widest rounded-xl hover:shadow-xl hover:shadow-primary/20 transition-all">
                          Ajouter au Réseau
                       </button>
                    </form>
                 </div>
              </div>

              <div className="lg:col-span-2">
                 <div className="grid sm:grid-cols-2 gap-4">
                    {cities.map(city => (
                       <div key={city.id} className="bg-white/5 border border-white/10 p-5 rounded-2xl flex items-center justify-between group">
                          <div className="flex items-center gap-4">
                             <div className="size-10 rounded-xl bg-black border border-white/10 flex items-center justify-center text-primary">
                                <span className="material-symbols-outlined text-xl">location_on</span>
                             </div>
                             <div>
                                <div className="font-bold">{city.name}</div>
                                <div className="text-[10px] text-gray-500 uppercase font-black">{city.region}</div>
                             </div>
                          </div>
                          <button onClick={() => deleteDocItem('cities', city.id)} className="size-8 rounded-lg text-gray-600 hover:text-red-500 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all">
                             <span className="material-symbols-outlined text-sm">delete</span>
                          </button>
                       </div>
                    ))}
                 </div>
              </div>
           </div>
        )}

        {/* USERS */}
        {activeTab === 'users' && (
           <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden animate-fadeIn">
              <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead className="bg-white/5 text-[10px] font-black text-gray-500 uppercase tracking-widest">
                       <tr>
                          <th className="px-6 py-4">Utilisateur</th>
                          <th className="px-6 py-4">Contact</th>
                          <th className="px-6 py-4">Rôle Système</th>
                          <th className="px-6 py-4 text-right">Actions</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                       {users.map(u => (
                          <tr key={u.uid} className="hover:bg-white/5 transition-colors group">
                             <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                   <div className="size-10 rounded-full bg-gray-800 flex items-center justify-center font-bold text-primary border border-white/10">
                                      {u.avatar || u.name.charAt(0)}
                                   </div>
                                   <div className="font-bold text-sm">{u.name}</div>
                                </div>
                             </td>
                             <td className="px-6 py-4 text-xs font-mono text-gray-500">{u.email}</td>
                             <td className="px-6 py-4">
                                <select 
                                  value={u.role} 
                                  onChange={(e) => updateUserRole(u.uid, e.target.value as UserRole)}
                                  className={`bg-transparent border-none text-[10px] font-black uppercase tracking-widest focus:ring-0 cursor-pointer ${
                                    u.role === 'super_admin' ? 'text-purple-500' : u.role === 'agency_admin' ? 'text-blue-500' : 'text-gray-400'
                                  }`}
                                >
                                   <option value="user">Utilisateur</option>
                                   <option value="agency_admin">Admin Agence</option>
                                   <option value="station_manager">Chef de Gare</option>
                                   <option value="super_admin">Super Admin</option>
                                </select>
                             </td>
                             <td className="px-6 py-4 text-right">
                                <button className="text-gray-600 hover:text-white transition-colors">
                                   <span className="material-symbols-outlined text-lg">more_vert</span>
                                </button>
                             </td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>
        )}

      </main>

      {/* MODAL: AGENCE */}
      {isAgencyModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn">
           <div className="bg-[#111] border border-white/10 w-full max-w-md rounded-3xl p-8 shadow-2xl">
              <h3 className="text-2xl font-black mb-6 uppercase tracking-tighter">
                {editingAgency ? "Modifier l'Agence" : "Nouvelle Agence"}
              </h3>
              <form onSubmit={saveAgency} className="space-y-6">
                 <div>
                    <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Nom de la Compagnie</label>
                    <input 
                      type="text" required value={agencyForm.name} onChange={e => setAgencyForm({...agencyForm, name: e.target.value})}
                      className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-primary outline-none"
                    />
                 </div>
                 <div>
                    <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Email de Contact</label>
                    <input 
                      type="email" required value={agencyForm.email} onChange={e => setAgencyForm({...agencyForm, email: e.target.value})}
                      className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-primary outline-none"
                    />
                 </div>
                 <div>
                    <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Couleur de la Marque</label>
                    <div className="flex items-center gap-4 bg-black border border-white/10 rounded-xl px-4 py-3">
                       <input type="color" value={agencyForm.color} onChange={e => setAgencyForm({...agencyForm, color: e.target.value})} className="size-8 rounded cursor-pointer bg-transparent border-none" />
                       <span className="font-mono text-xs uppercase text-gray-400">{agencyForm.color}</span>
                    </div>
                 </div>
                 <div className="flex gap-4 pt-4">
                    <button type="button" onClick={() => setIsAgencyModalOpen(false)} className="flex-1 py-4 text-xs font-black uppercase text-gray-500 hover:text-white transition-colors">Annuler</button>
                    <button type="submit" className="flex-1 py-4 bg-primary text-black font-black uppercase text-xs tracking-widest rounded-xl">Enregistrer</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminDashboard;