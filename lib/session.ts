import { SignJWT, jwtVerify, type JWTPayload } from 'jose'

export type UserRole = 'admin' | 'client'

export interface SessionPayload extends JWTPayload {
  role: UserRole
  email: string
}

export const COOKIE_NAME = 'ac_session'
export const COOKIE_MAX_AGE = 8 * 60 * 60 // 8 hours in seconds

// Fallback usado caso SESSION_SECRET não esteja configurado no ambiente
// (ex.: deploy sem configurar Project Settings → Environment Variables na Vercel).
const DEFAULT_SECRET = 'ac-coelho-dashboard-default-secret-troque-em-producao-32chars'

function getSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET || DEFAULT_SECRET
  return new TextEncoder().encode(secret)
}

export async function createSessionToken(role: UserRole, email: string): Promise<string> {
  return new SignJWT({ role, email })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('8h')
    .setIssuedAt()
    .sign(getSecret())
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    return payload as SessionPayload
  } catch {
    return null
  }
}
