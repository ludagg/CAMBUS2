import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigation } from '../contexts/NavigationContext';

const SuperAdminDashboard: React.FC = () => {
  const { t } = useLanguage();
  const { user, logout } = useNavigation();
  const [activeTab, setActiveTab] = useState('overview');

  // Sidebar item component
  const NavItem = ({ id, icon, label }: any) => (
    <button 
      onClick={() => setActiveTab(id)}
      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all font-bold ${activeTab === id ? 'bg-white text-black shadow-md' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
    >
      <span className="material-symbols-outlined">{icon}</span>
      <span>{label}</span>
    </button>
  );

  return (
    <div className="flex min-h-screen bg-[#111] text-white font-display">
      
      {/* Sidebar - Dark & Executive */}
      <aside className="w-72 bg-black border-r border-gray-800 p-6 flex flex-col">
        <div className="flex items-center gap-3 mb-10 px-2">
           <div className="size-8 rounded bg-primary flex items-center justify-center text-black">
             <span className="material-symbols-outlined">admin_panel_settings</span>
           </div>
           <div className="font-black text-xl tracking-tight">CamBus <span className="text-primary">Admin</span></div>
        </div>

        <nav className="flex-1 space-y-2">
           <div className="text-xs font-bold text-gray-500 uppercase px-3 mb-2">Platform</div>
           <NavItem id="overview" icon="dashboard" label="Vue d'ensemble" />
           <NavItem id="agencies" icon="business" label="Agences" />
           <NavItem id="users" icon="group" label="Utilisateurs" />
           
           <div className="text-xs font-bold text-gray-500 uppercase px-3 mb-2 mt-8">Finance</div>
           <NavItem id="revenue" icon="payments" label="Revenus" />
           <NavItem id="payouts" icon="account_balance" label="Reversements" />
        </nav>

        <div className="pt-6 border-t border-gray-800">
           <div className="flex items-center gap-3 px-3 mb-4">
              <div className="size-10 rounded-full bg-gray-800 flex items-center justify-center font-bold text-gray-400 border border-gray-700">SA</div>
              <div className="flex-1 min-w-0">
                 <div className="truncate font-bold text-sm">Super Admin</div>
                 <div className="truncate text-xs text-gray-500">owner@cambus.cm</div>
              </div>
           </div>
           <button onClick={logout} className="w-full py-2 bg-red-900/20 text-red-500 rounded-lg text-sm font-bold hover:bg-red-900/40 transition-colors">
              Déconnexion
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
         <header className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-black">
               {activeTab === 'overview' && "Tableau de Bord"}
               {activeTab === 'agencies' && "Gestion des Agences"}
               {activeTab === 'users' && "Utilisateurs Inscrits"}
               {activeTab === 'revenue' && "Revenus Plateforme"}
            </h1>
            <div className="flex items-center gap-4">
               <span className="size-2 rounded-full bg-green-500 animate-pulse"></span>
               <span className="text-sm font-mono text-gray-400">Système Opérationnel</span>
            </div>
         </header>

         {activeTab === 'overview' && (
           <div className="space-y-8 animate-fadeIn">
              {/* KPIs */}
              <div className="grid grid-cols-4 gap-6">
                 <div className="bg-[#1a1a1a] p-6 rounded-2xl border border-gray-800">
                    <div className="text-gray-400 text-sm font-bold mb-1">Chiffre d'Affaires Total</div>
                    <div className="text-3xl font-black text-white">45.2M <span className="text-sm text-gray-500 font-normal">FCFA</span></div>
                    <div className="mt-4 text-green-500 text-xs font-bold flex items-center gap-1">
                       <span className="material-symbols-outlined text-sm">trending_up</span> +12% ce mois
                    </div>
                 </div>
                 <div className="bg-[#1a1a1a] p-6 rounded-2xl border border-gray-800">
                    <div className="text-gray-400 text-sm font-bold mb-1">Agences Actives</div>
                    <div className="text-3xl font-black text-white">4</div>
                    <div className="mt-4 text-gray-500 text-xs font-bold">Sur 6 inscrites</div>
                 </div>
                 <div className="bg-[#1a1a1a] p-6 rounded-2xl border border-gray-800">
                    <div className="text-gray-400 text-sm font-bold mb-1">Billets Vendus</div>
                    <div className="text-3xl font-black text-white">12,450</div>
                 </div>
                 <div className="bg-[#1a1a1a] p-6 rounded-2xl border border-gray-800">
                    <div className="text-gray-400 text-sm font-bold mb-1">Commissions (10%)</div>
                    <div className="text-3xl font-black text-primary">4.5M <span className="text-sm text-gray-500 font-normal">FCFA</span></div>
                 </div>
              </div>

              {/* Agencies List Preview */}
              <div className="bg-[#1a1a1a] rounded-2xl border border-gray-800 p-6">
                 <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-lg">Performance des Agences</h3>
                    <button onClick={() => setActiveTab('agencies')} className="text-sm text-primary hover:underline">Voir tout</button>
                 </div>
                 <table className="w-full text-left">
                    <thead className="text-xs uppercase text-gray-500 border-b border-gray-800">
                       <tr>
                          <th className="pb-3 pl-2">Agence</th>
                          <th className="pb-3">Statut</th>
                          <th className="pb-3">Ventes du mois</th>
                          <th className="pb-3 text-right pr-2">Actions</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800 text-sm">
                       {[
                         { name: 'Express Voyage', status: 'active', sales: '15.4M' },
                         { name: 'GreenLines', status: 'active', sales: '8.2M' },
                         { name: 'CityLink', status: 'warning', sales: '2.1M' }
                       ].map((agency, idx) => (
                         <tr key={idx} className="hover:bg-white/5 transition-colors">
                            <td className="py-4 pl-2 font-bold">{agency.name}</td>
                            <td className="py-4">
                               <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${agency.status === 'active' ? 'bg-green-900/30 text-green-500' : 'bg-yellow-900/30 text-yellow-500'}`}>
                                  {agency.status}
                               </span>
                            </td>
                            <td className="py-4 text-gray-300">{agency.sales} FCFA</td>
                            <td className="py-4 text-right pr-2">
                               <button className="text-gray-400 hover:text-white">Gérer</button>
                            </td>
                         </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>
         )}

         {activeTab === 'agencies' && (
             <div className="bg-[#1a1a1a] rounded-2xl border border-gray-800 p-8 text-center animate-fadeIn">
                <div className="size-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                   <span className="material-symbols-outlined text-4xl text-gray-400">add_business</span>
                </div>
                <h2 className="text-xl font-bold mb-2">Ajouter une Agence</h2>
                <p className="text-gray-400 mb-6 max-w-md mx-auto">Créez un compte pour une nouvelle compagnie de transport. Ils recevront un email pour configurer leur flotte.</p>
                <button className="bg-primary text-black px-6 py-3 rounded-lg font-bold hover:bg-white transition-colors">
                   Configuration Nouvelle Agence
                </button>
             </div>
         )}
      </main>
    </div>
  );
};

export default SuperAdminDashboard;