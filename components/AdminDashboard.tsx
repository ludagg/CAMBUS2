import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigation, User, UserRole } from '../contexts/NavigationContext';

// --- DATA TYPES ---
interface Manager {
  id: number;
  name: string;
  email: string;
  phone: string;
  avatar: string;
}

interface Station {
  id: number;
  name: string;
  location: string;
  status: 'active' | 'inactive';
  manager: Manager | null;
  dailyRevenue?: number;
}

interface AgencyData {
  id: number;
  name: string;
  logo: string;
  color: string;
  totalRevenue: number;
  stations: Station[];
  admin: Manager;
}

// --- MOCK DATA ---
const mockAgencies: AgencyData[] = [
  {
    id: 1,
    name: "Express Voyage",
    logo: "directions_bus",
    color: "bg-blue-600",
    totalRevenue: 15400000,
    admin: { id: 90, name: "Boss Express", email: "ceo@express.cm", phone: "...", avatar: "BE" },
    stations: [
      { id: 101, name: "Gare Centrale Douala", location: "Douala, Akwa", status: 'active', dailyRevenue: 450000, manager: { id: 1, name: "Jean Dupont", email: "jean.d@express.cm", phone: "+237 699 00 11 22", avatar: "JD" } },
      { id: 102, name: "Terminus Yaoundé", location: "Yaoundé, Mvan", status: 'active', dailyRevenue: 320000, manager: { id: 2, name: "Marie Ngu", email: "marie.n@express.cm", phone: "+237 677 22 33 44", avatar: "MN" } },
    ]
  },
  {
    id: 2,
    name: "GreenLines",
    logo: "eco",
    color: "bg-green-600",
    totalRevenue: 8200000,
    admin: { id: 91, name: "Boss Green", email: "ceo@green.cm", phone: "...", avatar: "BG" },
    stations: [
      { id: 201, name: "Green Park Bamenda", location: "Bamenda", status: 'active', dailyRevenue: 210000, manager: { id: 3, name: "Peter Suh", email: "peter.suh@green.cm", phone: "+237 675 00 00 00", avatar: "PS" } },
    ]
  }
];

// --- SUB-COMPONENTS ---

const SidebarItem = ({ icon, label, isActive, onClick }: any) => (
  <button 
    onClick={onClick}
    className={`flex items-center justify-center lg:justify-start gap-3 w-full p-3 rounded-xl transition-all ${
      isActive 
        ? 'bg-primary text-text-main shadow-lg shadow-primary/20 font-bold' 
        : 'text-text-muted hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-text-main dark:hover:text-white'
    }`}
  >
    <span className="material-symbols-outlined">{icon}</span>
    <span className="hidden lg:inline text-sm">{label}</span>
  </button>
);

const StatCard = ({ icon, label, value, color }: any) => (
  <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center gap-4 hover:shadow-md transition-shadow">
    <div className={`size-12 rounded-xl ${color} text-white flex items-center justify-center shadow-md`}>
       <span className="material-symbols-outlined">{icon}</span>
    </div>
    <div>
       <div className="text-xs text-text-muted uppercase font-bold">{label}</div>
       <div className="text-2xl font-black text-text-main dark:text-white">{value}</div>
    </div>
  </div>
);

// --- MAIN COMPONENT ---

const AdminDashboard: React.FC = () => {
  const { t } = useLanguage();
  const { user, logout, login } = useNavigation();
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // State for Demo Switching
  const [currentRole, setCurrentRole] = useState<UserRole>(user?.role || 'super_admin');

  // Handle Role Switching for Demo Purposes
  const switchRole = (role: UserRole) => {
    setCurrentRole(role);
    // Determine context based on role for realism
    let mockUser: User = { name: "Admin", email: "admin@test.com", role: role };
    
    if (role === 'super_admin') {
      mockUser = { name: "Super Admin", email: "admin@cambus.cm", role: 'super_admin', avatar: "SA" };
    } else if (role === 'agency_admin') {
      mockUser = { name: "Boss Express", email: "ceo@express.cm", role: 'agency_admin', agencyId: 1, avatar: "BE" };
    } else if (role === 'station_manager') {
      mockUser = { name: "Jean Dupont", email: "jean@express.cm", role: 'station_manager', agencyId: 1, stationId: 101, avatar: "JD" };
    }
    
    login(mockUser);
    setActiveTab('dashboard'); // Reset tab on switch
  };

  // Get Context Data based on current user role
  const getCurrentAgency = () => mockAgencies.find(a => a.id === user?.agencyId);
  const getCurrentStation = () => {
    const agency = getCurrentAgency();
    return agency?.stations.find(s => s.id === user?.stationId);
  };

  // --- RENDER CONTENT BASED ON ROLE ---

  // 1. SUPER ADMIN VIEW
  const renderSuperAdmin = () => {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
           <StatCard icon="domain" label={t('admin.super.agencies')} value={mockAgencies.length} color="bg-blue-600" />
           <StatCard icon="group" label={t('admin.super.users')} value="12,504" color="bg-purple-600" />
           <StatCard icon="payments" label={t('admin.super.revenue')} value="24.5M FCFA" color="bg-green-600" />
           <StatCard icon="verified" label="Active Trips" value="142" color="bg-amber-600" />
        </div>

        <div className="bg-white dark:bg-surface-dark rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
           <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-text-main dark:text-white">Plateforme Agences</h3>
              <button className="bg-primary text-text-main px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-[#0fd651]">
                 <span className="material-symbols-outlined text-lg">add</span>
                 {t('admin.super.add_agency')}
              </button>
           </div>
           
           <div className="grid md:grid-cols-2 gap-6">
              {mockAgencies.map(agency => (
                <div key={agency.id} className="border border-gray-100 dark:border-gray-700 rounded-xl p-4 flex items-center gap-4 hover:border-primary transition-colors cursor-pointer bg-gray-50 dark:bg-[#102216]">
                   <div className={`size-16 rounded-lg ${agency.color} flex items-center justify-center text-white shadow-md`}>
                      <span className="material-symbols-outlined text-3xl">{agency.logo}</span>
                   </div>
                   <div className="flex-1">
                      <div className="flex justify-between items-start">
                         <h4 className="font-bold text-lg text-text-main dark:text-white">{agency.name}</h4>
                         <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded font-bold">Active</span>
                      </div>
                      <div className="text-sm text-text-muted mt-1">{agency.stations.length} Gares • {agency.admin.name}</div>
                      <div className="mt-3 w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                         <div className={`h-full ${agency.color} w-[70%]`}></div>
                      </div>
                   </div>
                </div>
              ))}
           </div>
        </div>
      </div>
    );
  };

  // 2. AGENCY ADMIN VIEW
  const renderAgencyAdmin = () => {
    const agency = getCurrentAgency();
    if (!agency) return <div>Agency not found</div>;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
           <StatCard icon="store" label={t('admin.agency.stations')} value={agency.stations.length} color={agency.color} />
           <StatCard icon="directions_bus" label="Total Bus" value="24" color="bg-gray-600" />
           <StatCard icon="group" label={t('admin.agency.staff')} value="18" color="bg-blue-500" />
           <StatCard icon="payments" label={t('admin.agency.revenue')} value={`${(agency.totalRevenue / 1000000).toFixed(1)}M FCFA`} color="bg-green-600" />
        </div>

        {/* Stations Management */}
        <div className="bg-white dark:bg-surface-dark rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
           <h3 className="text-xl font-bold text-text-main dark:text-white mb-6">Gestion des Gares</h3>
           <div className="overflow-x-auto">
             <table className="w-full text-left">
                <thead className="bg-gray-50 dark:bg-black/20 text-xs uppercase text-text-muted">
                   <tr>
                      <th className="p-4 rounded-l-lg">Nom de la Gare</th>
                      <th className="p-4">Localisation</th>
                      <th className="p-4">Chef de Gare</th>
                      <th className="p-4">Revenu Journalier</th>
                      <th className="p-4 rounded-r-lg text-right">Action</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                   {agency.stations.map(station => (
                     <tr key={station.id} className="group hover:bg-gray-50 dark:hover:bg-[#102216]/50">
                        <td className="p-4 font-bold text-text-main dark:text-white">{station.name}</td>
                        <td className="p-4 text-sm text-text-muted">{station.location}</td>
                        <td className="p-4">
                           {station.manager ? (
                             <div className="flex items-center gap-2">
                                <div className="size-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">{station.manager.avatar}</div>
                                <span className="text-sm">{station.manager.name}</span>
                             </div>
                           ) : <span className="text-red-500 text-xs font-bold">Non assigné</span>}
                        </td>
                        <td className="p-4 font-mono font-bold">{station.dailyRevenue?.toLocaleString()} FCFA</td>
                        <td className="p-4 text-right">
                           <button className="text-text-muted hover:text-primary"><span className="material-symbols-outlined">edit</span></button>
                        </td>
                     </tr>
                   ))}
                </tbody>
             </table>
           </div>
        </div>
      </div>
    );
  };

  // 3. STATION MANAGER VIEW
  const renderStationManager = () => {
    const station = getCurrentStation();
    const agency = getCurrentAgency();
    if (!station || !agency) return <div>Station info error</div>;

    return (
      <div className="space-y-6">
        {/* Header specifically for Station Manager */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-8 text-white flex justify-between items-center shadow-lg relative overflow-hidden">
           <div className={`absolute top-0 right-0 p-32 ${agency.color} opacity-10 rounded-full blur-3xl -mr-10 -mt-10`}></div>
           <div className="relative z-10">
              <div className="flex items-center gap-2 text-primary font-bold uppercase text-xs mb-2 tracking-wider">
                 <span className="material-symbols-outlined text-sm">location_on</span>
                 {station.name}
              </div>
              <h1 className="text-3xl font-black mb-1">{t('admin.station.daily_sales')}</h1>
              <div className="text-4xl font-black text-primary">{station.dailyRevenue?.toLocaleString()} FCFA</div>
           </div>
           <div className="relative z-10 flex gap-3">
              <button className="bg-white/10 hover:bg-white/20 backdrop-blur-md px-4 py-3 rounded-xl font-bold flex flex-col items-center min-w-[100px]">
                 <span className="material-symbols-outlined text-2xl mb-1">point_of_sale</span>
                 <span>Vente</span>
              </button>
              <button className="bg-primary text-text-main px-4 py-3 rounded-xl font-bold flex flex-col items-center min-w-[100px] hover:bg-[#0fd651]">
                 <span className="material-symbols-outlined text-2xl mb-1">qr_code_scanner</span>
                 <span>Scan</span>
              </button>
           </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
           {/* Recent Transactions */}
           <div className="bg-white dark:bg-surface-dark rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
              <h3 className="font-bold text-lg mb-4 text-text-main dark:text-white">Derniers Passagers</h3>
              <div className="space-y-4">
                 {[1,2,3,4].map((i) => (
                   <div key={i} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-[#102216] transition-colors">
                      <div className="flex items-center gap-3">
                         <div className="size-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-text-muted">
                            <span className="material-symbols-outlined">person</span>
                         </div>
                         <div>
                            <div className="font-bold text-sm text-text-main dark:text-white">Passager #{1000+i}</div>
                            <div className="text-xs text-text-muted">Yaoundé • 14:00</div>
                         </div>
                      </div>
                      <div className="text-right">
                         <div className="text-xs px-2 py-1 rounded bg-green-100 text-green-700 font-bold">Payé</div>
                      </div>
                   </div>
                 ))}
              </div>
           </div>

           {/* Departures */}
           <div className="bg-white dark:bg-surface-dark rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
              <h3 className="font-bold text-lg mb-4 text-text-main dark:text-white">Prochains Départs</h3>
              <div className="space-y-3">
                 <div className="border-l-4 border-green-500 pl-3 py-1">
                    <div className="text-xs font-bold text-text-muted">07:30</div>
                    <div className="font-bold text-text-main dark:text-white">Vers Yaoundé</div>
                    <div className="text-xs text-green-600">Embarquement en cours (45/50)</div>
                 </div>
                 <div className="border-l-4 border-gray-300 dark:border-gray-600 pl-3 py-1">
                    <div className="text-xs font-bold text-text-muted">09:00</div>
                    <div className="font-bold text-text-main dark:text-white">Vers Bafoussam</div>
                    <div className="text-xs text-text-muted">Prévu</div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    );
  };

  // Sidebar Logic based on Role
  const renderSidebar = () => {
    return (
      <nav className="flex-1 py-6 space-y-2 px-3">
        <SidebarItem icon="dashboard" label={t('admin.dashboard')} isActive={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
        
        {currentRole === 'super_admin' && (
          <>
            <SidebarItem icon="business" label={t('admin.super.agencies')} isActive={activeTab === 'agencies'} onClick={() => setActiveTab('agencies')} />
            <SidebarItem icon="group" label={t('admin.super.users')} isActive={activeTab === 'users'} onClick={() => {}} />
            <SidebarItem icon="payments" label="Finances" isActive={activeTab === 'finance'} onClick={() => {}} />
          </>
        )}

        {currentRole === 'agency_admin' && (
          <>
            <SidebarItem icon="store" label={t('admin.agency.stations')} isActive={activeTab === 'stations'} onClick={() => setActiveTab('stations')} />
            <SidebarItem icon="directions_bus" label={t('admin.agency.fleet')} isActive={activeTab === 'fleet'} onClick={() => {}} />
            <SidebarItem icon="badge" label={t('admin.agency.staff')} isActive={activeTab === 'staff'} onClick={() => {}} />
          </>
        )}

        {currentRole === 'station_manager' && (
          <>
             <SidebarItem icon="confirmation_number" label={t('admin.station.ticketing')} isActive={activeTab === 'ticketing'} onClick={() => {}} />
             <SidebarItem icon="qr_code_scanner" label={t('admin.station.checkin')} isActive={activeTab === 'checkin'} onClick={() => {}} />
             <SidebarItem icon="groups" label={t('admin.station.clients')} isActive={activeTab === 'clients'} onClick={() => {}} />
          </>
        )}

        <div className="my-4 border-t border-gray-100 dark:border-gray-800"></div>
        <SidebarItem icon="settings" label="Paramètres" isActive={activeTab === 'settings'} onClick={() => {}} />
      </nav>
    );
  };

  const getRoleLabel = (role: UserRole) => {
    switch(role) {
      case 'super_admin': return t('admin.super.role');
      case 'agency_admin': return t('admin.agency.role');
      case 'station_manager': return t('admin.station.role');
      default: return 'User';
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch(role) {
      case 'super_admin': return 'bg-purple-600';
      case 'agency_admin': return 'bg-blue-600';
      case 'station_manager': return 'bg-amber-600';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-background-dark font-display">
      {/* Sidebar Navigation */}
      <aside className="w-20 lg:w-64 bg-white dark:bg-surface-dark border-r border-gray-200 dark:border-gray-800 flex flex-col fixed h-full z-10 transition-all">
        <div className="h-16 flex items-center justify-center lg:justify-start lg:px-6 border-b border-gray-100 dark:border-gray-800">
          <div className="size-8 rounded-lg bg-primary text-text-main flex items-center justify-center mr-0 lg:mr-3">
            <span className="material-symbols-outlined text-xl">admin_panel_settings</span>
          </div>
          <span className="font-black text-xl text-text-main dark:text-white hidden lg:block">CamBus</span>
        </div>

        {renderSidebar()}

        <div className="p-4 border-t border-gray-100 dark:border-gray-800">
           <button 
             onClick={logout}
             className="flex items-center justify-center lg:justify-start gap-3 w-full p-3 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors font-bold"
           >
             <span className="material-symbols-outlined">logout</span>
             <span className="hidden lg:inline">{t('nav.logout')}</span>
           </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 ml-20 lg:ml-64 p-6 lg:p-10 animate-fadeIn">
        
        {/* Top Bar with Demo Switcher */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
             <div className="flex items-center gap-2 mb-1">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase tracking-wide ${getRoleColor(currentRole)}`}>
                  {getRoleLabel(currentRole)}
                </span>
                {user?.role === 'station_manager' && (
                  <span className="text-xs text-text-muted">• {getCurrentStation()?.name}</span>
                )}
                 {user?.role === 'agency_admin' && (
                  <span className="text-xs text-text-muted">• {getCurrentAgency()?.name}</span>
                )}
             </div>
             <h2 className="text-2xl font-black text-text-main dark:text-white">
               {t('admin.welcome')}, {user?.name || 'Admin'}
             </h2>
          </div>
          
          <div className="flex items-center gap-4">
             {/* DEMO ROLE SWITCHER */}
             <div className="flex items-center bg-white dark:bg-surface-dark rounded-lg p-1 border border-gray-200 dark:border-gray-700 shadow-sm">
                <button onClick={() => switchRole('super_admin')} className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${currentRole === 'super_admin' ? 'bg-gray-900 text-white' : 'text-text-muted hover:bg-gray-100 dark:hover:bg-gray-800'}`}>Super</button>
                <button onClick={() => switchRole('agency_admin')} className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${currentRole === 'agency_admin' ? 'bg-gray-900 text-white' : 'text-text-muted hover:bg-gray-100 dark:hover:bg-gray-800'}`}>Agency</button>
                <button onClick={() => switchRole('station_manager')} className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${currentRole === 'station_manager' ? 'bg-gray-900 text-white' : 'text-text-muted hover:bg-gray-100 dark:hover:bg-gray-800'}`}>Station</button>
             </div>

             <div className="size-10 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden border-2 border-white dark:border-gray-600 shadow-sm">
               <div className="size-full flex items-center justify-center font-bold text-text-muted">
                 {user?.avatar || 'AD'}
               </div>
             </div>
          </div>
        </header>

        {/* Dynamic Content */}
        {currentRole === 'super_admin' && renderSuperAdmin()}
        {currentRole === 'agency_admin' && renderAgencyAdmin()}
        {currentRole === 'station_manager' && renderStationManager()}

      </main>
    </div>
  );
};

export default AdminDashboard;