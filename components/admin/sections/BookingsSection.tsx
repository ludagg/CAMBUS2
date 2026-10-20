'use client';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Badge,
  Button,
  ConfirmDialog,
  Dialog,
  EmptyState,
  ErrorState,
  Field,
  Input,
  PageHeader,
  SearchInput,
  Select,
  SkeletonList,
  StatusBadge,
  Table,
  TD,
  Textarea,
  TR,
  Th,
  THead,
  formatDateTime,
  formatXAF,
  useToast,
} from '../ui';

// Props contract is fixed: this section takes no props.
export type BookingsSectionProps = Record<string, never>;

interface Leg {
  id: string;
  leg: 'OUTBOUND' | 'RETURN';
  status: string;
  seats: string[];
  departure: { id: string; departureAt: string; origin: string; destination: string; agencyName: string };
  passengers: Array<{ fullName: string; idNumber: string | null; seat: string | null }>;
}

interface BookingItem {
  id: string;
  reference: string;
  status: string;
  tripType: 'ONE_WAY' | 'ROUND_TRIP';
  channel: string | null;
  totalCents: number;
  contactName: string | null;
  contactEmail: string;
  contactPhone: string;
  createdAt: string;
  payment: { method: string; status: string } | null;
  bookings: Leg[];
}

const STATUS_OPTIONS = [
  { value: '', label: 'Tous les statuts' },
  { value: 'CONFIRMED', label: 'Confirmé' },
  { value: 'PENDING', label: 'En attente' },
  { value: 'BOARDED', label: 'Embarqué' },
  { value: 'CANCELLED', label: 'Annulé' },
];

const METHOD_LABELS: Record<string, string> = { MOMO: 'MTN MoMo', OM: 'Orange Money', CARD: 'Carte', CASH: 'Espèces' };
const CHANNEL_LABELS: Record<string, string> = { online: 'En ligne', counter: 'Guichet', web: 'En ligne' };
const LEG_LABELS: Record<string, string> = { OUTBOUND: 'Aller', RETURN: 'Retour' };

const channelLabel = (c: string | null) => (c ? CHANNEL_LABELS[c.toLowerCase()] ?? c : 'En ligne');
const passengerCount = (b: BookingItem) =>
  b.bookings.reduce((n, l) => n + (l.passengers.length || l.seats.length), 0);

const BookingsSection: React.FC<BookingsSectionProps> = () => {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [status, setStatus] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const [items, setItems] = useState<BookingItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selected, setSelected] = useState<BookingItem | null>(null);
  const [cancelTarget, setCancelTarget] = useState<BookingItem | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [busy, setBusy] = useState<'resend' | 'cancel' | null>(null);

  const seq = useRef(0);

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(search.trim()), 300);
    return () => window.clearTimeout(t);
  }, [search]);

  const load = useCallback(
    async (cursor?: string) => {
      const id = ++seq.current;
      if (cursor) setLoadingMore(true);
      else {
        setLoading(true);
        setError(null);
      }
      try {
        const qs = new URLSearchParams();
        if (debounced) qs.set('q', debounced);
        if (status) qs.set('status', status);
        if (from) qs.set('from', from);
        if (to) qs.set('to', to);
        if (cursor) qs.set('cursor', cursor);
        qs.set('limit', '25');
        const res = await fetch(`/api/admin/bookings?${qs.toString()}`);
        const json = await res.json().catch(() => ({}));
        if (id !== seq.current) return;
        if (!res.ok) throw new Error(json?.error || 'Impossible de charger les réservations.');
        const page = json.data as { items: BookingItem[]; nextCursor: string | null };
        setItems((prev) => (cursor ? [...prev, ...page.items] : page.items));
        setNextCursor(page.nextCursor);
      } catch (e) {
        if (id !== seq.current) return;
        const msg = e instanceof Error ? e.message : 'Erreur réseau.';
        if (cursor) toast(msg, 'error');
        else setError(msg);
      } finally {
        if (id === seq.current) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [debounced, status, from, to, toast],
  );

  useEffect(() => {
    load();
  }, [load]);

  const hasFilters = !!(debounced || status || from || to);
  const resetFilters = () => {
    setSearch('');
    setStatus('');
    setFrom('');
    setTo('');
  };

  const resend = async (b: BookingItem) => {
    setBusy('resend');
    try {
      const res = await fetch(`/api/bookings/${b.id}/resend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel: 'both' }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Impossible de renvoyer le billet.");
      toast(`Billet ${b.reference} renvoyé au client.`);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Erreur réseau.', 'error');
    } finally {
      setBusy(null);
    }
  };

  const cancel = async () => {
    if (!cancelTarget) return;
    const b = cancelTarget;
    setBusy('cancel');
    try {
      const res = await fetch(`/api/bookings/${b.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cancelReason.trim() ? { reason: cancelReason.trim() } : {}),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Impossible d'annuler la réservation.");
      const d = json?.data ?? {};
      const refund =
        typeof d.refundPercent === 'number'
          ? ` Remboursement : ${d.refundPercent} %${typeof d.refundAmountCents === 'number' ? ` (${formatXAF(d.refundAmountCents)})` : ''}.`
          : '';
      toast(`Réservation ${b.reference} annulée.${refund}`);
      setCancelTarget(null);
      setCancelReason('');
      setSelected(null);
      load();
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Erreur réseau.', 'error');
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Exploitation"
        title="Réservations"
        description="Recherchez, consultez et gérez les réservations de votre périmètre."
      />

      <div className="flex flex-wrap items-end gap-3 mb-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Référence, client, téléphone, passager…"
          className="w-full sm:w-72"
          label="Rechercher une réservation"
        />
        <Select aria-label="Filtrer par statut" value={status} onChange={(e) => setStatus(e.target.value)} className="sm:w-44">
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
        <Field label="Du" className="w-40">
          <Input type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} />
        </Field>
        <Field label="Au" className="w-40">
          <Input type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} />
        </Field>
        {hasFilters && (
          <Button variant="ghost" icon="filter_alt_off" onClick={resetFilters}>
            Réinitialiser
          </Button>
        )}
        {!loading && !error && (
          <span className="ml-auto text-sm text-text-muted tabular-nums" aria-live="polite">
            {items.length} réservation{items.length > 1 ? 's' : ''}
            {nextCursor ? '+' : ''}
          </span>
        )}
      </div>

      {loading ? (
        <SkeletonList rows={6} />
      ) : error ? (
        <ErrorState message={error} onRetry={() => load()} />
      ) : items.length === 0 ? (
        <EmptyState
          icon="confirmation_number"
          title={hasFilters ? 'Aucun résultat' : 'Aucune réservation'}
          description={
            hasFilters
              ? 'Aucune réservation ne correspond à ces critères.'
              : 'Les réservations de votre périmètre apparaîtront ici.'
          }
          action={hasFilters ? <Button onClick={resetFilters}>Réinitialiser les filtres</Button> : undefined}
        />
      ) : (
        <>
          <Table>
            <THead>
              <Th>Référence</Th>
              <Th>Client</Th>
              <Th>Trajet</Th>
              <Th className="text-right">Passagers</Th>
              <Th className="text-right">Total</Th>
              <Th>Paiement</Th>
              <Th>Statut</Th>
              <Th>Canal</Th>
              <Th>
                <span className="sr-only">Actions</span>
              </Th>
            </THead>
            <tbody>
              {items.map((b) => {
                const first = b.bookings[0];
                return (
                  <TR key={b.id} className="cursor-pointer" onClick={() => setSelected(b)}>
                    <TD className="font-mono text-xs font-semibold whitespace-nowrap">{b.reference}</TD>
                    <TD>
                      <div className="font-semibold">{b.contactName || 'Client'}</div>
                      <div className="text-xs text-text-muted">{b.contactPhone}</div>
                    </TD>
                    <TD>
                      {first ? (
                        <>
                          <div className="font-medium whitespace-nowrap">
                            {first.departure.origin} → {first.departure.destination}
                            {b.bookings.length > 1 && <span className="text-text-muted"> (+{b.bookings.length - 1})</span>}
                          </div>
                          <div className="text-xs text-text-muted">{formatDateTime(first.departure.departureAt)}</div>
                        </>
                      ) : (
                        '—'
                      )}
                    </TD>
                    <TD className="text-right tabular-nums">{passengerCount(b)}</TD>
                    <TD className="text-right tabular-nums font-semibold whitespace-nowrap">{formatXAF(b.totalCents)}</TD>
                    <TD>
                      {b.payment ? (
                        <div className="flex flex-col items-start gap-1">
                          <StatusBadge status={b.payment.status} />
                          <span className="text-xs text-text-muted">{METHOD_LABELS[b.payment.method] ?? b.payment.method}</span>
                        </div>
                      ) : (
                        <span className="text-text-muted">—</span>
                      )}
                    </TD>
                    <TD>
                      <StatusBadge status={b.status} />
                    </TD>
                    <TD>
                      <Badge tone="neutral">{channelLabel(b.channel)}</Badge>
                    </TD>
                    <TD>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelected(b);
                        }}
                      >
                        Détails
                      </Button>
                    </TD>
                  </TR>
                );
              })}
            </tbody>
          </Table>
          {nextCursor && (
            <div className="flex justify-center mt-4">
              <Button loading={loadingMore} onClick={() => load(nextCursor)}>
                Charger plus
              </Button>
            </div>
          )}
        </>
      )}

      {selected && (
        <Dialog
          size="lg"
          title={`Réservation ${selected.reference}`}
          description={`Créée le ${formatDateTime(selected.createdAt)}`}
          onClose={() => setSelected(null)}
          footer={
            <>
              <a
                href={`/admin/ticket/${selected.id}/print`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-ink-200 dark:border-white/15 bg-white dark:bg-white/5 px-4 text-sm font-semibold tracking-tight text-text-main dark:text-white hover:bg-ink-50 dark:hover:bg-white/10"
              >
                <span className="material-symbols-outlined text-[18px]">print</span>
                Voir le billet
              </a>
              <Button icon="forward_to_inbox" loading={busy === 'resend'} onClick={() => resend(selected)}>
                Renvoyer le billet
              </Button>
              {(selected.status === 'PENDING' || selected.status === 'CONFIRMED') && (
                <Button variant="danger" icon="cancel" onClick={() => setCancelTarget(selected)}>
                  Annuler la réservation
                </Button>
              )}
            </>
          }
        >
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={selected.status} />
              <Badge tone="neutral">{selected.tripType === 'ROUND_TRIP' ? 'Aller-retour' : 'Aller simple'}</Badge>
              <Badge tone="neutral">{channelLabel(selected.channel)}</Badge>
              <span className="ml-auto text-lg font-display font-semibold tabular-nums">{formatXAF(selected.totalCents)}</span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted mb-1.5">Contact</h3>
                <div className="text-sm font-semibold">{selected.contactName || 'Client'}</div>
                <div className="text-sm text-text-muted">{selected.contactPhone}</div>
                <div className="text-sm text-text-muted break-all">{selected.contactEmail}</div>
              </div>
              <div>
                <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted mb-1.5">Paiement</h3>
                {selected.payment ? (
                  <div className="flex items-center gap-2">
                    <StatusBadge status={selected.payment.status} />
                    <span className="text-sm text-text-muted">
                      {METHOD_LABELS[selected.payment.method] ?? selected.payment.method}
                    </span>
                  </div>
                ) : (
                  <span className="text-sm text-text-muted">Aucun paiement enregistré</span>
                )}
              </div>
            </div>

            {selected.bookings.map((leg) => (
              <section key={leg.id} className="rounded-2xl border border-ink-100 dark:border-white/10 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div className="min-w-0">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted">
                      {LEG_LABELS[leg.leg] ?? leg.leg}
                    </div>
                    <div className="font-semibold">
                      {leg.departure.origin} → {leg.departure.destination}
                    </div>
                    <div className="text-xs text-text-muted">
                      {formatDateTime(leg.departure.departureAt)} · {leg.departure.agencyName}
                    </div>
                  </div>
                  <StatusBadge status={leg.status} />
                </div>
                {leg.passengers.length === 0 ? (
                  <p className="text-sm text-text-muted">
                    Sièges : {leg.seats.length ? leg.seats.join(', ') : '—'}
                  </p>
                ) : (
                  <Table className="shadow-none">
                    <THead>
                      <Th>Passager</Th>
                      <Th>CNI</Th>
                      <Th>Siège</Th>
                    </THead>
                    <tbody>
                      {leg.passengers.map((p, i) => (
                        <TR key={i}>
                          <TD className="font-medium">{p.fullName}</TD>
                          <TD className="text-text-muted">{p.idNumber || '—'}</TD>
                          <TD className="tabular-nums">{p.seat || '—'}</TD>
                        </TR>
                      ))}
                    </tbody>
                  </Table>
                )}
              </section>
            ))}
          </div>
        </Dialog>
      )}

      {cancelTarget && (
        <ConfirmDialog
          title="Annuler la réservation ?"
          confirmLabel="Annuler la réservation"
          loading={busy === 'cancel'}
          onCancel={() => {
            setCancelTarget(null);
            setCancelReason('');
          }}
          onConfirm={cancel}
          message={
            <div className="space-y-3">
              <p>
                La réservation <strong>{cancelTarget.reference}</strong> sera annulée et les places libérées. Le remboursement
                suit la politique d&apos;annulation de la compagnie.
              </p>
              <Field label="Motif (facultatif)">
                <Textarea rows={3} maxLength={500} value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} />
              </Field>
            </div>
          }
        />
      )}
    </>
  );
};

export default BookingsSection;
