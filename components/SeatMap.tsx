'use client';
import React, { useEffect, useState } from 'react';
import type { SeatLayout } from '../lib/seat-layout';

type SeatData = {
  departureId: string;
  basePriceCents: number;
  currency: string;
  capacity: number;
  layout: SeatLayout;
  bookedSeats: string[];
  seatsAvailable: number;
};

type SeatMapProps = {
  departureId: string;
  totalSeatsNeeded: number;
  selectedSeats: string[];
  onChange: (seats: string[]) => void;
  label?: string;
};

function seatIdFor(row: number, col: number) {
  return `${row}${String.fromCharCode(65 + col)}`;
}

const SeatMap: React.FC<SeatMapProps> = ({ departureId, totalSeatsNeeded, selectedSeats, onChange, label }) => {
  const [data, setData] = useState<SeatData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/departures/${departureId}/seats`)
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || 'Impossible de charger le plan du bus.');
        return j.data as SeatData;
      })
      .then((d) => {
        if (cancelled) return;
        setData(d);
      })
      .catch((e) => !cancelled && setError(e instanceof Error ? e.message : String(e)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [departureId]);

  if (loading) {
    return (
      <div className="bg-surface-dark/40 dark:bg-surface-dark rounded-2xl p-6 border border-gray-200 dark:border-gray-800">
        <div className="animate-pulse space-y-3">
          <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="grid grid-cols-5 gap-2">
            {Array.from({ length: 30 }).map((_, i) => (
              <div key={i} className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 rounded-2xl p-4 text-sm text-red-700 dark:text-red-300">
        {error || 'Plan indisponible.'}
      </div>
    );
  }

  const { layout, bookedSeats, basePriceCents } = data;
  const booked = new Set(bookedSeats);
  const disabled = new Set(layout.disabledCells);
  const vipPrice = Math.round(basePriceCents * layout.vipMultiplier);
  const vipCount = selectedSeats.filter((s) => layout.vipRows.includes(Number(/^(\d+)/.exec(s)?.[1] || 0))).length;
  const classicCount = selectedSeats.length - vipCount;
  const totalPriceCents = vipCount * vipPrice + classicCount * basePriceCents;

  const toggle = (id: string) => {
    if (booked.has(id) || disabled.has(id)) return;
    if (selectedSeats.includes(id)) {
      onChange(selectedSeats.filter((s) => s !== id));
    } else if (selectedSeats.length < totalSeatsNeeded) {
      onChange([...selectedSeats, id]);
    } else {
      // Replace oldest selection to make UX forgiving
      onChange([...selectedSeats.slice(1), id]);
    }
  };

  const rows = Array.from({ length: layout.rows }, (_, i) => i + 1);
  const cols = Array.from({ length: layout.cols }, (_, i) => i);

  return (
    <div className="bg-white dark:bg-surface-dark rounded-2xl p-4 sm:p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base sm:text-lg font-black text-text-main dark:text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">event_seat</span>
            {label || 'Choisissez vos sièges'}
          </h3>
          <p className="text-xs text-text-muted mt-0.5">
            {selectedSeats.length}/{totalSeatsNeeded} sélectionné{selectedSeats.length > 1 ? 's' : ''} • {layout.label}
          </p>
        </div>
        <div className="text-right hidden sm:block">
          <div className="text-[10px] uppercase tracking-wider text-text-muted">Total sièges</div>
          <div className="text-lg font-black text-primary">{totalPriceCents.toLocaleString()} XAF</div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-[11px] text-text-muted mb-4">
        <span className="flex items-center gap-1.5">
          <span className="size-4 rounded bg-gray-200 dark:bg-gray-700 border-b-2 border-gray-300 dark:border-gray-600"></span> Libre
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-4 rounded bg-primary border-b-2 border-green-700"></span> Sélectionné
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-4 rounded bg-amber-400/30 border border-amber-500 text-amber-600 text-[8px] font-bold flex items-center justify-center">★</span> VIP (+{Math.round((layout.vipMultiplier - 1) * 100)}%)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-4 rounded bg-red-200 dark:bg-red-900/40 border-b-2 border-red-300 dark:border-red-800"></span> Occupé
        </span>
      </div>

      {/* Bus frame */}
      <div className="relative mx-auto max-w-[420px] border-2 border-gray-200 dark:border-gray-700 rounded-t-[40%] rounded-b-2xl p-4 pt-8 bg-gray-50 dark:bg-[#0a1b12]">
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-gray-200 dark:bg-gray-800 text-text-muted text-[10px] px-3 py-0.5 rounded-full">
          <span className="material-symbols-outlined text-xs">directions_bus</span> Avant du bus
        </div>
        <div className="flex flex-col gap-2">
          {rows.map((r) => {
            const isVipRow = layout.vipRows.includes(r);
            return (
              <div key={r} className="flex items-center gap-2 justify-center">
                <span className="w-5 text-[10px] text-text-muted text-right">{r}</span>
                {cols.map((c) => {
                  const id = seatIdFor(r, c);
                  const isDisabled = disabled.has(id);
                  const isBooked = booked.has(id);
                  const isSelected = selectedSeats.includes(id);

                  // Aisle break
                  const renderAisle = c === layout.aisleAfterCol;
                  return (
                    <React.Fragment key={id}>
                      {renderAisle && <span className="w-4"></span>}
                      {isDisabled ? (
                        <span className="size-9 sm:size-10 rounded-lg bg-transparent flex items-center justify-center text-text-muted">
                          <span className="material-symbols-outlined text-sm opacity-40">
                            {r === 1 && c === 0 ? 'airline_seat_recline_normal' : ''}
                          </span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => toggle(id)}
                          disabled={isBooked}
                          aria-label={`Siège ${id}${isVipRow ? ' VIP' : ''}${isBooked ? ' (occupé)' : ''}`}
                          className={[
                            'size-9 sm:size-10 rounded-lg flex items-center justify-center font-bold text-[11px] transition-all border-b-2 active:translate-y-0.5',
                            isBooked
                              ? 'bg-red-200/70 dark:bg-red-900/40 text-red-400 dark:text-red-500 border-red-300 dark:border-red-800 cursor-not-allowed'
                              : isSelected
                                ? 'bg-primary text-text-main border-green-700 shadow-md scale-105'
                                : isVipRow
                                  ? 'bg-amber-400/20 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500 hover:bg-amber-400/30'
                                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700',
                          ].join(' ')}
                        >
                          {isBooked ? <span className="material-symbols-outlined text-base">close</span> : id}
                        </button>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Selection chips */}
      {selectedSeats.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {selectedSeats.map((s) => {
            const isVip = layout.vipRows.includes(Number(/^(\d+)/.exec(s)?.[1] || 0));
            return (
              <span key={s} className={`text-xs font-bold px-2.5 py-1 rounded-full ${isVip ? 'bg-amber-400/20 text-amber-700' : 'bg-primary/10 text-primary'}`}>
                {s}{isVip ? ' ★' : ''}
              </span>
            );
          })}
        </div>
      )}

      {selectedSeats.length < totalSeatsNeeded && (
        <p className="mt-3 text-xs text-amber-600 dark:text-amber-400">
          Sélectionnez encore {totalSeatsNeeded - selectedSeats.length} siège{totalSeatsNeeded - selectedSeats.length > 1 ? 's' : ''}.
        </p>
      )}
    </div>
  );
};

export default SeatMap;
