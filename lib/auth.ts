import type { UserRole } from '@/lib/session'

// Defaults usados caso as variáveis de ambiente não estejam configuradas
// (ex.: deploy sem configurar Project Settings → Environment Variables na Vercel).
const DEFAULT_EMAIL = 'adm@accoelho.com.br'
const DEFAULT_PASSWORD = '123456y@'

export function verifyCredentials(email: string, password: string): UserRole | null {
  const adminEmail = process.env.ADMIN_EMAIL || DEFAULT_EMAIL
  const adminPassword = process.env.ADMIN_PASSWORD || DEFAULT_PASSWORD
  const clientEmail = process.env.CLIENT_EMAIL || DEFAULT_EMAIL
  const clientPassword = process.env.CLIENT_PASSWORD || DEFAULT_PASSWORD

  if (email === adminEmail && password === adminPassword) return 'admin'
  if (email === clientEmail && password === clientPassword) return 'client'
  return null
}
