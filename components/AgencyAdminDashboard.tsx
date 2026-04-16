'use client';
import React, { useState, useEffect } from 'react';
import { useNavigation } from '../contexts/NavigationContext';

const AgencyAdminDashboard: React.FC = () => {
  const { user, logout } = useNavigation();
  const [activeTab, setActiveTab] = useState('fleet');
  const [fleet, setFleet] = useState<any[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAgencyData = async () => {
      if (!user?.agencyId) return;
      setIsLoading(true);
      try {
        const res = await fetch(`/api/trips?agencyId=${encodeURIComponent(user.agencyId)}`);
        if (res.ok) {
          const data = await res.json();
          setRoutes(data.trips || []);
        }
        // Fleet data would come from a dedicated /api/fleet endpoint
        setFleet([]);
      } catch (error) {
        console.error("Error fetching agency data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAgencyData();
  }, [user]);

  // Sidebar item
  const NavItem = ({ id, icon, label }: any) => (
    <button 
      onClick={() => setActiveTab(id)}
      className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all font-medium text-sm ${activeTab === id ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
    >
      <span className="material-symbols-outlined">{icon}</span>
      <span>{label}</span>
    </button>
  );

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-background-dark font-display">
      
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-surface-dark border-r border-gray-200 dark:border-gray-800 flex flex-col">
         <div className="p-6 border-b border-gray-100 dark:border-gray-800">
             <div className="flex items-center gap-2 font-black text-lg text-text-main dark:text-white">
                 <span className="material-symbols-outlined text-blue-600">directions_bus</span>
                 {user?.name || 'Agency Admin'}
             </div>
             <div className="text-xs text-gray-500 mt-1 uppercase font-bold tracking-wider">Administration</div>
         </div>
         
         <div className="p-4 flex-1 space-y-1">
             <NavItem id="dashboard" icon="analytics" label="Tableau de Bord" />
             <NavItem id="fleet" icon="directions_bus" label="Gestion Flotte" />
             <NavItem id="routes" icon="map" label="Trajets & Prix" />
             <NavItem id="staff" icon="badge" label="Personnel" />
             <NavItem id="accounting" icon="account_balance_wallet" label="Comptabilité" />
         </div>

         <div className="p-4 border-t border-gray-100 dark:border-gray-800">
             <button onClick={logout} className="flex items-center gap-2 text-red-500 font-bold text-sm hover:underline">
                 <span className="material-symbols-outlined">logout</span> Déconnexion
             </button>
         </div>
      </aside>

      {/* Content */}
      <main className="flex-1 p-8 overflow-y-auto">
         
         <div className="flex justify-between items-end mb-8">
            <div>
                <h1 className="text-2xl font-black text-text-main dark:text-white mb-1">
                    {activeTab === 'fleet' ? 'Gestion de la Flotte' : 
                     activeTab === 'routes' ? 'Planification des Trajets' : 
                     'Tableau de Bord'}
                </h1>
                <p className="text-gray-500 text-sm">Gérez les opérations de votre compagnie en temps réel.</p>
            </div>
            {activeTab === 'fleet' && (
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-lg hover:bg-blue-700 flex items-center gap-2">
                    <span className="material-symbols-outlined">add</span> Ajouter un Bus
                </button>
            )}
            {activeTab === 'routes' && (
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-lg hover:bg-blue-700 flex items-center gap-2">
                    <span className="material-symbols-outlined">add_road</span> Créer un Trajet
                </button>
            )}
         </div>

         {isLoading ? (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
         ) : (
             <>
                 {/* FLEET VIEW */}
                 {activeTab === 'fleet' && (
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeIn">
                         {fleet.length > 0 ? fleet.map((bus, i) => (
                             <div key={i} className="bg-white dark:bg-surface-dark p-5 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm relative overflow-hidden">
                                 <div className={`absolute top-0 right-0 px-3 py-1 rounded-bl-xl text-xs font-bold uppercase ${
                                     bus.status === 'active' ? 'bg-green-100 text-green-700' : 
                                     bus.status === 'maintenance' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                                 }`}>
                                     {bus.status || 'active'}
                                 </div>
                                 <div className="flex items-center gap-4 mb-4">
                                     <div className="size-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center text-gray-500">
                                         <span className="material-symbols-outlined text-2xl">directions_bus</span>
                                     </div>
                                     <div>
                                         <div className="font-black text-lg text-text-main dark:text-white">{bus.plate || `Bus ${i+1}`}</div>
                                         <div className="text-xs text-gray-500">{bus.model || 'Standard'}</div>
                                     </div>
                                 </div>
                                 <div className="flex justify-between items-center text-sm border-t border-gray-100 dark:border-gray-800 pt-3">
                                     <div className="text-gray-500">Kilométrage: <span className="text-text-main dark:text-white font-bold">{bus.km || 'N/A'}</span></div>
                                     <button className="text-blue-600 font-bold hover:underline">Détails</button>
                                 </div>
                             </div>
                         )) : (
                             <div className="col-span-full text-center py-12 text-gray-500">
                                 Aucun bus enregistré pour le moment.
                             </div>
                         )}
                     </div>
                 )}

                 {/* ROUTES VIEW */}
                 {activeTab === 'routes' && (
                     <div className="space-y-4 animate-fadeIn">
                         {routes.length > 0 ? routes.map((route, i) => (
                             <div key={i} className="bg-white dark:bg-surface-dark p-6 rounded-xl border border-gray-200 dark:border-gray-800 flex items-center justify-between shadow-sm">
                                 <div className="flex items-center gap-6">
                                     <div className="text-center w-20">
                                         <div className="text-2xl font-black text-text-main dark:text-white">{route.departureTime}</div>
                                         <div className="text-xs text-gray-500 uppercase font-bold">Départ</div>
                                     </div>
                                     <div className="flex flex-col gap-1">
                                         <div className="flex items-center gap-2 font-bold text-lg text-text-main dark:text-white">
                                             {route.departureLocation} <span className="material-symbols-outlined text-gray-400">arrow_forward</span> {route.arrivalLocation}
                                         </div>
                                         <div className="flex items-center gap-2 text-xs text-gray-500">
                                             <span className="material-symbols-outlined text-sm">directions_bus</span>
                                             Bus: {route.busId || 'Non assigné'}
                                         </div>
                                     </div>
                                 </div>
                                 <div className="text-right">
                                     <div className="text-xl font-black text-blue-600">{route.price?.toLocaleString()} FCFA</div>
                                     <button className="text-xs font-bold text-gray-400 hover:text-text-main mt-1 flex items-center gap-1 justify-end">
                                         <span className="material-symbols-outlined text-sm">edit</span> Modifier
                                     </button>
                                 </div>
                             </div>
                         )) : (
                             <div className="text-center py-12 text-gray-500">
                                 Aucun trajet configuré pour le moment.
                             </div>
                         )}
                     </div>
                 )}
             </>
         )}
      </main>
    </div>
  );
};

export default AgencyAdminDashboard;