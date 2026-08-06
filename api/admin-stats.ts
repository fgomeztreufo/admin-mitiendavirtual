import type { VercelRequest, VercelResponse } from '@vercel/node'
import { verifyAdmin, getAdminClient, handleCors } from './_lib/adminAuth.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (handleCors(req, res)) return
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

    const auth = await verifyAdmin(req)
    if (!auth.authorized) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    const sb = getAdminClient()

    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()

    const [
      profilesRes,
      productsRes,
      faqsRes,
      leadsRes,
      appointmentsRes,
      plansRes,
    ] = await Promise.all([
      sb.from('profiles').select('id, email, plan_type, ai_credits_used, messages_used, messages_used_tl, messages_used_wpp, current_products, trial_plan, trial_ends_at, created_at'),
      sb.from('products').select('id', { count: 'exact', head: true }),
      sb.from('faqs').select('id', { count: 'exact', head: true }),
      sb.from('leads').select('id, sistema', { count: 'exact' }),
      sb.from('appointments').select('id', { count: 'exact', head: true }),
      sb.from('plans').select('code, display_name, messages_limit, products_limit, monthly_price_clp'),
    ])

    const profiles = profilesRes.data || []

    const usersByPlan: Record<string, number> = {}
    let activeTrials = 0
    let totalMsgIG = 0, totalMsgTG = 0, totalMsgWPP = 0
    let totalAiCredits = 0
    let newThisWeek = 0, newThisMonth = 0

    for (const p of profiles) {
      const plan = p.plan_type || 'free'
      usersByPlan[plan] = (usersByPlan[plan] || 0) + 1

      if (p.trial_ends_at && new Date(p.trial_ends_at) > now) activeTrials++

      totalMsgIG += p.messages_used || 0
      totalMsgTG += p.messages_used_tl || 0
      totalMsgWPP += p.messages_used_wpp || 0
      totalAiCredits += p.ai_credits_used || 0

      if (p.created_at) {
        if (p.created_at >= weekAgo) newThisWeek++
        if (p.created_at >= monthAgo) newThisMonth++
      }
    }

    const leadsByChannel: Record<string, number> = {}
    if (leadsRes.data) {
      for (const l of leadsRes.data) {
        const ch = l.sistema || 'unknown'
        leadsByChannel[ch] = (leadsByChannel[ch] || 0) + 1
      }
    }

    return res.status(200).json({
      totalUsers: profiles.length,
      usersByPlan,
      activeTrials,
      totalAiCredits,
      messagesByChannel: {
        instagram: totalMsgIG,
        telegram: totalMsgTG,
        whatsapp: totalMsgWPP,
      },
      totalMessages: totalMsgIG + totalMsgTG + totalMsgWPP,
      newUsersThisWeek: newThisWeek,
      newUsersThisMonth: newThisMonth,
      totalProducts: productsRes.count || 0,
      totalFaqs: faqsRes.count || 0,
      totalLeads: leadsRes.count || 0,
      leadsByChannel,
      totalAppointments: appointmentsRes.count || 0,
      plans: plansRes.data || [],
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return res.status(500).json({ error: 'Internal server error', message })
  }
}
