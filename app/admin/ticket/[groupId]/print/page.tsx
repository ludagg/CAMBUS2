import QRCode from 'qrcode';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import PrintButton from '@/components/PrintButton';

export const dynamic = 'force-dynamic';

function formatXAF(cents: number) {
  return `${cents.toLocaleString('fr-FR')} FCFA`;
}

export default async function TicketPrintPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  const group = await prisma.bookingGroup.findUnique({
    where: { id: groupId },
    include: {
      bookings: {
        include: {
          departure: {
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
            },
          },
          passengers: true,
        },
      },
      payment: true,
      soldBy: { select: { name: true } },
    },
  });
  if (!group) notFound();

  const qrByBooking = await Promise.all(
    group.bookings.map(async (b) => ({
      id: b.id,
      qr: await QRCode.toDataURL(b.qrCode, { width: 160, margin: 1 }),
    })),
  );
  const qrMap = Object.fromEntries(qrByBooking.map((q) => [q.id, q.qr]));

  return (
    <div className="print-root">
      <style>{`
        @page { size: A5 portrait; margin: 10mm; }
        @media print { .no-print { display: none !important; } body { background: #fff !important; } }
        .print-root { font-family: system-ui, -apple-system, Segoe UI, Arial, sans-serif; color: #111; background: #fff; padding: 16px; max-width: 600px; margin: 0 auto; }
        .ticket { border: 2px dashed #13ec5b; border-radius: 12px; padding: 16px; margin-bottom: 16px; page-break-inside: avoid; }
        .brand { font-weight: 900; font-size: 18px; letter-spacing: -0.01em; color: #13ec5b; }
        .muted { color: #6b7280; font-size: 11px; }
        .title { font-weight: 900; font-size: 22px; margin: 4px 0; }
        .row { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
        .pill { background: #f3f4f6; padding: 4px 8px; border-radius: 999px; font-size: 10px; font-weight: 900; letter-spacing: .05em; text-transform: uppercase; }
        table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 11px; }
        th, td { padding: 4px 6px; border-bottom: 1px solid #e5e7eb; text-align: left; }
        th { background: #f9fafb; font-size: 10px; font-weight: 900; color: #6b7280; text-transform: uppercase; letter-spacing: .05em; }
      `}</style>

      <div className="no-print" style={{ marginBottom: 12 }}>
        <PrintButton />
      </div>

      {group.bookings.map((b) => {
        const d = b.departure;
        return (
          <div className="ticket" key={b.id}>
            <div className="row">
              <div>
                <div className="brand">Easy Travel</div>
                <div className="muted">Billet officiel · {b.leg === 'OUTBOUND' ? 'Aller' : 'Retour'}</div>
              </div>
              <span className="pill" style={{ background: '#dcfce7', color: '#166534' }}>
                {group.status}
              </span>
            </div>

            <div className="title">
              {d.route.originCity.name} → {d.route.destinationCity.name}
            </div>
            <div className="muted" style={{ marginBottom: 8 }}>
              {d.route.company.name} · {d.originStation.name} → {d.destStation.name}
            </div>

            <div className="row" style={{ alignItems: 'flex-start' }}>
              <div style={{ fontSize: 12, lineHeight: 1.5 }}>
                <div>
                  <strong>Départ :</strong>{' '}
                  {d.departureAt.toLocaleString('fr-FR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
                <div>
                  <strong>Arrivée :</strong>{' '}
                  {d.arrivalAt.toLocaleString('fr-FR', {
                    day: '2-digit',
                    month: 'long',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
                <div>
                  <strong>Sièges :</strong> {b.seats.join(', ') || '—'}
                </div>
                <div>
                  <strong>Référence :</strong>{' '}
                  <code>{b.qrCode.slice(-10).toUpperCase()}</code>
                </div>
              </div>
              <img
                src={qrMap[b.id]}
                alt="QR"
                style={{ width: 120, height: 120, border: '1px solid #e5e7eb', borderRadius: 4 }}
              />
            </div>

            <table>
              <thead>
                <tr>
                  <th>Passager</th>
                  <th>CNI</th>
                  <th>Siège</th>
                </tr>
              </thead>
              <tbody>
                {b.passengers.map((p) => (
                  <tr key={p.id}>
                    <td>{p.fullName}</td>
                    <td>{p.idNumber || '—'}</td>
                    <td>{p.seat || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="row" style={{ marginTop: 8, fontSize: 11 }}>
              <span className="muted">
                Total : <strong style={{ color: '#111' }}>{formatXAF(b.priceCents)}</strong>
                {' · '}
                Paiement : {group.payment?.method ?? '—'}
                {group.channel === 'COUNTER' && group.soldBy ? ` · Guichet: ${group.soldBy.name}` : ''}
              </span>
              <span className="muted">
                {new Date().toLocaleString('fr-FR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                })}
              </span>
            </div>
          </div>
        );
      })}

      <div style={{ fontSize: 10, color: '#6b7280', textAlign: 'center' }}>
        Présentez ce billet (QR) au contrôle avec votre CNI. Merci de votre confiance.
      </div>
    </div>
  );
}
