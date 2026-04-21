'use client';

import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface TicketLeg {
  id: string;
  leg: 'OUTBOUND' | 'RETURN';
  seats: string[];
  qrCode: string;
  agencyName: string;
  from: string;
  to: string;
  fromCity: string;
  toCity: string;
  departureTime: string;
  arrivalTime: string;
  date: string;
  passengers: { fullName: string; idNumber?: string | null; seat?: string | null }[];
}

interface TicketModalProps {
  leg: TicketLeg | null;
  onClose: () => void;
}

const TicketModal: React.FC<TicketModalProps> = ({ leg, onClose }) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    if (!leg) return;
    let cancelled = false;
    setQrDataUrl('');
    QRCode.toDataURL(leg.qrCode, { width: 220, margin: 1, color: { dark: '#0a1a10', light: '#ffffff' } })
      .then((url) => { if (!cancelled) setQrDataUrl(url); })
      .catch(() => { if (!cancelled) setQrDataUrl(''); });
    return () => { cancelled = true; };
  }, [leg]);

  if (!leg) return null;

  const dateStr = new Date(leg.date).toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="relative max-w-md w-full my-auto" onClick={(e) => e.stopPropagation()}>
        {/* Ticket top (info) */}
        <div className="bg-white dark:bg-surface-dark rounded-t-2xl p-6 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-[10px] font-black text-primary uppercase tracking-widest">Billet Easy Travel</div>
              <div className="text-lg font-black text-text-main dark:text-white mt-1">{leg.agencyName}</div>
            </div>
            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${leg.leg === 'OUTBOUND' ? 'bg-primary/10 text-primary' : 'bg-blue-100 text-blue-700'}`}>
              {leg.leg === 'OUTBOUND' ? 'Aller' : 'Retour'}
            </span>
          </div>

          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <div className="text-3xl font-black text-text-main dark:text-white leading-none">{leg.departureTime}</div>
              <div className="text-xs text-text-muted mt-1 max-w-[120px]">{leg.fromCity}</div>
              <div className="text-[10px] text-text-muted mt-0.5 max-w-[140px] truncate">{leg.from}</div>
            </div>
            <div className="flex-1 flex flex-col items-center">
              <span className="material-symbols-outlined text-primary">directions_bus</span>
              <div className="w-full h-px border-t-2 border-dashed border-gray-200 dark:border-gray-700 my-1" />
            </div>
            <div className="text-right">
              <div className="text-3xl font-black text-text-main dark:text-white leading-none">{leg.arrivalTime}</div>
              <div className="text-xs text-text-muted mt-1 max-w-[120px]">{leg.toCity}</div>
              <div className="text-[10px] text-text-muted mt-0.5 max-w-[140px] truncate">{leg.to}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100 dark:border-gray-700 text-xs">
            <div>
              <div className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-0.5">Date</div>
              <div className="font-black text-text-main dark:text-white">{dateStr}</div>
            </div>
            <div>
              <div className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-0.5">Sièges</div>
              <div className="font-black text-text-main dark:text-white font-mono">{leg.seats.join(', ') || '—'}</div>
            </div>
            <div className="col-span-2">
              <div className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-0.5">Passager(s)</div>
              <div className="font-black text-text-main dark:text-white">{leg.passengers.map((p) => p.fullName).join(' • ')}</div>
            </div>
          </div>
        </div>

        {/* Ticket tear */}
        <div className="relative bg-white dark:bg-surface-dark">
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-t-2 border-dashed border-gray-200 dark:border-gray-700" />
          <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-black/60 rounded-full" />
          <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-black/60 rounded-full" />
          <div className="h-6" />
        </div>

        {/* Ticket bottom (QR) */}
        <div className="bg-white dark:bg-surface-dark rounded-b-2xl p-6 shadow-2xl text-center">
          <div className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-2">Scan à l'embarquement</div>
          {qrDataUrl ? (
            <img src={qrDataUrl} alt="QR code" className="mx-auto rounded-lg bg-white p-2" width={220} height={220} />
          ) : (
            <div className="size-[220px] mx-auto bg-gray-100 rounded-lg animate-pulse" />
          )}
          <div className="mt-3 text-[10px] font-mono text-text-muted break-all">{leg.qrCode}</div>
        </div>

        <button
          onClick={onClose}
          className="absolute -top-4 -right-4 size-10 bg-white dark:bg-surface-dark rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform border border-gray-100 dark:border-gray-700"
        >
          <span className="material-symbols-outlined text-text-main dark:text-white">close</span>
        </button>
      </div>
    </div>
  );
};

export default TicketModal;
