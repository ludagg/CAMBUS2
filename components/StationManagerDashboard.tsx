'use client';

import { todayLocal } from '../lib/datetime';
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigation } from '../contexts/NavigationContext';
import CounterSalePanel from './CounterSalePanel';
import DepartureControlPanel from './DepartureControlPanel';
import AnalyticsPanel from './AnalyticsPanel';
import QrScanner from './QrScanner';

interface Manifest {
  id: string;
  departureAt: string;
  company: string;
  brandColor: string;
  from: string;
  to: string;
  seatsAvailable: number;
  seatsTotal: number;
  bookings: {
    id: string;
    qrCode: string;
    leg: 'OUTBOUND' | 'RETURN';
    seats: string[];
    status: string;
    passengers: { name: string; seat?: string | null }[];
  }[];
}

const StationManagerDashboard: React.FC = () => {
  const { user, logout } = useNavigation();
  const today = todayLocal();
  const [date, setDate] = useState(today);
  const [manifest, setManifest] = useState<Manifest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [qrInput, setQrInput] = useState('');
  const [lastCheckin, setLastCheckin] = useState<{ ok: boolean; message: string } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [tab, setTab] = useState<'manifest' | 'counter' | 'operations' | 'analytics'>('manifest');
  const [scanMode, setScanMode] = useState<'manual' | 'camera'>('manual');

  const fetchManifest = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ date });
      if (user?.agencyId) params.set('agencyId', user.agencyId);
      const res = await fetch(`/api/admin/manifest?${params}`);
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Impossible de charger le manifeste.');
      setLoadError(null);
      setManifest(json.data ?? []);
    } catch (e) {
      setLoadError((e as Error).message);
      setManifest([]);
    } finally {
      setIsLoading(false);
    }
  }, [date, user?.agencyId]);

  useEffect(() => {
    fetchManifest();
  }, [fetchManifest]);

  const doCheckin = async (qrCode: string) => {
    if (!qrCode) return;
    try {
      const res = await fetch('/api/bookings/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrCode }),
      });
      const json = await res.json();
      if (!res.ok) {
        setLastCheckin({ ok: false, message: json.error || 'Erreur' });
      } else {
        setLastCheckin({ ok: true, message: `${json.data.passenger} • ${json.data.from} → ${json.data.to}` });
        fetchManifest();
        setQrInput('');
      }
    } catch (e) {
      setLastCheckin({ ok: false, message: (e as Error).message });
    }
  };

  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen">
      <div className="bg-gradient-to-r from-sky-600 to-blue-700 text-white px-4 py-6 md:p-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="text-[10px] font-black tracking-widest uppercase opacity-80">Chef de Station</div>
            <h1 className="text-2xl md:text-3xl font-black">Manifeste du jour</h1>
            <p className="opacity-80 text-sm mt-1">{user?.name}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-lg px-3 py-2 text-text-main text-sm font-black" />
            <button onClick={logout} className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 font-black text-sm">Déconnexion</button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
        <div className="flex gap-2 overflow-x-auto pb-2 border-b border-gray-200 dark:border-gray-800 mb-6">
          {(['manifest', 'counter', 'operations', 'analytics'] as const).map((t) => {
            const labels: Record<typeof t, string> = {
              manifest: 'Manifeste & check-in',
              counter: 'Vente au guichet',
              operations: 'Opérations',
              analytics: 'Analytics',
            };
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2 font-black text-sm ${
                  tab === t ? 'text-primary border-b-2 border-primary' : 'text-text-muted'
                }`}
              >
                {labels[t]}
              </button>
            );
          })}
        </div>

        {tab === 'counter' && <CounterSalePanel />}
        {tab === 'operations' && <DepartureControlPanel />}
        {tab === 'analytics' && <AnalyticsPanel />}

        {tab === 'manifest' && (<>
        {/* Check-in */}
        <div className="bg-white dark:bg-surface-dark rounded-xl border border-gray-100 dark:border-gray-800 shadow-subtle p-4 md:p-6 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
            <h2 className="font-black text-text-main dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">qr_code_scanner</span> Validation de billet
            </h2>
            <div className="flex items-center gap-1 p-1 rounded-full bg-gray-100 dark:bg-gray-800 text-xs font-black">
              <button
                type="button"
                onClick={() => setScanMode('camera')}
                className={`px-3 py-1.5 rounded-full flex items-center gap-1 transition-colors ${
                  scanMode === 'camera' ? 'bg-primary text-text-main' : 'text-text-muted hover:text-text-main'
                }`}
                aria-pressed={scanMode === 'camera'}
              >
                <span className="material-symbols-outlined text-[16px]">videocam</span>
                Caméra
              </button>
              <button
                type="button"
                onClick={() => setScanMode('manual')}
                className={`px-3 py-1.5 rounded-full flex items-center gap-1 transition-colors ${
                  scanMode === 'manual' ? 'bg-primary text-text-main' : 'text-text-muted hover:text-text-main'
                }`}
                aria-pressed={scanMode === 'manual'}
              >
                <span className="material-symbols-outlined text-[16px]">keyboard</span>
                Saisie
              </button>
            </div>
          </div>

          {scanMode === 'camera' ? (
            <QrScanner onDecode={(value) => doCheckin(value)} />
          ) : (
            <div className="flex gap-2 flex-wrap">
              <input
                value={qrInput}
                onChange={(e) => setQrInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') doCheckin(qrInput); }}
                placeholder="Code QR / référence"
                className="flex-1 min-w-64 rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-2 font-mono text-sm bg-white dark:bg-background-dark text-text-main dark:text-white"
              />
              <button onClick={() => doCheckin(qrInput)} className="px-6 py-2 bg-primary text-text-main rounded-lg font-black text-sm">Valider</button>
            </div>
          )}

          {lastCheckin && (
            <div className={`mt-3 text-sm font-black ${lastCheckin.ok ? 'text-green-600' : 'text-red-600'}`}>
              {lastCheckin.ok ? '✔ ' : '✖ '}{lastCheckin.message}
            </div>
          )}
        </div>

        {/* Manifest */}
        {isLoading ? (
          <div className="text-center py-16"><span className="material-symbols-outlined animate-spin text-5xl text-primary">progress_activity</span></div>
        ) : (
          <div className="space-y-4">
            {manifest.map((d) => (
              <div key={d.id} className="bg-white dark:bg-surface-dark rounded-xl border border-gray-100 dark:border-gray-800 shadow-subtle overflow-hidden">
                <div className="p-4 flex items-center justify-between flex-wrap gap-3 border-b border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-4">
                    <span className="size-3 rounded-full" style={{ backgroundColor: d.brandColor }} />
                    <div>
                      <div className="font-black text-text-main dark:text-white">{new Date(d.departureAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} • {d.from} → {d.to}</div>
                      <div className="text-xs text-text-muted">{d.company}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-xs font-black text-text-muted">{d.seatsTotal - d.seatsAvailable}/{d.seatsTotal} billets</div>
                    <a
                      href={`/admin/manifest/${d.id}/print`}
                      target="_blank"
                      rel="noopener"
                      className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-[10px] font-black flex items-center gap-1 hover:bg-gray-200"
                      aria-label="Manifeste imprimable"
                    >
                      <span className="material-symbols-outlined text-sm">print</span>
                      Manifeste
                    </a>
                  </div>
                </div>
                <div className="p-4 space-y-1">
                  {d.bookings.length === 0 && <div className="text-xs text-text-muted">Aucune réservation.</div>}
                  {d.bookings.map((b) => (
                    <div key={b.id} className="flex items-center justify-between text-xs flex-wrap gap-2">
                      <div className="flex items-center gap-2 flex-1">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${b.status === 'BOARDED' ? 'bg-gray-200 text-gray-700' : 'bg-green-100 text-green-700'}`}>{b.status}</span>
                        <span className="text-text-main dark:text-white">{b.passengers.map((p) => p.name).join(', ') || 'Passager'}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        {b.seats.length > 0 && <span className="font-mono text-text-muted">{b.seats.join(',')}</span>}
                        <button onClick={() => doCheckin(b.qrCode)} className="px-2 py-1 bg-primary/10 text-primary rounded font-black text-[10px] hover:bg-primary hover:text-text-main">SCAN</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {loadError && (
              <div role="alert" className="text-center py-10">
                <p className="text-red-600 font-bold mb-3">{loadError}</p>
                <button onClick={fetchManifest} className="px-4 py-2 rounded-lg bg-primary text-text-main font-bold text-sm">Réessayer</button>
              </div>
            )}
            {!loadError && manifest.length === 0 && <p className="text-text-muted text-center py-10">Aucun départ ce jour.</p>}
          </div>
        )}
        </>)}
      </div>
    </div>
  );
};

export default StationManagerDashboard;
