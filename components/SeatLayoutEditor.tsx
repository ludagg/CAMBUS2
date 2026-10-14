'use client';

import React, { useEffect, useMemo, useState } from 'react';
import type { SeatLayout } from '../lib/seat-layout';
import { defaultLayoutForCapacity, DEFAULT_VIP_MULTIPLIER } from '../lib/seat-layout';

const PRESETS: { key: string; label: string; build: () => SeatLayout }[] = [
  { key: 'coaster', label: 'Coaster 30', build: () => defaultLayoutForCapacity(30, 'CLASSIC') },
  { key: 'class50', label: 'Autocar 50', build: () => defaultLayoutForCapacity(50, 'CLASSIC') },
  { key: 'vip50', label: 'VIP 50', build: () => defaultLayoutForCapacity(50, 'VIP') },
  { key: 'class70', label: 'Autocar 70', build: () => defaultLayoutForCapacity(70, 'CLASSIC') },
  { key: 'vip70', label: 'VIP 70', build: () => defaultLayoutForCapacity(70, 'VIP') },
  {
    key: 'mix',
    label: 'Mix VIP avant',
    build: () => ({
      rows: 13,
      cols: 4,
      aisleAfterCol: 2,
      vipRows: [1, 2, 3, 4],
      disabledCells: ['1A'],
      label: 'Mix VIP + Classique',
      vipMultiplier: DEFAULT_VIP_MULTIPLIER,
    }),
  },
];

type Props = {
  vehicleId: string;
  initialLayout: SeatLayout | null;
  capacity: number;
  onClose: () => void;
  onSaved: (layout: SeatLayout) => void;
};

const colLetters = (n: number) => Array.from({ length: n }, (_, i) => String.fromCharCode(65 + i));

const SeatLayoutEditor: React.FC<Props> = ({ vehicleId, initialLayout, capacity, onClose, onSaved }) => {
  const [layout, setLayout] = useState<SeatLayout>(
    initialLayout ?? defaultLayoutForCapacity(capacity || 50, 'CLASSIC')
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    if (initialLayout) setLayout(initialLayout);
  }, [initialLayout]);

  const available = useMemo(() => {
    let n = layout.rows * layout.cols;
    n -= layout.disabledCells.length;
    return n;
  }, [layout]);

  const toggleVipRow = (r: number) => {
    setLayout((l) => ({
      ...l,
      vipRows: l.vipRows.includes(r) ? l.vipRows.filter((x) => x !== r) : [...l.vipRows, r].sort((a, b) => a - b),
    }));
  };

  const toggleDisabled = (id: string) => {
    setLayout((l) => ({
      ...l,
      disabledCells: l.disabledCells.includes(id) ? l.disabledCells.filter((x) => x !== id) : [...l.disabledCells, id],
    }));
  };

  const handleSave = async () => {
    if (layout.aisleAfterCol >= layout.cols) {
      setError('La position du couloir doit être strictement inférieure au nombre de colonnes.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/vehicles/${vehicleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seatLayout: layout }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Sauvegarde impossible.');
      onSaved(layout);
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  const letters = colLetters(layout.cols);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div role="dialog" aria-modal="true" aria-label="Configurer le plan du bus" className="bg-white dark:bg-surface-dark w-full max-w-3xl rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 flex flex-col max-h-[92vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h3 className="font-black text-text-main dark:text-white text-lg">Configurer le plan du bus</h3>
            <p className="text-xs text-text-muted">
              {available} sièges utiles · {layout.vipRows.length} rangée{layout.vipRows.length > 1 ? 's' : ''} VIP
            </p>
          </div>
          <button onClick={onClose} className="size-9 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center" aria-label="Fermer">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 grid md:grid-cols-5 gap-6">
          {/* Form */}
          <div className="md:col-span-2 space-y-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-text-muted mb-1">Presets</label>
              <div className="flex flex-wrap gap-1.5">
                {PRESETS.map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => setLayout(p.build())}
                    className="text-[10px] font-black uppercase px-2.5 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 border border-primary/30"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-text-muted mb-1">Label</label>
              <input
                type="text"
                value={layout.label}
                onChange={(e) => setLayout({ ...layout, label: e.target.value })}
                className="w-full h-10 px-3 bg-gray-50 dark:bg-[#102216] border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-text-main dark:text-white focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-text-muted mb-1">Rangées</label>
                <input
                  type="number" min={1} max={30}
                  value={layout.rows}
                  onChange={(e) => setLayout({ ...layout, rows: Math.max(1, Math.min(30, Number(e.target.value) || 1)) })}
                  className="w-full h-10 px-3 bg-gray-50 dark:bg-[#102216] border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-text-main dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-text-muted mb-1">Colonnes</label>
                <input
                  type="number" min={2} max={6}
                  value={layout.cols}
                  onChange={(e) => setLayout({ ...layout, cols: Math.max(2, Math.min(6, Number(e.target.value) || 2)) })}
                  className="w-full h-10 px-3 bg-gray-50 dark:bg-[#102216] border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-text-main dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-text-muted mb-1">Couloir après col.</label>
                <select
                  value={layout.aisleAfterCol}
                  onChange={(e) => setLayout({ ...layout, aisleAfterCol: Number(e.target.value) })}
                  className="w-full h-10 px-3 bg-gray-50 dark:bg-[#102216] border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-text-main dark:text-white"
                >
                  <option value={0}>Aucun</option>
                  {colLetters(layout.cols).slice(0, -1).map((l, i) => (
                    <option key={l} value={i + 1}>Après {l}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-text-muted mb-1">Bonus VIP</label>
                <select
                  value={layout.vipMultiplier}
                  onChange={(e) => setLayout({ ...layout, vipMultiplier: Number(e.target.value) })}
                  className="w-full h-10 px-3 bg-gray-50 dark:bg-[#102216] border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-text-main dark:text-white"
                >
                  <option value={1}>Aucun</option>
                  <option value={1.15}>+15%</option>
                  <option value={1.3}>+30%</option>
                  <option value={1.5}>+50%</option>
                  <option value={2}>+100%</option>
                </select>
              </div>
            </div>

            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-2">Rangées VIP (cliquez pour basculer)</div>
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: layout.rows }, (_, i) => i + 1).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => toggleVipRow(r)}
                    className={`size-8 rounded-lg text-xs font-black border transition-all ${
                      layout.vipRows.includes(r)
                        ? 'bg-amber-400 text-amber-900 border-amber-500'
                        : 'bg-gray-100 dark:bg-gray-800 text-text-muted border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-[11px] text-text-muted bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-gray-800 rounded-lg p-3 leading-relaxed">
              Astuce : cliquez directement sur un siège dans l'aperçu pour le désactiver (conducteur, escaliers, toilettes…). Clic à nouveau pour le réactiver.
            </div>

            {error && <div className="text-xs font-bold text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 rounded-lg px-3 py-2">{error}</div>}
          </div>

          {/* Preview */}
          <div className="md:col-span-3">
            <div className="bg-gray-50 dark:bg-[#0b1e13] border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl p-4">
              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-text-muted mb-3">
                <span>Avant du bus</span>
                <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">steering_wheel</span> conducteur</span>
              </div>
              <div className="space-y-1.5">
                {Array.from({ length: layout.rows }, (_, r) => r + 1).map((r) => {
                  const isVip = layout.vipRows.includes(r);
                  return (
                    <div key={r} className="flex items-center gap-1.5 justify-center">
                      {letters.map((L, ci) => {
                        const id = `${r}${L}`;
                        const disabled = layout.disabledCells.includes(id);
                        const aisle = layout.aisleAfterCol > 0 && ci === layout.aisleAfterCol;
                        return (
                          <React.Fragment key={id}>
                            {aisle && <div className="w-5 text-center text-[10px] text-gray-400">{r}</div>}
                            <button
                              type="button"
                              onClick={() => toggleDisabled(id)}
                              aria-label={`Bascule ${id}`}
                              className={`size-8 rounded-md text-[10px] font-bold border transition-all flex items-center justify-center ${
                                disabled
                                  ? 'bg-gray-900 text-white border-gray-700 opacity-70'
                                  : isVip
                                  ? 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200'
                                  : 'bg-white dark:bg-gray-700 text-text-muted border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
                              }`}
                            >
                              {disabled ? '×' : isVip ? '★' : id}
                            </button>
                          </React.Fragment>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center gap-3 flex-wrap text-[10px] text-text-muted mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                <span className="flex items-center gap-1"><span className="inline-block size-3 rounded bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600" /> classique</span>
                <span className="flex items-center gap-1"><span className="inline-block size-3 rounded bg-amber-100 border border-amber-300" /> VIP</span>
                <span className="flex items-center gap-1"><span className="inline-block size-3 rounded bg-gray-900 border border-gray-700" /> désactivé</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800">
          <button
            type="button"
            onClick={() => setLayout(defaultLayoutForCapacity(capacity || 50, 'CLASSIC'))}
            className="text-xs font-black uppercase text-text-muted hover:text-text-main dark:hover:text-white"
          >
            Réinitialiser
          </button>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-bold text-text-muted hover:bg-gray-100 dark:hover:bg-gray-800">Annuler</button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 rounded-lg bg-primary text-text-main font-black text-sm hover:bg-[#0fd651] disabled:opacity-60 flex items-center gap-2"
            >
              {saving && <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>}
              Enregistrer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeatLayoutEditor;
