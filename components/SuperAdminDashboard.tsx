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
  id: string; // ID Firestore est un string
  name: string;
  region: string;
  status: 'active' | 'inactive';
}

const SuperAdminDashboard: React.FC = () => {
  const { user, logout } = useNavigation();
  const [activeTab, setActiveTab] = useState('overview');

  // --- STATE POUR LES VILLES (FIRESTORE) ---
  const [cities, setCities] = useState<City[]>([]);
  const [isLoadingCities, setIsLoadingCities] = useState(true);

  const [newCityName, setNewCityName] = useState('');
  const [newCityRegion, setNewCityRegion] = useState('');

  // --- 2. EFFET DE CHARGEMENT TEMPS RÉEL (LISTENER) ---
  useEffect(() => {
    if (activeTab === 'cities' || activeTab === 'overview') {
      const q = query(collection(db, 'cities'), orderBy('name'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const citiesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as City[];
        setCities(citiesData);
        setIsLoadingCities(false);
      }, (error) => {
        console.error("Erreur lecture villes:", error);
        setIsLoadingCities(false);
      });
      return () => unsubscribe();
    }
  }, [activeTab]);

  // --- ACTIONS VILLES (CRUD FIRESTORE) ---
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
    } catch (error: any) {
      console.error("Erreur lors de l'ajout de la ville:", error);
      if (error.code === 'permission-denied') {
          alert("ERREUR PERMISSION: Vous n'avez pas les droits pour écrire. Vérifiez que vous êtes bien connecté avec un compte 'super_admin'.");
      } else {
          alert(`Erreur technique: ${error.message}`);
      }
    }
  };

  const toggleCityStatus = async (id: string, currentStatus: string) => {
    try {
      const cityRef = doc(db, 'cities', id);
      await updateDoc(cityRef, {
        status: currentStatus === 'active' ? 'inactive' : 'active'
      });
    } catch (error: any) {
      console.error("Erreur lors de la mise à jour:", error);
      alert("Erreur mise à jour: " + error.message);
    }
  };

  const deleteCity = async (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette ville ? Cette action est irréversible.')) {
      try {
        await deleteDoc(doc(db, 'cities', id));
      } catch (error: any) {
        console.error("Erreur lors de la suppression:", error);
        alert("Erreur suppression: " + error.message);
      }
    }
  };

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
           <NavItem id="cities" icon="location_city" label="Villes & Terminaux" />
           <NavItem id="users" icon="group" label="Utilisateurs" />
           
           <div className="text-xs font-bold text-gray-500 uppercase px-3 mb-2 mt-8">Finance</div>
           <NavItem id="revenue" icon="payments" label="Revenus" />
           <NavItem id="payouts" icon="account_balance" label="Reversements" />
        </nav>

        <div className="pt-6 border-t border-gray-800">
           <div className="flex items-center gap-3 px-3 mb-4">
              <div className="size-10 rounded-full bg-gray-800 flex items-center justify-center font-bold text-gray-400 border border-gray-700">
                  {user?.avatar || 'SA'}
              </div>
              <div className="flex-1 min-w-0">
                 <div className="truncate font-bold text-sm">{user?.name}</div>
                 <div className="truncate text-xs text-gray-500">{user?.email}</div>
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
               {activeTab === 'cities' && "Gestion des Villes"}
               {activeTab === 'users' && "Utilisateurs Inscrits"}
               {activeTab === 'revenue' && "Revenus Plateforme"}
            </h1>
            <div className="flex items-center gap-4">
               <span className="size-2 rounded-full bg-green-500 animate-pulse"></span>
               <span className="text-sm font-mono text-gray-400">Système Opérationnel</span>
            </div>
         </header>

         {/* VUE: TABLEAU DE BORD (OVERVIEW) */}
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
                    <div className="text-gray-400 text-sm font-bold mb-1">Villes Desservies</div>
                    <div className="text-3xl font-black text-white">
                        {isLoadingCities ? '...' : cities.filter(c => c.status === 'active').length}
                    </div>
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

         {/* VUE: GESTION DES AGENCES */}
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

         {/* VUE: GESTION DES VILLES (CITIES) */}
         {activeTab === 'cities' && (
           <div className="space-y-6 animate-fadeIn">
              
              {/* Formulaire Ajout Rapide */}
              <div className="bg-[#1a1a1a] p-6 rounded-2xl border border-gray-800">
                 <h3 className="font-bold text-lg mb-4">Ajouter une nouvelle destination</h3>
                 <form onSubmit={handleAddCity} className="flex gap-4">
                    <div className="flex-1">
                       <input 
                         type="text" 
                         placeholder="Nom de la ville (ex: Maroua)" 
                         value={newCityName}
                         onChange={(e) => setNewCityName(e.target.value)}
                         className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-primary outline-none"
                       />
                    </div>
                    <div className="w-1/3">
                       <select 
                         value={newCityRegion}
                         onChange={(e) => setNewCityRegion(e.target.value)}
                         className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-primary outline-none"
                       >
                         <option value="">Sélectionner Région</option>
                         <option value="Centre">Centre</option>
                         <option value="Littoral">Littoral</option>
                         <option value="Ouest">Ouest</option>
                         <option value="Nord">Nord</option>
                         <option value="Extrême-Nord">Extrême-Nord</option>
                         <option value="Adamaoua">Adamaoua</option>
                         <option value="Est">Est</option>
                         <option value="Sud">Sud</option>
                         <option value="Nord-Ouest">Nord-Ouest</option>
                         <option value="Sud-Ouest">Sud-Ouest</option>
                       </select>
                    </div>
                    <button type="submit" className="bg-primary text-black font-bold px-6 py-3 rounded-lg hover:bg-white transition-colors flex items-center gap-2">
                       <span className="material-symbols-outlined">add</span> Ajouter
                    </button>
                 </form>
              </div>

              {/* Liste des Villes */}
              <div className="bg-[#1a1a1a] rounded-2xl border border-gray-800 p-6">
                 <h3 className="font-bold text-lg mb-4">Villes Disponibles ({cities.length})</h3>
                 
                 {isLoadingCities ? (
                    <div className="py-12 text-center text-gray-500">Chargement des données...</div>
                 ) : cities.length === 0 ? (
                    <div className="py-12 text-center text-gray-500">Aucune ville configurée. Commencez par en ajouter une.</div>
                 ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {cities.map(city => (
                        <div key={city.id} className="bg-black border border-gray-800 rounded-xl p-4 flex items-center justify-between group hover:border-gray-600 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className={`size-10 rounded-lg flex items-center justify-center ${city.status === 'active' ? 'bg-blue-900/30 text-blue-500' : 'bg-gray-800 text-gray-500'}`}>
                                    <span className="material-symbols-outlined">location_city</span>
                                </div>
                                <div>
                                    <div className={`font-bold ${city.status === 'inactive' ? 'text-gray-500 line-through' : 'text-white'}`}>{city.name}</div>
                                    <div className="text-xs text-gray-500">{city.region}</div>
                                </div>
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                onClick={() => toggleCityStatus(city.id, city.status)} 
                                title={city.status === 'active' ? "Désactiver" : "Activer"}
                                className={`size-8 rounded-lg flex items-center justify-center ${city.status === 'active' ? 'bg-yellow-900/20 text-yellow-600 hover:bg-yellow-900/40' : 'bg-green-900/20 text-green-600 hover:bg-green-900/40'}`}
                                >
                                    <span className="material-symbols-outlined text-lg">{city.status === 'active' ? 'visibility_off' : 'visibility'}</span>
                                </button>
                                <button 
                                onClick={() => deleteCity(city.id)}
                                title="Supprimer"
                                className="size-8 rounded-lg bg-red-900/20 text-red-500 hover:bg-red-900/40 flex items-center justify-center"
                                >
                                    <span className="material-symbols-outlined text-lg">delete</span>
                                </button>
                            </div>
                        </div>
                        ))}
                    </div>
                 )}
              </div>
           </div>
         )}
      </main>
    </div>
  );
};

export default SuperAdminDashboard;