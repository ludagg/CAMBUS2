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
  writeBatch,
  limit
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
  revenue?: number;
}

interface PlatformUser {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  createdAt?: any;
}

interface Transaction {
  id: string;
  userName: string;
  amount: number;
  agencyName: string;
  date: any;
  status: string;
}

const SuperAdminDashboard: React.FC = () => {
  const { user, logout } = useNavigation();
  const [activeTab, setActiveTab] = useState('overview');
  
  // Data States
  const [cities, setCities] = useState<City[]>([]);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // UI States
  const [isAgencyModalOpen, setIsAgencyModalOpen] = useState(false);
  const [editingAgency, setEditingAgency] = useState<Agency | null>(null);
  const [agencyForm, setAgencyForm] = useState({ name: '', email: '', color: '#13ec5b' });
  const [newCity, setNewCity] = useState({ name: '', region: 'Centre' });

  // --- FIRESTORE REALTIME LISTENERS ---
  useEffect(() => {
    setIsLoading(true);
    
    const unsubCities = onSnapshot(query(collection(db, 'cities'), orderBy('name')), (snap) => {
      setCities(snap.docs.map(d => ({ id: d.id, ...d.data() } as City)));
    });

    const unsubAgencies = onSnapshot(query(collection(db, 'agencies'), orderBy('name')), (snap) => {
      setAgencies(snap.docs.map(d => ({ id: d.id, ...d.data() } as Agency)));
    });

    const unsubUsers = onSnapshot(query(collection(db, 'users'), orderBy('name')), (snap) => {
      setUsers(snap.docs.map(d => ({ uid: d.id, ...d.data() } as PlatformUser)));
    });

    // Mock/Real Transactions
    const unsubTrans = onSnapshot(query(collection(db, 'bookings'), orderBy('createdAt', 'desc'), limit(10)), (snap) => {
      setTransactions(snap.docs.map(d => ({ 
        id: d.id, 
        userName: d.data().passengerName || 'Client',
        amount: d.data().totalPrice || 0,
        agencyName: d.data().agencyName || 'CamBus',
        date: d.data().createdAt,
        status: d.data().status || 'completed'
      } as Transaction)));
      setIsLoading(false);
    });

    return () => {
      unsubCities();
      unsubAgencies();
      unsubUsers();
      unsubTrans();
    };
  }, []);

  // --- ACTIONS ---

  const handleSeedData = async () => {
    const batch = writeBatch(db);
    const demoCities = [
      { name: "Douala", region: "Littoral", status: "active" },
      { name: "Yaoundé", region: "Centre", status: "active" },
      { name: "Bafoussam", region: "Ouest", status: "active" },
      { name: "Kribi", region: "Sud", status: "active" },
      { name: "Garoua", region: "Nord", status: "active" }
    ];
    demoCities.forEach(city => {
      const ref = doc(collection(db, 'cities'));
      batch.set(ref, { ...city, createdAt: serverTimestamp() });
    });
    await batch.commit();
    alert("Villes initialisées !");
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

  const toggleAgencyStatus = async (id: string, current: string) => {
    await updateDoc(doc(db, 'agencies', id), { 
      status: current === 'active' ? 'inactive' : 'active' 
    });
  };

  const deleteDocItem = async (col: string, id: string) => {
    if (confirm("Confirmer la suppression ?")) await deleteDoc(doc(db, col, id));
  };

  const updateUserRole = async (uid: string, newRole: UserRole) => {
    await updateDoc(doc(db, 'users', uid), { role: newRole });
  };

  // --- HELPERS ---
  const totalRevenue = transactions.reduce((acc, curr) => acc + curr.amount, 0);

  const NavItem = ({ id, icon, label }: any) => (
    <button 
      onClick={() => setActiveTab(id)}
      className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all ${
        activeTab === id 
          ? 'bg-primary text-black font-black shadow-xl shadow-primary/20 scale-[1.02]' 
          : 'text-gray-500 hover:bg-white/5 hover:text-white'
      }`}
    >
      <span className="material-symbols-outlined text-[24px]">{icon}</span>
      <span className="text-sm font-bold tracking-tight">{label}</span>
    </button>
  );

  return (
    <div className="flex h-screen bg-[#050505] text-white overflow-hidden font-display">
      
      {/* SIDEBAR LUXE */}
      <aside className="w-80 bg-black border-r border-white/5 flex flex-col p-8 z-20">
        <div className="flex items-center gap-4 mb-14 px-2">
           <div className="size-12 bg-primary rounded-2xl flex items-center justify-center text-black shadow-lg shadow-primary/20 rotate-3">
              <span className="material-symbols-outlined font-black text-2xl">admin_panel_settings</span>
           </div>
           <div>
              <div className="font-black text-2xl tracking-tighter leading-none">CamBus</div>
              <div className="text-[10px] text-primary font-black uppercase tracking-[0.3em] mt-1">Super Console</div>
           </div>
        </div>

        <nav className="flex-1 space-y-2">
           <div className="px-5 mb-4 text-[10px] font-black text-gray-700 uppercase tracking-[0.2em]">Principal</div>
           <NavItem id="overview" icon="dashboard" label="Dashboard" />
           <NavItem id="agencies" icon="business_center" label="Partenaires" />
           <NavItem id="cities" icon="map" label="Réseau Routier" />
           <NavItem id="users" icon="group" label="Utilisateurs" />
           
           <div className="px-5 mt-12 mb-4 text-[10px] font-black text-gray-700 uppercase tracking-[0.2em]">Finances</div>
           <NavItem id="revenue" icon="account_balance" label="Transactions" />
        </nav>

        <div className="mt-auto pt-8">
           <div className="bg-white/5 p-5 rounded-[2rem] border border-white/5">
              <div className="flex items-center gap-4 mb-5">
                 <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center font-black text-primary border border-primary/20">
                    {user?.avatar || 'SA'}
                 </div>
                 <div className="min-w-0">
                    <div className="text-sm font-black truncate">{user?.name}</div>
                    <div className="text-[10px] text-gray-500 font-bold uppercase">Master Admin</div>
                 </div>
              </div>
              <button onClick={logout} className="w-full py-4 bg-red-500/10 text-red-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all border border-red-500/10">
                 Déconnexion
              </button>
           </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 overflow-y-auto p-12 lg:p-16 custom-scrollbar relative">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[150px] -z-10 -translate-y-1/2 translate-x-1/2"></div>
        
        {/* Header Dynamique */}
        <header className="flex justify-between items-start mb-16">
           <div>
              <h1 className="text-5xl font-black uppercase tracking-tighter mb-3">
                 {activeTab === 'overview' && "Contrôle Central"}
                 {activeTab === 'agencies' && "Gestion Agences"}
                 {activeTab === 'cities' && "Réseau National"}
                 {activeTab === 'users' && "Accès Plateforme"}
                 {activeTab === 'revenue' && "Trésorerie"}
              </h1>
              <p className="text-gray-500 text-lg font-medium max-w-xl">
                 {activeTab === 'overview' && "Aperçu global de la performance et de la santé du système CamBus."}
                 {activeTab === 'agencies' && "Supervision des agences de transport partenaires et de leurs statuts."}
                 {activeTab === 'cities' && "Configuration des destinations et du maillage géographique."}
                 {activeTab === 'users' && "Gestion hiérarchique des comptes et des permissions."}
                 {activeTab === 'revenue' && "Audit des flux financiers et des commissions générées."}
              </p>
           </div>
           
           <div className="flex gap-4">
              <div className="bg-white/5 border border-white/10 rounded-2xl px-6 py-4 flex items-center gap-4 shadow-sm backdrop-blur-md">
                 <div className="size-3 rounded-full bg-green-500 animate-pulse shadow-[0_0_15px_rgba(34,197,94,0.6)]"></div>
                 <span className="text-xs font-black uppercase tracking-widest text-gray-400">Database Live</span>
              </div>
           </div>
        </header>

        {/* SECTION: OVERVIEW */}
        {activeTab === 'overview' && (
           <div className="space-y-12 animate-fadeIn">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                 {[
                   { label: "Volume Ventes", value: totalRevenue.toLocaleString(), sub: "FCFA", icon: "payments", color: "text-green-500" },
                   { label: "Agences", value: agencies.length, sub: "Actives", icon: "business", color: "text-blue-500" },
                   { label: "Villes", value: cities.length, sub: "Connectées", icon: "map", color: "text-primary" },
                   { label: "Membres", value: users.length, sub: "Inscrits", icon: "group", color: "text-purple-500" }
                 ].map((stat, i) => (
                    <div key={i} className="bg-white/5 border border-white/10 p-8 rounded-[2.5rem] hover:border-primary/40 transition-all group shadow-lg">
                       <div className={`size-14 rounded-2xl ${stat.color} bg-white/5 flex items-center justify-center mb-8`}>
                          <span className="material-symbols-outlined text-3xl">{stat.icon}</span>
                       </div>
                       <div className="text-4xl font-black mb-1">{stat.value} <span className="text-sm font-normal text-gray-500">{stat.sub}</span></div>
                       <div className="text-xs text-gray-500 font-black uppercase tracking-widest">{stat.label}</div>
                    </div>
                 ))}
              </div>

              {/* Layout Mixte */}
              <div className="grid lg:grid-cols-3 gap-10">
                 <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-[3rem] p-12 backdrop-blur-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-12 opacity-5"><span className="material-symbols-outlined text-9xl">monitoring</span></div>
                    <h3 className="text-2xl font-black mb-10 flex items-center gap-4">
                       <span className="size-2 bg-primary rounded-full"></span>
                       Activité des Réservations
                    </h3>
                    <div className="h-80 flex items-end gap-4 px-2">
                       {[60, 40, 85, 30, 95, 70, 50, 80, 45, 90, 65, 75].map((h, i) => (
                          <div key={i} className="flex-1 bg-primary/10 rounded-2xl relative group hover:bg-primary/40 transition-all" style={{ height: `${h}%` }}>
                             <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent"></div>
                          </div>
                       ))}
                    </div>
                    <div className="flex justify-between mt-8 px-4 text-[10px] font-black text-gray-700 uppercase tracking-[0.3em]">
                       <span>Jan</span><span>Mar</span><span>Juin</span><span>Sep</span><span>Déc</span>
                    </div>
                 </div>

                 <div className="bg-white/5 border border-white/10 rounded-[3rem] p-12 backdrop-blur-sm">
                    <h3 className="text-2xl font-black mb-10">Derniers Inscrits</h3>
                    <div className="space-y-8">
                       {users.slice(0, 6).map((u, i) => (
                          <div key={i} className="flex items-center gap-5 group">
                             <div className="size-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center font-black text-gray-500 text-sm group-hover:border-primary/30 transition-all">
                                {u.avatar || u.name.charAt(0)}
                             </div>
                             <div className="flex-1 min-w-0">
                                <div className="text-sm font-black truncate">{u.name}</div>
                                <div className="text-[10px] text-gray-600 font-bold uppercase tracking-tighter">{u.email}</div>
                             </div>
                             <span className="text-[10px] font-black text-primary px-2 py-1 bg-primary/5 rounded">NEW</span>
                          </div>
                       ))}
                    </div>
                 </div>
              </div>
           </div>
        )}

        {/* SECTION: AGENCIES */}
        {activeTab === 'agencies' && (
           <div className="space-y-10 animate-fadeIn">
              <div className="flex justify-between items-center mb-4">
                 <h2 className="text-2xl font-black text-gray-600 uppercase tracking-widest">Partenaires Certifiés ({agencies.length})</h2>
                 <button 
                  onClick={() => { setEditingAgency(null); setAgencyForm({name: '', email: '', color: '#13ec5b'}); setIsAgencyModalOpen(true); }}
                  className="px-10 py-5 bg-primary text-black font-black text-xs uppercase tracking-[0.2em] rounded-2xl hover:bg-white transition-all shadow-xl shadow-primary/10"
                 >
                    + Créer Agence
                 </button>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
                 {agencies.map(agency => (
                    <div key={agency.id} className="bg-white/5 border border-white/10 p-10 rounded-[2.5rem] relative overflow-hidden group hover:border-primary/40 transition-all shadow-2xl">
                       <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-all flex gap-3">
                          <button onClick={() => { setEditingAgency(agency); setAgencyForm({name: agency.name, email: agency.email, color: agency.color}); setIsAgencyModalOpen(true); }} className="size-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-primary hover:text-black">
                             <span className="material-symbols-outlined text-sm">edit</span>
                          </button>
                          <button onClick={() => deleteDocItem('agencies', agency.id)} className="size-10 rounded-xl bg-red-500/20 backdrop-blur-md text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white">
                             <span className="material-symbols-outlined text-sm">delete</span>
                          </button>
                       </div>
                       
                       <div className="size-24 rounded-[2rem] flex items-center justify-center mb-10 shadow-inner" style={{ backgroundColor: agency.color + '15', color: agency.color, border: `1px solid ${agency.color}30` }}>
                          <span className="material-symbols-outlined text-6xl">{agency.logo}</span>
                       </div>
                       
                       <h4 className="text-3xl font-black mb-2 tracking-tighter">{agency.name}</h4>
                       <p className="text-sm text-gray-500 font-bold mb-10 opacity-70">{agency.email}</p>
                       
                       <div className="flex justify-between items-center pt-8 border-t border-white/5">
                          <button 
                            onClick={() => toggleAgencyStatus(agency.id, agency.status)}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${agency.status === 'active' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}
                          >
                             {agency.status === 'active' ? 'En Service' : 'Suspendue'}
                          </button>
                          <span className="text-[11px] font-black text-gray-700 uppercase">ID: {agency.id.slice(0, 6)}</span>
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        )}

        {/* SECTION: CITIES */}
        {activeTab === 'cities' && (
           <div className="grid lg:grid-cols-3 gap-16 animate-fadeIn">
              <div className="lg:col-span-1">
                 <div className="bg-white/5 border border-white/10 p-12 rounded-[3rem] sticky top-12 backdrop-blur-xl">
                    <h3 className="text-3xl font-black mb-10 tracking-tighter">Nouvelle Escale</h3>
                    <form onSubmit={addCity} className="space-y-8">
                       <div className="space-y-3">
                          <label className="block text-[10px] font-black text-gray-600 uppercase tracking-widest">Désignation Ville</label>
                          <input 
                            type="text" required value={newCity.name} onChange={e => setNewCity({...newCity, name: e.target.value})}
                            className="w-full h-16 bg-black border border-white/10 rounded-2xl px-6 text-sm font-bold focus:border-primary focus:ring-0 outline-none transition-all"
                            placeholder="ex: Bertoua"
                          />
                       </div>
                       <div className="space-y-3">
                          <label className="block text-[10px] font-black text-gray-600 uppercase tracking-widest">Région</label>
                          <select 
                            value={newCity.region} onChange={e => setNewCity({...newCity, region: e.target.value})}
                            className="w-full h-16 bg-black border border-white/10 rounded-2xl px-6 text-sm font-bold focus:border-primary outline-none appearance-none"
                          >
                             {["Centre", "Littoral", "Ouest", "Nord", "Sud", "Adamaoua", "Est", "Extrême-Nord", "Nord-Ouest", "Sud-Ouest"].map(r => (
                               <option key={r} value={r}>{r}</option>
                             ))}
                          </select>
                       </div>
                       <button type="submit" className="w-full py-6 bg-primary text-black font-black uppercase text-xs tracking-[0.2em] rounded-2xl shadow-2xl shadow-primary/10 hover:shadow-primary/30 transition-all">
                          Publier la Ville
                       </button>
                    </form>
                    
                    {cities.length === 0 && (
                        <button onClick={handleSeedData} className="w-full mt-4 py-3 border border-white/5 rounded-2xl text-[10px] font-black text-gray-500 uppercase tracking-widest hover:text-white transition-all">
                            Seeder les données par défaut
                        </button>
                    )}
                 </div>
              </div>

              <div className="lg:col-span-2">
                 <div className="grid sm:grid-cols-2 gap-6">
                    {cities.map(city => (
                       <div key={city.id} className="bg-white/5 border border-white/10 p-8 rounded-3xl flex items-center justify-between group hover:border-primary/40 transition-all shadow-xl">
                          <div className="flex items-center gap-6">
                             <div className="size-14 rounded-2xl bg-black border border-white/5 flex items-center justify-center text-primary shadow-inner">
                                <span className="material-symbols-outlined text-2xl">location_on</span>
                             </div>
                             <div>
                                <div className="font-black text-xl tracking-tight">{city.name}</div>
                                <div className="text-[10px] text-gray-600 font-black uppercase tracking-widest">{city.region}</div>
                             </div>
                          </div>
                          <button onClick={() => deleteDocItem('cities', city.id)} className="size-10 rounded-xl text-gray-700 hover:text-red-500 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all">
                             <span className="material-symbols-outlined text-xl">delete</span>
                          </button>
                       </div>
                    ))}
                 </div>
              </div>
           </div>
        )}

        {/* SECTION: USERS */}
        {activeTab === 'users' && (
           <div className="bg-white/5 border border-white/10 rounded-[3rem] overflow-hidden animate-fadeIn shadow-2xl backdrop-blur-md">
              <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead className="bg-white/5 text-[10px] font-black text-gray-700 uppercase tracking-[0.3em]">
                       <tr>
                          <th className="px-10 py-8">Utilisateur</th>
                          <th className="px-10 py-8">Email / Contact</th>
                          <th className="px-10 py-8">Rôle Système</th>
                          <th className="px-10 py-8 text-right">Actions</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                       {users.map(u => (
                          <tr key={u.uid} className="hover:bg-white/5 transition-colors group">
                             <td className="px-10 py-8">
                                <div className="flex items-center gap-5">
                                   <div className="size-14 rounded-2xl bg-gray-900 border border-white/10 flex items-center justify-center font-black text-primary text-lg shadow-2xl">
                                      {u.avatar || u.name.charAt(0)}
                                   </div>
                                   <div className="font-black text-base tracking-tight">{u.name}</div>
                                </div>
                             </td>
                             <td className="px-10 py-8 text-xs font-mono text-gray-600">{u.email}</td>
                             <td className="px-10 py-8">
                                <select 
                                  value={u.role} 
                                  onChange={(e) => updateUserRole(u.uid, e.target.value as UserRole)}
                                  className={`bg-transparent border-none text-[10px] font-black uppercase tracking-widest focus:ring-0 cursor-pointer transition-colors ${
                                    u.role === 'super_admin' ? 'text-purple-500' : u.role === 'agency_admin' ? 'text-blue-500' : 'text-gray-500'
                                  }`}
                                >
                                   <option value="user">Passager Standard</option>
                                   <option value="agency_admin">Directeur Agence</option>
                                   <option value="station_manager">Chef de Gare</option>
                                   <option value="super_admin">Super Administrateur</option>
                                </select>
                             </td>
                             <td className="px-10 py-8 text-right">
                                <button className="size-12 rounded-2xl text-gray-700 hover:text-white hover:bg-white/5 transition-all">
                                   <span className="material-symbols-outlined text-2xl">settings</span>
                                </button>
                             </td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>
        )}

        {/* SECTION: REVENUE */}
        {activeTab === 'revenue' && (
           <div className="space-y-12 animate-fadeIn">
              <div className="bg-white/5 border border-white/10 rounded-[3rem] p-12 backdrop-blur-sm">
                 <h3 className="text-2xl font-black mb-10 uppercase tracking-widest text-gray-600">Flux de Trésorerie Récents</h3>
                 <div className="space-y-6">
                    {transactions.map(t => (
                       <div key={t.id} className="flex items-center justify-between p-7 rounded-[2rem] bg-black/40 border border-white/5 hover:border-primary/20 transition-all">
                          <div className="flex items-center gap-6">
                             <div className="size-14 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-500">
                                <span className="material-symbols-outlined text-3xl">receipt_long</span>
                             </div>
                             <div>
                                <div className="font-black text-lg">{t.userName}</div>
                                <div className="text-[10px] text-gray-600 uppercase font-black tracking-widest">Payé à {t.agencyName}</div>
                             </div>
                          </div>
                          <div className="text-right">
                             <div className="text-2xl font-black text-primary">+{t.amount.toLocaleString()} <span className="text-xs font-normal">FCFA</span></div>
                             <div className="text-[10px] text-gray-700 font-bold uppercase tracking-tighter">Réussi • CB-{t.id.slice(0, 6)}</div>
                          </div>
                       </div>
                    ))}
                    {transactions.length === 0 && (
                        <div className="text-center py-20 text-gray-700">Aucune transaction enregistrée.</div>
                    )}
                 </div>
              </div>
           </div>
        )}

      </main>

      {/* MODAL SYSTEM: AGENCIES */}
      {isAgencyModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-black/95 backdrop-blur-2xl animate-fadeIn">
           <div className="bg-[#0a0a0a] border border-white/10 w-full max-w-xl rounded-[3.5rem] p-16 shadow-[0_0_150px_rgba(19,236,91,0.08)] relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-primary"></div>
              
              <div className="flex justify-between items-center mb-12">
                 <h3 className="text-4xl font-black tracking-tighter">
                   {editingAgency ? "Éditer l'Agence" : "Nouveau Partenaire"}
                 </h3>
                 <button onClick={() => setIsAgencyModalOpen(false)} className="size-12 rounded-full hover:bg-white/5 flex items-center justify-center transition-colors">
                    <span className="material-symbols-outlined text-2xl text-gray-500">close</span>
                 </button>
              </div>

              <form onSubmit={saveAgency} className="space-y-10">
                 <div className="space-y-3">
                    <label className="block text-[10px] font-black text-gray-700 uppercase tracking-widest">Nom de la Compagnie</label>
                    <input 
                      type="text" required value={agencyForm.name} onChange={e => setAgencyForm({...agencyForm, name: e.target.value})}
                      className="w-full h-16 bg-black border border-white/10 rounded-2xl px-7 text-sm font-bold focus:border-primary outline-none"
                      placeholder="ex: Finexs Voyages"
                    />
                 </div>
                 <div className="space-y-3">
                    <label className="block text-[10px] font-black text-gray-700 uppercase tracking-widest">Email Professionnel</label>
                    <input 
                      type="email" required value={agencyForm.email} onChange={e => setAgencyForm({...agencyForm, email: e.target.value})}
                      className="w-full h-16 bg-black border border-white/10 rounded-2xl px-7 text-sm font-bold focus:border-primary outline-none"
                      placeholder="admin@agence.cm"
                    />
                 </div>
                 <div className="space-y-3">
                    <label className="block text-[10px] font-black text-gray-700 uppercase tracking-widest">Couleur de Marque</label>
                    <div className="flex items-center gap-8 bg-black border border-white/10 rounded-2xl px-7 py-4">
                       <input type="color" value={agencyForm.color} onChange={e => setAgencyForm({...agencyForm, color: e.target.value})} className="size-12 rounded-xl cursor-pointer bg-transparent border-none p-0" />
                       <span className="font-mono text-xs uppercase text-gray-600 font-black tracking-widest">{agencyForm.color}</span>
                    </div>
                 </div>
                 
                 <div className="flex gap-6 pt-10">
                    <button type="button" onClick={() => setIsAgencyModalOpen(false)} className="flex-1 py-6 text-xs font-black uppercase tracking-widest text-gray-700 hover:text-white transition-colors">Annuler</button>
                    <button type="submit" className="flex-1 py-6 bg-primary text-black font-black uppercase text-xs tracking-[0.2em] rounded-2xl shadow-2xl shadow-primary/20">Sauvegarder</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminDashboard;