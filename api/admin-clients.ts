import type { VercelRequest, VercelResponse } from '@vercel/node'
import { verifyAdmin, getAdminClient, handleCors } from './_lib/adminAuth.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (handleCors(req, res)) return

    const auth = await verifyAdmin(req)
    if (!auth.authorized) return res.status(403).json({ error: 'Forbidden' })

    const sb = getAdminClient()

    if (req.method === 'GET') {
      const { search, plan, page = '1', limit = '20' } = req.query as Record<string, string>

      let query = sb.from('profiles')
        .select('id, email, plan_type, business_type, ai_credits_used, bonus_credits, current_products, messages_used, messages_used_tl, messages_used_wpp, trial_plan, trial_ends_at, plan_expires_at, created_at', { count: 'exact' })
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

      const { data: clients, count, error } = await query
      if (error) return res.status(500).json({ error: error.message })

      return res.status(200).json({
        clients: clients || [],
        total: count || 0,
        page: pageNum,
        limit: limitNum,
      })
    }

    if (req.method === 'PUT') {
      const { id, plan_type, business_type, ai_credits_used, bonus_credits } = req.body

      if (!id) return res.status(400).json({ error: 'Missing client id' })

      const updates: Record<string, unknown> = {}
      if (plan_type !== undefined) updates.plan_type = plan_type
      if (business_type !== undefined) updates.business_type = business_type
      if (ai_credits_used !== undefined) updates.ai_credits_used = Number(ai_credits_used)
      if (bonus_credits !== undefined) updates.bonus_credits = Number(bonus_credits)

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: 'No fields to update' })
      }

      const { error } = await sb.from('profiles').update(updates).eq('id', id)
      if (error) return res.status(500).json({ error: error.message })

      return res.status(200).json({ success: true })
    }

    if (req.method === 'DELETE') {
      const { id } = req.query as Record<string, string>

      if (!id) return res.status(400).json({ error: 'Missing client id' })

      const { error: authError } = await sb.auth.admin.deleteUser(id)
      if (authError) return res.status(500).json({ error: authError.message })

      return res.status(200).json({ success: true })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return res.status(500).json({ error: 'Internal server error', message })
  }
}
