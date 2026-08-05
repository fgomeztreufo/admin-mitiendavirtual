import { createClient } from '@supabase/supabase-js'
import type { VercelRequest, VercelResponse } from '@vercel/node'

const SUPABASE_URL = process.env.SUPABASE_URL || ''
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const ADMIN_EMAILS = [
  'test@mitiendavirtual.cl',
]

const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'https://admin.mitiendavirtual.cl',
  'https://admin-mitiendavirtual.vercel.app',
]

export function getAdminClient() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  })
}

export async function verifyAdmin(req: VercelRequest): Promise<{ authorized: boolean; email?: string }> {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return { authorized: false }

  const sb = getAdminClient()
  const { data: { user }, error } = await sb.auth.getUser(token)
  if (error || !user?.email) return { authorized: false }
  if (!ADMIN_EMAILS.includes(user.email.toLowerCase())) return { authorized: false }

  return { authorized: true, email: user.email }
}

export function handleCors(req: VercelRequest, res: VercelResponse): boolean {
  const origin = req.headers.origin || ''
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type')

  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return true
  }
  return false
}
