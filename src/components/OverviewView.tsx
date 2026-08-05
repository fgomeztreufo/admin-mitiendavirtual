import { Session } from '@supabase/supabase-js'
import { useAdminFetch } from '../hooks/useAdminFetch'
import { formatNumber } from '../utils/formatters'
import { motion } from 'framer-motion'
import { Users, Clock, Zap, TrendingUp, Package, MessageSquare, HelpCircle, Calendar } from 'lucide-react'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

interface Stats {
  totalUsers: number
  usersByPlan: Record<string, number>
  activeTrials: number
  totalAiCredits: number
  messagesByChannel: { instagram: number; telegram: number; whatsapp: number }
  totalMessages: number
  newUsersThisWeek: number
  newUsersThisMonth: number
  totalProducts: number
  totalFaqs: number
  totalLeads: number
  totalAppointments: number
}

const PLAN_COLORS: Record<string, string> = {
  inicial: '#6366f1',
  pyme: '#3b82f6',
  pro: '#a855f7',
  escala: '#f59e0b',
  free: '#6b7280',
}

const PLAN_LABELS: Record<string, string> = {
  inicial: 'Inicial',
  pyme: 'Pyme',
  pro: 'Pro',
  escala: 'Escala',
  free: 'Semilla',
}

const CHANNEL_COLORS = {
  instagram: '#e879f9',
  telegram: '#38bdf8',
  whatsapp: '#34d399',
}

export default function OverviewView({ session: _session }: { session: Session }) {
  const { data: stats, loading } = useAdminFetch<Stats>('/api/admin-stats')

  if (loading || !stats) {
    return (
      <div className="p-6 md:p-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white/[0.03] border border-white/5 rounded-2xl p-5 h-28 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  const planData = Object.entries(stats.usersByPlan).map(([key, value]) => ({
    name: PLAN_LABELS[key] || key,
    value,
    color: PLAN_COLORS[key] || '#6b7280',
  }))

  const channelData = [
    { name: 'Instagram', value: stats.messagesByChannel.instagram, fill: CHANNEL_COLORS.instagram },
    { name: 'Telegram', value: stats.messagesByChannel.telegram, fill: CHANNEL_COLORS.telegram },
    { name: 'WhatsApp', value: stats.messagesByChannel.whatsapp, fill: CHANNEL_COLORS.whatsapp },
  ]

  const statCards = [
    { label: 'Total Usuarios', value: formatNumber(stats.totalUsers), icon: Users, color: 'from-indigo-500 to-indigo-600' },
    { label: 'Trials Activos', value: formatNumber(stats.activeTrials), icon: Clock, color: 'from-amber-500 to-orange-600' },
    { label: 'Créditos IA Usados', value: formatNumber(stats.totalAiCredits), icon: Zap, color: 'from-purple-500 to-purple-600' },
    { label: 'Nuevos Este Mes', value: formatNumber(stats.newUsersThisMonth), icon: TrendingUp, color: 'from-emerald-500 to-emerald-600' },
    { label: 'Productos', value: formatNumber(stats.totalProducts), icon: Package, color: 'from-blue-500 to-blue-600' },
    { label: 'Total Mensajes', value: formatNumber(stats.totalMessages), icon: MessageSquare, color: 'from-pink-500 to-pink-600' },
    { label: 'FAQs', value: formatNumber(stats.totalFaqs), icon: HelpCircle, color: 'from-cyan-500 to-cyan-600' },
    { label: 'Citas', value: formatNumber(stats.totalAppointments), icon: Calendar, color: 'from-rose-500 to-rose-600' },
  ]

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-2xl font-bold text-white">Overview</h1>
        <p className="text-zinc-500 text-sm mt-1">Resumen general de la plataforma</p>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {statCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white/[0.03] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-all"
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center`}>
                <card.icon className="w-4 h-4 text-white" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white tracking-tight">{card.value}</p>
            <p className="text-[11px] text-zinc-500 mt-1 uppercase tracking-wider font-medium">{card.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Users by Plan */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/[0.03] border border-white/5 rounded-2xl p-6"
        >
          <h2 className="text-sm font-semibold text-white mb-6">Usuarios por Plan</h2>
          <div className="flex items-center gap-6">
            <ResponsiveContainer width="50%" height={180}>
              <PieChart>
                <Pie
                  data={planData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {planData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.75rem', fontSize: '12px' }}
                  itemStyle={{ color: '#e5e7eb' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2">
              {planData.map(p => (
                <div key={p.name} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />
                  <span className="text-xs text-zinc-400">{p.name}</span>
                  <span className="text-xs font-bold text-white ml-auto">{p.value}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Messages by Channel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/[0.03] border border-white/5 rounded-2xl p-6"
        >
          <h2 className="text-sm font-semibold text-white mb-6">Mensajes por Canal</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={channelData} barSize={40}>
              <XAxis dataKey="name" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.75rem', fontSize: '12px' }}
                itemStyle={{ color: '#e5e7eb' }}
                cursor={{ fill: 'rgba(255,255,255,0.02)' }}
              />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {channelData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Quick stats footer */}
      <div className="mt-6 bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex flex-wrap gap-6 text-xs text-zinc-500">
        <span>Nuevos esta semana: <strong className="text-indigo-400">{stats.newUsersThisWeek}</strong></span>
        <span>Total leads: <strong className="text-emerald-400">{formatNumber(stats.totalLeads)}</strong></span>
      </div>
    </div>
  )
}
