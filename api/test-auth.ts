import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { getAdminClient, handleCors } = await import('./_lib/adminAuth')
    if (handleCors(req, res)) return
    const sb = getAdminClient()
    const { count } = await sb.from('profiles').select('id', { count: 'exact', head: true })
    res.status(200).json({ ok: true, count })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    const stack = err instanceof Error ? err.stack : undefined
    res.status(500).json({ ok: false, error: message, stack })
  }
}
