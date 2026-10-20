'use client';

import { todayLocal } from '../lib/datetime';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import SeatMap from './SeatMap';
import {
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  ErrorState,
  Field,
  IconButton,
  InlineAlert,
  Input,
  SearchInput,
  SkeletonList,
  cx,
  formatXAF,
  useToast,
} from './admin/ui';

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

// Cameroon mobile: 9 digits starting with 6, optional +237 / 00237 prefix, spaces tolerated.
function normalizeCmPhone(value: string) {
  return value.replace(/[\s.-]/g, '').replace(/^(\+237|00237)/, '');
}

function isValidCmMobile(value: string) {
  return /^6\d{8}$/.test(normalizeCmPhone(value));
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

const PAYMENT_OPTIONS = [
  { value: 'CASH', label: 'Espèces', icon: 'payments' },
  { value: 'MOMO', label: 'MTN MoMo', icon: 'smartphone' },
  { value: 'OM', label: 'Orange Money', icon: 'smartphone' },
] as const;

const timeFmt = (iso: string) =>
  new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Douala' });

const StepTitle: React.FC<{ n: number; done?: boolean }> = ({ n, done }) => (
  <span
    className={cx(
      'inline-flex size-6 items-center justify-center rounded-full text-xs font-semibold tabular-nums',
      done ? 'bg-primary text-ink-950' : 'bg-ink-100 dark:bg-white/10 text-text-main dark:text-white',
    )}
    aria-hidden="true"
  >
    {done ? <span className="material-symbols-outlined text-[16px]">check</span> : n}
  </span>
);

const CounterSalePanel: React.FC<Props> = ({ onSold }) => {
  const toast = useToast();
  const today = todayLocal();
  const [date, setDate] = useState(today);
  const [departures, setDepartures] = useState<Departure[]>([]);
  const [depLoading, setDepLoading] = useState(true);
  const [depError, setDepError] = useState<string | null>(null);
  const [reloadTick, setReloadTick] = useState(0);
  const [search, setSearch] = useState('');
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
  const [lastSale, setLastSale] = useState<{ groupId: string; bookingId?: string; total: number; route: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    setDepLoading(true);
    setDepError(null);
    fetch(`/api/admin/departures-list?from=${date}&to=${date}`)
      .then(async (r) => {
        const j = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(j.error || 'Impossible de charger les départs.');
        return j;
      })
      .then((j) => {
        if (!cancelled) setDepartures(j.data ?? []);
      })
      .catch((e) => {
        if (!cancelled) {
          setDepartures([]);
          setDepError(e instanceof Error ? e.message : String(e));
        }
      })
      .finally(() => {
        if (!cancelled) setDepLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [date, reloadTick]);

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

  const removePassenger = () => {
    if (passengers.length <= 1) return;
    setPassengers((p) => p.slice(0, -1));
    // Keep selected seats in sync with the passenger count.
    setSeats((s) => s.slice(0, passengers.length - 1));
  };

  const addPassenger = () =>
    setPassengers((p) => (p.length < 10 ? [...p, { fullName: '', idNumber: '' }] : p));

  const submit = async () => {
    if (!selectedDep) return;
    setError(null);
    const nameMissing = passengers.some((p) => !p.fullName.trim());
    if (nameMissing) return setError('Saisissez le nom de chaque passager.');
    if (seats.length !== passengers.length) {
      return setError(`Sélectionnez ${passengers.length} siège(s) sur le plan.`);
    }
    if (!contactPhone.trim()) return setError('Téléphone du client requis.');
    if (!isValidCmMobile(contactPhone)) {
      return setError('Téléphone du client invalide (9 chiffres, commençant par 6).');
    }
    const email = contactEmail.trim();
    if (email && !isValidEmail(email)) return setError('Adresse e-mail invalide.');
    const isMobileMoney = paymentMethod === 'MOMO' || paymentMethod === 'OM';
    if (isMobileMoney && !paymentPhone.trim()) return setError('Numéro Mobile Money requis.');
    if (isMobileMoney && !isValidCmMobile(paymentPhone)) {
      return setError('Numéro Mobile Money invalide (9 chiffres, commençant par 6).');
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
          contactEmail: email || 'guichet@easytravel.cm',
          contactPhone: normalizeCmPhone(contactPhone),
          contactName: passengers[0].fullName,
          paymentMethod,
          paymentPhone: isMobileMoney ? normalizeCmPhone(paymentPhone) : undefined,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Erreur à la vente.');
      idemKeyRef.current = '';
      const total = selectedDep.priceCents * passengers.length;
      setLastSale({
        groupId: json.data.groupId,
        total,
        route: `${selectedDep.from} → ${selectedDep.to}`,
      });
      toast(`Billet vendu · ${formatXAF(total)}`, 'success');
      onSold?.(json.data.groupId);
      reset();
      setReloadTick((t) => t + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const sellable = useMemo(
    () => departures.filter((d) => d.tripStatus !== 'CANCELLED' && d.seatsAvailable > 0),
    [departures],
  );
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return sellable;
    return sellable.filter((d) => `${d.from} ${d.to} ${d.company} ${timeFmt(d.departureAt)}`.toLowerCase().includes(q));
  }, [sellable, search]);

  const total = selectedDep ? selectedDep.priceCents * passengers.length : 0;
  const isMobileMoney = paymentMethod === 'MOMO' || paymentMethod === 'OM';

  if (lastSale) {
    return (
      <Card className="max-w-2xl">
        <div role="status" aria-live="polite" className="flex flex-col items-center text-center py-6">
          <span className="inline-flex size-16 items-center justify-center rounded-2xl bg-primary/15 text-teal-accent dark:text-primary mb-4">
            <span className="material-symbols-outlined text-[36px]">check_circle</span>
          </span>
          <h2 className="font-display text-xl font-semibold text-text-main dark:text-white">Billet vendu</h2>
          <p className="mt-1 text-sm text-text-muted dark:text-gray-400">
            {lastSale.route} · <span className="tabular-nums font-medium">{formatXAF(lastSale.total)}</span>
          </p>
          <div className="mt-4 rounded-xl bg-ink-50 dark:bg-white/5 border border-ink-100 dark:border-white/10 px-4 py-2">
            <span className="text-xs text-text-muted">Référence </span>
            <span className="font-mono font-semibold text-text-main dark:text-white">
              {lastSale.groupId.slice(-8).toUpperCase()}
            </span>
          </div>
          <div className="mt-6 flex items-center justify-center gap-3 flex-wrap">
            <a
              href={`/admin/ticket/${lastSale.groupId}/print`}
              target="_blank"
              rel="noopener"
              className="inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-xl bg-primary text-ink-950 hover:bg-primary-600 shadow-subtle text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2"
            >
              <span className="material-symbols-outlined text-[18px]">print</span>
              Imprimer le billet
            </a>
            <Button variant="secondary" icon="add" onClick={() => setLastSale(null)}>
              Nouvelle vente
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] items-start">
      <div className="space-y-6 min-w-0">
        {/* Step 1 */}
        <Card>
          <CardHeader
            icon="directions_bus"
            title={
              <span className="inline-flex items-center gap-2">
                <StepTitle n={1} done={!!selectedDep} /> Départ
              </span>
            }
            subtitle="Choisissez le départ à vendre."
            action={
              <Input
                type="date"
                aria-label="Date des départs"
                value={date}
                onChange={(e) => e.target.value && setDate(e.target.value)}
                className="!w-auto"
              />
            }
          />
          {selectedDep ? (
            <div className="flex items-center justify-between gap-3 flex-wrap rounded-xl border border-primary/40 bg-primary/5 p-3.5">
              <div className="min-w-0">
                <div className="font-semibold text-text-main dark:text-white tabular-nums">
                  {timeFmt(selectedDep.departureAt)} · {selectedDep.from} → {selectedDep.to}
                </div>
                <div className="text-xs text-text-muted mt-0.5">
                  {selectedDep.company} · {formatXAF(selectedDep.priceCents)} / place
                </div>
              </div>
              <Button size="sm" variant="secondary" icon="arrow_back" onClick={reset}>
                Changer de départ
              </Button>
            </div>
          ) : depError ? (
            <ErrorState message={depError} onRetry={() => setReloadTick((t) => t + 1)} />
          ) : depLoading ? (
            <SkeletonList rows={3} />
          ) : sellable.length === 0 ? (
            <EmptyState icon="event_busy" title="Aucun départ disponible" description="Aucun départ avec des places libres à cette date." />
          ) : (
            <div className="space-y-3">
              <SearchInput value={search} onChange={setSearch} placeholder="Rechercher un trajet, une compagnie…" label="Rechercher un départ" />
              {filtered.length === 0 ? (
                <p className="text-sm text-text-muted py-6 text-center">Aucun départ ne correspond à la recherche.</p>
              ) : (
                <ul className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                  {filtered.map((d) => (
                    <li key={d.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedDep(d)}
                        className="w-full text-left flex items-center gap-4 p-3.5 rounded-xl border border-ink-100 dark:border-white/10 bg-white dark:bg-ink-950/30 hover:border-primary hover:bg-primary/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                      >
                        <span className="font-display text-lg font-semibold tabular-nums text-text-main dark:text-white w-14 shrink-0">
                          {timeFmt(d.departureAt)}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2 font-medium text-text-main dark:text-white truncate">
                            <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: d.brandColor }} aria-hidden="true" />
                            <span className="truncate">{d.from} → {d.to}</span>
                            {d.tripStatus === 'DELAYED' && <Badge tone="warning">Retardé</Badge>}
                          </span>
                          <span className="block text-xs text-text-muted truncate">{d.company}</span>
                        </span>
                        <span className="text-right shrink-0">
                          <span className="block text-sm font-semibold tabular-nums text-text-main dark:text-white">{formatXAF(d.priceCents)}</span>
                          <span className="block text-xs text-text-muted tabular-nums">{d.seatsAvailable}/{d.seatsTotal} places</span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </Card>

        {selectedDep && (
          <>
            {/* Step 2 */}
            <Card>
              <CardHeader
                icon="airline_seat_recline_normal"
                title={
                  <span className="inline-flex items-center gap-2">
                    <StepTitle n={2} done={seats.length === passengers.length && passengers.every((p) => p.fullName.trim() !== '')} /> Passagers &amp; sièges
                  </span>
                }
                subtitle="Un nom et un siège par passager."
                action={
                  <div className="inline-flex items-center gap-1 rounded-xl bg-ink-100/80 dark:bg-white/10 p-1">
                    <IconButton icon="remove" label="Retirer un passager" onClick={removePassenger} disabled={passengers.length <= 1} className="!size-8" />
                    <span className="min-w-8 text-center font-semibold tabular-nums text-sm" aria-live="polite">{passengers.length}</span>
                    <IconButton icon="add" label="Ajouter un passager" onClick={addPassenger} disabled={passengers.length >= 10} className="!size-8" />
                  </div>
                }
              />
              <div className="space-y-3">
                {passengers.map((p, i) => (
                  <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Field label={`Passager ${i + 1}`}>
                      <Input
                        aria-label={`Nom complet passager ${i + 1}`}
                        placeholder="Nom complet"
                        value={p.fullName}
                        onChange={(e) => updatePassenger(i, 'fullName', e.target.value)}
                      />
                    </Field>
                    <Field label="N° CNI (optionnel)">
                      <Input
                        aria-label={`N° CNI passager ${i + 1} (optionnel)`}
                        placeholder="N° CNI"
                        value={p.idNumber}
                        onChange={(e) => updatePassenger(i, 'idNumber', e.target.value)}
                      />
                    </Field>
                  </div>
                ))}
              </div>
              <div className="mt-5">
                <SeatMap
                  departureId={selectedDep.id}
                  totalSeatsNeeded={passengers.length}
                  selectedSeats={seats}
                  onChange={setSeats}
                  label="Sièges"
                />
              </div>
              <div className="mt-4 flex items-center gap-2 flex-wrap text-sm">
                <span className="text-text-muted">Sièges choisis ({seats.length}/{passengers.length}) :</span>
                {seats.length === 0 ? (
                  <span className="text-text-muted">aucun</span>
                ) : (
                  seats.map((s) => (
                    <span key={s} className="inline-flex items-center rounded-lg bg-primary/15 text-teal-accent dark:text-primary px-2.5 py-0.5 text-xs font-semibold tabular-nums">
                      {s}
                    </span>
                  ))
                )}
              </div>
            </Card>

            {/* Step 3 */}
            <Card>
              <CardHeader
                icon="payments"
                title={
                  <span className="inline-flex items-center gap-2">
                    <StepTitle n={3} /> Client &amp; paiement
                  </span>
                }
                subtitle="Coordonnées du client et mode de règlement."
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field label="Téléphone de contact" hint="9 chiffres, commençant par 6">
                  <Input
                    aria-label="Téléphone de contact"
                    required
                    inputMode="tel"
                    placeholder="6XX XXX XXX"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                  />
                </Field>
                <Field label="E-mail (optionnel)" hint="Sinon guichet@easytravel.cm">
                  <Input
                    aria-label="Email de contact"
                    type="email"
                    placeholder="client@exemple.com"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                  />
                </Field>
              </div>

              <div className="mt-5">
                <div id="pay-method-label" className="text-[12px] font-semibold text-text-main dark:text-gray-200 mb-1.5">Mode de paiement</div>
                <div role="group" aria-labelledby="pay-method-label" className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {PAYMENT_OPTIONS.map((m) => (
                    <button
                      key={m.value}
                      type="button"
                      aria-pressed={paymentMethod === m.value}
                      onClick={() => setPaymentMethod(m.value)}
                      className={cx(
                        'flex items-center gap-2.5 p-3 rounded-xl border text-sm font-semibold text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60',
                        paymentMethod === m.value
                          ? 'border-primary bg-primary/10 text-text-main dark:text-white ring-1 ring-primary/40'
                          : 'border-ink-200 dark:border-white/15 bg-white dark:bg-ink-950/30 text-text-main dark:text-white hover:bg-ink-50 dark:hover:bg-white/10',
                      )}
                    >
                      <span className="material-symbols-outlined text-[22px] text-teal-accent dark:text-primary">{m.icon}</span>
                      {m.label}
                    </button>
                  ))}
                </div>
                {isMobileMoney && (
                  <Field label="Numéro Mobile Money" className="mt-3" hint="Le client validera le paiement sur son téléphone.">
                    <Input
                      aria-label="Numéro Mobile Money"
                      inputMode="tel"
                      placeholder="6XX XXX XXX"
                      value={paymentPhone}
                      onChange={(e) => setPaymentPhone(e.target.value)}
                    />
                  </Field>
                )}
              </div>
            </Card>
          </>
        )}
      </div>

      {/* Summary */}
      <aside className="lg:sticky lg:top-20" aria-label="Récapitulatif de la vente">
        <Card>
          <CardHeader icon="receipt_long" title="Récapitulatif" />
          {selectedDep ? (
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-xs text-text-muted">Trajet</dt>
                <dd className="font-medium text-text-main dark:text-white">{selectedDep.from} → {selectedDep.to}</dd>
                <dd className="text-xs text-text-muted tabular-nums">{timeFmt(selectedDep.departureAt)} · {selectedDep.company}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-text-muted">Passagers</dt>
                <dd className="font-medium tabular-nums">{passengers.length} × {formatXAF(selectedDep.priceCents)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-text-muted">Sièges</dt>
                <dd className="font-medium tabular-nums">{seats.length > 0 ? seats.join(', ') : '—'}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-text-muted">Paiement</dt>
                <dd className="font-medium">{PAYMENT_OPTIONS.find((o) => o.value === paymentMethod)?.label}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-3 border-t border-ink-100 dark:border-white/10 pt-3">
                <dt className="font-medium">Total</dt>
                <dd className="font-display text-2xl font-semibold tabular-nums text-text-main dark:text-white">{formatXAF(total)}</dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm text-text-muted">Sélectionnez un départ pour commencer la vente.</p>
          )}
          {error && (
            <div className="mt-4">
              <InlineAlert tone="danger">{error}</InlineAlert>
            </div>
          )}
          <Button
            variant="primary"
            icon="point_of_sale"
            className="w-full !h-12 mt-4 text-base"
            onClick={submit}
            loading={loading}
            disabled={!selectedDep}
          >
            {loading ? 'En cours…' : selectedDep ? `Encaisser ${formatXAF(total)}` : 'Encaisser'}
          </Button>
        </Card>
      </aside>
    </div>
  );
};

export default CounterSalePanel;
