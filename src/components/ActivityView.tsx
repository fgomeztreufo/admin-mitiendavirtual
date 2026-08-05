import { Session } from '@supabase/supabase-js'
import { useAdminFetch } from '../hooks/useAdminFetch'
import { formatNumber } from '../utils/formatters'
import { motion } from 'framer-motion'
import { MessageSquare, AlertTriangle, Instagram, Send, Phone } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface Stats {
  totalUsers: number
  usersByPlan: Record<string, number>
  totalAiCredits: number
  messagesByChannel: { instagram: number; telegram: number; whatsapp: number }
  totalMessages: number
  totalLeads: number
  leadsByChannel: Record<string, number>
  plans: { code: string; display_name: string; messages_limit: number }[]
}

const CHANNEL_COLORS = {
  instagram: '#e879f9',
  telegram: '#38bdf8',
  whatsapp: '#34d399',
}

export default function ActivityView({ session: _session }: { session: Session }) {
  const { data: stats, loading } = useAdminFetch<Stats>('/api/admin-stats')

  if (loading || !stats) {
    return (
      <div className="p-6 md:p-10">
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white/[0.03] border border-white/5 rounded-2xl h-40 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  const channelData = [
    { name: 'Instagram', value: stats.messagesByChannel.instagram, fill: CHANNEL_COLORS.instagram, icon: Instagram },
    { name: 'Telegram', value: stats.messagesByChannel.telegram, fill: CHANNEL_COLORS.telegram, icon: Send },
    { name: 'WhatsApp', value: stats.messagesByChannel.whatsapp, fill: CHANNEL_COLORS.whatsapp, icon: Phone },
  ]

  const leadsData = Object.entries(stats.leadsByChannel || {}).map(([ch, count]) => ({
    name: ch.charAt(0).toUpperCase() + ch.slice(1),
    value: count,
    fill: CHANNEL_COLORS[ch as keyof typeof CHANNEL_COLORS] || '#6b7280',
  }))

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-2xl font-bold text-white">Actividad</h1>
        <p className="text-zinc-500 text-sm mt-1">Mensajes, créditos y leads</p>
      </motion.div>

      {/* Messages overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Total messages */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/[0.03] border border-white/5 rounded-2xl p-6"
        >
          <div className="flex items-center gap-2 mb-6">
            <MessageSquare className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-semibold text-white">Mensajes por Canal</h2>
            <span className="ml-auto text-xs text-zinc-600">Total: {formatNumber(stats.totalMessages)}</span>
          </div>

          <div className="space-y-4 mb-6">
            {channelData.map(ch => {
              const pct = stats.totalMessages > 0 ? (ch.value / stats.totalMessages) * 100 : 0
              return (
                <div key={ch.name}>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <div className="flex items-center gap-2">
                      <ch.icon className="w-3.5 h-3.5" style={{ color: ch.fill }} />
                      <span className="text-zinc-400">{ch.name}</span>
                    </div>
                    <span className="text-white font-mono font-bold">{formatNumber(ch.value)}</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/[0.03] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, background: ch.fill }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>

        {/* AI Credits */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/[0.03] border border-white/5 rounded-2xl p-6"
        >
          <div className="flex items-center gap-2 mb-6">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-semibold text-white">Créditos IA</h2>
          </div>

          <div className="text-center py-4">
            <p className="text-4xl font-bold text-white mb-2">{formatNumber(stats.totalAiCredits)}</p>
            <p className="text-xs text-zinc-500 uppercase tracking-wider">Créditos consumidos en total</p>
          </div>

          <div className="mt-4 pt-4 border-t border-white/5">
            <p className="text-[10px] text-zinc-600 uppercase tracking-widest mb-3">Distribución por plan</p>
            <div className="space-y-2">
              {Object.entries(stats.usersByPlan).map(([plan, count]) => (
                <div key={plan} className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400 capitalize">{plan}</span>
                  <span className="text-zinc-300 font-bold">{count} usuarios</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Leads */}
      {leadsData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/[0.03] border border-white/5 rounded-2xl p-6"
        >
          <h2 className="text-sm font-semibold text-white mb-4">Leads por Canal</h2>
          <div className="flex items-center gap-6 mb-4 text-xs text-zinc-500">
            <span>Total: <strong className="text-white">{formatNumber(stats.totalLeads)}</strong></span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={leadsData} barSize={40}>
              <XAxis dataKey="name" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.75rem', fontSize: '12px' }}
                itemStyle={{ color: '#e5e7eb' }}
                cursor={{ fill: 'rgba(255,255,255,0.02)' }}
              />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {leadsData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}
    </div>
  )
}
