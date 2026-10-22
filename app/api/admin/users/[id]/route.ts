import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getSession, hashPassword, requireRole, AuthError } from '@/lib/auth';
import { assertOwnsAgency, getSessionScope } from '@/lib/scoping';
import { bad, handleError } from '@/lib/api';
import { logAudit } from '@/lib/audit';
import { canEditRole, isLastSuperAdmin } from '@/lib/team-rules';

const updateSchema = z.object({
  name: z.string().trim().min(2, 'Le nom est trop court.').max(120).optional(),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères.').max(200).optional(),
  role: z.enum(['SUPER_ADMIN', 'COMPANY_ADMIN', 'AGENCY_ADMIN', 'STATION_MANAGER']).optional(),
  agencyId: z.string().min(1).nullable().optional(),
  stationId: z.string().min(1).nullable().optional(),
});

export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const session = await getSession();
    requireRole(session, ['SUPER_ADMIN', 'COMPANY_ADMIN', 'AGENCY_ADMIN']);

    const body = updateSchema.parse(await req.json().catch(() => ({})));
    const targetId = params.id;

    const targetUser = await prisma.user.findUnique({
      where: { id: targetId },
    });

    if (!targetUser) return bad('Utilisateur introuvable.', 404);

    if (session!.sub === targetUser.id && body.role && body.role !== targetUser.role) {
      return bad('Vous ne pouvez pas modifier votre propre rôle.', 403);
    }

    if (!canEditRole(session!.role, targetUser.role, body.role)) {
      return bad("Vous n'avez pas le droit de modifier cet utilisateur ou d'assigner ce rôle.", 403);
    }

    if (targetUser.role === 'SUPER_ADMIN' && body.role && body.role !== 'SUPER_ADMIN') {
      if (await isLastSuperAdmin(targetUser.id, prisma)) {
         return bad('Impossible de rétrograder le dernier SUPER_ADMIN.', 403);
      }
    }

    if (session!.role === 'COMPANY_ADMIN') {
       if (targetUser.companyId !== (await getSessionScope(session!)).companyId) {
          return bad("Vous n'avez pas accès à cet utilisateur.", 403);
       }
    } else if (session!.role === 'AGENCY_ADMIN') {
       if (targetUser.agencyId !== (await getSessionScope(session!)).agencyId) {
          return bad("Vous n'avez pas accès à cet utilisateur.", 403);
       }
    }

    let companyId: string | null = targetUser.companyId;
    let agencyId: string | null = body.agencyId !== undefined ? body.agencyId : targetUser.agencyId;
    let stationId: string | null = body.stationId !== undefined ? body.stationId : targetUser.stationId;

    if (body.role || body.agencyId !== undefined || body.stationId !== undefined) {
      const newRole = body.role ?? targetUser.role;

      if (newRole === 'COMPANY_ADMIN') {
         agencyId = null;
         stationId = null;
      } else if (newRole === 'AGENCY_ADMIN' || newRole === 'STATION_MANAGER') {
        if (agencyId) {
          const agency = await prisma.agency.findUnique({
            where: { id: agencyId },
            select: { id: true, companyId: true },
          });
          if (!agency) return bad('Agence introuvable.', 404);
          await assertOwnsAgency(session!, agency.id);
          companyId = agency.companyId;

          if (newRole === 'STATION_MANAGER' && stationId) {
            const station = await prisma.station.findUnique({
              where: { id: stationId },
              select: { id: true, agencyId: true },
            });
            if (!station || station.agencyId !== agency.id) return bad("Cette gare n'appartient pas à l'agence.", 400);
          } else if (newRole === 'AGENCY_ADMIN') {
             stationId = null;
          }
        }
      }
    }

    const data: Prisma.UserUpdateInput = {};
    if (body.name) data.name = body.name;
    if (body.role) data.role = body.role;
    if (body.password) data.passwordHash = await hashPassword(body.password);
    if (body.role || body.agencyId !== undefined) {
      data.company = companyId ? { connect: { id: companyId } } : { disconnect: true };
    }
    if (body.agencyId !== undefined) {
      data.agency = agencyId ? { connect: { id: agencyId } } : { disconnect: true };
    }
    if (body.stationId !== undefined) {
      data.station = stationId ? { connect: { id: stationId } } : { disconnect: true };
    }

    const updatedUser = await prisma.user.update({
      where: { id: targetId },
      data,
      select: {
        id: true, email: true, name: true, role: true, avatar: true,
        companyId: true, agencyId: true, stationId: true, createdAt: true,
        company: { select: { name: true } },
        agency: { select: { name: true } }
      }
    });

    await logAudit(
      {
        action: 'user.update',
        entityType: 'User',
        entityId: updatedUser.id,
        metadata: {
           email: updatedUser.email,
           name: updatedUser.name,
           role: updatedUser.role,
           companyId: updatedUser.companyId,
           agencyId: updatedUser.agencyId,
           stationId: updatedUser.stationId,
           passwordReset: !!body.password
        },
      },
      { session, req },
    );

    return NextResponse.json({ data: updatedUser });
  } catch (err) {
    if (err instanceof AuthError) return bad(err.message, err.status);
    return handleError(err);
  }
}

export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const session = await getSession();
    requireRole(session, ['SUPER_ADMIN', 'COMPANY_ADMIN', 'AGENCY_ADMIN']);

    const targetId = params.id;
    if (session!.sub === targetId) {
      return bad('Vous ne pouvez pas supprimer votre propre compte.', 403);
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: targetId },
    });

    if (!targetUser) return bad('Utilisateur introuvable.', 404);

    if (!canEditRole(session!.role, targetUser.role)) {
      return bad("Vous n'avez pas le droit de supprimer cet utilisateur.", 403);
    }

    if (targetUser.role === 'SUPER_ADMIN') {
      if (await isLastSuperAdmin(targetUser.id, prisma)) {
         return bad('Impossible de supprimer le dernier SUPER_ADMIN.', 403);
      }
    }

    if (session!.role === 'COMPANY_ADMIN') {
       if (targetUser.companyId !== (await getSessionScope(session!)).companyId) {
          return bad("Vous n'avez pas accès à cet utilisateur.", 403);
       }
    } else if (session!.role === 'AGENCY_ADMIN') {
       if (targetUser.agencyId !== (await getSessionScope(session!)).agencyId) {
          return bad("Vous n'avez pas accès à cet utilisateur.", 403);
       }
    }

    try {
      await prisma.user.delete({ where: { id: targetId } });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2003') {
        return bad('Ce compte est lié à des réservations ou à un historique: impossible de le supprimer.', 409);
      }
      throw err;
    }

    await logAudit(
      { action: 'user.delete', entityType: 'User', entityId: targetId, metadata: { email: targetUser.email } },
      { session, req }
    );

    return NextResponse.json({ data: { success: true } });
  } catch (err) {
    if (err instanceof AuthError) return bad(err.message, err.status);
    return handleError(err);
  }
}
