import { prisma } from './prisma'
import { AuthError, type SessionPayload } from './auth'

/**
 * Ownership scoping helpers for admin endpoints.
 *
 * RBAC check (requireRole) only validates the session's role. These helpers
 * additionally verify the caller actually owns the resource they are trying
 * to mutate — preventing a COMPANY_ADMIN of company A from modifying
 * company B, an AGENCY_ADMIN of agency X from modifying vehicles of agency Y,
 * etc. SUPER_ADMIN bypasses all scoping.
 */

export async function assertOwnsCompany(session: SessionPayload, companyId: string): Promise<void> {
  if (session.role === 'SUPER_ADMIN') return
  if (session.role !== 'COMPANY_ADMIN') {
    throw new AuthError('Accès refusé.', 403)
  }
  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: { companyId: true },
  })
  if (!user?.companyId || user.companyId !== companyId) {
    throw new AuthError('Accès refusé: cette compagnie ne vous appartient pas.', 403)
  }
}

export async function assertOwnsAgency(session: SessionPayload, agencyId: string): Promise<void> {
  if (session.role === 'SUPER_ADMIN') return

  const agency = await prisma.agency.findUnique({
    where: { id: agencyId },
    select: { id: true, companyId: true },
  })
  if (!agency) throw new AuthError('Agence introuvable.', 404)

  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: { companyId: true, agencyId: true, role: true },
  })
  if (!user) throw new AuthError('Utilisateur introuvable.', 404)

  if (user.role === 'COMPANY_ADMIN') {
    if (user.companyId !== agency.companyId) {
      throw new AuthError('Accès refusé: cette agence ne fait pas partie de votre compagnie.', 403)
    }
    return
  }
  if (user.role === 'AGENCY_ADMIN' || user.role === 'STATION_MANAGER') {
    if (user.agencyId !== agency.id) {
      throw new AuthError('Accès refusé: cette agence n\'est pas la vôtre.', 403)
    }
    return
  }
  throw new AuthError('Accès refusé.', 403)
}

export async function assertOwnsVehicle(session: SessionPayload, vehicleId: string): Promise<void> {
  if (session.role === 'SUPER_ADMIN') return
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
    select: { agencyId: true },
  })
  if (!vehicle) throw new AuthError('Véhicule introuvable.', 404)
  await assertOwnsAgency(session, vehicle.agencyId)
}

export async function assertOwnsDeparture(session: SessionPayload, departureId: string): Promise<void> {
  if (session.role === 'SUPER_ADMIN') return
  const dep = await prisma.departure.findUnique({
    where: { id: departureId },
    select: { agencyId: true },
  })
  if (!dep) throw new AuthError('Départ introuvable.', 404)
  await assertOwnsAgency(session, dep.agencyId)
}

export async function assertOwnsRoute(session: SessionPayload, routeId: string): Promise<void> {
  if (session.role === 'SUPER_ADMIN') return
  const route = await prisma.route.findUnique({
    where: { id: routeId },
    select: { companyId: true },
  })
  if (!route) throw new AuthError('Route introuvable.', 404)
  await assertOwnsCompany(session, route.companyId)
}
