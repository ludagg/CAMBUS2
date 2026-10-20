import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { Prisma } from '@prisma/client'
import { AuthError } from './auth'

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ data }, init)
}

export function bad(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

export function handleError(err: unknown) {
  if (err instanceof AuthError) {
    return bad(err.message, err.status)
  }
  if (err instanceof ZodError) {
    return NextResponse.json(
      { error: 'ValidationError', issues: err.issues },
      { status: 422 },
    )
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') return bad('Cet élément existe déjà.', 409)
    if (err.code === 'P2025') return bad('Ressource introuvable.', 404)
    if (err.code === 'P2003') return bad('Opération impossible: des éléments liés existent.', 409)
  }
  console.error('API error:', err)
  return bad('Erreur interne', 500)
}
