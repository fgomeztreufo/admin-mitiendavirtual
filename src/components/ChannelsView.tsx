import { Session } from '@supabase/supabase-js'
import { useAdminFetch } from '../hooks/useAdminFetch'
import { formatDate } from '../utils/formatters'
import { motion } from 'framer-motion'
import { Instagram, Send, Phone } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface ChannelUser {
  userId: string
  email: string
  connectedAt: string
}

interface ChannelsData {
  instagram: { count: number; users: (ChannelUser & { providerId: string })[] }
  telegram: { count: number; users: (ChannelUser & { username: string })[] }
  whatsapp: { count: number; users: (ChannelUser & { phoneNumber: string })[] }
}

const CHANNEL_CONFIG = [
  { key: 'instagram' as const, label: 'Instagram', icon: Instagram, color: '#e879f9', bg: 'from-pink-500/20 to-fuchsia-500/10' },
  { key: 'telegram' as const, label: 'Telegram', icon: Send, color: '#38bdf8', bg: 'from-sky-500/20 to-cyan-500/10' },
  { key: 'whatsapp' as const, label: 'WhatsApp', icon: Phone, color: '#34d399', bg: 'from-emerald-500/20 to-green-500/10' },
]

export default function ChannelsView({ session: _session }: { session: Session }) {
  const { data, loading } = useAdminFetch<ChannelsData>('/api/admin-channels')

  if (loading || !data) {
    return (
      <div className="p-6 md:p-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white/[0.03] border border-white/5 rounded-2xl h-32 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  const chartData = CHANNEL_CONFIG.map(ch => ({
    name: ch.label,
    value: data[ch.key].count,
    fill: ch.color,
  }))

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-2xl font-bold text-white">Canales</h1>
        <p className="text-zinc-500 text-sm mt-1">Conexiones activas por canal</p>
      </motion.div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {CHANNEL_CONFIG.map((ch, i) => (
          <motion.div
            key={ch.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`bg-gradient-to-br ${ch.bg} border border-white/5 rounded-2xl p-5`}
          >
            <ch.icon className="w-6 h-6 mb-3" style={{ color: ch.color }} />
            <p className="text-3xl font-bold text-white">{data[ch.key].count}</p>
            <p className="text-xs text-zinc-500 mt-1">{ch.label} conectados</p>
          </motion.div>
        ))}
      </div>

      {/* Adoption chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white/[0.03] border border-white/5 rounded-2xl p-6 mb-8"
      >
        <h2 className="text-sm font-semibold text-white mb-4">Adopción de Canales</h2>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={chartData} layout="vertical" barSize={24}>
            <XAxis type="number" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="name" tick={{ fill: '#a1a1aa', fontSize: 12 }} axisLine={false} tickLine={false} width={80} />
            <Tooltip
              contentStyle={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.75rem', fontSize: '12px' }}
              itemStyle={{ color: '#e5e7eb' }}
            />
            <Bar dataKey="value" radius={[0, 8, 8, 0]}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Users by channel */}
      {CHANNEL_CONFIG.map(ch => {
        const channelData = data[ch.key]
        if (channelData.count === 0) return null

        return (
          <motion.div
            key={ch.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/[0.03] border border-white/5 rounded-2xl p-5 mb-4"
          >
            <div className="flex items-center gap-2 mb-4">
              <ch.icon className="w-4 h-4" style={{ color: ch.color }} />
              <h2 className="text-sm font-semibold text-white">{ch.label}</h2>
              <span className="text-[10px] text-zinc-600 ml-auto">{channelData.count} conexiones</span>
            </div>
            <div className="space-y-1.5 max-h-60 overflow-y-auto">
              {channelData.users.map((u: ChannelUser, i: number) => (
                <div key={i} className="flex items-center gap-3 text-xs py-1.5 border-b border-white/[0.02] last:border-0">
                  <span className="text-zinc-300 flex-1 truncate">{u.email}</span>
                  <span className="text-zinc-600">{formatDate(u.connectedAt)}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
