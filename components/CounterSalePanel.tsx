'use client';

import React, { useEffect, useRef, useState } from 'react';
import SeatMap from './SeatMap';

type Departure = {
  id: string;
  company: string;
  brandColor: string;
  from: string;
  to: string;
  departureAt: string;
  arrivalAt: string;
  priceCents: number;
  currency: string;
  seatsTotal: number;
  seatsAvailable: number;
  tripStatus: string;
};

type Passenger = { fullName: string; idNumber: string };

type Props = {
  onSold?: (groupId: string) => void;
};

function formatXAF(cents: number) {
  return `${cents.toLocaleString('fr-FR')} FCFA`;
}

const CounterSalePanel: React.FC<Props> = ({ onSold }) => {
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(today);
  const [departures, setDepartures] = useState<Departure[]>([]);
  const [selectedDep, setSelectedDep] = useState<Departure | null>(null);
  const [passengers, setPassengers] = useState<Passenger[]>([{ fullName: '', idNumber: '' }]);
  const [seats, setSeats] = useState<string[]>([]);
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'MOMO' | 'OM'>('CASH');
  const [paymentPhone, setPaymentPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const idemKeyRef = useRef('');
  const [error, setError] = useState<string | null>(null);
  const [lastSale, setLastSale] = useState<{ groupId: string; bookingId?: string } | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/departures-list?from=${date}&to=${date}`)
      .then((r) => r.json())
      .then((j) => setDepartures(j.data ?? []))
      .finally(() => setLoading(false));
  }, [date]);

  const reset = () => {
    setSelectedDep(null);
    setPassengers([{ fullName: '', idNumber: '' }]);
    setSeats([]);
    setContactPhone('');
    setContactEmail('');
    setPaymentPhone('');
    setPaymentMethod('CASH');
    setError(null);
  };

  const updatePassenger = (i: number, key: keyof Passenger, value: string) => {
    setPassengers((prev) => prev.map((p, idx) => (idx === i ? { ...p, [key]: value } : p)));
  };

  const submit = async () => {
    if (!selectedDep) return;
    setError(null);
    const nameMissing = passengers.some((p) => !p.fullName.trim());
    if (nameMissing) return setError('Saisissez le nom de chaque passager.');
    if (seats.length !== passengers.length) {
      return setError(`Sélectionnez ${passengers.length} siège(s) sur le plan.`);
    }
    if ((paymentMethod === 'MOMO' || paymentMethod === 'OM') && !paymentPhone.trim()) {
      return setError('Numéro Mobile Money requis.');
    }

    // One key per sale attempt: a retry after a network error must not create a second sale.
    if (!idemKeyRef.current) idemKeyRef.current = crypto.randomUUID();
    setLoading(true);
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idemKeyRef.current,
        },
        body: JSON.stringify({
          outboundDepartureId: selectedDep.id,
          outboundSeats: seats,
          passengers: passengers.map((p, i) => ({
            fullName: p.fullName,
            idNumber: p.idNumber || undefined,
            seat: seats[i],
          })),
          contactEmail: contactEmail || 'guichet@easytravel.cm',
          contactPhone: contactPhone || '000000000',
          contactName: passengers[0].fullName,
          paymentMethod,
          paymentPhone:
            paymentMethod === 'MOMO' || paymentMethod === 'OM' ? paymentPhone : undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erreur à la vente.');
      idemKeyRef.current = '';
      setLastSale({ groupId: json.data.groupId });
      onSold?.(json.data.groupId);
      reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-surface-dark rounded-xl border border-gray-100 dark:border-gray-800 p-6">
      <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
        <h2 className="font-black text-text-main dark:text-white flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">point_of_sale</span>
          Vente au guichet
        </h2>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm font-black bg-white dark:bg-background-dark text-text-main dark:text-white"
        />
      </div>

      {lastSale && (
        <div className="mb-4 p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 flex items-center justify-between flex-wrap gap-2">
          <div className="text-sm font-black text-green-700 dark:text-green-300">
            ✔ Billet vendu • référence {lastSale.groupId.slice(-8).toUpperCase()}
          </div>
          <a
            href={`/admin/ticket/${lastSale.groupId}/print`}
            target="_blank"
            rel="noopener"
            className="px-3 py-1 bg-green-600 text-white rounded-md text-xs font-black flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-sm">print</span>
            Imprimer
          </a>
        </div>
      )}

      {!selectedDep ? (
        <div>
          <div className="text-xs text-text-muted mb-2">Sélectionnez un départ :</div>
          {loading ? (
            <div className="text-center py-8 text-text-muted text-sm">Chargement…</div>
          ) : departures.length === 0 ? (
            <div className="text-center py-8 text-text-muted text-sm">Aucun départ ce jour.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {departures
                .filter((d) => d.tripStatus !== 'CANCELLED' && d.seatsAvailable > 0)
                .map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setSelectedDep(d)}
                    className="text-left p-3 rounded-lg border border-gray-100 dark:border-gray-800 hover:border-primary bg-white dark:bg-background-dark"
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-black text-text-main dark:text-white text-sm">
                        {new Date(d.departureAt).toLocaleTimeString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        · {d.from} → {d.to}
                      </div>
                      <span
                        className="size-2 rounded-full"
                        style={{ backgroundColor: d.brandColor }}
                      />
                    </div>
                    <div className="text-xs text-text-muted mt-1">
                      {d.company} · {formatXAF(d.priceCents)} · {d.seatsAvailable}/{d.seatsTotal} places
                      {d.tripStatus === 'DELAYED' && (
                        <span className="ml-2 text-orange-600 font-black">⏰ RETARDÉ</span>
                      )}
                    </div>
                  </button>
                ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <button
            onClick={reset}
            className="text-xs text-primary font-black flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Changer de départ
          </button>
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
            <div className="font-black text-sm text-text-main dark:text-white">
              {selectedDep.from} → {selectedDep.to} ·{' '}
              {new Date(selectedDep.departureAt).toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
            <div className="text-xs text-text-muted">
              {selectedDep.company} · {formatXAF(selectedDep.priceCents)} / place
            </div>
          </div>

          {/* Passengers */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-xs font-black text-text-muted uppercase">Passagers</div>
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    setPassengers((p) =>
                      p.length > 1 ? p.slice(0, -1) : p,
                    )
                  }
                  className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-xs font-black"
                >
                  −
                </button>
                <span className="font-black text-sm">{passengers.length}</span>
                <button
                  onClick={() =>
                    setPassengers((p) =>
                      p.length < 10 ? [...p, { fullName: '', idNumber: '' }] : p,
                    )
                  }
                  className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-xs font-black"
                >
                  +
                </button>
              </div>
            </div>
            {passengers.map((p, i) => (
              <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <input
                  placeholder={`Nom complet passager ${i + 1}`}
                  value={p.fullName}
                  onChange={(e) => updatePassenger(i, 'fullName', e.target.value)}
                  className="rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm bg-white dark:bg-background-dark text-text-main dark:text-white"
                />
                <input
                  placeholder="N° CNI (optionnel)"
                  value={p.idNumber}
                  onChange={(e) => updatePassenger(i, 'idNumber', e.target.value)}
                  className="rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm bg-white dark:bg-background-dark text-text-main dark:text-white"
                />
              </div>
            ))}
          </div>

          <SeatMap
            departureId={selectedDep.id}
            totalSeatsNeeded={passengers.length}
            selectedSeats={seats}
            onChange={setSeats}
            label="Sièges"
          />

          {/* Contact */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <input
              placeholder="Téléphone de contact (6XX XXX XXX)"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              className="rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm bg-white dark:bg-background-dark text-text-main dark:text-white"
            />
            <input
              placeholder="Email de contact (optionnel)"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              className="rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm bg-white dark:bg-background-dark text-text-main dark:text-white"
            />
          </div>

          {/* Payment */}
          <div>
            <div className="text-xs font-black text-text-muted uppercase mb-2">Paiement</div>
            <div className="grid grid-cols-3 gap-2">
              {(['CASH', 'MOMO', 'OM'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setPaymentMethod(m)}
                  className={`p-3 rounded-lg border text-sm font-black ${
                    paymentMethod === m
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-background-dark text-text-main dark:text-white'
                  }`}
                >
                  {m === 'CASH' ? 'Espèces' : m === 'MOMO' ? 'MTN MoMo' : 'Orange Money'}
                </button>
              ))}
            </div>
            {(paymentMethod === 'MOMO' || paymentMethod === 'OM') && (
              <input
                placeholder="Numéro Mobile Money (6XX XXX XXX)"
                value={paymentPhone}
                onChange={(e) => setPaymentPhone(e.target.value)}
                className="mt-2 w-full rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm bg-white dark:bg-background-dark text-text-main dark:text-white"
              />
            )}
          </div>

          {error && (
            <div className="p-2 rounded bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-300 font-black">
              {error}
            </div>
          )}

          <button
            onClick={submit}
            disabled={loading}
            className="w-full py-3 rounded-lg bg-primary text-text-main font-black disabled:opacity-50"
          >
            {loading
              ? 'En cours…'
              : `Encaisser ${formatXAF(selectedDep.priceCents * passengers.length)}`}
          </button>
        </div>
      )}
    </div>
  );
};

export default CounterSalePanel;
