'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigation } from '../contexts/NavigationContext';
import AdminShell, { type NavItem } from './admin/AdminShell';
import {
  Badge,
  Button,
  Card,
  CardHeader,
  Dialog,
  EmptyState,
  ErrorState,
  Field,
  IconButton,
  InlineAlert,
  Input,
  PageHeader,
  SearchInput,
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
import BookingsSection from './admin/sections/BookingsSection';
import DriversSection from './admin/sections/DriversSection';
import IncidentsSection from './admin/sections/IncidentsSection';
import TeamSection from './admin/sections/TeamSection';
import CancellationPolicySection from './admin/sections/CancellationPolicySection';
import type { SeatLayout } from '../lib/seat-layout';

interface Company {
  id: string;
  name: string;
  logo: string;
  brandColor: string;
  description?: string | null;
  _count?: { agencies: number; routes: number };
  agencies?: Agency[];
  routes?: RouteRow[];
}

interface Agency {
  id: string;
  name: string;
  status?: string;
  city: { id?: string; name: string; region?: string };
  _count?: { departures: number; vehicles: number };
}

interface RouteRow {
  id: string;
  originCity: { id?: string; name: string };
  destinationCity: { id?: string; name: string };
  defaultDurationMin: number;
  distanceKm?: number | null;
  _count?: { departures: number };
}

interface City {
  id: string;
  name: string;
  region: string;
}

interface Vehicle {
  id: string;
  plate: string;
  model: string;
  capacity: number;
  amenities: string[];
  status?: string;
  seatLayout?: SeatLayout | null;
}

interface AnalyticsSummary {
  totals: { revenueCents: number; bookings: number; avgOccupancyPct: number };
  daily: Array<{ date: string; revenue: number; bookings: number }>;
}

const LOAD_ERROR = 'Impossible de charger les données de la compagnie. Vérifiez votre connexion puis réessayez.';

const NAV: NavItem[] = [
  { key: 'overview', label: "Vue d'ensemble", icon: 'space_dashboard', group: 'Pilotage' },
  { key: 'operations', label: 'Départs en direct', icon: 'directions_bus', group: 'Pilotage' },
  { key: 'analytics', label: 'Statistiques', icon: 'monitoring', group: 'Pilotage' },
  { key: 'bookings', label: 'Réservations', icon: 'confirmation_number', group: 'Pilotage' },
  { key: 'agencies', label: 'Agences', icon: 'storefront', group: 'Réseau' },
  { key: 'routes', label: 'Routes', icon: 'alt_route', group: 'Réseau' },
  { key: 'vehicles', label: 'Flotte', icon: 'airport_shuttle', group: 'Réseau' },
  { key: 'drivers', label: 'Chauffeurs', icon: 'badge', group: 'Réseau' },
  { key: 'incidents', label: 'Incidents', icon: 'report', group: 'Exploitation' },
  { key: 'team', label: 'Équipe', icon: 'group', group: 'Gestion' },
  { key: 'policy', label: "Politique d'annulation", icon: 'rule', group: 'Gestion' },
];

const fetchJson = async (url: string) => {
  const res = await fetch(url);
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || 'Erreur');
  return json;
};

const formatDuration = (min: number) => `${Math.floor(min / 60)}h${String(min % 60).padStart(2, '0')}`;

const CompanyAdminDashboard: React.FC = () => {
  const { user } = useNavigation();
  const [section, setSection] = useState('overview');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const loadCompanies = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      if (user?.companyId) {
        const json = await fetchJson(`/api/companies/${user.companyId}`);
        setCompanies(json.data ? [json.data] : []);
        setActiveId(user.companyId);
      } else {
        const json = await fetchJson('/api/companies');
        const list: Company[] = json.data ?? [];
        setCompanies(list);
        setActiveId(list[0]?.id ?? null);
      }
    } catch (err) {
      console.error(err);
      setLoadError(LOAD_ERROR);
    } finally {
      setIsLoading(false);
    }
  }, [user?.companyId]);

  useEffect(() => {
    loadCompanies();
  }, [loadCompanies, reloadKey]);

  const reloadActiveCompany = useCallback(async () => {
    if (!activeId) return;
    try {
      const json = await fetchJson(`/api/companies/${activeId}`);
      setCompanies((prev) => prev.map((c) => (c.id === activeId ? { ...c, ...json.data } : c)));
    } catch (err) {
      console.error(err);
      setLoadError(LOAD_ERROR);
    }
  }, [activeId]);

  // The list endpoint may not embed agencies: fetch the detail once.
  const active = useMemo(() => companies.find((c) => c.id === activeId), [companies, activeId]);
  const needsDetail = !!active && !active.agencies;
  useEffect(() => {
    if (needsDetail) reloadActiveCompany();
  }, [needsDetail, reloadActiveCompany]);

  const retry = () => setReloadKey((k) => k + 1);

  return (
    <AdminShell context={active?.name ?? 'Ma compagnie'} nav={NAV} active={section} onNavigate={setSection}>
      {loadError ? (
        <ErrorState message={loadError} onRetry={retry} />
      ) : isLoading ? (
        <>
          <div className="h-24" />
          <SkeletonList rows={5} />
        </>
      ) : !active ? (
        <Card padded={false}>
          <EmptyState icon="business" title="Aucune compagnie assignée" description="Ce compte n'est rattaché à aucune compagnie." />
        </Card>
      ) : (
        <Sections
          section={section}
          onNavigate={setSection}
          company={active}
          reloadCompany={reloadActiveCompany}
          reloadKey={reloadKey}
        />
      )}
    </AdminShell>
  );
};

/* ── Sections ─────────────────────────────────────────────────────────── */

const Sections: React.FC<{
  section: string;
  onNavigate: (s: string) => void;
  company: Company;
  reloadCompany: () => Promise<void>;
  reloadKey: number;
}> = ({ section, onNavigate, company, reloadCompany, reloadKey }) => {
  const toast = useToast();
  const { confirm, dialog } = useConfirm();
  const agencies = useMemo(() => company.agencies ?? [], [company.agencies]);

  const [cities, setCities] = useState<City[]>([]);
  const [citiesError, setCitiesError] = useState(false);
  const [routes, setRoutes] = useState<RouteRow[]>([]);
  const [routesLoading, setRoutesLoading] = useState(false);
  const [routesError, setRoutesError] = useState<string | null>(null);
  const [routeModalOpen, setRouteModalOpen] = useState(false);
  const [vehicleModalOpen, setVehicleModalOpen] = useState(false);
  const [selectedAgencyId, setSelectedAgencyId] = useState('');
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(false);
  const [vehiclesError, setVehiclesError] = useState<string | null>(null);
  const [layoutVehicle, setLayoutVehicle] = useState<Vehicle | null>(null);

  useEffect(() => {
    let cancelled = false;
    setCitiesError(false);
    fetchJson('/api/cities')
      .then((j) => !cancelled && setCities(j.data ?? []))
      .catch((err) => {
        console.error(err);
        if (!cancelled) setCitiesError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  useEffect(() => {
    if (agencies.length === 0) return;
    if (!selectedAgencyId || !agencies.some((a) => a.id === selectedAgencyId)) setSelectedAgencyId(agencies[0].id);
  }, [agencies, selectedAgencyId]);

  const reloadRoutes = useCallback(async () => {
    setRoutesError(null);
    try {
      const json = await fetchJson(`/api/routes?companyId=${company.id}`);
      setRoutes(json.data ?? []);
    } catch (err) {
      console.error(err);
      setRoutesError('Impossible de charger les routes.');
    }
  }, [company.id]);

  useEffect(() => {
    if (section !== 'routes') return;
    setRoutesLoading(true);
    reloadRoutes().finally(() => setRoutesLoading(false));
  }, [section, reloadRoutes, reloadKey]);

  const reloadVehicles = useCallback(async () => {
    if (!selectedAgencyId) return;
    setVehiclesError(null);
    try {
      const json = await fetchJson(`/api/agencies/${selectedAgencyId}/vehicles`);
      setVehicles(json.data ?? []);
    } catch (err) {
      console.error(err);
      setVehiclesError('Impossible de charger la flotte.');
    }
  }, [selectedAgencyId]);

  useEffect(() => {
    if (section !== 'vehicles' || !selectedAgencyId) return;
    setVehicles([]);
    setVehiclesLoading(true);
    reloadVehicles().finally(() => setVehiclesLoading(false));
  }, [section, selectedAgencyId, reloadVehicles, reloadKey]);

  const deleteRoute = async (r: RouteRow) => {
    const ok = await confirm({
      title: 'Supprimer cette route ?',
      message: `${r.originCity.name} → ${r.destinationCity.name} sera supprimée. Cette action est irréversible.`,
      confirmLabel: 'Supprimer',
    });
    if (!ok) return;
    const res = await fetch(`/api/routes/${r.id}`, { method: 'DELETE' });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      toast(j.error || 'Suppression impossible.', 'error');
      return;
    }
    toast('Route supprimée.');
    await reloadRoutes();
    await reloadCompany();
  };

  const deleteVehicle = async (v: Vehicle) => {
    const ok = await confirm({
      title: `Désactiver ${v.plate} ?`,
      message: "Le véhicule ne pourra plus être affecté à de nouveaux départs.",
      confirmLabel: 'Désactiver',
    });
    if (!ok) return;
    const res = await fetch(`/api/vehicles/${v.id}`, { method: 'DELETE' });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      toast(j.error || 'Désactivation impossible.', 'error');
      return;
    }
    toast('Véhicule désactivé.');
    await reloadVehicles();
    await reloadCompany();
  };

  return (
    <>
      {section === 'overview' && <Overview company={company} onNavigate={onNavigate} onNewRoute={() => { onNavigate('routes'); setRouteModalOpen(true); }} />}
      {section === 'agencies' && <AgenciesSection agencies={agencies} />}
      {section === 'routes' && (
        <RoutesSection
          routes={routes}
          loading={routesLoading}
          error={routesError}
          onRetry={reloadRoutes}
          onNew={() => setRouteModalOpen(true)}
          onDelete={deleteRoute}
        />
      )}
      {section === 'vehicles' && (
        <VehiclesSection
          agencies={agencies}
          agencyId={selectedAgencyId}
          onAgencyChange={setSelectedAgencyId}
          vehicles={vehicles}
          loading={vehiclesLoading}
          error={vehiclesError}
          onRetry={reloadVehicles}
          onNew={() => setVehicleModalOpen(true)}
          onLayout={setLayoutVehicle}
          onDelete={deleteVehicle}
        />
      )}

      {section === 'operations' && (
        <>
          <PageHeader eyebrow="Pilotage" title="Départs en direct" description="Suivez les départs du jour, signalez un retard ou annulez un départ. Les passagers sont prévenus automatiquement." />
          <DepartureControlPanel />
        </>
      )}
      {section === 'analytics' && (
        <>
          <PageHeader eyebrow="Pilotage" title="Statistiques" description="Revenus, remplissage et sièges les plus demandés sur votre réseau." />
          <AnalyticsPanel />
        </>
      )}
      {section === 'bookings' && <BookingsSection />}
      {section === 'drivers' && <DriversSection agencies={agencies.map((a) => ({ id: a.id, name: a.name }))} />}
      {section === 'incidents' && <IncidentsSection />}
      {section === 'team' && <TeamSection />}
      {section === 'policy' && <CancellationPolicySection companyId={company.id} />}

      {routeModalOpen && (
        <RouteForm
          companyId={company.id}
          cities={cities}
          citiesError={citiesError}
          onClose={() => setRouteModalOpen(false)}
          onSaved={async () => {
            setRouteModalOpen(false);
            toast('Route créée.');
            await reloadRoutes();
            await reloadCompany();
          }}
        />
      )}
      {vehicleModalOpen && selectedAgencyId && (
        <VehicleForm
          agencyId={selectedAgencyId}
          onClose={() => setVehicleModalOpen(false)}
          onSaved={async () => {
            setVehicleModalOpen(false);
            toast('Véhicule ajouté.');
            await reloadVehicles();
            await reloadCompany();
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
            await reloadVehicles();
          }}
        />
      )}
      {dialog}
    </>
  );
};

/* ── Overview ─────────────────────────────────────────────────────────── */

const Sparkline: React.FC<{ data: Array<{ date: string; value: number }>; label: string }> = ({ data, label }) => {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div role="img" aria-label={label} className="flex h-16 items-end gap-[2px]">
      {data.map((d) => (
        <div
          key={d.date}
          title={`${d.date} : ${d.value.toLocaleString('fr-FR')}`}
          className={cx('flex-1 rounded-t-sm', d.value > 0 ? 'bg-primary' : 'bg-ink-100 dark:bg-white/10')}
          style={{ height: `${Math.max(4, (d.value / max) * 100)}%` }}
        />
      ))}
    </div>
  );
};

const Overview: React.FC<{ company: Company; onNavigate: (s: string) => void; onNewRoute: () => void }> = ({
  company,
  onNavigate,
  onNewRoute,
}) => {
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const agencies = company.agencies ?? [];
  const vehicleCount = agencies.reduce((s, a) => s + (a._count?.vehicles ?? 0), 0);
  const departureCount = agencies.reduce((s, a) => s + (a._count?.departures ?? 0), 0);
  const cityCount = new Set(agencies.map((a) => a.city.name)).size;

  useEffect(() => {
    let cancelled = false;
    fetchJson('/api/admin/analytics?rangeDays=30')
      .then((j) => !cancelled && setAnalytics(j.data ?? null))
      .catch(() => !cancelled && setAnalytics(null));
    return () => {
      cancelled = true;
    };
  }, [company.id]);

  return (
    <>
      <PageHeader
        eyebrow="Pilotage"
        title="Vue d'ensemble"
        description={`Bienvenue, voici l'activité de ${company.name} en un coup d'œil.`}
        actions={
          <Button variant="primary" icon="add" onClick={onNewRoute}>
            Nouvelle route
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Agences" value={company._count?.agencies ?? agencies.length} icon="storefront" />
        <StatCard label="Routes" value={company._count?.routes ?? company.routes?.length ?? 0} icon="alt_route" tone="info" />
        <StatCard label="Véhicules" value={vehicleCount} icon="airport_shuttle" tone="warning" />
        <StatCard label="Départs programmés" value={departureCount} icon="directions_bus" tone="info" hint={`${cityCount} ville${cityCount > 1 ? 's' : ''} desservie${cityCount > 1 ? 's' : ''}`} />
      </div>

      {analytics && (
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <StatCard label="Revenus (30 jours)" value={formatXAF(analytics.totals.revenueCents)} icon="payments" hint="Réservations confirmées" />
          <StatCard label="Réservations (30 jours)" value={analytics.totals.bookings.toLocaleString('fr-FR')} icon="confirmation_number" tone="info" hint={`Remplissage moyen ${analytics.totals.avgOccupancyPct} %`} />
          <Card className="!p-5">
            <div className="text-[12px] font-medium text-text-muted dark:text-gray-400">Revenus par jour</div>
            <div className="mt-3">
              <Sparkline
                label="Revenus quotidiens sur 30 jours"
                data={analytics.daily.map((d) => ({ date: d.date, value: d.revenue }))}
              />
            </div>
          </Card>
        </div>
      )}

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2" padded={false}>
          <div className="p-5 pb-0 md:p-6 md:pb-0">
            <CardHeader
              icon="storefront"
              title="Agences"
              subtitle={`${agencies.length} agence${agencies.length > 1 ? 's' : ''}`}
              action={
                <Button size="sm" variant="ghost" onClick={() => onNavigate('agencies')}>
                  Tout voir
                </Button>
              }
            />
          </div>
          {agencies.length === 0 ? (
            <EmptyState icon="storefront" title="Aucune agence" description="Les agences sont créées par l'administrateur de la plateforme." />
          ) : (
            <ul className="divide-y divide-ink-100 dark:divide-white/10">
              {agencies.slice(0, 6).map((a) => (
                <li key={a.id} className="flex items-center gap-4 px-5 py-3.5 md:px-6">
                  <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-teal-accent ring-1 ring-inset ring-primary/20 dark:text-primary">
                    <span className="material-symbols-outlined text-[20px]">storefront</span>
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-text-main dark:text-white">{a.name}</div>
                    <div className="text-xs text-text-muted">{a.city.name}</div>
                  </div>
                  <div className="text-right text-xs text-text-muted tabular-nums">
                    <div><strong className="text-text-main dark:text-white">{a._count?.departures ?? 0}</strong> départs</div>
                    <div><strong className="text-text-main dark:text-white">{a._count?.vehicles ?? 0}</strong> véhicules</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader icon="bolt" title="Accès rapides" />
          <div className="grid gap-2">
            {[
              { key: 'routes', icon: 'alt_route', label: 'Nouvelle route', hint: 'Relier deux villes', action: onNewRoute },
              { key: 'vehicles', icon: 'airport_shuttle', label: 'Ajouter un véhicule', hint: 'Étendre la flotte', action: () => onNavigate('vehicles') },
              { key: 'bookings', icon: 'confirmation_number', label: 'Voir les réservations', hint: 'Suivre les ventes', action: () => onNavigate('bookings') },
            ].map((q) => (
              <button
                key={q.key}
                onClick={q.action}
                className="group flex items-center gap-3 rounded-xl border border-ink-100 px-3.5 py-3 text-left transition hover:border-primary/50 hover:bg-primary/5 dark:border-white/10"
              >
                <span className="material-symbols-outlined text-[20px] text-teal-accent dark:text-primary">{q.icon}</span>
                <span className="flex-1">
                  <span className="block text-sm font-semibold text-text-main dark:text-white">{q.label}</span>
                  <span className="block text-xs text-text-muted">{q.hint}</span>
                </span>
                <span className="material-symbols-outlined text-[18px] text-ink-300 transition-transform group-hover:translate-x-0.5">arrow_forward</span>
              </button>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
};

/* ── Agencies ─────────────────────────────────────────────────────────── */

const AgenciesSection: React.FC<{ agencies: Agency[] }> = ({ agencies }) => {
  const [q, setQ] = useState('');
  const rows = useMemo(
    () => agencies.filter((a) => `${a.name} ${a.city.name}`.toLowerCase().includes(q.toLowerCase())),
    [agencies, q],
  );
  return (
    <>
      <PageHeader eyebrow="Réseau" title="Agences" description="Les points de vente et gares de votre compagnie." />
      <div className="mb-4">
        <SearchInput value={q} onChange={setQ} placeholder="Rechercher une agence ou une ville…" className="w-full sm:w-80" />
      </div>
      {rows.length === 0 ? (
        <Card padded={false}>
          <EmptyState icon="storefront" title={q ? 'Aucun résultat' : 'Aucune agence'} description={q ? 'Essayez un autre nom ou une autre ville.' : "Les agences sont créées par l'administrateur de la plateforme."} />
        </Card>
      ) : (
        <Table>
          <THead>
            <Th>Agence</Th>
            <Th>Ville</Th>
            <Th>Départs</Th>
            <Th>Véhicules</Th>
            <Th>Statut</Th>
          </THead>
          <tbody>
            {rows.map((a) => (
              <TR key={a.id}>
                <TD className="font-semibold">{a.name}</TD>
                <TD>
                  {a.city.name}
                  {a.city.region && <span className="text-xs text-text-muted"> · {a.city.region}</span>}
                </TD>
                <TD className="tabular-nums">{a._count?.departures ?? 0}</TD>
                <TD className="tabular-nums">{a._count?.vehicles ?? 0}</TD>
                <TD>
                  <StatusBadge status={a.status ?? 'ACTIVE'} />
                </TD>
              </TR>
            ))}
          </tbody>
        </Table>
      )}
    </>
  );
};

/* ── Routes ───────────────────────────────────────────────────────────── */

const RoutesSection: React.FC<{
  routes: RouteRow[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onNew: () => void;
  onDelete: (r: RouteRow) => void;
}> = ({ routes, loading, error, onRetry, onNew, onDelete }) => {
  const [q, setQ] = useState('');
  const rows = useMemo(
    () => routes.filter((r) => `${r.originCity.name} ${r.destinationCity.name}`.toLowerCase().includes(q.toLowerCase())),
    [routes, q],
  );
  return (
    <>
      <PageHeader
        eyebrow="Réseau"
        title="Routes"
        description="Les liaisons entre villes sur lesquelles vous programmez des départs."
        actions={
          <Button variant="primary" icon="add" onClick={onNew}>
            Nouvelle route
          </Button>
        }
      />
      {error ? (
        <ErrorState message={error} onRetry={onRetry} />
      ) : loading ? (
        <SkeletonList rows={5} />
      ) : (
        <>
          {routes.length > 8 && (
            <div className="mb-4">
              <SearchInput value={q} onChange={setQ} placeholder="Rechercher une ville…" className="w-full sm:w-80" />
            </div>
          )}
          {rows.length === 0 ? (
            <Card padded={false}>
              <EmptyState
                icon="alt_route"
                title={q ? 'Aucun résultat' : 'Aucune route'}
                description={q ? 'Essayez une autre ville.' : 'Créez votre première liaison pour pouvoir programmer des départs.'}
                action={!q && <Button variant="primary" icon="add" onClick={onNew}>Nouvelle route</Button>}
              />
            </Card>
          ) : (
            <Table>
              <THead>
                <Th>Trajet</Th>
                <Th>Durée</Th>
                <Th>Distance</Th>
                <Th>Départs</Th>
                <Th className="text-right">Actions</Th>
              </THead>
              <tbody>
                {rows.map((r) => (
                  <TR key={r.id}>
                    <TD className="font-semibold">
                      {r.originCity.name} <span className="text-text-muted">→</span> {r.destinationCity.name}
                    </TD>
                    <TD className="tabular-nums">{formatDuration(r.defaultDurationMin)}</TD>
                    <TD className="tabular-nums">{r.distanceKm != null ? `${r.distanceKm} km` : '–'}</TD>
                    <TD className="tabular-nums">{r._count?.departures ?? 0}</TD>
                    <TD className="text-right">
                      <IconButton icon="delete" label={`Supprimer la route ${r.originCity.name} → ${r.destinationCity.name}`} tone="danger" onClick={() => onDelete(r)} />
                    </TD>
                  </TR>
                ))}
              </tbody>
            </Table>
          )}
        </>
      )}
    </>
  );
};

/* ── Vehicles ─────────────────────────────────────────────────────────── */

const VehiclesSection: React.FC<{
  agencies: Agency[];
  agencyId: string;
  onAgencyChange: (id: string) => void;
  vehicles: Vehicle[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onNew: () => void;
  onLayout: (v: Vehicle) => void;
  onDelete: (v: Vehicle) => void;
}> = ({ agencies, agencyId, onAgencyChange, vehicles, loading, error, onRetry, onNew, onLayout, onDelete }) => (
  <>
    <PageHeader
      eyebrow="Réseau"
      title="Flotte"
      description="Les véhicules de chaque agence, leurs équipements et leur plan de sièges."
      actions={
        <Button variant="primary" icon="add" onClick={onNew} disabled={!agencyId}>
          Ajouter un véhicule
        </Button>
      }
    />
    {agencies.length === 0 ? (
      <Card padded={false}>
        <EmptyState icon="airport_shuttle" title="Aucune agence" description="Une agence est nécessaire pour enregistrer des véhicules." />
      </Card>
    ) : (
      <>
        <div className="mb-4 flex flex-wrap gap-3">
          <Select value={agencyId} onChange={(e) => onAgencyChange(e.target.value)} aria-label="Agence" className="w-full sm:w-72">
            {agencies.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} · {a.city.name}
              </option>
            ))}
          </Select>
        </div>
        {error ? (
          <ErrorState message={error} onRetry={onRetry} />
        ) : loading ? (
          <SkeletonList rows={4} />
        ) : vehicles.length === 0 ? (
          <Card padded={false}>
            <EmptyState
              icon="airport_shuttle"
              title="Aucun véhicule"
              description="Ajoutez un véhicule à cette agence pour l'affecter à des départs."
              action={<Button variant="primary" icon="add" onClick={onNew}>Ajouter un véhicule</Button>}
            />
          </Card>
        ) : (
          <Table>
            <THead>
              <Th>Plaque</Th>
              <Th>Modèle</Th>
              <Th>Places</Th>
              <Th>Équipements</Th>
              <Th>Plan de sièges</Th>
              <Th>Statut</Th>
              <Th className="text-right">Actions</Th>
            </THead>
            <tbody>
              {vehicles.map((v) => (
                <TR key={v.id}>
                  <TD className="font-mono font-semibold">{v.plate}</TD>
                  <TD>{v.model}</TD>
                  <TD className="tabular-nums">{v.capacity}</TD>
                  <TD>
                    <div className="flex flex-wrap gap-1">
                      {v.amenities.length === 0 ? (
                        <span className="text-text-muted">–</span>
                      ) : (
                        v.amenities.map((a) => <Badge key={a}>{a}</Badge>)
                      )}
                    </div>
                  </TD>
                  <TD>
                    <Badge tone={v.seatLayout ? 'brand' : 'neutral'}>
                      {v.seatLayout ? `Plan ${v.seatLayout.label ?? 'personnalisé'}` : 'Plan auto'}
                    </Badge>
                  </TD>
                  <TD>
                    <StatusBadge status={v.status ?? 'ACTIVE'} />
                  </TD>
                  <TD className="text-right">
                    <div className="inline-flex gap-1">
                      <IconButton icon="event_seat" label={`Configurer le plan de sièges de ${v.plate}`} onClick={() => onLayout(v)} />
                      {v.status !== 'INACTIVE' && (
                        <IconButton icon="block" label={`Désactiver ${v.plate}`} tone="danger" onClick={() => onDelete(v)} />
                      )}
                    </div>
                  </TD>
                </TR>
              ))}
            </tbody>
          </Table>
        )}
      </>
    )}
  </>
);

/* ── Forms ────────────────────────────────────────────────────────────── */

const FormFooter: React.FC<{ onClose: () => void; saving: boolean; label?: string }> = ({ onClose, saving, label = 'Créer' }) => (
  <div className="flex justify-end gap-2 pt-2">
    <Button variant="ghost" onClick={onClose}>
      Annuler
    </Button>
    <Button type="submit" variant="primary" loading={saving}>
      {saving ? 'Enregistrement…' : label}
    </Button>
  </div>
);

const RouteForm: React.FC<{
  companyId: string;
  cities: City[];
  citiesError: boolean;
  onClose: () => void;
  onSaved: () => void;
}> = ({ companyId, cities, citiesError, onClose, onSaved }) => {
  const [originCityId, setOriginCityId] = useState(cities[0]?.id ?? '');
  const [destinationCityId, setDestinationCityId] = useState(cities[1]?.id ?? '');
  const [durationH, setDurationH] = useState<number>(4);
  const [durationM, setDurationM] = useState<number>(0);
  const [distanceKm, setDistanceKm] = useState<number | ''>('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cities may arrive after the dialog opens: fill empty selections once they are loaded.
  useEffect(() => {
    if (cities.length === 0) return;
    setOriginCityId((prev) => prev || cities[0].id);
    setDestinationCityId((prev) => prev || (cities[1] ?? cities[0]).id);
  }, [cities]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!originCityId || !destinationCityId) {
      setError('Sélectionnez une origine et une destination.');
      return;
    }
    if (originCityId === destinationCityId) {
      setError("L'origine et la destination doivent être différentes.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/routes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId,
          originCityId,
          destinationCityId,
          defaultDurationMin: durationH * 60 + durationM,
          distanceKm: distanceKm === '' ? undefined : Number(distanceKm),
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
    <Dialog title="Nouvelle route" description="Une liaison entre deux villes, avec sa durée habituelle." onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        {citiesError && <InlineAlert>Impossible de charger la liste des villes. Fermez puis rouvrez cette fenêtre après avoir réessayé.</InlineAlert>}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Origine">
            <Select required value={originCityId} onChange={(e) => setOriginCityId(e.target.value)}>
              {cities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Destination">
            <Select required value={destinationCityId} onChange={(e) => setDestinationCityId(e.target.value)}>
              {cities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Durée (heures)">
            <Input type="number" min={0} value={durationH} onChange={(e) => setDurationH(Number(e.target.value))} />
          </Field>
          <Field label="Durée (minutes)">
            <Input type="number" min={0} max={59} value={durationM} onChange={(e) => setDurationM(Number(e.target.value))} />
          </Field>
          <Field label="Distance (km)">
            <Input type="number" min={0} value={distanceKm} onChange={(e) => setDistanceKm(e.target.value === '' ? '' : Number(e.target.value))} placeholder="240" />
          </Field>
        </div>
        {error && <InlineAlert>{error}</InlineAlert>}
        <FormFooter onClose={onClose} saving={saving} />
      </form>
    </Dialog>
  );
};

const AMENITY_OPTIONS = ['AC', 'WIFI', 'USB', 'VIP', 'TV'];

const VehicleForm: React.FC<{ agencyId: string; onClose: () => void; onSaved: () => void }> = ({ agencyId, onClose, onSaved }) => {
  const [plate, setPlate] = useState('');
  const [model, setModel] = useState('Coaster');
  const [capacity, setCapacity] = useState(30);
  const [amenities, setAmenities] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = (a: string) => setAmenities((arr) => (arr.includes(a) ? arr.filter((x) => x !== a) : [...arr, a]));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/agencies/${agencyId}/vehicles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plate, model, capacity, amenities }),
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
    <Dialog title="Ajouter un véhicule" description="Le plan de sièges peut être personnalisé après la création." onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Plaque d'immatriculation">
          <Input required value={plate} onChange={(e) => setPlate(e.target.value.toUpperCase())} className="font-mono uppercase" placeholder="LT-1234-AB" autoFocus />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Modèle">
            <Input required value={model} onChange={(e) => setModel(e.target.value)} placeholder="Toyota Coaster" />
          </Field>
          <Field label="Capacité (places)">
            <Input required type="number" min={1} value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} />
          </Field>
        </div>
        <div>
          <div className="mb-1.5 text-[12px] font-semibold text-text-main dark:text-gray-200">Équipements</div>
          <div className="flex flex-wrap gap-2">
            {AMENITY_OPTIONS.map((a) => (
              <button
                type="button"
                key={a}
                aria-pressed={amenities.includes(a)}
                onClick={() => toggle(a)}
                className={cx(
                  'h-8 rounded-full border px-3 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60',
                  amenities.includes(a)
                    ? 'border-primary bg-primary/10 text-teal-accent dark:text-primary'
                    : 'border-ink-200 text-text-muted hover:bg-ink-50 dark:border-white/15 dark:hover:bg-white/5',
                )}
              >
                {a}
              </button>
            ))}
          </div>
        </div>
        {error && <InlineAlert>{error}</InlineAlert>}
        <FormFooter onClose={onClose} saving={saving} />
      </form>
    </Dialog>
  );
};

export default CompanyAdminDashboard;
