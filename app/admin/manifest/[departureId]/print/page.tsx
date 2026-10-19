import { prisma } from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { assertOwnsDeparture } from '@/lib/scoping';
import PrintButton from '@/components/PrintButton';

export const dynamic = 'force-dynamic';

export default async function ManifestPrintPage({
  params,
}: {
  params: Promise<{ departureId: string }>;
}) {
  const { departureId } = await params;

  // Passenger PII: staff only, scoped to their own agency/company.
  const session = await getSession();
  if (!session) redirect('/login');
  if (!['SUPER_ADMIN', 'COMPANY_ADMIN', 'AGENCY_ADMIN', 'STATION_MANAGER'].includes(session.role)) notFound();
  try {
    await assertOwnsDeparture(session, departureId);
  } catch {
    notFound();
  }
  const dep = await prisma.departure.findUnique({
    where: { id: departureId },
    include: {
      route: {
        include: {
          company: { select: { name: true, brandColor: true } },
          originCity: { select: { name: true } },
          destinationCity: { select: { name: true } },
        },
      },
      originStation: { select: { name: true, address: true } },
      destStation: { select: { name: true, address: true } },
      vehicle: { select: { plate: true, model: true, capacity: true } },
      agency: { select: { name: true } },
      bookings: {
        where: { status: { in: ['PENDING', 'CONFIRMED', 'BOARDED'] } },
        include: {
          passengers: true,
          group: { select: { contactPhone: true, contactEmail: true, contactName: true, channel: true } },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  });
  if (!dep) notFound();

  const allPassengers = dep.bookings.flatMap((b) =>
    b.passengers.map((p) => ({
      ...p,
      bookingSeats: b.seats,
      contactPhone: b.group?.contactPhone ?? '',
      contactName: b.group?.contactName ?? '',
      status: b.status,
    })),
  );
  allPassengers.sort((a, b) => {
    const sa = a.seat ?? '';
    const sb = b.seat ?? '';
    return sa.localeCompare(sb);
  });

  return (
    <div className="print-root">
      <style>{`
        @page { size: A4 portrait; margin: 10mm; }
        @media print { .no-print { display: none !important; } body { background: #fff !important; } }
        .print-root { font-family: system-ui, -apple-system, Segoe UI, Arial, sans-serif; color: #111; background: #fff; padding: 16px; max-width: 800px; margin: 0 auto; }
        .header { border-bottom: 3px solid ${dep.route.company.brandColor || '#13ec5b'}; padding-bottom: 8px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; }
        .brand { font-size: 22px; font-weight: 900; color: ${dep.route.company.brandColor || '#13ec5b'}; }
        .muted { color: #6b7280; font-size: 11px; }
        .title { font-weight: 900; font-size: 18px; margin: 4px 0; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 11px; margin-bottom: 12px; }
        .grid div strong { display: block; text-transform: uppercase; font-size: 9px; color: #6b7280; letter-spacing: .05em; margin-bottom: 2px; font-weight: 900; }
        table { width: 100%; border-collapse: collapse; font-size: 11px; }
        th, td { padding: 4px 6px; border: 1px solid #d1d5db; text-align: left; }
        th { background: #f3f4f6; font-size: 10px; font-weight: 900; color: #374151; text-transform: uppercase; letter-spacing: .05em; }
        .status-pill { display: inline-block; padding: 1px 6px; border-radius: 999px; font-size: 9px; font-weight: 900; letter-spacing: .05em; text-transform: uppercase; background: #f3f4f6; }
        .status-BOARDED { background: #dcfce7; color: #166534; }
        .status-CONFIRMED { background: #dbeafe; color: #1e40af; }
        .status-PENDING { background: #fef3c7; color: #92400e; }
        .signatures { margin-top: 24px; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; font-size: 11px; }
        .signature { border-top: 1px solid #111; padding-top: 4px; text-align: center; font-weight: 900; }
      `}</style>

      <div className="no-print" style={{ marginBottom: 12 }}>
        <PrintButton />
      </div>

      <div className="header">
        <div>
          <div className="brand">{dep.route.company.name}</div>
          <div className="title">
            MANIFESTE DE VOYAGE · {dep.route.originCity.name} → {dep.route.destinationCity.name}
          </div>
          <div className="muted">
            Agence : {dep.agency.name} · {dep.originStation.name} → {dep.destStation.name}
          </div>
        </div>
        <div className="muted" style={{ textAlign: 'right' }}>
          Référence :{' '}
          <strong style={{ color: '#111' }}>{dep.id.slice(-10).toUpperCase()}</strong>
          <br />
          Édité le{' '}
          {new Date().toLocaleString('fr-FR', {
            timeZone: 'Africa/Douala',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      </div>

      <div className="grid">
        <div>
          <strong>Date & Heure de départ</strong>
          {dep.departureAt.toLocaleString('fr-FR', {
            timeZone: 'Africa/Douala',
            weekday: 'long',
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
          {dep.delayMinutes ? ` (retard ${dep.delayMinutes}min)` : ''}
        </div>
        <div>
          <strong>Heure d'arrivée prévue</strong>
          {dep.arrivalAt.toLocaleString('fr-FR', {
            timeZone: 'Africa/Douala',
            day: '2-digit',
            month: 'long',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
        <div>
          <strong>Véhicule</strong>
          {dep.vehicle
            ? `${dep.vehicle.plate} · ${dep.vehicle.model} · ${dep.vehicle.capacity} places`
            : '—'}
        </div>
        <div>
          <strong>Occupation</strong>
          {dep.seatsTotal - dep.seatsAvailable} / {dep.seatsTotal} places (
          {Math.round(((dep.seatsTotal - dep.seatsAvailable) / dep.seatsTotal) * 100)}%)
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th style={{ width: 30 }}>#</th>
            <th style={{ width: 60 }}>Siège</th>
            <th>Nom complet</th>
            <th style={{ width: 100 }}>CNI</th>
            <th style={{ width: 110 }}>Téléphone</th>
            <th style={{ width: 80 }}>Statut</th>
            <th style={{ width: 90 }}>Émargement</th>
          </tr>
        </thead>
        <tbody>
          {allPassengers.map((p, i) => (
            <tr key={p.id}>
              <td>{i + 1}</td>
              <td style={{ fontWeight: 900 }}>{p.seat ?? p.bookingSeats.join(',') ?? '—'}</td>
              <td>{p.fullName}</td>
              <td>{p.idNumber ?? '—'}</td>
              <td>{p.contactPhone}</td>
              <td>
                <span className={`status-pill status-${p.status}`}>{p.status}</span>
              </td>
              <td></td>
            </tr>
          ))}
          {allPassengers.length === 0 && (
            <tr>
              <td colSpan={7} style={{ textAlign: 'center', color: '#6b7280', padding: 16 }}>
                Aucun passager inscrit sur ce départ.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="signatures">
        <div className="signature">Chauffeur</div>
        <div className="signature">Chef de station</div>
        <div className="signature">Gendarmerie (contrôle)</div>
      </div>
    </div>
  );
}
