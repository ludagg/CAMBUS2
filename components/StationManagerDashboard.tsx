'use client';
import React, { useState, useEffect } from 'react';
import { useNavigation } from '../contexts/NavigationContext';

const StationManagerDashboard: React.FC = () => {
  const { user, logout } = useNavigation();
  const [activeTab, setActiveTab] = useState('checkin');
  const [scanCode, setScanCode] = useState('');
  const [scanResult, setScanResult] = useState<{ success: boolean; message: string; passenger?: string; seat?: string } | null>(null);
  const [recentScans, setRecentScans] = useState<any[]>([]);

  const handleScan = async () => {
    if (!scanCode) return;
    
    try {
      const res = await fetch(`/api/bookings/${encodeURIComponent(scanCode)}`);

      if (!res.ok) {
        setScanResult({ success: false, message: 'Billet introuvable.' });
        return;
      }

      const { booking } = await res.json();

      if (booking.status === 'BOARDED') {
        setScanResult({ success: false, message: 'Billet déjà validé.' });
        return;
      }

      if (booking.status !== 'CONFIRMED') {
        setScanResult({ success: false, message: `Statut invalide: ${booking.status}` });
        return;
      }

      // Update status to boarded
      const patchRes = await fetch(`/api/bookings/${encodeURIComponent(scanCode)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'BOARDED' }),
      });

      if (!patchRes.ok) {
        setScanResult({ success: false, message: 'Erreur lors de la validation.' });
        return;
      }

      const passengerName = booking.passengers > 0 ? `${booking.passengers} passager(s)` : 'Passager';
      const seat = (booking.seats || [])[0] || 'N/A';

      setScanResult({ success: true, message: 'Billet validé avec succès.', passenger: passengerName, seat });
      
      setRecentScans(prev => [{
        id: booking.id,
        name: passengerName,
        seat,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }, ...prev].slice(0, 5));

      setScanCode('');
    } catch (error) {
      console.error("Error scanning ticket:", error);
      setScanResult({ success: false, message: 'Erreur lors de la validation.' });
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-black font-display overflow-hidden">
       
       {/* Top Bar Mobile-First */}
       <header className="bg-white dark:bg-surface-dark px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center shadow-sm z-10">
          <div className="flex items-center gap-3">
             <div className="size-10 bg-amber-500 text-white rounded-lg flex items-center justify-center shadow-lg shadow-amber-500/30">
                <span className="material-symbols-outlined">confirmation_number</span>
             </div>
             <div>
                <div className="font-black text-text-main dark:text-white leading-tight">Gare Centrale</div>
                <div className="text-xs text-gray-500 font-medium">Terminal Manager: {user?.name}</div>
             </div>
          </div>
          <button onClick={logout} className="size-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 hover:bg-red-100 hover:text-red-500 transition-colors">
             <span className="material-symbols-outlined">power_settings_new</span>
          </button>
       </header>

       <div className="flex flex-1 overflow-hidden">
          
          {/* Side Menu (Desktop) / Bottom Bar (Mobile - conceptual) */}
          <nav className="w-20 bg-white dark:bg-surface-dark border-r border-gray-200 dark:border-gray-800 flex flex-col items-center py-6 gap-6 z-0">
             <button 
               onClick={() => setActiveTab('pos')}
               className={`size-12 rounded-xl flex items-center justify-center transition-all ${activeTab === 'pos' ? 'bg-amber-500 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
               title="Point of Sale"
             >
                <span className="material-symbols-outlined">point_of_sale</span>
             </button>
             <button 
               onClick={() => setActiveTab('checkin')}
               className={`size-12 rounded-xl flex items-center justify-center transition-all ${activeTab === 'checkin' ? 'bg-amber-500 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
               title="Check-in Scanner"
             >
                <span className="material-symbols-outlined">qr_code_scanner</span>
             </button>
             <button 
               onClick={() => setActiveTab('manifest')}
               className={`size-12 rounded-xl flex items-center justify-center transition-all ${activeTab === 'manifest' ? 'bg-amber-500 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
               title="Manifeste de Voyage"
             >
                <span className="material-symbols-outlined">list_alt</span>
             </button>
          </nav>

          {/* Main Area */}
          <main className="flex-1 p-6 overflow-y-auto relative">
             
             {activeTab === 'checkin' && (
                 <div className="max-w-md mx-auto flex flex-col items-center justify-center h-full animate-fadeIn">
                     <div className="w-full bg-white dark:bg-surface-dark rounded-3xl p-8 shadow-2xl border border-gray-200 dark:border-gray-800 text-center relative overflow-hidden">
                         <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-400 to-amber-600"></div>
                         
                         <div className="mb-8 relative">
                             <div className="size-64 bg-black rounded-2xl mx-auto border-4 border-gray-800 flex items-center justify-center relative overflow-hidden">
                                 {/* Scanner Simulation Line */}
                                 <div className="absolute top-0 left-0 w-full h-1 bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.8)] animate-[scan_2s_infinite]"></div>
                                 <span className="text-gray-600 text-xs uppercase font-bold tracking-widest">Camera Feed</span>
                             </div>
                             <button className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-amber-500 text-white px-6 py-2 rounded-full font-bold shadow-lg flex items-center gap-2 hover:bg-amber-600">
                                <span className="material-symbols-outlined">camera_alt</span> Scanner
                             </button>
                         </div>

                         <h2 className="text-xl font-bold text-text-main dark:text-white mt-8 mb-2">Validation Billet</h2>
                         <p className="text-gray-500 text-sm mb-6">Pointez la caméra vers le QR Code du passager ou entrez le code manuellement.</p>

                         {scanResult && (
                           <div className={`mb-4 p-3 rounded-lg text-sm font-bold ${scanResult.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                             {scanResult.message}
                           </div>
                         )}

                         <div className="flex gap-2">
                            <input 
                              type="text" 
                              value={scanCode}
                              onChange={(e) => setScanCode(e.target.value)}
                              placeholder="ID Billet" 
                              className="flex-1 bg-gray-100 dark:bg-black border-none rounded-xl px-4 font-mono text-center font-bold focus:ring-2 focus:ring-amber-500"
                            />
                            <button onClick={handleScan} className="bg-gray-900 text-white size-12 rounded-xl flex items-center justify-center shadow-lg active:scale-95 transition-transform">
                               <span className="material-symbols-outlined">arrow_forward</span>
                            </button>
                         </div>
                     </div>

                     {/* Recent Scans */}
                     <div className="w-full mt-6 space-y-3">
                        <div className="text-xs font-bold text-gray-500 uppercase ml-2">Validés Récemment</div>
                        {recentScans.map((scan, i) => (
                          <div key={i} className="bg-white dark:bg-surface-dark p-4 rounded-xl border border-gray-200 dark:border-gray-800 flex items-center justify-between shadow-sm">
                             <div className="flex items-center gap-3">
                                <div className="size-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                                   <span className="material-symbols-outlined text-sm">check</span>
                                </div>
                                <div>
                                   <div className="font-bold text-sm dark:text-white">{scan.name}</div>
                                   <div className="text-xs text-gray-500">Siège {scan.seat} • {scan.id.substring(0, 8)}...</div>
                                </div>
                             </div>
                             <div className="text-xs font-mono text-gray-400">{scan.time}</div>
                          </div>
                        ))}
                     </div>
                 </div>
             )}

             {activeTab === 'pos' && (
                 <div className="h-full flex flex-col animate-fadeIn">
                    <h2 className="text-2xl font-black text-text-main dark:text-white mb-6">Vente Rapide (Guichet)</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
                       {/* Destinations Selector */}
                       <div className="bg-white dark:bg-surface-dark rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-800 overflow-y-auto">
                          <h3 className="font-bold text-gray-500 uppercase text-xs mb-4">Prochains Départs</h3>
                          <div className="space-y-3">
                             {[
                                { to: 'Yaoundé', time: '15:00', price: 4500, seats: 12 },
                                { to: 'Bafoussam', time: '16:30', price: 6000, seats: 5 },
                                { to: 'Kribi', time: '17:00', price: 5000, seats: 28 },
                             ].map((trip, i) => (
                                <button key={i} className="w-full flex items-center justify-between p-4 rounded-xl border-2 border-transparent hover:border-amber-500 bg-gray-50 dark:bg-black/20 hover:bg-amber-50 dark:hover:bg-amber-900/10 transition-all text-left group">
                                   <div>
                                      <div className="text-2xl font-black text-text-main dark:text-white">{trip.time}</div>
                                      <div className="text-sm font-bold text-gray-500">Vers {trip.to}</div>
                                   </div>
                                   <div className="text-right">
                                      <div className="text-xl font-bold text-amber-600">{trip.price} <span className="text-xs text-gray-400">FCFA</span></div>
                                      <div className="text-xs font-bold bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded mt-1 inline-block">
                                         {trip.seats} places
                                      </div>
                                   </div>
                                </button>
                             ))}
                          </div>
                       </div>

                       {/* Checkout Form */}
                       <div className="bg-white dark:bg-surface-dark rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-800 flex flex-col">
                          <h3 className="font-bold text-gray-500 uppercase text-xs mb-4">Détails Passager</h3>
                          <div className="space-y-4 flex-1">
                             <input type="text" placeholder="Nom Complet" className="w-full p-4 bg-gray-100 dark:bg-black rounded-xl border-none font-bold" />
                             <input type="text" placeholder="Numéro CNI" className="w-full p-4 bg-gray-100 dark:bg-black rounded-xl border-none font-bold" />
                             <input type="tel" placeholder="Téléphone" className="w-full p-4 bg-gray-100 dark:bg-black rounded-xl border-none font-bold" />
                          </div>
                          <div className="mt-6 border-t border-gray-100 dark:border-gray-800 pt-6">
                             <div className="flex justify-between items-center mb-6">
                                <span className="text-gray-500">Total à payer</span>
                                <span className="text-3xl font-black text-text-main dark:text-white">4,500 FCFA</span>
                             </div>
                             <button className="w-full py-4 bg-green-600 text-white font-bold rounded-xl shadow-lg hover:bg-green-700 active:scale-95 transition-all flex items-center justify-center gap-2">
                                <span className="material-symbols-outlined">payments</span> Encaisser (Espèces)
                             </button>
                          </div>
                       </div>
                    </div>
                 </div>
             )}

          </main>
       </div>
    </div>
  );
};

export default StationManagerDashboard;