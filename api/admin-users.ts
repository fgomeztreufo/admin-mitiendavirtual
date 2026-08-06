import type { VercelRequest, VercelResponse } from '@vercel/node'
import { verifyAdmin, getAdminClient, handleCors } from './_lib/adminAuth.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
  if (handleCors(req, res)) return
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const auth = await verifyAdmin(req)
  if (!auth.authorized) return res.status(403).json({ error: 'Forbidden' })

  const sb = getAdminClient()
  const { id, search, plan, page = '1', limit = '20' } = req.query as Record<string, string>

  // Detail mode — single user
  if (id) {
    const [profileRes, instanceRes, telegramRes, whatsappRes, productsRes, faqsRes, leadsRes, agentPromptsRes] = await Promise.all([
      sb.from('profiles').select('*').eq('id', id).single(),
      sb.from('instances').select('*').eq('user_id', id),
      sb.from('telegram_link_tokens').select('*').eq('user_id', id).eq('used', true),
      sb.from('whatsapp_connections').select('*').eq('user_id', id),
      sb.from('products').select('id, name, price, category, created_at').eq('user_id', id).order('created_at', { ascending: false }).limit(10),
      sb.from('faqs').select('id', { count: 'exact', head: true }).eq('user_id', id),
      sb.from('leads').select('id, sistema, status, created_at').eq('user_id', id).order('created_at', { ascending: false }).limit(20),
      sb.from('agent_prompts').select('channel, is_active, created_at').eq('user_id', id),
    ])

    return res.status(200).json({
      profile: profileRes.data,
      instances: instanceRes.data || [],
      telegram: telegramRes.data || [],
      whatsapp: whatsappRes.data || [],
      recentProducts: productsRes.data || [],
      faqsCount: faqsRes.count || 0,
      leads: leadsRes.data || [],
      agentPrompts: agentPromptsRes.data || [],
    })
  }

  // List mode
  let query = sb.from('profiles')
    .select('id, email, plan_type, ai_credits_used, messages_used, messages_used_tl, messages_used_wpp, current_products, trial_plan, trial_ends_at, created_at, business_type', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (search) {
    query = query.ilike('email', `%${search}%`)
  }
  if (plan) {
    query = query.eq('plan_type', plan)
  }

  const pageNum = parseInt(page) || 1
  const limitNum = Math.min(parseInt(limit) || 20, 100)
  const from = (pageNum - 1) * limitNum
  query = query.range(from, from + limitNum - 1)

  const { data: users, count, error } = await query

  if (error) return res.status(500).json({ error: error.message })

  // Get connection status for listed users
  const userIds = (users || []).map(u => u.id)

  const [instancesRes, telegramRes, whatsappRes] = await Promise.all([
    userIds.length > 0 ? sb.from('instances').select('user_id').in('user_id', userIds) : { data: [] },
    userIds.length > 0 ? sb.from('telegram_link_tokens').select('user_id').in('user_id', userIds).eq('used', true) : { data: [] },
    userIds.length > 0 ? sb.from('whatsapp_connections').select('user_id').in('user_id', userIds).eq('active', true) : { data: [] },
  ])

  const igUsers = new Set((instancesRes.data || []).map(i => i.user_id))
  const tgUsers = new Set((telegramRes.data || []).map(t => t.user_id))
  const wppUsers = new Set((whatsappRes.data || []).map(w => w.user_id))

  const enriched = (users || []).map(u => ({
    ...u,
    hasInstagram: igUsers.has(u.id),
    hasTelegram: tgUsers.has(u.id),
    hasWhatsapp: wppUsers.has(u.id),
  }))

  res.status(200).json({
    users: enriched,
    total: count || 0,
    page: pageNum,
    limit: limitNum,
  })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return res.status(500).json({ error: 'Internal server error', message })
  }
}
