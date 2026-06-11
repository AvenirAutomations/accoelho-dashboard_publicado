import type { UserRole } from '@/lib/session'

export function verifyCredentials(email: string, password: string): UserRole | null {
  const adminEmail = process.env.ADMIN_EMAIL
  const adminPassword = process.env.ADMIN_PASSWORD
  const clientEmail = process.env.CLIENT_EMAIL
  const clientPassword = process.env.CLIENT_PASSWORD

  if (!adminEmail || !adminPassword || !clientEmail || !clientPassword) {
    throw new Error('Variáveis de autenticação não configuradas no .env.local')
  }

  if (email === adminEmail && password === adminPassword) return 'admin'
  if (email === clientEmail && password === clientPassword) return 'client'
  return null
}
