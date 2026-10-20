'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import AdminShell, { type NavItem } from './admin/AdminShell';
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardHeader,
  Dialog,
  EmptyState,
  ErrorState,
  Field,
  Input,
  PageHeader,
  ROLE_LABELS,
  SearchInput,
  Select,
  SkeletonList,
  StatCard,
  StatusBadge,
  Table,
  TD,
  TR,
  THead,
  Textarea,
  Th,
  Tone,
  formatXAF,
  inputCls,
  useConfirm,
  useToast,
} from './admin/ui';
import AnalyticsPanel from './AnalyticsPanel';
import DepartureControlPanel from './DepartureControlPanel';

// Re-exported for the other dashboards that still import them from here.
export { inputCls, Field, StatCard };

interface Company {
  id: string;
  name: string;
  slug: string;
  logo: string;
  brandColor: string;
  status: string;
  email?: string | null;
  _count?: { agencies: number; routes: number };
}

interface Agency {
  id: string;
  name: string;
  status: string;
  company: { name: string; brandColor: string };
  city: { name: string; region: string };
  _count?: { departures: number; vehicles: number };
}

interface City {
  id: string;
  name: string;
  region: string;
}

interface PlatformUser {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

interface Stats {
  companies: number;
  agencies: number;
  cities: number;
  users: number;
  bookings: number;
  departures: number;
  totalRevenue: number;
}

const NAV: NavItem[] = [
  { key: 'overview', label: "Vue d'ensemble", icon: 'space_dashboard', group: 'Pilotage' },
  { key: 'operations', label: 'Départs en direct', icon: 'directions_bus', group: 'Pilotage' },
  { key: 'analytics', label: 'Statistiques', icon: 'monitoring', group: 'Pilotage' },
  { key: 'companies', label: 'Compagnies', icon: 'business', group: 'Réseau' },
  { key: 'agencies', label: 'Agences', icon: 'storefront', group: 'Réseau' },
  { key: 'cities', label: 'Villes', icon: 'location_city', group: 'Réseau' },
  { key: 'users', label: 'Utilisateurs', icon: 'group', group: 'Plateforme' },
];

const ROLE_TONE: Record<string, Tone> = {
  SUPER_ADMIN: 'danger',
  COMPANY_ADMIN: 'brand',
  AGENCY_ADMIN: 'info',
  STATION_MANAGER: 'warning',
  USER: 'neutral',
};

const fetchJson = async (url: string) => {
  const res = await fetch(url);
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || 'Erreur');
  return json;
};

const SuperAdminDashboard: React.FC = () => {
  const [section, setSection] = useState('overview');

  return (
    <AdminShell context="Plateforme Easy Travel" nav={NAV} active={section} onNavigate={setSection}>
      <Sections section={section} onNavigate={setSection} />
    </AdminShell>
  );
};

const Sections: React.FC<{ section: string; onNavigate: (s: string) => void }> = ({ section, onNavigate }) => {
  const toast = useToast();
  const { confirm, dialog } = useConfirm();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [companyModalOpen, setCompanyModalOpen] = useState(false);
  const [agencyModalOpen, setAgencyModalOpen] = useState(false);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const [companiesRes, agenciesRes, citiesRes, usersRes, statsRes] = await Promise.all([
        fetchJson('/api/companies'),
        fetchJson('/api/agencies'),
        fetchJson('/api/cities'),
        fetchJson('/api/admin/users'),
        fetchJson('/api/admin/stats'),
      ]);
      setCompanies(companiesRes.data ?? []);
      setAgencies(agenciesRes.data ?? []);
      setCities(citiesRes.data ?? []);
      setUsers(usersRes.data ?? []);
      setStats(statsRes.data ?? null);
    } catch (err) {
      console.error(err);
      setLoadError('Impossible de charger les données de la plateforme.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const toggleCompanyStatus = async (c: Company) => {
    if (c.status === 'ACTIVE') {
      const ok = await confirm({
        title: `Désactiver ${c.name} ?`,
        message: 'La compagnie disparaît de la recherche. Ses réservations existantes restent valides.',
        confirmLabel: 'Désactiver',
      });
      if (!ok) return;
    }
    const res = await fetch(`/api/companies/${c.id}`, {
      method: c.status === 'ACTIVE' ? 'DELETE' : 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: c.status === 'ACTIVE' ? undefined : JSON.stringify({ status: 'ACTIVE' }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      toast(j.error || 'Opération impossible.', 'error');
      return;
    }
    toast(c.status === 'ACTIVE' ? `${c.name} désactivée.` : `${c.name} réactivée.`);
    await refetch();
  };

  const needsData = ['overview', 'companies', 'agencies', 'cities', 'users'].includes(section);

  return (
    <>
      {needsData && loadError && <ErrorState message={loadError} onRetry={refetch} />}
      {needsData && isLoading && !loadError && (
        <>
          <div className="h-24" />
          <SkeletonList rows={5} />
        </>
      )}

      {needsData && !isLoading && !loadError && section === 'overview' && stats && (
        <Overview stats={stats} companies={companies} onNavigate={onNavigate} onNewCompany={() => setCompanyModalOpen(true)} onNewAgency={() => setAgencyModalOpen(true)} />
      )}
      {needsData && !isLoading && !loadError && section === 'companies' && (
        <CompaniesSection companies={companies} onNew={() => setCompanyModalOpen(true)} onToggle={toggleCompanyStatus} />
      )}
      {needsData && !isLoading && !loadError && section === 'agencies' && (
        <AgenciesSection agencies={agencies} companies={companies} onNew={() => setAgencyModalOpen(true)} />
      )}
      {needsData && !isLoading && !loadError && section === 'cities' && <CitiesSection cities={cities} />}
      {needsData && !isLoading && !loadError && section === 'users' && <UsersSection users={users} />}

      {section === 'operations' && (
        <>
          <PageHeader eyebrow="Pilotage" title="Départs en direct" description="Suivez les départs du jour, signalez un retard ou annulez un départ. Les passagers sont prévenus automatiquement." />
          <DepartureControlPanel />
        </>
      )}
      {section === 'analytics' && (
        <>
          <PageHeader eyebrow="Pilotage" title="Statistiques" description="Revenus, remplissage et sièges les plus demandés sur l'ensemble du réseau." />
          <AnalyticsPanel />
        </>
      )}

      {companyModalOpen && (
        <CompanyForm
          onClose={() => setCompanyModalOpen(false)}
          onSaved={async () => {
            setCompanyModalOpen(false);
            toast('Compagnie créée.');
            await refetch();
          }}
        />
      )}
      {agencyModalOpen && (
        <AgencyForm
          companies={companies}
          cities={cities}
          onClose={() => setAgencyModalOpen(false)}
          onSaved={async () => {
            setAgencyModalOpen(false);
            toast('Agence créée.');
            await refetch();
          }}
        />
      )}
      {dialog}
    </>
  );
};

/* ── Overview ─────────────────────────────────────────────────────────── */

const Overview: React.FC<{
  stats: Stats;
  companies: Company[];
  onNavigate: (s: string) => void;
  onNewCompany: () => void;
  onNewAgency: () => void;
}> = ({ stats, companies, onNavigate, onNewCompany, onNewAgency }) => (
  <>
    <PageHeader
      eyebrow="Pilotage"
      title="Vue d'ensemble"
      description="L'activité de toute la plateforme en un coup d'œil."
      actions={
        <>
          <Button icon="add_business" onClick={onNewCompany}>
            Nouvelle compagnie
          </Button>
          <Button variant="primary" icon="add_location_alt" onClick={onNewAgency}>
            Nouvelle agence
          </Button>
        </>
      }
    />

    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard label="Revenus encaissés" value={formatXAF(stats.totalRevenue)} icon="payments" hint="Paiements confirmés" />
      <StatCard label="Réservations" value={stats.bookings.toLocaleString('fr-FR')} icon="confirmation_number" tone="info" />
      <StatCard label="Départs programmés" value={stats.departures.toLocaleString('fr-FR')} icon="directions_bus" tone="info" />
      <StatCard label="Utilisateurs" value={stats.users.toLocaleString('fr-FR')} icon="group" tone="warning" />
    </div>

    <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2" padded={false}>
        <div className="p-5 md:p-6 pb-0">
          <CardHeader
            icon="business"
            title="Compagnies partenaires"
            subtitle={`${stats.companies} compagnies · ${stats.agencies} agences · ${stats.cities} villes`}
            action={
              <Button size="sm" variant="ghost" onClick={() => onNavigate('companies')}>
                Tout voir
              </Button>
            }
          />
        </div>
        {companies.length === 0 ? (
          <EmptyState icon="business" title="Aucune compagnie" description="Ajoutez votre première compagnie partenaire." />
        ) : (
          <ul className="divide-y divide-ink-100 dark:divide-white/10">
            {companies.slice(0, 6).map((c) => (
              <li key={c.id} className="flex items-center gap-4 px-5 md:px-6 py-3.5">
                <span className="inline-flex size-10 items-center justify-center rounded-xl text-white" style={{ backgroundColor: c.brandColor }}>
                  <span className="material-symbols-outlined text-[20px]">{c.logo || 'directions_bus'}</span>
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-text-main dark:text-white">{c.name}</div>
                  <div className="text-xs text-text-muted">
                    {c._count?.agencies ?? 0} agences · {c._count?.routes ?? 0} routes
                  </div>
                </div>
                <StatusBadge status={c.status} />
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <CardHeader icon="bolt" title="Accès rapides" />
        <div className="grid gap-2">
          {[
            { key: 'operations', icon: 'directions_bus', label: 'Départs en direct', hint: 'Retards, annulations' },
            { key: 'analytics', icon: 'monitoring', label: 'Statistiques', hint: 'Revenus et remplissage' },
            { key: 'agencies', icon: 'storefront', label: 'Agences', hint: 'Gérer le réseau' },
            { key: 'users', icon: 'group', label: 'Utilisateurs', hint: 'Comptes et rôles' },
          ].map((q) => (
            <button
              key={q.key}
              onClick={() => onNavigate(q.key)}
              className="group flex items-center gap-3 rounded-xl border border-ink-100 dark:border-white/10 px-3.5 py-3 text-left transition hover:border-primary/50 hover:bg-primary/5"
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

/* ── Companies ────────────────────────────────────────────────────────── */

const CompaniesSection: React.FC<{
  companies: Company[];
  onNew: () => void;
  onToggle: (c: Company) => void;
}> = ({ companies, onNew, onToggle }) => {
  const [q, setQ] = useState('');
  const rows = useMemo(() => companies.filter((c) => c.name.toLowerCase().includes(q.toLowerCase())), [companies, q]);
  return (
    <>
      <PageHeader
        eyebrow="Réseau"
        title="Compagnies"
        description="Les compagnies de transport partenaires, leurs agences et leurs routes."
        actions={
          <Button variant="primary" icon="add" onClick={onNew}>
            Nouvelle compagnie
          </Button>
        }
      />
      <div className="mb-4 max-w-sm">
        <SearchInput value={q} onChange={setQ} placeholder="Rechercher une compagnie…" />
      </div>
      {rows.length === 0 ? (
        <Card padded={false}>
          <EmptyState icon="business" title={q ? 'Aucun résultat' : 'Aucune compagnie enregistrée'} description={q ? 'Essayez un autre nom.' : 'Créez la première compagnie partenaire.'} />
        </Card>
      ) : (
        <Table>
          <THead>
            <Th>Compagnie</Th>
            <Th>Agences</Th>
            <Th>Routes</Th>
            <Th>Statut</Th>
            <Th className="text-right">Actions</Th>
          </THead>
          <tbody>
            {rows.map((c) => (
              <TR key={c.id}>
                <TD>
                  <div className="flex items-center gap-3">
                    <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl text-white" style={{ backgroundColor: c.brandColor }}>
                      <span className="material-symbols-outlined text-[20px]">{c.logo || 'business'}</span>
                    </span>
                    <div className="min-w-0">
                      <div className="font-semibold">{c.name}</div>
                      <div className="text-xs text-text-muted">{c.email || c.slug}</div>
                    </div>
                  </div>
                </TD>
                <TD className="tabular-nums">{c._count?.agencies ?? 0}</TD>
                <TD className="tabular-nums">{c._count?.routes ?? 0}</TD>
                <TD>
                  <StatusBadge status={c.status} />
                </TD>
                <TD className="text-right">
                  <Button size="sm" variant={c.status === 'ACTIVE' ? 'secondary' : 'primary'} onClick={() => onToggle(c)}>
                    {c.status === 'ACTIVE' ? 'Désactiver' : 'Réactiver'}
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

/* ── Agencies ─────────────────────────────────────────────────────────── */

const AgenciesSection: React.FC<{ agencies: Agency[]; companies: Company[]; onNew: () => void }> = ({ agencies, companies, onNew }) => {
  const [q, setQ] = useState('');
  const [companyName, setCompanyName] = useState('');
  const rows = useMemo(
    () =>
      agencies.filter(
        (a) =>
          (!companyName || a.company.name === companyName) &&
          `${a.name} ${a.city.name}`.toLowerCase().includes(q.toLowerCase()),
      ),
    [agencies, q, companyName],
  );
  return (
    <>
      <PageHeader
        eyebrow="Réseau"
        title="Agences"
        description="Les points de vente et gares du réseau."
        actions={
          <Button variant="primary" icon="add" onClick={onNew}>
            Nouvelle agence
          </Button>
        }
      />
      <div className="mb-4 flex flex-wrap gap-3">
        <SearchInput value={q} onChange={setQ} placeholder="Rechercher une agence ou une ville…" className="w-full sm:w-80" />
        <Select value={companyName} onChange={(e) => setCompanyName(e.target.value)} aria-label="Filtrer par compagnie" className="w-full sm:w-56">
          <option value="">Toutes les compagnies</option>
          {companies.map((c) => (
            <option key={c.id} value={c.name}>
              {c.name}
            </option>
          ))}
        </Select>
      </div>
      {rows.length === 0 ? (
        <Card padded={false}>
          <EmptyState icon="storefront" title="Aucune agence" description="Aucune agence ne correspond à ces critères." />
        </Card>
      ) : (
        <Table>
          <THead>
            <Th>Agence</Th>
            <Th>Compagnie</Th>
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
                  <span className="inline-flex items-center gap-2">
                    <span className="size-2.5 rounded-full" style={{ backgroundColor: a.company.brandColor }} />
                    {a.company.name}
                  </span>
                </TD>
                <TD>
                  {a.city.name} <span className="text-xs text-text-muted">· {a.city.region}</span>
                </TD>
                <TD className="tabular-nums">{a._count?.departures ?? 0}</TD>
                <TD className="tabular-nums">{a._count?.vehicles ?? 0}</TD>
                <TD>
                  <StatusBadge status={a.status} />
                </TD>
              </TR>
            ))}
          </tbody>
        </Table>
      )}
    </>
  );
};

/* ── Cities ───────────────────────────────────────────────────────────── */

const CitiesSection: React.FC<{ cities: City[] }> = ({ cities }) => {
  const byRegion = useMemo(() => {
    const m = new Map<string, City[]>();
    for (const c of cities) m.set(c.region, [...(m.get(c.region) ?? []), c]);
    return Array.from(m.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [cities]);
  return (
    <>
      <PageHeader eyebrow="Réseau" title="Villes" description="Les villes desservies, regroupées par région." />
      {cities.length === 0 ? (
        <Card padded={false}>
          <EmptyState icon="location_city" title="Aucune ville enregistrée" />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {byRegion.map(([region, list]) => (
            <Card key={region}>
              <CardHeader icon="map" title={region} subtitle={`${list.length} ville${list.length > 1 ? 's' : ''}`} />
              <div className="flex flex-wrap gap-2">
                {list.map((c) => (
                  <Badge key={c.id} tone="neutral" className="!px-3 !py-1 !text-xs">
                    {c.name}
                  </Badge>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
};

/* ── Users ────────────────────────────────────────────────────────────── */

const UsersSection: React.FC<{ users: PlatformUser[] }> = ({ users }) => {
  const [q, setQ] = useState('');
  const [role, setRole] = useState('');
  const rows = useMemo(
    () =>
      users.filter(
        (u) => (!role || u.role === role) && `${u.name} ${u.email}`.toLowerCase().includes(q.toLowerCase()),
      ),
    [users, q, role],
  );
  return (
    <>
      <PageHeader eyebrow="Plateforme" title="Utilisateurs" description={`${users.length} compte${users.length > 1 ? 's' : ''} sur la plateforme.`} />
      <div className="mb-4 flex flex-wrap gap-3">
        <SearchInput value={q} onChange={setQ} placeholder="Nom ou e-mail…" className="w-full sm:w-80" />
        <Select value={role} onChange={(e) => setRole(e.target.value)} aria-label="Filtrer par rôle" className="w-full sm:w-56">
          <option value="">Tous les rôles</option>
          {Object.entries(ROLE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </Select>
      </div>
      {rows.length === 0 ? (
        <Card padded={false}>
          <EmptyState icon="group" title="Aucun utilisateur" description="Aucun compte ne correspond à ces critères." />
        </Card>
      ) : (
        <Table>
          <THead>
            <Th>Utilisateur</Th>
            <Th>Rôle</Th>
            <Th>Inscrit le</Th>
          </THead>
          <tbody>
            {rows.map((u) => (
              <TR key={u.id}>
                <TD>
                  <div className="flex items-center gap-3">
                    <Avatar name={u.name} />
                    <div className="min-w-0">
                      <div className="font-semibold">{u.name}</div>
                      <div className="text-xs text-text-muted">{u.email}</div>
                    </div>
                  </div>
                </TD>
                <TD>
                  <Badge tone={ROLE_TONE[u.role] ?? 'neutral'}>{ROLE_LABELS[u.role] ?? u.role}</Badge>
                </TD>
                <TD className="text-text-muted">{new Date(u.createdAt).toLocaleDateString('fr-FR', { timeZone: 'Africa/Douala' })}</TD>
              </TR>
            ))}
          </tbody>
        </Table>
      )}
    </>
  );
};

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

const CompanyForm: React.FC<{ onClose: () => void; onSaved: () => void }> = ({ onClose, onSaved }) => {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [brandColor, setBrandColor] = useState('#13ec5b');
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          slug: slug || name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
          brandColor,
          description: description || undefined,
          email: email || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erreur');
      onSaved();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog title="Nouvelle compagnie" description="Elle pourra ensuite ouvrir ses agences et publier ses routes." onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Nom commercial">
          <Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex : Express Union" autoFocus />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Identifiant (URL)" hint="Généré à partir du nom si vide">
            <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="express-union" />
          </Field>
          <Field label="E-mail de contact">
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="contact@express.cm" />
          </Field>
        </div>
        <Field label="Couleur de marque">
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={brandColor}
              onChange={(e) => setBrandColor(e.target.value)}
              aria-label="Choisir la couleur"
              className="h-10 w-14 cursor-pointer rounded-xl border border-ink-200 bg-transparent p-1"
            />
            <input value={brandColor} onChange={(e) => setBrandColor(e.target.value)} className={inputCls + ' font-mono'} aria-label="Code couleur" />
          </div>
        </Field>
        <Field label="Description">
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
        </Field>
        {error && <div role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</div>}
        <FormFooter onClose={onClose} saving={saving} />
      </form>
    </Dialog>
  );
};

const AgencyForm: React.FC<{ companies: Company[]; cities: City[]; onClose: () => void; onSaved: () => void }> = ({
  companies,
  cities,
  onClose,
  onSaved,
}) => {
  const [companyId, setCompanyId] = useState(companies[0]?.id ?? '');
  const [cityId, setCityId] = useState(cities[0]?.id ?? '');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/agencies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId,
          cityId,
          name,
          address: address || undefined,
          phone: phone || undefined,
          email: email || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erreur');
      onSaved();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog title="Nouvelle agence" description="Un point de vente ou une gare rattaché à une compagnie." onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Compagnie">
            <Select required value={companyId} onChange={(e) => setCompanyId(e.target.value)}>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Ville">
            <Select required value={cityId} onChange={(e) => setCityId(e.target.value)}>
              {cities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <Field label="Nom de l'agence">
          <Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex : Express Douala Bonabéri" />
        </Field>
        <Field label="Adresse">
          <Input value={address} onChange={(e) => setAddress(e.target.value)} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Téléphone">
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+237 6…" />
          </Field>
          <Field label="E-mail">
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
        </div>
        {error && <div role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</div>}
        <FormFooter onClose={onClose} saving={saving} />
      </form>
    </Dialog>
  );
};

export default SuperAdminDashboard;
