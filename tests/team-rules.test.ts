import { describe, expect, it } from 'vitest'
import {
  canCreateRole,
  canManageRole,
  checkModify,
  creatableRoles,
  isInScope,
  wouldRemoveLastSuperAdmin,
} from '../lib/team-rules'

describe('team rules', () => {
  it('super admin can create every staff role', () => {
    expect(creatableRoles('SUPER_ADMIN')).toEqual(['SUPER_ADMIN', 'COMPANY_ADMIN', 'AGENCY_ADMIN', 'STATION_MANAGER'])
  })
  it('company admin creates agency admins and station managers only', () => {
    expect(canCreateRole('COMPANY_ADMIN', 'AGENCY_ADMIN')).toBe(true)
    expect(canCreateRole('COMPANY_ADMIN', 'STATION_MANAGER')).toBe(true)
    expect(canCreateRole('COMPANY_ADMIN', 'COMPANY_ADMIN')).toBe(false)
    expect(canCreateRole('COMPANY_ADMIN', 'SUPER_ADMIN')).toBe(false)
  })
  it('agency admin creates station managers only', () => {
    expect(canCreateRole('AGENCY_ADMIN', 'STATION_MANAGER')).toBe(true)
    expect(canCreateRole('AGENCY_ADMIN', 'AGENCY_ADMIN')).toBe(false)
  })
  it('station manager and users create nothing', () => {
    expect(creatableRoles('STATION_MANAGER')).toEqual([])
    expect(creatableRoles('USER')).toEqual([])
  })
  it('cannot manage equal or higher ranks unless super admin', () => {
    expect(canManageRole('COMPANY_ADMIN', 'COMPANY_ADMIN')).toBe(false)
    expect(canManageRole('AGENCY_ADMIN', 'COMPANY_ADMIN')).toBe(false)
    expect(canManageRole('AGENCY_ADMIN', 'STATION_MANAGER')).toBe(true)
    expect(canManageRole('SUPER_ADMIN', 'SUPER_ADMIN')).toBe(true)
  })
  it('non-super cannot manage plain customers', () => {
    expect(canManageRole('COMPANY_ADMIN', 'USER')).toBe(false)
  })
  it('scopes accounts by company or agency', () => {
    const company = { companyId: 'c1', agencyId: null }
    expect(isInScope('COMPANY_ADMIN', company, { companyId: 'c1', agencyId: 'a1' })).toBe(true)
    expect(isInScope('COMPANY_ADMIN', company, { companyId: 'c2', agencyId: 'a9' })).toBe(false)
    expect(isInScope('AGENCY_ADMIN', { companyId: 'c1', agencyId: 'a1' }, { companyId: 'c1', agencyId: 'a2' })).toBe(false)
    expect(isInScope('AGENCY_ADMIN', { companyId: null, agencyId: null }, { companyId: null, agencyId: null })).toBe(false)
    expect(isInScope('SUPER_ADMIN', { companyId: null, agencyId: null }, { companyId: 'x', agencyId: null })).toBe(true)
  })
  it('detects removal of the last super admin', () => {
    expect(wouldRemoveLastSuperAdmin('SUPER_ADMIN', null, 1)).toBe(true)
    expect(wouldRemoveLastSuperAdmin('SUPER_ADMIN', 'COMPANY_ADMIN', 1)).toBe(true)
    expect(wouldRemoveLastSuperAdmin('SUPER_ADMIN', null, 2)).toBe(false)
    expect(wouldRemoveLastSuperAdmin('SUPER_ADMIN', 'SUPER_ADMIN', 1)).toBe(false)
    expect(wouldRemoveLastSuperAdmin('AGENCY_ADMIN', null, 1)).toBe(false)
  })
  it('refuses self deletion and self role change', () => {
    const base = { actorId: 'u1', targetId: 'u1', superAdminCount: 3 }
    expect(checkModify({ ...base, actorRole: 'SUPER_ADMIN', targetRole: 'SUPER_ADMIN', newRole: null }).ok).toBe(false)
    const r = checkModify({ ...base, actorRole: 'SUPER_ADMIN', targetRole: 'SUPER_ADMIN', newRole: 'COMPANY_ADMIN' })
    expect(r.ok).toBe(false)
    expect(checkModify({ ...base, actorRole: 'SUPER_ADMIN', targetRole: 'SUPER_ADMIN' }).ok).toBe(true)
  })
  it('refuses demoting the last super admin', () => {
    const r = checkModify({
      actorId: 'a', actorRole: 'SUPER_ADMIN', targetId: 'b', targetRole: 'SUPER_ADMIN', newRole: 'AGENCY_ADMIN', superAdminCount: 1,
    })
    expect(r).toMatchObject({ ok: false, status: 409 })
  })
  it('refuses assigning a role above the actor', () => {
    const r = checkModify({
      actorId: 'a', actorRole: 'COMPANY_ADMIN', targetId: 'b', targetRole: 'STATION_MANAGER', newRole: 'COMPANY_ADMIN', superAdminCount: 2,
    })
    expect(r).toMatchObject({ ok: false, status: 403 })
  })
})
