import { useAdminFetch } from '../hooks/useAdminFetch'
import { formatDate, formatNumber } from '../utils/formatters'
import { motion } from 'framer-motion'
import { Instagram, Send, Phone, Zap, Package, HelpCircle, Users, Bot } from 'lucide-react'

interface UserDetail {
  profile: {
    id: string
    email: string
    plan_type: string
    ai_credits_used: number
    messages_used: number
    messages_used_tl: number
    messages_used_wpp: number
    current_products: number
    trial_plan: string | null
    trial_ends_at: string | null
    created_at: string
    business_type: string | null
    plan_expires_at: string | null
    bonus_credits: number
  }
  instances: { provider_id: string; created_at: string }[]
  telegram: { telegram_username: string; created_at: string }[]
  whatsapp: { display_phone_number: string; phone_number_id: string; active: boolean }[]
  recentProducts: { id: string; name: string; price: number; category: string; created_at: string }[]
  faqsCount: number
  leads: { id: string; sistema: string; status: string; created_at: string }[]
  agentPrompts: { channel: string; is_active: boolean; created_at: string }[]
}

const PLAN_LABELS: Record<string, string> = {
  inicial: 'Inicial', pyme: 'Pyme', pro: 'Pro', escala: 'Escala', free: 'Semilla',
}

export default function UserDetailView({ userId }: { userId: string }) {
  const { data, loading } = useAdminFetch<UserDetail>(`/api/admin-users?id=${userId}`)

  if (loading || !data?.profile) {
    return (
      <div className="p-6 md:p-10 flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const { profile: p } = data
  const isInTrial = p.trial_plan && p.trial_ends_at && new Date(p.trial_ends_at) > new Date()

  const leadsByChannel: Record<string, number> = {}
  for (const l of data.leads) {
    leadsByChannel[l.sistema] = (leadsByChannel[l.sistema] || 0) + 1
  }

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex flex-wrap items-center gap-3 mb-2">
          <h1 className="text-xl font-bold text-white">{p.email}</h1>
          <span className="px-2.5 py-0.5 text-[10px] font-bold bg-indigo-500/15 text-indigo-400 rounded-full border border-indigo-500/20">
            {PLAN_LABELS[p.plan_type] || p.plan_type}
          </span>
          {isInTrial && (
            <span className="px-2 py-0.5 text-[9px] font-bold bg-amber-500/15 text-amber-400 rounded-full border border-amber-500/20">
              TRIAL hasta {formatDate(p.trial_ends_at!)}
            </span>
          )}
        </div>
        <p className="text-zinc-600 text-xs">
          Registrado el {formatDate(p.created_at)}
          {p.business_type && <span className="ml-2 capitalize">· {p.business_type}</span>}
        </p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <StatCard icon={Zap} label="Créditos IA" value={formatNumber(p.ai_credits_used || 0)} color="text-purple-400" />
        <StatCard icon={Package} label="Productos" value={formatNumber(p.current_products || 0)} color="text-blue-400" />
        <StatCard icon={HelpCircle} label="FAQs" value={formatNumber(data.faqsCount)} color="text-cyan-400" />
        <StatCard icon={Users} label="Leads" value={formatNumber(data.leads.length)} color="text-emerald-400" />
      </div>

      {/* Messages breakdown */}
      <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-5 mb-6">
        <h2 className="text-sm font-semibold text-white mb-4">Mensajes por Canal</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <Instagram className="w-5 h-5 text-pink-400 mx-auto mb-1" />
            <p className="text-lg font-bold text-white">{p.messages_used || 0}</p>
            <p className="text-[10px] text-zinc-600">Instagram</p>
          </div>
          <div className="text-center">
            <Send className="w-5 h-5 text-sky-400 mx-auto mb-1" />
            <p className="text-lg font-bold text-white">{p.messages_used_tl || 0}</p>
            <p className="text-[10px] text-zinc-600">Telegram</p>
          </div>
          <div className="text-center">
            <Phone className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
            <p className="text-lg font-bold text-white">{p.messages_used_wpp || 0}</p>
            <p className="text-[10px] text-zinc-600">WhatsApp</p>
          </div>
        </div>
      </div>

      {/* Channels connected */}
      <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-5 mb-6">
        <h2 className="text-sm font-semibold text-white mb-4">Canales Conectados</h2>
        <div className="space-y-3">
          <ChannelRow
            icon={<Instagram className="w-4 h-4 text-pink-400" />}
            label="Instagram"
            connected={data.instances.length > 0}
            detail={data.instances[0]?.provider_id}
          />
          <ChannelRow
            icon={<Send className="w-4 h-4 text-sky-400" />}
            label="Telegram"
            connected={data.telegram.length > 0}
            detail={data.telegram[0]?.telegram_username ? `@${data.telegram[0].telegram_username}` : undefined}
          />
          <ChannelRow
            icon={<Phone className="w-4 h-4 text-emerald-400" />}
            label="WhatsApp"
            connected={data.whatsapp.length > 0}
            detail={data.whatsapp[0]?.display_phone_number}
          />
        </div>
      </div>

      {/* Agent prompts */}
      {data.agentPrompts.length > 0 && (
        <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-5 mb-6">
          <h2 className="text-sm font-semibold text-white mb-4">Agentes IA Configurados</h2>
          <div className="flex flex-wrap gap-2">
            {data.agentPrompts.map((ap, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.03] border border-white/5 rounded-xl text-xs">
                <Bot className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-zinc-300 capitalize">{ap.channel}</span>
                <span className={`w-1.5 h-1.5 rounded-full ${ap.is_active ? 'bg-emerald-400' : 'bg-zinc-700'}`} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Leads by channel */}
      {data.leads.length > 0 && (
        <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-5 mb-6">
          <h2 className="text-sm font-semibold text-white mb-4">Leads Recientes</h2>
          <div className="flex gap-4 mb-4 text-xs text-zinc-500">
            {Object.entries(leadsByChannel).map(([ch, count]) => (
              <span key={ch} className="capitalize">{ch}: <strong className="text-zinc-300">{count}</strong></span>
            ))}
          </div>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {data.leads.slice(0, 10).map(l => (
              <div key={l.id} className="flex items-center gap-3 text-xs py-1.5">
                <span className="text-zinc-600 w-20">{formatDate(l.created_at)}</span>
                <span className="capitalize text-zinc-400">{l.sistema}</span>
                <span className={`ml-auto px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  l.status === 'completado' ? 'bg-emerald-500/15 text-emerald-400' :
                  l.status === 'cotizando' ? 'bg-amber-500/15 text-amber-400' :
                  'bg-zinc-500/15 text-zinc-400'
                }`}>
                  {l.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color }: { icon: typeof Zap; label: string; value: string; color: string }) {
  return (
    <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4">
      <Icon className={`w-4 h-4 ${color} mb-2`} />
      <p className="text-lg font-bold text-white">{value}</p>
      <p className="text-[10px] text-zinc-600 uppercase tracking-wider">{label}</p>
    </div>
  )
}

function ChannelRow({ icon, label, connected, detail }: { icon: React.ReactNode; label: string; connected: boolean; detail?: string }) {
  return (
    <div className="flex items-center gap-3 py-1">
      {icon}
      <span className="text-sm text-zinc-300">{label}</span>
      <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full ${
        connected ? 'bg-emerald-500/15 text-emerald-400' : 'bg-zinc-800 text-zinc-600'
      }`}>
        {connected ? 'Conectado' : 'No conectado'}
      </span>
      {detail && <span className="text-[10px] text-zinc-600 font-mono">{detail}</span>}
    </div>
  )
}
