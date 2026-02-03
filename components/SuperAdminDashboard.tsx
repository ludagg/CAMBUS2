
import React, { useState } from 'react';
import { useNavigation, UserRole } from '../contexts/NavigationContext';
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";

const SuperAdminDashboard: React.FC = () => {
  const { user, logout } = useNavigation();
  const [activeTab, setActiveTab] = useState('overview');
  
  // Convex Queries (Réactivité automatique)
  const agencies = useQuery(api.functions.getAllAgencies) || [];
  const cities = useQuery(api.functions.getAllCities) || [];
  const users = useQuery(api.functions.getAllUsers) || [];
  const latestBookings = useQuery(api.functions.getLatestBookings, { limit: 15 }) || [];

  // Convex Mutations
  const createAgency = useMutation(api.functions.createAgency);
  const updateAgencyStatus = useMutation(api.functions.updateAgencyStatus);
  const deleteAgencyMutation = useMutation(api.functions.deleteAgency);
  const createCityMutation = useMutation(api.functions.createCity);
  const deleteCityMutation = useMutation(api.functions.deleteCity);
  const updateUserRoleMutation = useMutation(api.functions.updateUserRole);

  // UI States
  const [isAgencyModalOpen, setIsAgencyModalOpen] = useState(false);
  const [agencyForm, setAgencyForm] = useState({ name: '', email: '', color: '#13ec5b' });
  const [newCity, setNewCity] = useState({ name: '', region: 'Centre' });

  // --- ACTIONS ---

  const handleCreateAgency = async (e: React.FormEvent) => {
    e.preventDefault();
    await createAgency({ ...agencyForm, logo: 'directions_bus' });
    setAgencyForm({ name: '', email: '', color: '#13ec5b' });
    setIsAgencyModalOpen(false);
  };

  const handleAddCity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCity.name) return;
    await createCityMutation(newCity);
    setNewCity({ name: '', region: 'Centre' });
  };

  const totalRevenue = latestBookings.reduce((acc, curr) => acc + curr.totalPrice, 0);

  const SidebarItem = ({ id, icon, label }: any) => (
    <button 
      onClick={() => setActiveTab(id)}
      className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${
        activeTab === id 
          ? 'bg-primary text-black font-black shadow-2xl shadow-primary/20 scale-[1.02]' 
          : 'text-gray-500 hover:bg-white/5 hover:text-white'
      }`}
    >
      <span className="material-symbols-outlined text-[24px]">{icon}</span>
      <span className="text-sm font-bold tracking-tight">{label}</span>
    </button>
  );

  return (
    <div className="flex h-screen bg-[#020202] text-white overflow-hidden font-display">
      
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-80 bg-black border-r border-white/5 flex flex-col p-8 z-20 shadow-[20px_0_50px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-4 mb-16 px-2">
           <div className="size-12 bg-primary rounded-2xl flex items-center justify-center text-black shadow-xl shadow-primary/20 rotate-6">
              <span className="material-symbols-outlined font-black text-2xl">shield_person</span>
           </div>
           <div>
              <div className="font-black text-2xl tracking-tighter leading-none">CamBus</div>
              <div className="text-[10px] text-primary font-black uppercase tracking-[0.4em] mt-2 opacity-80">Convex Engine</div>
           </div>
        </div>

        <nav className="flex-1 space-y-2">
           <div className="px-6 mb-4 text-[10px] font-black text-gray-700 uppercase tracking-[0.25em]">Principal</div>
           <SidebarItem id="overview" icon="grid_view" label="Dashboard" />
           <SidebarItem id="agencies" icon="business_center" label="Partenaires" />
           <SidebarItem id="cities" icon="map" label="Réseau National" />
           <SidebarItem id="users" icon="group" label="Utilisateurs" />
        </nav>

        <div className="mt-auto pt-8">
           <div className="bg-[#0a0a0a] p-6 rounded-[2.5rem] border border-white/5">
              <div className="flex items-center gap-4 mb-6">
                 <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center font-black text-primary border border-primary/20 shadow-lg">
                    {user?.avatar || 'SA'}
                 </div>
                 <div className="min-w-0">
                    <div className="text-sm font-black truncate text-gray-200">{user?.name}</div>
                    <div className="text-[10px] text-gray-500 font-bold uppercase">Master Admin</div>
                 </div>
              </div>
              <button onClick={logout} className="w-full py-4 bg-red-500/10 text-red-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all border border-red-500/10">
                 Déconnexion
              </button>
           </div>
        </div>
      </aside>

      {/* MAIN VIEWPORT */}
      <main className="flex-1 overflow-y-auto p-12 lg:p-20 custom-scrollbar relative">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[200px] -z-10 -translate-y-1/2 translate-x-1/2"></div>
        
        <header className="flex flex-col md:flex-row justify-between items-start gap-8 mb-20">
           <div>
              <h1 className="text-6xl font-black uppercase tracking-tighter mb-4 text-white">
                 {activeTab === 'overview' && "Console"}
                 {activeTab === 'agencies' && "Agences"}
                 {activeTab === 'cities' && "Réseau"}
                 {activeTab === 'users' && "Identités"}
              </h1>
              <p className="text-gray-500 text-lg font-medium">Propulsé par Convex Realtime DB.</p>
           </div>
           
           <div className="bg-white/5 border border-white/10 rounded-[2rem] px-8 py-5 flex items-center gap-6 shadow-2xl backdrop-blur-3xl">
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1">Backend</span>
                <span className="text-xs font-black text-primary">Convex Syncing...</span>
              </div>
              <div className="size-4 rounded-full bg-primary animate-pulse shadow-[0_0_20px_rgba(19,236,91,0.8)]"></div>
           </div>
        </header>

        {/* --- CONTENT: OVERVIEW --- */}
        {activeTab === 'overview' && (
           <div className="space-y-16 animate-fadeIn">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
                 {[
                   { label: "Volume Ventes", value: totalRevenue.toLocaleString(), sub: "FCFA", icon: "payments", color: "text-green-500" },
                   { label: "Agences", value: agencies.length, sub: "Actives", icon: "business", color: "text-blue-500" },
                   { label: "Villes", value: cities.length, sub: "Connectées", icon: "map", color: "text-primary" },
                   { label: "Membres", value: users.length, sub: "Inscrits", icon: "group", color: "text-purple-500" }
                 ].map((stat, i) => (
                    <div key={i} className="bg-white/5 border border-white/5 p-10 rounded-[3rem] hover:border-primary/40 transition-all group shadow-xl hover:-translate-y-2">
                       <div className={`size-16 rounded-[1.5rem] ${stat.color} bg-white/5 flex items-center justify-center mb-10 shadow-lg group-hover:scale-110 transition-transform`}>
                          <span className="material-symbols-outlined text-4xl">{stat.icon}</span>
                       </div>
                       <div className="text-5xl font-black mb-2 tabular-nums">{stat.value}</div>
                       <div className="text-sm font-bold text-gray-500 flex items-center justify-between uppercase tracking-widest">
                         <span>{stat.label}</span>
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        )}

        {/* --- CONTENT: AGENCIES --- */}
        {activeTab === 'agencies' && (
           <div className="space-y-14 animate-fadeIn">
              <div className="flex justify-between items-center">
                 <h2 className="text-3xl font-black text-gray-600 uppercase tracking-[0.2em]">Partenaires ({agencies.length})</h2>
                 <button 
                  onClick={() => setIsAgencyModalOpen(true)}
                  className="px-12 py-6 bg-primary text-black font-black text-sm uppercase tracking-widest rounded-[2rem] hover:bg-white transition-all shadow-xl shadow-primary/20"
                 >
                    + Enregistrer Agence
                 </button>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-12">
                 {agencies.map(agency => (
                    <div key={agency._id} className="bg-white/5 border border-white/5 p-12 rounded-[3.5rem] relative overflow-hidden group hover:border-primary/50 transition-all shadow-2xl">
                       <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-100 transition-all flex gap-4">
                          <button onClick={() => deleteAgencyMutation({ id: agency._id })} className="size-12 rounded-2xl bg-red-500/10 backdrop-blur-3xl text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white shadow-xl">
                             <span className="material-symbols-outlined text-sm">delete</span>
                          </button>
                       </div>
                       
                       <div className="size-28 rounded-[2.5rem] flex items-center justify-center mb-10 border border-white/5" style={{ backgroundColor: agency.color + '10', color: agency.color }}>
                          <span className="material-symbols-outlined text-7xl">{agency.logo}</span>
                       </div>
                       
                       <h4 className="text-4xl font-black mb-2 tracking-tighter text-gray-100">{agency.name}</h4>
                       <p className="text-sm text-gray-500 font-bold mb-12 opacity-80 font-mono">{agency.email}</p>
                       
                       <div className="flex justify-between items-center pt-10 border-t border-white/5">
                          <button 
                            onClick={() => updateAgencyStatus({ id: agency._id, status: agency.status === 'active' ? 'inactive' : 'active' })}
                            className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${agency.status === 'active' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}
                          >
                             {agency.status === 'active' ? 'Opérationnelle' : 'Interrompue'}
                          </button>
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        )}

        {/* --- CONTENT: CITIES --- */}
        {activeTab === 'cities' && (
           <div className="grid lg:grid-cols-3 gap-20 animate-fadeIn">
              <div className="lg:col-span-1">
                 <div className="bg-white/5 border border-white/5 p-14 rounded-[4rem] sticky top-14 backdrop-blur-3xl shadow-2xl">
                    <h3 className="text-4xl font-black mb-12 tracking-tighter">Nouveau Terminal</h3>
                    <form onSubmit={handleAddCity} className="space-y-10">
                       <div className="space-y-4">
                          <label className="block text-[10px] font-black text-gray-700 uppercase tracking-[0.3em]">Toponyme</label>
                          <input 
                            type="text" required value={newCity.name} onChange={e => setNewCity({...newCity, name: e.target.value})}
                            className="w-full h-16 bg-[#050505] border border-white/5 rounded-3xl px-8 text-base font-bold focus:border-primary outline-none transition-all shadow-inner"
                            placeholder="ex: Bertoua"
                          />
                       </div>
                       <div className="space-y-4">
                          <label className="block text-[10px] font-black text-gray-700 uppercase tracking-[0.3em]">Région</label>
                          <select 
                                value={newCity.region} onChange={e => setNewCity({...newCity, region: e.target.value})}
                                className="w-full h-16 bg-[#050505] border border-white/5 rounded-3xl px-8 text-base font-bold focus:border-primary outline-none appearance-none cursor-pointer"
                            >
                                {["Centre", "Littoral", "Ouest", "Nord", "Sud", "Adamaoua", "Est", "Extrême-Nord", "Nord-Ouest", "Sud-Ouest"].map(r => (
                                <option key={r} value={r}>{r}</option>
                                ))}
                            </select>
                       </div>
                       <button type="submit" className="w-full py-6 bg-primary text-black font-black uppercase text-xs tracking-[0.25em] rounded-3xl shadow-[0_20px_50px_rgba(19,236,91,0.15)] hover:shadow-primary/30 transition-all hover:-translate-y-2">
                          Mettre à jour le Réseau
                       </button>
                    </form>
                 </div>
              </div>

              <div className="lg:col-span-2">
                 <div className="grid sm:grid-cols-2 gap-8">
                    {cities.map(city => (
                       <div key={city._id} className="bg-white/5 border border-white/5 p-10 rounded-[2.5rem] flex items-center justify-between group hover:border-primary/40 transition-all shadow-xl hover:-translate-y-1">
                          <div className="flex items-center gap-8">
                             <div className="size-16 rounded-[1.5rem] bg-[#050505] border border-white/5 flex items-center justify-center text-primary shadow-2xl transition-transform">
                                <span className="material-symbols-outlined text-3xl">location_on</span>
                             </div>
                             <div>
                                <div className="font-black text-2xl tracking-tight text-gray-200">{city.name}</div>
                                <div className="text-[10px] text-gray-700 font-black uppercase tracking-[0.2em] mt-1">{city.region}</div>
                             </div>
                          </div>
                          <button onClick={() => deleteCityMutation({ id: city._id })} className="size-12 rounded-2xl text-gray-800 hover:text-red-500 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                             <span className="material-symbols-outlined text-2xl">delete_forever</span>
                          </button>
                       </div>
                    ))}
                 </div>
              </div>
           </div>
        )}

        {/* --- CONTENT: USERS --- */}
        {activeTab === 'users' && (
           <div className="bg-white/5 border border-white/5 rounded-[4rem] overflow-hidden animate-fadeIn shadow-[0_50px_100px_rgba(0,0,0,0.5)] backdrop-blur-3xl">
              <div className="overflow-x-auto custom-scrollbar">
                 <table className="w-full text-left">
                    <thead className="bg-white/5 text-[10px] font-black text-gray-700 uppercase tracking-[0.4em]">
                       <tr>
                          <th className="px-12 py-10">Membre</th>
                          <th className="px-12 py-10">Email</th>
                          <th className="px-12 py-10">Privilèges</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                       {users.map(u => (
                          <tr key={u._id} className="hover:bg-white/5 transition-colors group">
                             <td className="px-12 py-10">
                                <div className="flex items-center gap-6">
                                   <div className="size-14 rounded-2xl bg-[#050505] border border-white/5 flex items-center justify-center font-black text-primary text-lg shadow-2xl transition-transform group-hover:scale-110">
                                      {u.avatar || u.name.charAt(0)}
                                   </div>
                                   <div className="font-black text-lg tracking-tight text-gray-100">{u.name}</div>
                                </div>
                             </td>
                             <td className="px-12 py-10 text-xs font-mono text-gray-600 font-bold">{u.email}</td>
                             <td className="px-12 py-10">
                                <select 
                                  value={u.role} 
                                  onChange={(e) => updateUserRoleMutation({ id: u._id, role: e.target.value })}
                                  className={`bg-transparent border-none text-[10px] font-black uppercase tracking-[0.2em] focus:ring-0 cursor-pointer transition-colors ${
                                    u.role === 'super_admin' ? 'text-purple-500' : u.role === 'agency_admin' ? 'text-blue-500' : 'text-gray-500'
                                  }`}
                                >
                                   <option value="user">Passager</option>
                                   <option value="agency_admin">Directeur</option>
                                   <option value="super_admin">Master</option>
                                </select>
                             </td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>
        )}

      </main>

      {/* --- MODAL SYSTEM: AGENCIES --- */}
      {isAgencyModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-black/98 backdrop-blur-[100px] animate-fadeIn">
           <div className="bg-black border border-white/10 w-full max-w-2xl rounded-[4rem] p-20 shadow-[0_0_200px_rgba(19,236,91,0.1)] relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-3 bg-primary"></div>
              
              <div className="flex justify-between items-center mb-16">
                 <h3 className="text-5xl font-black tracking-tighter text-white">Nouveau Partenaire</h3>
                 <button onClick={() => setIsAgencyModalOpen(false)} className="size-14 rounded-full hover:bg-white/5 flex items-center justify-center transition-all group">
                    <span className="material-symbols-outlined text-3xl text-gray-600 group-hover:text-white">close</span>
                 </button>
              </div>

              <form onSubmit={handleCreateAgency} className="space-y-12">
                 <div className="space-y-4">
                    <label className="block text-[10px] font-black text-gray-700 uppercase tracking-[0.3em]">Raison Sociale</label>
                    <input 
                      type="text" required value={agencyForm.name} onChange={e => setAgencyForm({...agencyForm, name: e.target.value})}
                      className="w-full h-20 bg-[#050505] border border-white/10 rounded-3xl px-8 text-lg font-bold focus:border-primary outline-none shadow-2xl"
                      placeholder="ex: Finexs Voyages"
                    />
                 </div>
                 <div className="space-y-4">
                    <label className="block text-[10px] font-black text-gray-700 uppercase tracking-[0.3em]">Email Corporate</label>
                    <input 
                      type="email" required value={agencyForm.email} onChange={e => setAgencyForm({...agencyForm, email: e.target.value})}
                      className="w-full h-20 bg-[#050505] border border-white/10 rounded-3xl px-8 text-lg font-bold focus:border-primary outline-none shadow-2xl"
                      placeholder="admin@agence.cm"
                    />
                 </div>
                 <div className="space-y-4">
                    <label className="block text-[10px] font-black text-gray-700 uppercase tracking-[0.3em]">Couleur de Marque</label>
                    <div className="flex items-center gap-10 bg-[#050505] border border-white/10 rounded-3xl px-10 py-6">
                       <input type="color" value={agencyForm.color} onChange={e => setAgencyForm({...agencyForm, color: e.target.value})} className="size-14 rounded-2xl cursor-pointer bg-transparent border-none p-0" />
                       <span className="font-mono text-base uppercase text-gray-600 font-black tracking-widest">{agencyForm.color}</span>
                    </div>
                 </div>
                 
                 <div className="flex gap-8 pt-12">
                    <button type="button" onClick={() => setIsAgencyModalOpen(false)} className="flex-1 py-6 text-xs font-black uppercase tracking-[0.3em] text-gray-700 hover:text-white transition-all">Annuler</button>
                    <button type="submit" className="flex-1 py-6 bg-primary text-black font-black uppercase text-xs tracking-[0.3em] rounded-3xl shadow-2xl hover:shadow-primary/40 transition-all hover:-translate-y-2">Confirmer & Enregistrer</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminDashboard;
