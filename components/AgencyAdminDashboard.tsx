'use client';

import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { useNavigation } from '../contexts/NavigationContext';
import AdminShell, { type NavItem } from './admin/AdminShell';
import {
  Badge,
  Button,
  Card,
  Dialog,
  EmptyState,
  ErrorState,
  Field,
  IconButton,
  InlineAlert,
  Input,
  PageHeader,
  SearchInput,
  SegmentedControl,
  Select,
  SkeletonList,
  StatCard,
  StatusBadge,
  Table,
  TD,
  TR,
  THead,
  Th,
  cx,
  formatXAF,
  useConfirm,
  useToast,
} from './admin/ui';
import SeatLayoutEditor from './SeatLayoutEditor';
import AnalyticsPanel from './AnalyticsPanel';
import DepartureControlPanel from './DepartureControlPanel';
import CounterSalePanel from './CounterSalePanel';
import BookingsSection from './admin/sections/BookingsSection';
import DriversSection from './admin/sections/DriversSection';
import IncidentsSection from './admin/sections/IncidentsSection';
import TeamSection from './admin/sections/TeamSection';
import { localDateKey, todayLocal } from '../lib/datetime';
import type { SeatLayout } from '../lib/seat-layout';

interface Departure {
  id: string;
  departureAt: string;
  arrivalAt: string;
  priceCents: number;
  seatsAvailable: number;
  seatsTotal: number;
  status?: string;
  route: {
    originCity: { id?: string; name: string };
    destinationCity: { id?: string; name: string };
  };
  vehicle?: { plate: string; model: string; capacity: number } | null;
}

interface Vehicle {
  id: string;
  plate: string;
  model: string;
  capacity: number;
  amenities: string[];
  seatLayout?: SeatLayout | null;
}

interface Agency {
  id: string;
  name: string;
  companyId: string;
  company: { name: string; brandColor: string };
  city: { id: string; name: string };
  stations: { id: string; name: string; cityId: string }[];
}

interface City {
  id: string;
  name: string;
  region: string;
}

interface Station {
  id: string;
  name: string;
  city: { id: string; name: string };
  agency: { id: string; name: string };
}

const LOAD_ERROR = "Impossible de charger les données de l'agence. Vérifiez votre connexion puis réessayez.";
const TZ = 'Africa/Douala';
const DAY_MS = 24 * 60 * 60 * 1000;

const NAV: NavItem[] = [
  { key: 'departures', label: 'Départs', icon: 'directions_bus', group: 'Pilotage' },
  { key: 'counter', label: 'Guichet', icon: 'point_of_sale', group: 'Pilotage' },
  { key: 'bookings', label: 'Réservations', icon: 'confirmation_number', group: 'Pilotage' },
  { key: 'operations', label: 'Départs en direct', icon: 'bolt', group: 'Pilotage' },
  { key: 'analytics', label: 'Statistiques', icon: 'monitoring', group: 'Pilotage' },
  { key: 'vehicles', label: 'Véhicules', icon: 'airport_shuttle', group: 'Ressources' },
  { key: 'drivers', label: 'Chauffeurs', icon: 'badge', group: 'Ressources' },
  { key: 'incidents', label: 'Incidents', icon: 'report', group: 'Exploitation' },
  { key: 'team', label: 'Équipe', icon: 'group', group: 'Gestion' },
];

const fetchJson = async (url: string) => {
  const res = await fetch(url);
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || 'Erreur');
  return json;
};

/* ── Root ─────────────────────────────────────────────────────────────── */

const AgencyAdminDashboard: React.FC = () => {
  const { user } = useNavigation();
  const [section, setSection] = useState('departures');
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [activeAgencyId, setActiveAgencyId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const url = user?.companyId ? `/api/agencies?companyId=${user.companyId}` : '/api/agencies';
        const [agRes, ciRes] = await Promise.all([fetchJson(url), fetchJson('/api/cities')]);
        if (cancelled) return;
        const list: Agency[] = agRes.data ?? [];
        setAgencies(list);
        setCities(ciRes.data ?? []);
        setActiveAgencyId((prev) => user?.agencyId ?? (prev && list.some((a) => a.id === prev) ? prev : list[0]?.id ?? null));
      } catch (e) {
        if (cancelled) return;
        console.error(e);
        setLoadError(LOAD_ERROR);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    init();
    return () => {
      cancelled = true;
    };
  }, [user?.agencyId, user?.companyId, reloadKey]);

  const activeAgency = useMemo(() => agencies.find((a) => a.id === activeAgencyId), [agencies, activeAgencyId]);
  const context = activeAgency ? `${activeAgency.name} · ${activeAgency.city.name}` : 'Mon agence';
  const canSwitch = !user?.agencyId && agencies.length > 1;

  const actions = canSwitch ? (
    <div className="w-40 sm:w-64">
      <Select value={activeAgencyId ?? ''} onChange={(e) => setActiveAgencyId(e.target.value)} aria-label="Agence active">
        {agencies.map((a) => (
          <option key={a.id} value={a.id}>
            {a.name}
          </option>
        ))}
      </Select>
    </div>
  ) : undefined;

  return (
    <AdminShell context={context} nav={NAV} active={section} onNavigate={setSection} actions={actions}>
      {loadError ? (
        <ErrorState message={loadError} onRetry={() => setReloadKey((k) => k + 1)} />
      ) : isLoading ? (
        <>
          <div className="h-24" />
          <SkeletonList rows={5} />
        </>
      ) : (
        <Sections key={activeAgencyId ?? 'none'} section={section} agencyId={activeAgencyId} cities={cities} agencies={agencies} />
      )}
    </AdminShell>
  );
};

/* ── Sections ─────────────────────────────────────────────────────────── */

const Sections: React.FC<{ section: string; agencyId: string | null; cities: City[]; agencies: Agency[] }> = ({
  section,
  agencyId,
  cities,
  agencies,
}) => {
  const toast = useToast();
  const { confirm, dialog } = useConfirm();
  const [departures, setDepartures] = useState<Departure[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [agencyDetail, setAgencyDetail] = useState<Agency | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [depModalOpen, setDepModalOpen] = useState(false);
  const [vehicleModalOpen, setVehicleModalOpen] = useState(false);
  const [layoutVehicle, setLayoutVehicle] = useState<Vehicle | null>(null);
  const seq = useRef(0);

  const reload = useCallback(async () => {
    if (!agencyId) {
      setIsLoading(false);
      return;
    }
    const mine = ++seq.current;
    setIsLoading(true);
    setLoadError(null);
    try {
      const [dep, veh, detail] = await Promise.all([
        fetchJson(`/api/agencies/${agencyId}/departures`),
        fetchJson(`/api/agencies/${agencyId}/vehicles`),
        fetchJson(`/api/agencies/${agencyId}`),
      ]);
      if (mine !== seq.current) return;
      setDepartures(dep.data ?? []);
      setVehicles(veh.data ?? []);
      setAgencyDetail(detail.data ?? null);
    } catch (e) {
      if (mine !== seq.current) return;
      console.error(e);
      setLoadError(LOAD_ERROR);
    } finally {
      if (mine === seq.current) setIsLoading(false);
    }
  }, [agencyId]);

  useEffect(() => {
    reload();
    return () => {
      seq.current++;
    };
  }, [reload]);

  const deactivate = async (d: Departure) => {
    const ok = await confirm({
      title: 'Désactiver ce départ ?',
      message: `${d.route.originCity.name} → ${d.route.destinationCity.name}, ${fmtTime(d.departureAt)}. Il ne sera plus proposé à la vente.`,
      confirmLabel: 'Désactiver',
    });
    if (!ok) return;
    try {
      const res = await fetch(`/api/departures/${d.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        toast(j.error || 'Opération impossible.', 'error');
        return;
      }
      toast('Départ désactivé.');
      await reload();
    } catch {
      toast('Connexion impossible. Réessayez.', 'error');
    }
  };

  const needsData = section === 'departures' || section === 'vehicles';

  return (
    <>
      {!agencyId && needsData && (
        <Card padded={false}>
          <EmptyState icon="storefront" title="Aucune agence" description="Aucune agence n'est rattachée à ce compte." />
        </Card>
      )}
      {agencyId && needsData && loadError && <ErrorState message={loadError} onRetry={reload} />}
      {agencyId && needsData && isLoading && !loadError && (
        <>
          <div className="h-24" />
          <SkeletonList rows={5} />
        </>
      )}

      {agencyId && needsData && !isLoading && !loadError && section === 'departures' && (
        <DeparturesSection
          departures={departures}
          canCreate={!!agencyDetail}
          onNew={() => setDepModalOpen(true)}
          onDeactivate={deactivate}
        />
      )}
      {agencyId && needsData && !isLoading && !loadError && section === 'vehicles' && (
        <VehiclesSection vehicles={vehicles} onNew={() => setVehicleModalOpen(true)} onLayout={setLayoutVehicle} />
      )}

      {section === 'counter' && (
        <>
          <PageHeader eyebrow="Pilotage" title="Guichet" description="Vendez des billets au comptoir et encaissez en espèces ou mobile money." />
          <CounterSalePanel />
        </>
      )}
      {section === 'bookings' && <BookingsSection />}
      {section === 'operations' && (
        <>
          <PageHeader eyebrow="Pilotage" title="Départs en direct" description="Suivez les départs du jour, signalez un retard ou annulez un départ. Les passagers sont prévenus automatiquement." />
          <DepartureControlPanel />
        </>
      )}
      {section === 'analytics' && (
        <>
          <PageHeader eyebrow="Pilotage" title="Statistiques" description="Revenus, remplissage et sièges les plus demandés." />
          <AnalyticsPanel />
        </>
      )}
      {section === 'drivers' && <DriversSection agencyId={agencyId ?? undefined} agencies={agencies.map((a) => ({ id: a.id, name: a.name }))} />}
      {section === 'incidents' && <IncidentsSection agencyId={agencyId ?? undefined} />}
      {section === 'team' && <TeamSection />}

      {depModalOpen && agencyDetail && (
        <DepartureForm
          agency={agencyDetail}
          cities={cities}
          vehicles={vehicles}
          onClose={() => setDepModalOpen(false)}
          onSaved={async () => {
            setDepModalOpen(false);
            toast('Départ créé.');
            await reload();
          }}
        />
      )}
      {vehicleModalOpen && agencyId && (
        <VehicleForm
          agencyId={agencyId}
          onClose={() => setVehicleModalOpen(false)}
          onSaved={async () => {
            setVehicleModalOpen(false);
            toast('Véhicule ajouté.');
            await reload();
          }}
        />
      )}
      {layoutVehicle && (
        <SeatLayoutEditor
          vehicleId={layoutVehicle.id}
          initialLayout={layoutVehicle.seatLayout ?? null}
          capacity={layoutVehicle.capacity}
          onClose={() => setLayoutVehicle(null)}
          onSaved={async () => {
            await reload();
          }}
        />
      )}
      {dialog}
    </>
  );
};

/* ── Departures ───────────────────────────────────────────────────────── */

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('fr-FR', { timeZone: TZ, hour: '2-digit', minute: '2-digit' });

const dayLabel = (key: string) => {
  const s = new Date(`${key}T12:00:00+01:00`).toLocaleDateString('fr-FR', {
    timeZone: TZ,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  return s.charAt(0).toUpperCase() + s.slice(1);
};

const isLive = (d: Departure) => d.status !== 'INACTIVE' && d.status !== 'CANCELLED';

type DateFilter = 'today' | 'tomorrow' | 'week' | 'all';

const STATUS_FILTERS: Array<{ value: string; label: string }> = [
  { value: '', label: 'Tous les statuts' },
  { value: 'SCHEDULED', label: 'Prévu' },
  { value: 'DELAYED', label: 'Retardé' },
  { value: 'COMPLETED', label: 'Terminé' },
  { value: 'CANCELLED', label: 'Annulé' },
  { value: 'INACTIVE', label: 'Inactif' },
];

const SeatsCell: React.FC<{ available: number; total: number }> = ({ available, total }) => {
  const sold = Math.max(0, total - available);
  const pct = total > 0 ? Math.min(100, Math.round((sold / total) * 100)) : 0;
  const bar = pct >= 90 ? 'bg-red-500' : pct >= 60 ? 'bg-amber-500' : 'bg-emerald-500';
  return (
    <div className="flex items-center gap-3" title={`${sold} places réservées sur ${total}`}>
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-ink-100 dark:bg-white/10" aria-hidden>
        <div className={cx('h-full rounded-full', bar)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-sm font-medium tabular-nums">
        {sold}/{total}
        <span className="sr-only"> places réservées</span>
      </span>
    </div>
  );
};

const DeparturesSection: React.FC<{
  departures: Departure[];
  canCreate: boolean;
  onNew: () => void;
  onDeactivate: (d: Departure) => void;
}> = ({ departures, canCreate, onNew, onDeactivate }) => {
  const [range, setRange] = useState<DateFilter>('today');
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');

  const today = todayLocal();

  const stats = useMemo(() => {
    const live = departures.filter((d) => localDateKey(new Date(d.departureAt)) === today && isLive(d));
    const total = live.reduce((s, d) => s + d.seatsTotal, 0);
    const left = live.reduce((s, d) => s + d.seatsAvailable, 0);
    return { count: live.length, fill: total > 0 ? Math.round(((total - left) / total) * 100) : 0, left, total };
  }, [departures, today]);

  const groups = useMemo(() => {
    const now = Date.now();
    const tomorrow = localDateKey(new Date(now + DAY_MS));
    const weekEnd = localDateKey(new Date(now + 6 * DAY_MS));
    const needle = q.trim().toLowerCase();
    const rows = departures
      .filter((d) => {
        const key = localDateKey(new Date(d.departureAt));
        if (range === 'today' && key !== today) return false;
        if (range === 'tomorrow' && key !== tomorrow) return false;
        if (range === 'week' && (key < today || key > weekEnd)) return false;
        if (status && (d.status ?? 'SCHEDULED') !== status) return false;
        if (needle) {
          const hay = `${d.route.originCity.name} ${d.route.destinationCity.name} ${d.vehicle?.plate ?? ''}`.toLowerCase();
          if (!hay.includes(needle)) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(a.departureAt).getTime() - new Date(b.departureAt).getTime());
    const map = new Map<string, Departure[]>();
    for (const d of rows) {
      const key = localDateKey(new Date(d.departureAt));
      map.set(key, [...(map.get(key) ?? []), d]);
    }
    return Array.from(map.entries());
  }, [departures, range, q, status, today]);

  const newButton = (
    <Button variant="primary" icon="add" onClick={onNew} disabled={!canCreate}>
      Nouveau départ
    </Button>
  );
  const filtered = !!q || !!status || range !== 'all';

  return (
    <>
      <PageHeader
        eyebrow="Pilotage"
        title="Départs"
        description="Programmez les départs de votre agence et suivez leur remplissage."
        actions={newButton}
      />

      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Départs du jour" value={stats.count} icon="directions_bus" hint="Hors annulés et inactifs" />
        <StatCard label="Remplissage moyen" value={`${stats.fill} %`} icon="stacked_bar_chart" tone="info" hint="Sur les départs du jour" />
        <StatCard label="Places restantes" value={stats.left.toLocaleString('fr-FR')} icon="event_seat" tone="warning" hint={`sur ${stats.total.toLocaleString('fr-FR')} places aujourd'hui`} />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <SegmentedControl<DateFilter>
          label="Période"
          value={range}
          onChange={setRange}
          options={[
            { value: 'today', label: "Aujourd'hui" },
            { value: 'tomorrow', label: 'Demain' },
            { value: 'week', label: '7 jours' },
            { value: 'all', label: 'Tous' },
          ]}
        />
        <SearchInput value={q} onChange={setQ} placeholder="Rechercher un trajet…" label="Rechercher un trajet" className="w-full sm:w-72" />
        <Select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filtrer par statut" className="w-full sm:w-52">
          {STATUS_FILTERS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </Select>
      </div>

      {groups.length === 0 ? (
        <Card padded={false}>
          <EmptyState
            icon="directions_bus"
            title={departures.length === 0 ? 'Aucun départ programmé' : 'Aucun départ'}
            description={
              departures.length === 0
                ? 'Créez votre premier départ pour ouvrir les ventes.'
                : filtered
                  ? 'Aucun départ ne correspond à ces critères. Élargissez la période ou changez de filtre.'
                  : undefined
            }
            action={newButton}
          />
        </Card>
      ) : (
        <div className="space-y-6">
          {groups.map(([key, list]) => (
            <section key={key} aria-label={dayLabel(key)}>
              <div className="mb-2 flex items-baseline gap-2">
                <h2 className="font-display text-base font-semibold tracking-tight text-text-main dark:text-white">{dayLabel(key)}</h2>
                <span className="text-xs text-text-muted tabular-nums">
                  {list.length} départ{list.length > 1 ? 's' : ''}
                </span>
              </div>
              <Table>
                <THead>
                  <Th>Heure</Th>
                  <Th>Trajet</Th>
                  <Th>Véhicule</Th>
                  <Th>Places</Th>
                  <Th>Tarif</Th>
                  <Th>Statut</Th>
                  <Th className="text-right">Actions</Th>
                </THead>
                <tbody>
                  {list.map((d) => (
                    <TR key={d.id} className={d.status === 'INACTIVE' ? 'opacity-60' : undefined}>
                      <TD className="font-display text-lg font-semibold tabular-nums">{fmtTime(d.departureAt)}</TD>
                      <TD className="whitespace-nowrap font-semibold">
                        {d.route.originCity.name} <span className="text-text-muted">→</span> {d.route.destinationCity.name}
                      </TD>
                      <TD className="whitespace-nowrap">
                        {d.vehicle ? (
                          <>
                            <span className="font-medium">{d.vehicle.plate}</span>
                            <span className="text-text-muted"> · {d.vehicle.model}</span>
                          </>
                        ) : (
                          <span className="text-text-muted">Non assigné</span>
                        )}
                      </TD>
                      <TD>
                        <SeatsCell available={d.seatsAvailable} total={d.seatsTotal} />
                      </TD>
                      <TD className="whitespace-nowrap font-medium tabular-nums">{formatXAF(d.priceCents)}</TD>
                      <TD>
                        <StatusBadge status={d.status ?? 'SCHEDULED'} />
                      </TD>
                      <TD className="text-right">
                        {d.status !== 'INACTIVE' && (
                          <IconButton icon="delete" label="Désactiver ce départ" tone="danger" onClick={() => onDeactivate(d)} />
                        )}
                      </TD>
                    </TR>
                  ))}
                </tbody>
              </Table>
            </section>
          ))}
        </div>
      )}
    </>
  );
};

/* ── Vehicles ─────────────────────────────────────────────────────────── */

const VehiclesSection: React.FC<{ vehicles: Vehicle[]; onNew: () => void; onLayout: (v: Vehicle) => void }> = ({
  vehicles,
  onNew,
  onLayout,
}) => {
  const [q, setQ] = useState('');
  const rows = useMemo(
    () => vehicles.filter((v) => `${v.plate} ${v.model}`.toLowerCase().includes(q.trim().toLowerCase())),
    [vehicles, q],
  );
  const addButton = (
    <Button variant="primary" icon="add" onClick={onNew}>
      Ajouter un véhicule
    </Button>
  );
  return (
    <>
      <PageHeader
        eyebrow="Ressources"
        title="Véhicules"
        description="La flotte de l'agence et le plan des sièges de chaque véhicule."
        actions={addButton}
      />
      {vehicles.length > 8 && (
        <div className="mb-4">
          <SearchInput value={q} onChange={setQ} placeholder="Plaque ou modèle…" label="Rechercher un véhicule" className="w-full sm:w-80" />
        </div>
      )}
      {rows.length === 0 ? (
        <Card padded={false}>
          <EmptyState
            icon="airport_shuttle"
            title={vehicles.length === 0 ? 'Aucun véhicule enregistré' : 'Aucun résultat'}
            description={vehicles.length === 0 ? 'Ajoutez un véhicule pour pouvoir l’affecter à vos départs.' : 'Essayez une autre plaque ou un autre modèle.'}
            action={vehicles.length === 0 ? addButton : undefined}
          />
        </Card>
      ) : (
        <Table>
          <THead>
            <Th>Véhicule</Th>
            <Th>Capacité</Th>
            <Th>Équipements</Th>
            <Th>Plan des sièges</Th>
            <Th className="text-right">Actions</Th>
          </THead>
          <tbody>
            {rows.map((v) => (
              <TR key={v.id}>
                <TD>
                  <div className="flex items-center gap-3">
                    <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-teal-accent ring-1 ring-inset ring-primary/20 dark:text-primary">
                      <span className="material-symbols-outlined text-[20px]">airport_shuttle</span>
                    </span>
                    <div className="min-w-0">
                      <div className="font-semibold">{v.plate}</div>
                      <div className="text-xs text-text-muted">{v.model}</div>
                    </div>
                  </div>
                </TD>
                <TD className="whitespace-nowrap tabular-nums">{v.capacity} places</TD>
                <TD>
                  {v.amenities.length === 0 ? (
                    <span className="text-text-muted">—</span>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {v.amenities.map((a) => (
                        <Badge key={a}>{a}</Badge>
                      ))}
                    </div>
                  )}
                </TD>
                <TD>
                  <Badge tone={v.seatLayout ? 'brand' : 'neutral'}>
                    {v.seatLayout ? `Plan ${v.seatLayout.label ?? 'personnalisé'}` : 'Plan auto'}
                  </Badge>
                </TD>
                <TD className="text-right">
                  <Button size="sm" icon="event_seat" onClick={() => onLayout(v)}>
                    Plan des sièges
                  </Button>
                </TD>
              </TR>
            ))}
          </tbody>
        </Table>
      )}
    </>
  );
};

/* ── Forms ────────────────────────────────────────────────────────────── */

const FormFooter: React.FC<{ formId: string; onClose: () => void; saving: boolean; label?: string }> = ({
  formId,
  onClose,
  saving,
  label = 'Créer',
}) => (
  <>
    <Button variant="ghost" onClick={onClose}>
      Annuler
    </Button>
    <Button type="submit" form={formId} variant="primary" loading={saving}>
      {saving ? 'Enregistrement…' : label}
    </Button>
  </>
);

const AMENITY_SUGGESTIONS = ['Climatisation', 'WiFi', 'USB', 'Toilettes', 'TV'];

const VehicleForm: React.FC<{ agencyId: string; onClose: () => void; onSaved: () => void }> = ({ agencyId, onClose, onSaved }) => {
  const formId = useId();
  const [plate, setPlate] = useState('');
  const [model, setModel] = useState('');
  const [capacity, setCapacity] = useState<number>(30);
  const [amenities, setAmenities] = useState<string[]>([]);
  const [extra, setExtra] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = (a: string) => setAmenities((cur) => (cur.includes(a) ? cur.filter((x) => x !== a) : [...cur, a]));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!Number.isInteger(capacity) || capacity < 1) {
      setError('La capacité doit être un nombre entier positif.');
      return;
    }
    const extras = extra.split(',').map((s) => s.trim()).filter(Boolean);
    const all = Array.from(new Set([...amenities, ...extras]));
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/agencies/${agencyId}/vehicles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plate: plate.trim().toUpperCase(), model: model.trim(), capacity, amenities: all }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Erreur');
      onSaved();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      title="Ajouter un véhicule"
      description="Il pourra ensuite être affecté à vos départs."
      onClose={onClose}
      footer={<FormFooter formId={formId} onClose={onClose} saving={saving} label="Ajouter" />}
    >
      <form id={formId} onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Immatriculation">
            <Input required value={plate} onChange={(e) => setPlate(e.target.value)} placeholder="LT-123-AB" autoFocus />
          </Field>
          <Field label="Modèle">
            <Input required value={model} onChange={(e) => setModel(e.target.value)} placeholder="Yutong ZK6122" />
          </Field>
        </div>
        <Field label="Capacité (places)">
          <Input required type="number" min={1} value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} />
        </Field>
        <div>
          <div className="mb-1.5 text-[12px] font-semibold text-text-main dark:text-gray-200">Équipements</div>
          <div className="flex flex-wrap gap-2">
            {AMENITY_SUGGESTIONS.map((a) => {
              const on = amenities.includes(a);
              return (
                <button
                  key={a}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggle(a)}
                  className={cx(
                    'inline-flex h-8 items-center rounded-full border px-3 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60',
                    on
                      ? 'border-primary bg-primary/15 text-teal-accent dark:text-primary'
                      : 'border-ink-200 dark:border-white/15 text-text-muted hover:bg-ink-50 dark:hover:bg-white/10',
                  )}
                >
                  {a}
                </button>
              );
            })}
          </div>
        </div>
        <Field label="Autres équipements" hint="Séparés par des virgules">
          <Input value={extra} onChange={(e) => setExtra(e.target.value)} placeholder="Prises 220V, Rideaux" />
        </Field>
        {error && <InlineAlert>{error}</InlineAlert>}
      </form>
    </Dialog>
  );
};

const DepartureForm: React.FC<{ agency: Agency; cities: City[]; vehicles: Vehicle[]; onClose: () => void; onSaved: () => void }> = ({
  agency,
  cities,
  vehicles,
  onClose,
  onSaved,
}) => {
  const formId = useId();
  const [originCityId] = useState(agency.city.id);
  const [destinationCityId, setDestinationCityId] = useState<string>(cities.find((c) => c.id !== agency.city.id)?.id ?? '');
  const [originStationId, setOriginStationId] = useState<string>(agency.stations[0]?.id ?? '');
  const [destStationId, setDestStationId] = useState<string>('');
  const [destStations, setDestStations] = useState<Station[]>([]);
  const [stationError, setStationError] = useState<string | null>(null);
  const [vehicleId, setVehicleId] = useState<string>('');
  const [dateTime, setDateTime] = useState<string>('');
  const [durationH, setDurationH] = useState<number>(4);
  const [durationM, setDurationM] = useState<number>(0);
  const [priceXAF, setPriceXAF] = useState<number>(6000);
  const [seats, setSeats] = useState<number>(30);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Race-safe: a slower response for a previous city never overwrites the current one.
  useEffect(() => {
    if (!destinationCityId) {
      setDestStations([]);
      return;
    }
    let cancelled = false;
    setStationError(null);
    fetchJson(`/api/stations?cityId=${destinationCityId}`)
      .then((j) => {
        if (cancelled) return;
        const list: Station[] = j.data ?? [];
        setDestStations(list);
        setDestStationId((prev) => (list.find((s) => s.id === prev) ? prev : list[0]?.id ?? ''));
      })
      .catch((err) => {
        if (cancelled) return;
        console.error(err);
        setDestStations([]);
        setDestStationId('');
        setStationError('Impossible de charger les stations de destination.');
      });
    return () => {
      cancelled = true;
    };
  }, [destinationCityId]);

  useEffect(() => {
    const v = vehicles.find((x) => x.id === vehicleId);
    if (v) setSeats(v.capacity);
  }, [vehicleId, vehicles]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!destStationId) {
      setError('Sélectionnez une station de destination.');
      return;
    }
    if (!dateTime) {
      setError('Sélectionnez une date et heure.');
      return;
    }
    // datetime-local carries no zone: read it as Cameroon time (UTC+1), not the browser's.
    const departureAt = new Date(dateTime.length === 16 ? `${dateTime}:00+01:00` : dateTime);
    if (Number.isNaN(departureAt.getTime())) {
      setError('Date et heure invalides.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/agencies/${agency.id}/departures`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originCityId,
          destinationCityId,
          originStationId,
          destStationId,
          vehicleId: vehicleId || undefined,
          departureAt: departureAt.toISOString(),
          durationMin: durationH * 60 + durationM,
          priceCents: priceXAF,
          seatsTotal: seats,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Erreur');
      onSaved();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      title="Nouveau départ"
      description="Choisissez le trajet, l'horaire et le tarif."
      size="lg"
      onClose={onClose}
      footer={<FormFooter formId={formId} onClose={onClose} saving={saving} />}
    >
      <form id={formId} onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Origine (ville)">
            <Input disabled value={agency.city.name} />
          </Field>
          <Field label="Destination (ville)">
            <Select required value={destinationCityId} onChange={(e) => setDestinationCityId(e.target.value)}>
              {cities
                .filter((c) => c.id !== originCityId)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </Select>
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Station de départ">
            <Select required value={originStationId} onChange={(e) => setOriginStationId(e.target.value)}>
              {agency.stations.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Station d'arrivée" error={stationError ?? undefined}>
            <Select required value={destStationId} onChange={(e) => setDestStationId(e.target.value)}>
              {destStations.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.agency.name})
                </option>
              ))}
              {destStations.length === 0 && <option value="">Aucune station disponible</option>}
            </Select>
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Date et heure de départ" hint="Heure du Cameroun">
            <Input required type="datetime-local" value={dateTime} onChange={(e) => setDateTime(e.target.value)} />
          </Field>
          <div>
            <div className="mb-1.5 text-[12px] font-semibold text-text-main dark:text-gray-200">Durée estimée</div>
            <div className="grid grid-cols-[1fr_auto_1fr_auto] items-center gap-2">
              <Input type="number" min={0} aria-label="Durée en heures" value={durationH} onChange={(e) => setDurationH(Number(e.target.value))} />
              <span className="text-xs font-semibold text-text-muted">h</span>
              <Input type="number" min={0} max={59} aria-label="Durée en minutes" value={durationM} onChange={(e) => setDurationM(Number(e.target.value))} />
              <span className="text-xs font-semibold text-text-muted">min</span>
            </div>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Prix (XAF)">
            <Input required type="number" min={100} value={priceXAF} onChange={(e) => setPriceXAF(Number(e.target.value))} />
          </Field>
          <Field label="Véhicule">
            <Select value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
              <option value="">— Aucun —</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.plate} · {v.model}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Nombre de places">
            <Input required type="number" min={1} value={seats} onChange={(e) => setSeats(Number(e.target.value))} />
          </Field>
        </div>
        {error && <InlineAlert>{error}</InlineAlert>}
      </form>
    </Dialog>
  );
};

export default AgencyAdminDashboard;
