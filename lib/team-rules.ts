import { Role } from '@prisma/client';

export function canCreateRole(actorRole: Role, targetRole: Role): boolean {
  if (actorRole === 'SUPER_ADMIN') return true;
  if (actorRole === 'COMPANY_ADMIN') {
    return targetRole === 'AGENCY_ADMIN' || targetRole === 'STATION_MANAGER';
  }
  if (actorRole === 'AGENCY_ADMIN') {
    return targetRole === 'STATION_MANAGER';
  }
  return false;
}

export function canEditRole(actorRole: Role, currentTargetRole: Role, newTargetRole?: Role): boolean {
  if (actorRole === 'SUPER_ADMIN') return true;

  if (actorRole === 'COMPANY_ADMIN') {
    if (currentTargetRole === 'SUPER_ADMIN' || currentTargetRole === 'COMPANY_ADMIN') return false;
    if (newTargetRole && (newTargetRole === 'SUPER_ADMIN' || newTargetRole === 'COMPANY_ADMIN')) return false;
    return true;
  }

  if (actorRole === 'AGENCY_ADMIN') {
    if (currentTargetRole !== 'STATION_MANAGER') return false;
    if (newTargetRole && newTargetRole !== 'STATION_MANAGER') return false;
    return true;
  }

  return false;
}

export async function isLastSuperAdmin(userId: string, prisma: any): Promise<boolean> {
  const superAdminsCount = await prisma.user.count({
    where: { role: 'SUPER_ADMIN' }
  });
  return superAdminsCount <= 1;
}
