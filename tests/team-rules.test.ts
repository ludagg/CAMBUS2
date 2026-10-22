import { describe, it, expect, vi } from 'vitest';
import { canCreateRole, canEditRole, isLastSuperAdmin } from '../lib/team-rules';

describe('canCreateRole', () => {
  it('SUPER_ADMIN can create any role', () => {
    expect(canCreateRole('SUPER_ADMIN', 'COMPANY_ADMIN')).toBe(true);
    expect(canCreateRole('SUPER_ADMIN', 'AGENCY_ADMIN')).toBe(true);
    expect(canCreateRole('SUPER_ADMIN', 'STATION_MANAGER')).toBe(true);
    expect(canCreateRole('SUPER_ADMIN', 'SUPER_ADMIN')).toBe(true);
  });

  it('COMPANY_ADMIN can only create AGENCY_ADMIN or STATION_MANAGER', () => {
    expect(canCreateRole('COMPANY_ADMIN', 'AGENCY_ADMIN')).toBe(true);
    expect(canCreateRole('COMPANY_ADMIN', 'STATION_MANAGER')).toBe(true);
    expect(canCreateRole('COMPANY_ADMIN', 'COMPANY_ADMIN')).toBe(false);
    expect(canCreateRole('COMPANY_ADMIN', 'SUPER_ADMIN')).toBe(false);
  });

  it('AGENCY_ADMIN can only create STATION_MANAGER', () => {
    expect(canCreateRole('AGENCY_ADMIN', 'STATION_MANAGER')).toBe(true);
    expect(canCreateRole('AGENCY_ADMIN', 'AGENCY_ADMIN')).toBe(false);
    expect(canCreateRole('AGENCY_ADMIN', 'COMPANY_ADMIN')).toBe(false);
  });

  it('STATION_MANAGER cannot create any role', () => {
    expect(canCreateRole('STATION_MANAGER', 'STATION_MANAGER')).toBe(false);
  });
});

describe('canEditRole', () => {
  it('SUPER_ADMIN can edit any role to any role', () => {
    expect(canEditRole('SUPER_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN')).toBe(true);
    expect(canEditRole('SUPER_ADMIN', 'STATION_MANAGER', 'AGENCY_ADMIN')).toBe(true);
  });

  it('COMPANY_ADMIN cannot edit SUPER_ADMIN or COMPANY_ADMIN', () => {
    expect(canEditRole('COMPANY_ADMIN', 'SUPER_ADMIN')).toBe(false);
    expect(canEditRole('COMPANY_ADMIN', 'COMPANY_ADMIN')).toBe(false);
  });

  it('COMPANY_ADMIN can edit AGENCY_ADMIN and STATION_MANAGER but cannot promote them out of scope', () => {
    expect(canEditRole('COMPANY_ADMIN', 'AGENCY_ADMIN')).toBe(true);
    expect(canEditRole('COMPANY_ADMIN', 'STATION_MANAGER', 'AGENCY_ADMIN')).toBe(true);
    expect(canEditRole('COMPANY_ADMIN', 'AGENCY_ADMIN', 'COMPANY_ADMIN')).toBe(false);
    expect(canEditRole('COMPANY_ADMIN', 'AGENCY_ADMIN', 'SUPER_ADMIN')).toBe(false);
  });

  it('AGENCY_ADMIN can only edit STATION_MANAGER and cannot promote them', () => {
    expect(canEditRole('AGENCY_ADMIN', 'STATION_MANAGER')).toBe(true);
    expect(canEditRole('AGENCY_ADMIN', 'STATION_MANAGER', 'AGENCY_ADMIN')).toBe(false);
    expect(canEditRole('AGENCY_ADMIN', 'COMPANY_ADMIN')).toBe(false);
  });
});

describe('isLastSuperAdmin', () => {
  it('returns true if there is only 1 or 0 SUPER_ADMINs', async () => {
    const mockPrisma = {
      user: {
        count: vi.fn().mockResolvedValue(1)
      }
    };
    const result = await isLastSuperAdmin('user1', mockPrisma);
    expect(result).toBe(true);
    expect(mockPrisma.user.count).toHaveBeenCalledWith({ where: { role: 'SUPER_ADMIN' } });
  });

  it('returns false if there are more than 1 SUPER_ADMINs', async () => {
    const mockPrisma = {
      user: {
        count: vi.fn().mockResolvedValue(2)
      }
    };
    const result = await isLastSuperAdmin('user1', mockPrisma);
    expect(result).toBe(false);
  });
});
