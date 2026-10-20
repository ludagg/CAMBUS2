/**
 * Pure permission rules for staff-account management (no I/O, unit-tested).
 *
 * Hierarchy: SUPER_ADMIN > COMPANY_ADMIN > AGENCY_ADMIN > STATION_MANAGER > USER.
 * A manager may only create / modify accounts strictly below their own rank,
 * except SUPER_ADMIN who may also manage other super admins.
 */
export type TeamRole = 'USER' | 'SUPER_ADMIN' | 'COMPANY_ADMIN' | 'AGENCY_ADMIN' | 'STATION_MANAGER'

export const ROLE_RANK: Record<TeamRole, number> = {
  USER: 0,
  STATION_MANAGER: 1,
  AGENCY_ADMIN: 2,
  COMPANY_ADMIN: 3,
  SUPER_ADMIN: 4,
}

const CREATABLE: Record<TeamRole, TeamRole[]> = {
  SUPER_ADMIN: ['SUPER_ADMIN', 'COMPANY_ADMIN', 'AGENCY_ADMIN', 'STATION_MANAGER'],
  COMPANY_ADMIN: ['AGENCY_ADMIN', 'STATION_MANAGER'],
  AGENCY_ADMIN: ['STATION_MANAGER'],
  STATION_MANAGER: [],
  USER: [],
}

/** Roles the actor is allowed to hand out (create or assign). */
export function creatableRoles(actor: TeamRole): TeamRole[] {
  return CREATABLE[actor] ?? []
}

export function canCreateRole(actor: TeamRole, target: TeamRole): boolean {
  return creatableRoles(actor).includes(target)
}

/** May the actor modify / delete an existing account holding `target` role? */
export function canManageRole(actor: TeamRole, target: TeamRole): boolean {
  if (actor === 'SUPER_ADMIN') return true
  if (CREATABLE[actor].length === 0) return false
  return ROLE_RANK[target] < ROLE_RANK[actor] && target !== 'USER'
}

export interface Scope {
  companyId: string | null
  agencyId: string | null
}

/** Is the target account inside the actor's tenant scope? */
export function isInScope(actor: TeamRole, actorScope: Scope, target: Scope): boolean {
  if (actor === 'SUPER_ADMIN') return true
  if (actor === 'COMPANY_ADMIN') return !!actorScope.companyId && target.companyId === actorScope.companyId
  if (actor === 'AGENCY_ADMIN') return !!actorScope.agencyId && target.agencyId === actorScope.agencyId
  return false
}

/**
 * Would changing `targetRole` into `newRole` (or deleting, newRole = null)
 * leave the platform without any SUPER_ADMIN?
 */
export function wouldRemoveLastSuperAdmin(
  targetRole: TeamRole,
  newRole: TeamRole | null,
  superAdminCount: number,
): boolean {
  return targetRole === 'SUPER_ADMIN' && newRole !== 'SUPER_ADMIN' && superAdminCount <= 1
}

export type RuleResult = { ok: true } | { ok: false; status: number; message: string }

/** Full decision for PATCH / DELETE on an existing account (scope checked separately via isInScope). */
export function checkModify(args: {
  actorId: string
  actorRole: TeamRole
  targetId: string
  targetRole: TeamRole
  newRole?: TeamRole | null // undefined = unchanged, null = delete
  superAdminCount: number
}): RuleResult {
  const { actorId, actorRole, targetId, targetRole, newRole, superAdminCount } = args
  const isDelete = newRole === null
  const roleChanges = newRole !== undefined && newRole !== null && newRole !== targetRole
  if (!canManageRole(actorRole, targetRole)) {
    return { ok: false, status: 403, message: 'Vous ne pouvez pas gérer un compte de ce niveau.' }
  }
  if (actorId === targetId) {
    if (isDelete) return { ok: false, status: 409, message: 'Vous ne pouvez pas supprimer votre propre compte.' }
    if (roleChanges) return { ok: false, status: 403, message: 'Vous ne pouvez pas modifier votre propre rôle.' }
  }
  if (roleChanges && !canCreateRole(actorRole, newRole as TeamRole)) {
    return { ok: false, status: 403, message: 'Vous ne pouvez pas attribuer ce rôle.' }
  }
  if (wouldRemoveLastSuperAdmin(targetRole, newRole === undefined ? targetRole : newRole, superAdminCount)) {
    return {
      ok: false,
      status: 409,
      message: isDelete
        ? 'Impossible de supprimer le dernier super administrateur.'
        : 'Impossible de rétrograder le dernier super administrateur.',
    }
  }
  return { ok: true }
}
