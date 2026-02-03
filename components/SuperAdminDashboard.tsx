import React, { useState, useEffect } from 'react';
import { useNavigation } from '../contexts/NavigationContext';
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
  serverTimestamp 
} from 'firebase/firestore';

// --- TYPES ---
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
  createdAt?: any;
}

interface PlatformUser {
  uid: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  createdAt?: any;
}

const SuperAdminDashboard: React.FC = () => {
  const { user, logout } = useNavigation();
  const [activeTab, setActiveTab] = useState('overview');

  // --- STATES ---
  const [cities, setCities] = useState<City[]>([]);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [platformUsers, setPlatformUsers] = useState<PlatformUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Forms States
  const [newCityName, setNewCityName] = useState('');
  const [newCityRegion, setNewCityRegion] = useState('');
  
  const [newAgencyName, setNewAgencyName] = useState('');
  const [newAgencyEmail, setNewAgencyEmail] = useState('');
  const [newAgencyColor, setNewAgencyColor] = useState('#13ec5b');

  // --- FIRESTORE LISTENERS ---
  useEffect(() => {
    setIsLoading(true);
    
    // Villes
    const qCities = query(collection(db, 'cities'), orderBy('name'));
    const unsubCities = onSnapshot(qCities, (snap) => {
      setCities(snap.docs.map(d => ({ id: d.id, ...d.data() } as City)));
    });

    // Agences
    const qAgencies = query(collection(db, 'agencies'), orderBy('name'));
    const unsubAgencies = onSnapshot(qAgencies, (snap) => {
      setAgencies(snap.docs.map(d => ({ id: d.id, ...d.data() } as Agency)));
    });

    // Utilisateurs
    const qUsers = query(collection(db, 'users'), orderBy('email'));
    const unsubUsers = onSnapshot(qUsers, (snap) => {
      setPlatformUsers(snap.docs.map(d => ({ uid: d.id, ...d.data() } as PlatformUser)));
      setIsLoading(false);
    });

    return () => {
      unsubCities();
      unsubAgencies();
      unsubUsers();
    };
  }, []);

  // --- ACTIONS: CITIES ---
  const handleAddCity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCityName || !newCityRegion) return;
    try {
      await addDoc(collection(db, 'cities'), {
        name: newCityName,
        region: newCityRegion,
        status: 'active',
        createdAt: serverTimestamp()
      });
      setNewCityName('');
      setNewCityRegion('');
    } catch (err) { alert("Erreur: " + err); }
  };

  const deleteCity = async (id: string) => {
    if (confirm('Supprimer cette ville ?')) await deleteDoc(doc(db, 'cities', id));
  };

  // --- ACTIONS: AGENCIES ---
  const handleAddAgency = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAgencyName || !newAgencyEmail) return;
    try {
      await addDoc(collection(db, 'agencies'), {
        name: newAgencyName,
        email: newAgencyEmail,
        color: newAgencyColor,
        logo: 'directions_bus',
        status: 'active',
        createdAt: serverTimestamp()
      });
      setNewAgencyName('');
      setNewAgencyEmail('');
    } catch (err) { alert("Erreur: " + err); }
  };

  const toggleAgencyStatus = async (id: string, current: string) => {
    await updateDoc(doc(db, 'agencies', id), {
      status: current === 'active' ? 'inactive' : 'active'
    });
  };

  const deleteAgency = async (id: string) => {
    if (confirm('Supprimer cette agence ?')) await deleteDoc(doc(db, 'agencies', id));
  };

  // --- RENDER HELPERS ---
  const NavItem = ({ id, icon, label }: any) => (
    <button 
      onClick={() => setActiveTab(id)}
      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all font-bold ${activeTab === id ? 'bg-white text-black shadow-md' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
    >
      <span className="material-symbols-outlined">{icon}</span>
      <span className="text-sm">{label}</span>
    </button>
  );

  return (
    <div className="flex min-h-screen bg-[#0a0a0a] text-white font-display">
      
      {/* Sidebar */}
      <aside className="w-64 bg-black border-r border-gray-800 p-6 flex flex-col fixed h-full">
        <div className="flex items-center gap-3 mb-10 px-2">
           <div className="size-8 rounded bg-primary flex items-center justify-center text-black">
             <span className="material-symbols-outlined font-black">admin_panel_settings</span>
           </div>
           <div className="font-black text-xl tracking-tight">CamBus <span className="text-primary text-xs border border-primary px-1 rounded ml-1">ADMIN</span></div>
        </div>

        <nav className="flex-1 space-y-1">
           <div className="text-[10px] font-black text-gray-600 uppercase px-3 mb-2 tracking-widest">Plateforme</div>
           <NavItem id="overview" icon="dashboard" label="Vue d'ensemble" />
           <NavItem id="agencies" icon="business" label="Agences" />
           <NavItem id="cities" icon="location_city" label="Villes & Terminaux" />
           <NavItem id="users" icon="group" label="Utilisateurs" />
           
           <div className="text-[10px] font-black text-gray-600 uppercase px-3 mb-2 mt-8 tracking-widest">Finance</div>
           <NavItem id="revenue" icon="payments" label="Revenus" />
        </nav>

        <div className="pt-6 border-t border-gray-800">
           <div className="flex items-center gap-3 px-3 mb-4 overflow-hidden">
              <div className="size-9 rounded-lg bg-primary/20 flex items-center justify-center font-bold text-primary border border-primary/30 shrink-0">
                  {user?.avatar || 'SA'}
              </div>
              <div className="min-w-0">
                 <div className="truncate font-bold text-xs">{user?.name}</div>
                 <div className="truncate text-[10px] text-gray-500 uppercase font-black tracking-tighter">Super Admin</div>
              </div>
           </div>
           
           <button onClick={logout} className="w-full py-2.5 bg-red-900/10 text-red-500 rounded-lg text-xs font-black hover:bg-red-900/20 transition-colors border border-red-900/20 uppercase tracking-widest">
              Déconnexion
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8 overflow-y-auto">
         <header className="flex justify-between items-center mb-8 bg-black/40 backdrop-blur-md p-6 rounded-2xl border border-gray-800 sticky top-0 z-10 shadow-xl">
            <div>
               <h1 className="text-2xl font-black uppercase tracking-tight">
                  {activeTab === 'overview' && "Dashboard Principal"}
                  {activeTab === 'agencies' && "Annuaire des Agences"}
                  {activeTab === 'cities' && "Réseau Urbain"}
                  {activeTab === 'users' && "Gestion des Comptes"}
               </h1>
               <p className="text-xs text-gray-500 font-bold">Dernière mise à jour: {new Date().toLocaleTimeString()}</p>
            </div>
            <div className="flex items-center gap-4">
               <div className="flex items-center gap-2 bg-green-500/10 text-green-500 px-3 py-1.5 rounded-full border border-green-500/20">
                  <span className="size-2 rounded-full bg-green-500 animate-pulse"></span>
                  <span className="text-[10px] font-black uppercase tracking-widest">Live Cloud Connection</span>
               </div>
            </div>
         </header>

         {/* VUE: TABLEAU DE BORD */}
         {activeTab === 'overview' && (
           <div className="space-y-8 animate-fadeIn">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                 <div className="bg-[#111] p-6 rounded-2xl border border-gray-800 hover:border-primary/50 transition-colors group">
                    <div className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1 group-hover:text-primary">Chiffre d'Affaires</div>
                    <div className="text-3xl font-black">45.2M <span className="text-xs text-gray-600 font-normal">FCFA</span></div>
                 </div>
                 <div className="bg-[#111] p-6 rounded-2xl border border-gray-800 hover:border-primary/50 transition-colors group">
                    <div className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1 group-hover:text-primary">Agences Actives</div>
                    <div className="text-3xl font-black">{agencies.filter(a => a.status === 'active').length}</div>
                 </div>
                 <div className="bg-[#111] p-6 rounded-2xl border border-gray-800 hover:border-primary/50 transition-colors group">
                    <div className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1 group-hover:text-primary">Villes Desservies</div>
                    <div className="text-3xl font-black">{cities.filter(c => c.status === 'active').length}</div>
                 </div>
                 <div className="bg-[#111] p-6 rounded-2xl border border-gray-800 hover:border-primary/50 transition-colors group">
                    <div className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1 group-hover:text-primary">Utilisateurs</div>
                    <div className="text-3xl font-black">{platformUsers.length}</div>
                 </div>
              </div>

              <div className="grid lg:grid-cols-2 gap-8">
                  {/* Recent Agencies */}
                  <div className="bg-[#111] rounded-2xl border border-gray-800 p-6">
                    <h3 className="font-black text-sm uppercase tracking-widest mb-6 border-b border-gray-800 pb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">analytics</span>
                        Performance Agences
                    </h3>
                    <div className="space-y-4">
                        {agencies.slice(0, 5).map(agency => (
                            <div key={agency.id} className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-gray-800/50">
                                <div className="flex items-center gap-3">
                                    <div className="size-10 rounded-lg flex items-center justify-center text-white" style={{backgroundColor: agency.color + '20', color: agency.color}}>
                                        <span className="material-symbols-outlined">{agency.logo}</span>
                                    </div>
                                    <div className="font-bold text-sm">{agency.name}</div>
                                </div>
                                <span className="text-xs font-black font-mono text-gray-500">1.2M CFA</span>
                            </div>
                        ))}
                    </div>
                  </div>

                  {/* Recent Users */}
                  <div className="bg-[#111] rounded-2xl border border-gray-800 p-6">
                    <h3 className="font-black text-sm uppercase tracking-widest mb-6 border-b border-gray-800 pb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">group</span>
                        Dernières Inscriptions
                    </h3>
                    <div className="space-y-4">
                        {platformUsers.slice(0, 5).map(u => (
                            <div key={u.uid} className="flex items-center gap-3 p-3 rounded-xl bg-black/40 border border-gray-800/50">
                                <div className="size-10 rounded-full bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-500 border border-gray-700">
                                    {u.avatar || u.name.charAt(0)}
                                </div>
                                <div>
                                    <div className="font-bold text-sm">{u.name}</div>
                                    <div className="text-[10px] text-gray-500">{u.email}</div>
                                </div>
                                <div className="ml-auto text-[9px] font-black uppercase px-2 py-0.5 rounded bg-white/5 text-gray-400">
                                    {u.role}
                                </div>
                            </div>
                        ))}
                    </div>
                  </div>
              </div>
           </div>
         )}

         {/* VUE: AGENCES */}
         {activeTab === 'agencies' && (
           <div className="space-y-6 animate-fadeIn">
              <div className="bg-[#111] p-8 rounded-2xl border border-gray-800">
                 <h3 className="font-black text-lg mb-6 uppercase tracking-widest">Enregistrer une Agence</h3>
                 <form onSubmit={handleAddAgency} className="grid md:grid-cols-4 gap-4">
                    <input 
                      type="text" placeholder="Nom de l'agence" value={newAgencyName} onChange={e => setNewAgencyName(e.target.value)}
                      className="bg-black border border-gray-800 rounded-xl px-4 py-3 text-sm focus:border-primary outline-none"
                    />
                    <input 
                      type="email" placeholder="Email Contact" value={newAgencyEmail} onChange={e => setNewAgencyEmail(e.target.value)}
                      className="bg-black border border-gray-800 rounded-xl px-4 py-3 text-sm focus:border-primary outline-none"
                    />
                    <div className="flex items-center gap-3 px-4 py-3 bg-black border border-gray-800 rounded-xl">
                        <span className="text-xs text-gray-500 font-bold">Couleur</span>
                        <input type="color" value={newAgencyColor} onChange={e => setNewAgencyColor(e.target.value)} className="bg-transparent size-6 rounded cursor-pointer" />
                    </div>
                    <button type="submit" className="bg-primary text-black font-black uppercase tracking-widest text-xs rounded-xl hover:bg-white transition-all">
                       Ajouter l'agence
                    </button>
                 </form>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {agencies.map(agency => (
                      <div key={agency.id} className="bg-[#111] border border-gray-800 rounded-2xl p-6 relative group overflow-hidden">
                          <div className="absolute top-0 left-0 w-1.5 h-full" style={{backgroundColor: agency.color}}></div>
                          <div className="flex items-center justify-between mb-4">
                                <div className="size-14 rounded-2xl flex items-center justify-center shadow-lg" style={{backgroundColor: agency.color + '15', color: agency.color}}>
                                    <span className="material-symbols-outlined text-4xl">{agency.logo}</span>
                                </div>
                                <div className="flex gap-1">
                                    <button onClick={() => toggleAgencyStatus(agency.id, agency.status)} className={`size-8 rounded-lg flex items-center justify-center ${agency.status === 'active' ? 'bg-green-500/10 text-green-500' : 'bg-gray-800 text-gray-500'}`}>
                                        <span className="material-symbols-outlined text-lg">{agency.status === 'active' ? 'check_circle' : 'do_not_disturb_on'}</span>
                                    </button>
                                    <button onClick={() => deleteAgency(agency.id)} className="size-8 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500/20">
                                        <span className="material-symbols-outlined text-lg">delete</span>
                                    </button>
                                </div>
                          </div>
                          <h4 className="font-black text-xl mb-1">{agency.name}</h4>
                          <p className="text-xs text-gray-500 font-bold mb-4">{agency.email}</p>
                          <div className="pt-4 border-t border-gray-800 flex justify-between items-center">
                              <span className="text-[10px] font-black uppercase text-gray-600 tracking-widest">Performance</span>
                              <span className="text-sm font-bold">8.4M CFA</span>
                          </div>
                      </div>
                  ))}
              </div>
           </div>
         )}

         {/* VUE: VILLES */}
         {activeTab === 'cities' && (
           <div className="space-y-6 animate-fadeIn">
              <div className="bg-[#111] p-8 rounded-2xl border border-gray-800">
                 <h3 className="font-black text-lg mb-6 uppercase tracking-widest">Nouvelle Destination</h3>
                 <form onSubmit={handleAddCity} className="flex gap-4">
                    <input 
                      type="text" placeholder="Nom de la ville" value={newCityName} onChange={e => setNewCityName(e.target.value)}
                      className="flex-1 bg-black border border-gray-800 rounded-xl px-4 py-3 text-sm focus:border-primary outline-none"
                    />
                    <select value={newCityRegion} onChange={e => setNewCityRegion(e.target.value)} className="w-64 bg-black border border-gray-800 rounded-xl px-4 py-3 text-sm focus:border-primary outline-none text-gray-400">
                         <option value="">Sélectionner Région</option>
                         <option value="Centre">Centre</option><option value="Littoral">Littoral</option><option value="Ouest">Ouest</option><option value="Nord">Nord</option><option value="Adamaoua">Adamaoua</option>
                    </select>
                    <button type="submit" className="bg-primary text-black font-black uppercase tracking-widest text-xs px-8 rounded-xl hover:bg-white transition-all">
                       Valider
                    </button>
                 </form>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {cities.map(city => (
                    <div key={city.id} className="bg-[#111] border border-gray-800 rounded-xl p-4 flex items-center justify-between group hover:border-primary/30 transition-all">
                        <div className="flex items-center gap-3">
                            <div className="size-10 rounded-lg bg-gray-800 flex items-center justify-center text-primary border border-gray-700">
                                <span className="material-symbols-outlined">location_city</span>
                            </div>
                            <div>
                                <div className="font-black text-sm">{city.name}</div>
                                <div className="text-[10px] text-gray-600 uppercase font-black tracking-tighter">{city.region}</div>
                            </div>
                        </div>
                        <button onClick={() => deleteCity(city.id)} className="opacity-0 group-hover:opacity-100 size-8 rounded-lg bg-red-900/20 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center">
                            <span className="material-symbols-outlined text-lg">delete</span>
                        </button>
                    </div>
                  ))}
              </div>
           </div>
         )}

         {/* VUE: UTILISATEURS */}
         {activeTab === 'users' && (
            <div className="bg-[#111] rounded-2xl border border-gray-800 overflow-hidden animate-fadeIn shadow-2xl">
                <div className="p-6 border-b border-gray-800 bg-black/20">
                    <h3 className="font-black text-sm uppercase tracking-widest">Base de données Utilisateurs ({platformUsers.length})</h3>
                </div>
                <table className="w-full text-left">
                    <thead className="bg-black/50 text-[10px] uppercase text-gray-500 font-black tracking-widest">
                        <tr>
                            <th className="p-4">Utilisateur</th>
                            <th className="p-4">Email</th>
                            <th className="p-4">Rôle</th>
                            <th className="p-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800 text-sm">
                        {platformUsers.map(u => (
                            <tr key={u.uid} className="hover:bg-white/5 transition-colors">
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="size-8 rounded-lg bg-gray-800 flex items-center justify-center font-bold text-gray-500 border border-gray-700">
                                            {u.avatar || u.name.charAt(0)}
                                        </div>
                                        <span className="font-bold">{u.name}</span>
                                    </div>
                                </td>
                                <td className="p-4 text-gray-400 font-mono text-xs">{u.email}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter ${
                                        u.role === 'super_admin' ? 'bg-purple-900/30 text-purple-400' : 
                                        u.role === 'agency_admin' ? 'bg-blue-900/30 text-blue-400' : 'bg-gray-800 text-gray-400'
                                    }`}>
                                        {u.role}
                                    </span>
                                </td>
                                <td className="p-4">
                                    <button className="text-gray-500 hover:text-white transition-colors">
                                        <span className="material-symbols-outlined text-lg">settings</span>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
         )}

      </main>
    </div>
  );
};

export default SuperAdminDashboard;