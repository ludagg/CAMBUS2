'use client';
import React, { useState, useEffect } from 'react';
import { useNavigation } from '../contexts/NavigationContext';

interface TripRow {
  id: string;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime?: string;
  duration?: string;
  date: string;
  price: number;
  currency: string;
  seatsAvailable: number;
  totalSeats: number;
  status: string;
  amenities: string[];
}

const BLANK_FORM = {
  origin: '',
  destination: '',
  departureTime: '',
  arrivalTime: '',
  duration: '',
  date: '',
  price: '',
  totalSeats: '70',
  amenities: [] as string[],
};

const AgencyAdminDashboard: React.FC = () => {
  const { user, logout } = useNavigation();
  const [activeTab, setActiveTab] = useState('routes');
  const [routes, setRoutes] = useState<TripRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...BLANK_FORM });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchRoutes = async () => {
    if (!user?.agencyId) { setIsLoading(false); return; }
    setIsLoading(true);
    try {
      const res = await fetch(`/api/trips?agencyId=${encodeURIComponent(user.agencyId)}`);
      if (res.ok) {
        const data = await res.json();
        setRoutes(data.trips || []);
      }
    } catch (err) {
      console.error('Error fetching trips:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchRoutes(); }, [user]);

  const openCreateForm = () => {
    setForm({ ...BLANK_FORM });
    setEditingId(null);
    setShowForm(true);
  };

  const openEditForm = (trip: TripRow) => {
    setForm({
      origin: trip.origin,
      destination: trip.destination,
      departureTime: trip.departureTime,
      arrivalTime: trip.arrivalTime || '',
      duration: trip.duration || '',
      date: trip.date,
      price: String(trip.price),
      totalSeats: String(trip.totalSeats),
      amenities: trip.amenities || [],
    });
    setEditingId(trip.id);
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.agencyId) return;
    setSaving(true);

    const agencyName = user.name || 'Agence';
    const body = {
      agencyId: user.agencyId,
      agencyName,
      origin: form.origin,
      destination: form.destination,
      departureTime: form.departureTime,
      arrivalTime: form.arrivalTime || undefined,
      duration: form.duration || undefined,
      date: form.date,
      price: Number(form.price),
      totalSeats: Number(form.totalSeats),
      amenities: form.amenities,
    };

    try {
      if (editingId) {
        // For now update via PATCH on /api/trips/[id] (if needed add that route)
        // Simplified: delete + recreate
        await fetch(`/api/trips/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      } else {
        await fetch('/api/trips', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      }
      setShowForm(false);
      fetchRoutes();
    } catch (err) {
      console.error('Error saving trip:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/trips/${id}`, { method: 'DELETE' });
      setDeleteConfirm(null);
      fetchRoutes();
    } catch (err) {
      console.error('Error deleting trip:', err);
    }
  };

  const toggleAmenity = (a: string) => {
    setForm(prev => ({
      ...prev,
      amenities: prev.amenities.includes(a)
        ? prev.amenities.filter(x => x !== a)
        : [...prev.amenities, a],
    }));
  };

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
          <NavItem id="routes"  icon="map"                   label="Trajets & Prix" />
          <NavItem id="fleet"   icon="directions_bus"        label="Gestion Flotte" />
          <NavItem id="staff"   icon="badge"                 label="Personnel" />
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
              {activeTab === 'routes' ? 'Planification des Trajets' : 'Tableau de Bord'}
            </h1>
            <p className="text-gray-500 text-sm">Gérez les opérations de votre compagnie en temps réel.</p>
          </div>
          {activeTab === 'routes' && (
            <button
              onClick={openCreateForm}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <span className="material-symbols-outlined">add_road</span> Créer un Trajet
            </button>
          )}
        </div>

        {/* ROUTES VIEW */}
        {activeTab === 'routes' && (
          <>
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : routes.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <span className="material-symbols-outlined text-5xl mb-2 block">map</span>
                <p className="font-bold">Aucun trajet configuré pour le moment.</p>
                <button onClick={openCreateForm} className="mt-4 text-blue-600 font-black underline text-sm">Créer votre premier trajet</button>
              </div>
            ) : (
              <div className="space-y-4 animate-fadeIn">
                {routes.map((route) => (
                  <div key={route.id} className="bg-white dark:bg-surface-dark p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div className="flex items-center gap-6">
                        <div className="text-center w-16">
                          <div className="text-xl font-black text-text-main dark:text-white">{route.departureTime}</div>
                          <div className="text-[10px] text-gray-500 uppercase font-bold">Départ</div>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 font-bold text-text-main dark:text-white">
                            {route.origin}
                            <span className="material-symbols-outlined text-gray-400 text-sm">arrow_forward</span>
                            {route.destination}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-3">
                            <span>{route.date}</span>
                            {route.duration && <span>· {route.duration}</span>}
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              route.status === 'SCHEDULED' ? 'bg-green-100 text-green-700' :
                              route.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>{route.status}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <div className="text-xl font-black text-blue-600">{route.price.toLocaleString()} {route.currency}</div>
                          <div className="text-xs text-gray-500">{route.seatsAvailable}/{route.totalSeats} places</div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEditForm(route)}
                            className="size-9 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-400 hover:text-blue-600 hover:border-blue-300 transition-all"
                          >
                            <span className="material-symbols-outlined text-base">edit</span>
                          </button>
                          {deleteConfirm === route.id ? (
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleDelete(route.id)}
                                className="px-2 py-1 bg-red-600 text-white text-xs font-black rounded-lg"
                              >Oui</button>
                              <button
                                onClick={() => setDeleteConfirm(null)}
                                className="px-2 py-1 bg-gray-200 text-gray-700 text-xs font-black rounded-lg"
                              >Non</button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirm(route.id)}
                              className="size-9 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-400 hover:text-red-600 hover:border-red-300 transition-all"
                            >
                              <span className="material-symbols-outlined text-base">delete</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Placeholder tabs */}
        {activeTab !== 'routes' && (
          <div className="text-center py-16 text-gray-400">
            <span className="material-symbols-outlined text-5xl mb-2 block">construction</span>
            <p className="font-bold">Section en cours de développement.</p>
          </div>
        )}
      </main>

      {/* Trip Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <form
            onSubmit={handleSave}
            className="bg-white dark:bg-surface-dark rounded-2xl p-6 w-full max-w-lg shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-black text-text-main dark:text-white">
                {editingId ? 'Modifier le trajet' : 'Nouveau trajet'}
              </h2>
              <button type="button" onClick={() => setShowForm(false)} className="text-gray-400 hover:text-red-500">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Origine', key: 'origin', placeholder: 'Douala' },
                { label: 'Destination', key: 'destination', placeholder: 'Yaoundé' },
                { label: 'Heure de départ', key: 'departureTime', placeholder: '07:30', type: 'time' },
                { label: "Heure d'arrivée", key: 'arrivalTime', placeholder: '11:30', type: 'time' },
                { label: 'Durée', key: 'duration', placeholder: '4h 00m' },
                { label: 'Date', key: 'date', type: 'date' },
                { label: 'Prix (FCFA)', key: 'price', type: 'number', placeholder: '4500' },
                { label: 'Nombre de places', key: 'totalSeats', type: 'number', placeholder: '70' },
              ].map(({ label, key, placeholder, type = 'text' }) => (
                <div key={key}>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">{label}</label>
                  <input
                    type={type}
                    required={['origin', 'destination', 'departureTime', 'date', 'price'].includes(key)}
                    value={(form as any)[key]}
                    onChange={(e) => setForm(prev => ({ ...prev, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-text-main dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              ))}
            </div>

            {/* Amenities */}
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Services</label>
              <div className="flex flex-wrap gap-2">
                {['wifi', 'ac', 'power', 'snack', 'tv'].map((a) => (
                  <button
                    type="button"
                    key={a}
                    onClick={() => toggleAmenity(a)}
                    className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${
                      form.amenities.includes(a)
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-200 text-gray-500 hover:border-blue-300'
                    }`}
                  >
                    {a.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-xl font-black text-sm hover:bg-blue-700 transition-all disabled:opacity-60"
            >
              {saving ? (
                <span className="material-symbols-outlined animate-spin">progress_activity</span>
              ) : (
                <><span className="material-symbols-outlined">save</span> {editingId ? 'Enregistrer' : 'Créer le trajet'}</>
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default AgencyAdminDashboard;
