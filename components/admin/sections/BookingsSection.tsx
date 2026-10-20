'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  PageHeader,
  SearchInput,
  SegmentedControl,
  Input,
  Button,
  Table,
  THead,
  Th,
  TR,
  TD,
  StatusBadge,
  Badge,
  Dialog,
  useConfirm,
  useToast,
  Field,
  Textarea
} from '../ui';
import { useNavigation } from '../../../contexts/NavigationContext';

export type BookingsSectionProps = Record<string, never>;

export default function BookingsSection(_props: BookingsSectionProps) {
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [status, setStatus] = useState<string>('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const [items, setItems] = useState<any[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selected, setSelected] = useState<any | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  const toast = useToast();
  const { confirm, dialog } = useConfirm();

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedQ(q), 300);
    return () => clearTimeout(handler);
  }, [q]);

  const fetchBookings = useCallback(async (cursor?: string) => {
    const params = new URLSearchParams();
    if (debouncedQ) params.append('q', debouncedQ);
    if (status) params.append('status', status);
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    if (cursor) params.append('cursor', cursor);

    try {
      if (cursor) setLoadingMore(true);
      else setLoading(true);

      const res = await fetch(`/api/admin/bookings?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load');
      const json = await res.json();

      if (cursor) {
        setItems(prev => [...prev, ...json.data.items]);
      } else {
        setItems(json.data.items);
      }
      setNextCursor(json.data.nextCursor);
    } catch (e) {
      toast('Erreur lors du chargement des réservations', 'error');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [debouncedQ, status, from, to, toast]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const loadMore = () => {
    if (nextCursor) fetchBookings(nextCursor);
  };

  const handleResend = async (id: string) => {
    try {
      const res = await fetch(`/api/bookings/${id}/resend`, { method: 'POST' });
      if (!res.ok) throw new Error();
      toast('Billet renvoyé avec succès', 'success');
    } catch {
      toast('Erreur lors du renvoi', 'error');
    }
  };

  const handleCancel = async (booking: any) => {
    const ok = await confirm({
       title: 'Annuler la réservation',
       message: 'Êtes-vous sûr de vouloir annuler cette réservation ?'
    });
    if (!ok) return;

    try {
      const payload = cancelReason ? { reason: cancelReason } : {};
      const res = await fetch(`/api/bookings/${booking.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erreur');

      toast(`Réservation annulée. Remboursé : ${json.data?.refundAmountCents || 0}XAF (${json.data?.refundPercent || 0}%)`, 'success');
      setSelected(null);
      setCancelReason('');
      fetchBookings();
    } catch (e: any) {
      toast(e.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Réservations"
        description="Gérez les réservations et consultez les détails."
      />

      <div className="flex flex-wrap items-end gap-3">
        <div className="w-64">
           <SearchInput
             value={q}
             onChange={setQ}
             placeholder="Référence, nom, email, téléphone..."
             label="Rechercher"
           />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1 text-text-muted">Statut</label>
          <select
            className="h-10 rounded-xl border border-ink-200 bg-white px-3 text-sm focus:ring-2 focus:ring-primary/60 outline-none"
            value={status}
            onChange={e => setStatus(e.target.value)}
          >
            <option value="">Tous</option>
            <option value="CONFIRMED">CONFIRMED</option>
            <option value="PENDING">PENDING</option>
            <option value="BOARDED">BOARDED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </div>
        <div className="flex items-end gap-2">
           <Field label="Du" className="w-40">
             <Input type="date" value={from} onChange={e => setFrom(e.target.value)} />
           </Field>
           <Field label="Au" className="w-40">
             <Input type="date" value={to} onChange={e => setTo(e.target.value)} />
           </Field>
        </div>
        <div className="text-sm text-text-muted pb-2">
           {items.length} résultat{items.length > 1 ? 's' : ''}
        </div>
      </div>

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
          <Th></Th>
        </THead>
        <tbody>
          {items.map(b => (
            <TR key={b.id} onClick={() => setSelected(b)} className="cursor-pointer hover:bg-ink-50 transition-colors">
              <TD className="font-mono text-sm font-semibold">{b.reference}</TD>
              <TD>
                <div className="font-semibold">{b.contactName || 'Client'}</div>
                <div className="text-xs text-text-muted">{b.contactPhone}</div>
              </TD>
              <TD>
                {b.bookings[0] ? (
                  <>
                    <div className="font-medium">
                      {b.bookings[0].departure.origin} → {b.bookings[0].departure.destination}
                    </div>
                    <div className="text-xs text-text-muted">
                      {new Date(b.bookings[0].departure.departureAt).toLocaleString()}
                    </div>
                  </>
                ) : '—'}
              </TD>
              <TD className="text-right tabular-nums">
                 {b.bookings.reduce((acc: number, cur: any) => Math.max(acc, cur.passengers.length), 1)}
              </TD>
              <TD className="text-right tabular-nums font-semibold">
                 {(b.totalCents / 100).toLocaleString('fr-FR')} XAF
              </TD>
              <TD>
                {b.payment ? (
                  <div className="flex flex-col gap-1">
                    <StatusBadge status={b.payment.status} />
                    <span className="text-xs text-text-muted">{b.payment.method}</span>
                  </div>
                ) : '—'}
              </TD>
              <TD><StatusBadge status={b.status} /></TD>
              <TD><Badge tone="neutral">{b.channel || 'INCONNU'}</Badge></TD>
              <TD>
                <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); setSelected(b); }}>
                   Détails
                </Button>
              </TD>
            </TR>
          ))}
          {items.length === 0 && !loading && (
            <TR><TD colSpan={9} className="text-center py-4">Aucune réservation trouvée.</TD></TR>
          )}
        </tbody>
      </Table>

      {nextCursor && (
        <div className="flex justify-center mt-4">
           <Button variant="secondary" onClick={loadMore} loading={loadingMore}>
             Charger plus
           </Button>
        </div>
      )}

      {selected && (
        <Dialog
          size="lg"
          title={`Réservation ${selected.reference}`}
          description={`Date: ${new Date(selected.createdAt).toLocaleString()}`}
          onClose={() => { setSelected(null); setCancelReason(''); }}
          footer={
            <>
              <a
                href={`/admin/ticket/${selected.id}/print`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl border border-ink-200 text-sm font-semibold hover:bg-ink-50"
              >
                <span className="material-symbols-outlined text-[18px]">print</span> Voir le billet
              </a>
              <Button icon="send" onClick={() => handleResend(selected.id)}>Renvoyer le billet</Button>
              {(selected.status === 'PENDING' || selected.status === 'CONFIRMED') && (
                <Button variant="danger" icon="cancel" onClick={() => handleCancel(selected)}>
                  Annuler la réservation
                </Button>
              )}
            </>
          }
        >
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 border p-4 rounded-xl">
               <div>
                  <h4 className="text-xs font-semibold text-text-muted uppercase mb-1">Contact</h4>
                  <div>{selected.contactName}</div>
                  <div className="text-sm">{selected.contactPhone}</div>
                  <div className="text-sm">{selected.contactEmail}</div>
               </div>
               <div>
                  <h4 className="text-xs font-semibold text-text-muted uppercase mb-1">Paiement</h4>
                  {selected.payment ? (
                    <div>
                      <StatusBadge status={selected.payment.status} /> {selected.payment.method}
                    </div>
                  ) : <span className="text-sm text-text-muted">Aucun paiement</span>}
               </div>
            </div>

            {selected.status === 'PENDING' || selected.status === 'CONFIRMED' ? (
              <Field label="Motif d'annulation (Optionnel - Seulement si vous allez annuler)">
                 <Textarea value={cancelReason} onChange={e => setCancelReason(e.target.value)} />
              </Field>
            ) : null}

            <div className="space-y-4">
              <h4 className="font-semibold text-lg">Trajets</h4>
              {selected.bookings.map((leg: any) => (
                <div key={leg.id} className="border p-4 rounded-xl">
                  <div className="flex justify-between items-center mb-2">
                    <div className="font-semibold">{leg.departure.origin} → {leg.departure.destination}</div>
                    <StatusBadge status={leg.status} />
                  </div>
                  <div className="text-sm text-text-muted mb-2">
                    {new Date(leg.departure.departureAt).toLocaleString()} - {leg.departure.agencyName}
                  </div>
                  {leg.passengers.length > 0 && (
                     <table className="w-full text-sm">
                       <thead><tr className="border-b"><th className="text-left py-1">Passager</th><th className="text-left py-1">CNI</th><th className="text-left py-1">Siège</th></tr></thead>
                       <tbody>
                         {leg.passengers.map((p: any, idx: number) => (
                           <tr key={idx}><td className="py-1">{p.fullName}</td><td className="py-1">{p.idNumber || '-'}</td><td className="py-1">{p.seat || '-'}</td></tr>
                         ))}
                       </tbody>
                     </table>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Dialog>
      )}

      {dialog}
    </div>
  );
}
