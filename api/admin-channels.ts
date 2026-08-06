import type { VercelRequest, VercelResponse } from '@vercel/node'
import { verifyAdmin, getAdminClient, handleCors } from './_lib/adminAuth'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
  if (handleCors(req, res)) return
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const auth = await verifyAdmin(req)
  if (!auth.authorized) return res.status(403).json({ error: 'Forbidden' })

  const sb = getAdminClient()

  const [instancesRes, telegramRes, whatsappRes, profilesRes] = await Promise.all([
    sb.from('instances').select('user_id, provider_id, created_at'),
    sb.from('telegram_link_tokens').select('user_id, telegram_username, created_at').eq('used', true),
    sb.from('whatsapp_connections').select('user_id, display_phone_number, phone_number_id, created_at').eq('active', true),
    sb.from('profiles').select('id, email'),
  ])

  const emailMap = new Map((profilesRes.data || []).map(p => [p.id, p.email]))

  const instagram = (instancesRes.data || []).map(i => ({
    userId: i.user_id,
    email: emailMap.get(i.user_id) || '',
    providerId: i.provider_id,
    connectedAt: i.created_at,
  }))

  const telegramUsers = new Map<string, { userId: string; email: string; username: string; connectedAt: string }>()
  for (const t of telegramRes.data || []) {
    if (!telegramUsers.has(t.user_id)) {
      telegramUsers.set(t.user_id, {
        userId: t.user_id,
        email: emailMap.get(t.user_id) || '',
        username: t.telegram_username || '',
        connectedAt: t.created_at,
      })
    }
  }

  const whatsapp = (whatsappRes.data || []).map(w => ({
    userId: w.user_id,
    email: emailMap.get(w.user_id) || '',
    phoneNumber: w.display_phone_number,
    phoneNumberId: w.phone_number_id,
    connectedAt: w.created_at,
  }))

  res.status(200).json({
    instagram: {
      count: instagram.length,
      users: instagram,
    },
    telegram: {
      count: telegramUsers.size,
      users: Array.from(telegramUsers.values()),
    },
    whatsapp: {
      count: whatsapp.length,
      users: whatsapp,
    },
  })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return res.status(500).json({ error: 'Internal server error', message })
  }
}
