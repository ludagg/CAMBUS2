'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { todayLocal } from '../lib/datetime';
import { useNavigation } from '../contexts/NavigationContext';
import AdminShell, { type NavItem } from './admin/AdminShell';
import {
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  ErrorState,
  IconButton,
  InlineAlert,
  Input,
  PageHeader,
  SegmentedControl,
  Skeleton,
  SkeletonList,
  StatCard,
  StatusBadge,
  TD,
  TR,
  THead,
  Th,
  cx,
  useToast,
} from './admin/ui';
import CounterSalePanel from './CounterSalePanel';
import DepartureControlPanel from './DepartureControlPanel';
import AnalyticsPanel from './AnalyticsPanel';
import BookingsSection from './admin/sections/BookingsSection';
import IncidentsSection from './admin/sections/IncidentsSection';
import QrScanner from './QrScanner';

interface ManifestBooking {
  id: string;
  qrCode: string;
  leg: 'OUTBOUND' | 'RETURN';
  seats: string[];
  status: string;
  passengers: { name: string; seat?: string | null }[];
}

interface Manifest {
  id: string;
  departureAt: string;
  company: string;
  brandColor: string;
  from: string;
  to: string;
  seatsAvailable: number;
  seatsTotal: number;
  bookings: ManifestBooking[];
}

type Section = 'manifest' | 'counter' | 'bookings' | 'operations' | 'incidents' | 'analytics';

const NAV: NavItem[] = [
  { key: 'manifest', label: 'Manifeste & embarquement', icon: 'fact_check', group: 'Pilotage' },
  { key: 'counter', label: 'Guichet', icon: 'point_of_sale', group: 'Pilotage' },
  { key: 'bookings', label: 'Réservations', icon: 'confirmation_number', group: 'Pilotage' },
  { key: 'operations', label: 'Départs en direct', icon: 'bolt', group: 'Exploitation' },
  { key: 'incidents', label: 'Incidents', icon: 'report', group: 'Exploitation' },
  { key: 'analytics', label: 'Statistiques', icon: 'monitoring', group: 'Exploitation' },
];

const SECTION_META: Record<Section, { eyebrow: string; title: string; description: string }> = {
  manifest: {
    eyebrow: 'Pilotage',
    title: 'Manifeste & embarquement',
    description: 'Validez les billets et suivez l’embarquement de chaque départ de la journée.',
  },
  counter: { eyebrow: 'Pilotage', title: 'Guichet', description: 'Vendez et imprimez un billet en trois étapes.' },
  bookings: { eyebrow: 'Pilotage', title: 'Réservations', description: 'Recherchez et gérez les réservations de votre gare.' },
  operations: { eyebrow: 'Exploitation', title: 'Départs en direct', description: 'Retards, annulations et statut des départs en temps réel.' },
  incidents: { eyebrow: 'Exploitation', title: 'Incidents', description: 'Signalez et suivez les incidents de votre agence.' },
  analytics: { eyebrow: 'Exploitation', title: 'Statistiques', description: 'Activité et performance de votre gare.' },
};

const timeFmt = (iso: string) =>
  new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Douala' });

/** Pure calendar arithmetic on a YYYY-MM-DD key. */
const shiftDay = (key: string, delta: number) => {
  const d = new Date(`${key}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
};

const paxCount = (b: ManifestBooking) => Math.max(b.passengers.length, b.seats.length, 1);

const StationManagerDashboard: React.FC = () => {
  const { user } = useNavigation();
  const [section, setSection] = useState<Section>('manifest');
  const [date, setDate] = useState(() => todayLocal());

  const actions =
    section === 'manifest' ? (
      <div className="flex items-center gap-1.5">
        <IconButton icon="chevron_left" label="Jour précédent" onClick={() => setDate((d) => shiftDay(d, -1))} />
        <Input
          type="date"
          aria-label="Date du manifeste"
          value={date}
          onChange={(e) => e.target.value && setDate(e.target.value)}
          className="!w-auto !h-9"
        />
        <IconButton icon="chevron_right" label="Jour suivant" onClick={() => setDate((d) => shiftDay(d, 1))} />
        <Button size="sm" variant="secondary" className="!h-9" onClick={() => setDate(todayLocal())} disabled={date === todayLocal()}>
          Aujourd&apos;hui
        </Button>
      </div>
    ) : undefined;

  const meta = SECTION_META[section];

  return (
    <AdminShell
      context="Gare"
      nav={NAV}
      active={section}
      onNavigate={(k) => setSection(k as Section)}
      actions={actions}
    >
      <PageHeader eyebrow={meta.eyebrow} title={meta.title} description={meta.description} />

      {/* Kept mounted so a half-entered sale survives section switches. */}
      <div className={section === 'counter' ? '' : 'hidden'}>
        <CounterSalePanel />
      </div>

      {section === 'manifest' && <ManifestScreen date={date} agencyId={user?.agencyId ?? undefined} />}
      {section === 'bookings' && <BookingsSection />}
      {section === 'operations' && <DepartureControlPanel />}
      {section === 'incidents' && <IncidentsSection agencyId={user?.agencyId ?? undefined} />}
      {section === 'analytics' && <AnalyticsPanel />}
    </AdminShell>
  );
};

/* ── Manifest screen ──────────────────────────────────────────────────── */

const ManifestScreen: React.FC<{ date: string; agencyId?: string }> = ({ date, agencyId }) => {
  const toast = useToast();
  const [manifest, setManifest] = useState<Manifest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [qrInput, setQrInput] = useState('');
  const [lastCheckin, setLastCheckin] = useState<{ ok: boolean; message: string } | null>(null);
  const [scanMode, setScanMode] = useState<'manual' | 'camera'>('manual');
  const [validating, setValidating] = useState(false);
  const [boardingId, setBoardingId] = useState<string | null>(null);

  const fetchManifest = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ date });
      if (agencyId) params.set('agencyId', agencyId);
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
  }, [date, agencyId]);

  useEffect(() => {
    fetchManifest();
  }, [fetchManifest]);

  const doCheckin = async (qrCode: string): Promise<boolean> => {
    if (!qrCode) return false;
    try {
      const res = await fetch('/api/bookings/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrCode }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setLastCheckin({ ok: false, message: json.error || 'Erreur' });
        return false;
      }
      setLastCheckin({ ok: true, message: `${json.data.passenger} • ${json.data.from} → ${json.data.to}` });
      fetchManifest();
      setQrInput('');
      return true;
    } catch (e) {
      setLastCheckin({ ok: false, message: (e as Error).message });
      return false;
    }
  };

  const validateManual = async () => {
    setValidating(true);
    await doCheckin(qrInput.trim());
    setValidating(false);
  };

  const boardRow = async (b: ManifestBooking) => {
    setBoardingId(b.id);
    const ok = await doCheckin(b.qrCode);
    if (ok) toast(`${b.passengers.map((p) => p.name).join(', ') || 'Passager'} embarqué`, 'success');
    else toast('Embarquement impossible', 'error');
    setBoardingId(null);
  };

  const stats = useMemo(() => {
    let toBoard = 0;
    let boarded = 0;
    for (const d of manifest)
      for (const b of d.bookings) {
        if (b.status === 'CONFIRMED') toBoard += paxCount(b);
        else if (b.status === 'BOARDED') boarded += paxCount(b);
      }
    return { departures: manifest.length, toBoard, boarded };
  }, [manifest]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          icon="qr_code_scanner"
          title="Validation de billet"
          subtitle="Scannez le QR code ou saisissez la référence du billet."
          action={
            <SegmentedControl
              label="Mode de validation"
              value={scanMode}
              onChange={setScanMode}
              options={[
                { value: 'camera', label: 'Caméra', icon: 'videocam' },
                { value: 'manual', label: 'Saisie', icon: 'keyboard' },
              ]}
            />
          }
        />
        {scanMode === 'camera' ? (
          <div className="max-w-xl">
            <QrScanner onDecode={(value) => doCheckin(value)} />
          </div>
        ) : (
          <form
            className="flex gap-2 flex-wrap"
            onSubmit={(e) => {
              e.preventDefault();
              validateManual();
            }}
          >
            <Input
              value={qrInput}
              onChange={(e) => setQrInput(e.target.value)}
              aria-label="Code QR ou référence"
              placeholder="Code QR / référence"
              autoComplete="off"
              className="flex-1 min-w-56 !h-11 font-mono"
            />
            <Button type="submit" variant="primary" icon="check_circle" className="!h-11 px-6" loading={validating} disabled={!qrInput.trim()}>
              Valider
            </Button>
          </form>
        )}
        {lastCheckin && (
          <div className="mt-4" aria-live="polite">
            <InlineAlert tone={lastCheckin.ok ? 'success' : 'danger'}>
              <span className="inline-flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px]">{lastCheckin.ok ? 'check_circle' : 'cancel'}</span>
                {lastCheckin.message}
              </span>
            </InlineAlert>
          </div>
        )}
      </Card>

      {isLoading ? (
        <div className="space-y-4">
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-[108px] rounded-2xl" />
            ))}
          </div>
          <SkeletonList rows={4} />
        </div>
      ) : loadError ? (
        <ErrorState message={loadError} onRetry={fetchManifest} />
      ) : (
        <>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
            <StatCard label="Départs du jour" value={stats.departures} icon="directions_bus" tone="info" />
            <StatCard label="Billets à embarquer" value={stats.toBoard} icon="confirmation_number" tone="warning" />
            <StatCard label="Embarqués" value={stats.boarded} icon="how_to_reg" tone="brand" />
          </div>

          {manifest.length === 0 ? (
            <Card padded={false}>
              <EmptyState icon="event_busy" title="Aucun départ ce jour" description="Choisissez une autre date avec le sélecteur en haut de page." />
            </Card>
          ) : (
            <div className="space-y-4">
              {manifest.map((d) => (
                <DepartureCard key={d.id} d={d} boardingId={boardingId} onBoard={boardRow} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

const DepartureCard: React.FC<{
  d: Manifest;
  boardingId: string | null;
  onBoard: (b: ManifestBooking) => void;
}> = ({ d, boardingId, onBoard }) => {
  const sold = Math.max(0, d.seatsTotal - d.seatsAvailable);
  const pct = d.seatsTotal > 0 ? Math.min(100, Math.round((sold / d.seatsTotal) * 100)) : 0;
  const empty = d.bookings.length === 0;
  const allBoarded = !empty && d.bookings.every((b) => b.status === 'BOARDED' || b.status === 'CANCELLED');

  const title = (
    <div className="flex items-center gap-3 min-w-0">
      <span className="size-3 rounded-full shrink-0" style={{ backgroundColor: d.brandColor }} aria-hidden="true" />
      <div className="min-w-0">
        <div className="font-display text-base font-semibold text-text-main dark:text-white truncate tabular-nums">
          {timeFmt(d.departureAt)} · {d.from} → {d.to}
        </div>
        <div className="text-xs text-text-muted dark:text-gray-400">{d.company}</div>
      </div>
    </div>
  );

  if (empty) {
    return (
      <Card className="!py-3.5 !px-5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          {title}
          <span className="text-sm text-text-muted dark:text-gray-400">Aucune réservation</span>
        </div>
      </Card>
    );
  }

  return (
    <Card padded={false} className="overflow-hidden">
      <div className="p-5 flex items-center justify-between gap-4 flex-wrap">
        {title}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="w-40">
            <div className="flex items-center justify-between text-xs text-text-muted dark:text-gray-400 mb-1 tabular-nums">
              <span>Places</span>
              <span className="font-semibold text-text-main dark:text-white">
                {sold}/{d.seatsTotal}
              </span>
            </div>
            <div
              className="h-1.5 rounded-full bg-ink-100 dark:bg-white/10 overflow-hidden"
              role="progressbar"
              aria-label={`Places vendues ${sold} sur ${d.seatsTotal}`}
              aria-valuemin={0}
              aria-valuemax={d.seatsTotal}
              aria-valuenow={sold}
            >
              <div className={cx('h-full rounded-full', pct >= 90 ? 'bg-amber-500' : 'bg-primary')} style={{ width: `${pct}%` }} />
            </div>
          </div>
          <Badge tone={allBoarded ? 'brand' : 'info'} dot>
            {allBoarded ? 'Embarqué' : 'En cours'}
          </Badge>
          <a
            href={`/admin/manifest/${d.id}/print`}
            target="_blank"
            rel="noopener"
            aria-label={`Manifeste imprimable ${d.from} vers ${d.to}`}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl border border-ink-200 dark:border-white/15 text-xs font-semibold text-text-main dark:text-white hover:bg-ink-50 dark:hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
          >
            <span className="material-symbols-outlined text-[16px]">print</span>
            Manifeste
          </a>
        </div>
      </div>
      <div className="border-t border-ink-100 dark:border-white/10 overflow-x-auto">
        <table className="w-full text-sm">
          <THead>
            <Th>Passager</Th>
            <Th>Siège</Th>
            <Th>Statut</Th>
            <Th className="text-right">Action</Th>
          </THead>
          <tbody>
            {d.bookings.map((b) => (
              <TR key={b.id}>
                <TD className="font-medium">
                  {b.passengers.map((p) => p.name).join(', ') || 'Passager'}
                  {b.leg === 'RETURN' && <span className="ml-2 text-xs text-text-muted">(retour)</span>}
                </TD>
                <TD className="font-mono text-text-muted tabular-nums">
                  {b.seats.length > 0 ? b.seats.join(', ') : b.passengers.map((p) => p.seat).filter(Boolean).join(', ') || '—'}
                </TD>
                <TD>
                  <StatusBadge status={b.status} />
                </TD>
                <TD className="text-right">
                  {b.status === 'CONFIRMED' && (
                    <Button
                      size="sm"
                      variant="secondary"
                      icon="how_to_reg"
                      loading={boardingId === b.id}
                      disabled={boardingId !== null}
                      onClick={() => onBoard(b)}
                      aria-label={`Embarquer ${b.passengers.map((p) => p.name).join(', ') || 'le passager'}`}
                    >
                      Embarquer
                    </Button>
                  )}
                </TD>
              </TR>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

export default StationManagerDashboard;
