import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
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
  console.error('API error:', err)
  const msg = err instanceof Error ? err.message : 'Erreur interne'
  return bad(msg, 500)
}
