import { useState, useEffect, useCallback } from 'react'
import { Session } from '@supabase/supabase-js'
import { supabase } from '../supabaseClient'
import { formatDate } from '../utils/formatters'
import { motion } from 'framer-motion'
import { Search, ChevronLeft, ChevronRight, Instagram, Send, Phone, ArrowLeft, Trash2 } from 'lucide-react'
import Swal from 'sweetalert2'
import UserDetailView from './UserDetailView'

interface User {
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
  hasInstagram: boolean
  hasTelegram: boolean
  hasWhatsapp: boolean
}

interface UsersResponse {
  users: User[]
  total: number
  page: number
  limit: number
}

const PLAN_BADGE: Record<string, { label: string; class: string }> = {
  inicial: { label: 'Inicial', class: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/20' },
  pyme: { label: 'Pyme', class: 'bg-blue-500/15 text-blue-400 border-blue-500/20' },
  pro: { label: 'Pro', class: 'bg-purple-500/15 text-purple-400 border-purple-500/20' },
  escala: { label: 'Escala', class: 'bg-amber-500/15 text-amber-400 border-amber-500/20' },
  free: { label: 'Semilla', class: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/20' },
}

export default function UsersView({ session: _session }: { session: Session }) {
  const [users, setUsers] = useState<User[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [planFilter, setPlanFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)

  async function getToken() {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token
  }

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const params = new URLSearchParams({ page: String(page), limit: '20' })
    if (search) params.set('search', search)
    if (planFilter) params.set('plan', planFilter)

    const res = await fetch(`/api/admin-users?${params}`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
    if (res.ok) {
      const data: UsersResponse = await res.json()
      setUsers(data.users)
      setTotal(data.total)
    }
    setLoading(false)
  }, [page, search, planFilter])

  useEffect(() => {
    const timer = setTimeout(fetchUsers, search ? 300 : 0)
    return () => clearTimeout(timer)
  }, [fetchUsers, search])

  async function handleDelete(user: User) {
    const result = await Swal.fire({
      title: '¿Eliminar usuario?',
      html: `<p style="color:#a1a1aa;">Se eliminará permanentemente a <strong style="color:#e4e4e7;">${user.email}</strong> y todos sus datos asociados.</p>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#ef4444',
      background: '#111118',
      color: '#e4e4e7',
    })

    if (!result.isConfirmed) return

    const token = await getToken()
    if (!token) return

    const res = await fetch(`/api/admin-users?id=${user.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })

    if (res.ok) {
      Swal.fire({
        icon: 'success',
        title: 'Eliminado',
        text: 'El usuario fue eliminado correctamente.',
        timer: 1500,
        showConfirmButton: false,
        background: '#111118',
        color: '#e4e4e7',
      })
      fetchUsers()
    } else {
      const err = await res.json()
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.error || 'No se pudo eliminar el usuario.',
        background: '#111118',
        color: '#e4e4e7',
      })
    }
  }

  if (selectedUserId) {
    return (
      <div>
        <div className="p-6 md:p-10">
          <button
            onClick={() => setSelectedUserId(null)}
            className="flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a usuarios
          </button>
        </div>
        <UserDetailView userId={selectedUserId} />
      </div>
    )
  }

  const totalPages = Math.ceil(total / 20)

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl font-bold text-white">Usuarios</h1>
        <p className="text-zinc-500 text-sm mt-1">{total} usuarios registrados</p>
      </motion.div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
          <input
            type="text"
            placeholder="Buscar por email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-zinc-300 placeholder-zinc-600 outline-none focus:border-indigo-500/50"
          />
        </div>
        <select
          value={planFilter}
          onChange={(e) => { setPlanFilter(e.target.value); setPage(1) }}
          className="bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-zinc-300 outline-none focus:border-indigo-500/50"
        >
          <option value="">Todos los planes</option>
          <option value="inicial">Inicial</option>
          <option value="pyme">Pyme</option>
          <option value="pro">Pro</option>
          <option value="escala">Escala</option>
          <option value="free">Semilla</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden overflow-x-auto">
        <table className="w-full text-left min-w-[800px]">
          <thead>
            <tr className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
              <th className="px-5 py-4 border-b border-white/5">Email</th>
              <th className="px-5 py-4 border-b border-white/5">Plan</th>
              <th className="px-5 py-4 border-b border-white/5 text-center">Créditos IA</th>
              <th className="px-5 py-4 border-b border-white/5 text-center">Productos</th>
              <th className="px-5 py-4 border-b border-white/5 text-center">Canales</th>
              <th className="px-5 py-4 border-b border-white/5">Registro</th>
              <th className="px-5 py-4 border-b border-white/5 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.03]">
            {loading && (
              <tr>
                <td colSpan={7} className="px-5 py-16 text-center">
                  <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
                </td>
              </tr>
            )}
            {!loading && users.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-16 text-center text-zinc-700 italic">
                  No se encontraron usuarios
                </td>
              </tr>
            )}
            {!loading && users.map(user => {
              const badge = PLAN_BADGE[user.plan_type] || PLAN_BADGE.free
              return (
                <tr
                  key={user.id}
                  onClick={() => setSelectedUserId(user.id)}
                  className="hover:bg-white/[0.02] cursor-pointer transition-colors"
                >
                  <td className="px-5 py-3.5">
                    <p className="text-sm text-zinc-200 font-medium">{user.email}</p>
                    {user.business_type && (
                      <p className="text-[10px] text-zinc-600 capitalize">{user.business_type}</p>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-block px-2.5 py-0.5 text-[10px] font-bold rounded-full border ${badge.class}`}>
                      {badge.label}
                    </span>
                    {user.trial_plan && user.trial_ends_at && new Date(user.trial_ends_at) > new Date() && (
                      <span className="ml-1.5 px-1.5 py-0.5 text-[9px] font-bold bg-amber-500/15 text-amber-400 rounded-full border border-amber-500/20">
                        TRIAL
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-center text-sm font-mono text-zinc-400">
                    {user.ai_credits_used || 0}
                  </td>
                  <td className="px-5 py-3.5 text-center text-sm font-mono text-zinc-400">
                    {user.current_products || 0}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-center gap-1.5">
                      <Instagram className={`w-3.5 h-3.5 ${user.hasInstagram ? 'text-pink-400' : 'text-zinc-800'}`} />
                      <Send className={`w-3.5 h-3.5 ${user.hasTelegram ? 'text-sky-400' : 'text-zinc-800'}`} />
                      <Phone className={`w-3.5 h-3.5 ${user.hasWhatsapp ? 'text-emerald-400' : 'text-zinc-800'}`} />
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-zinc-600">{formatDate(user.created_at)}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-center">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(user) }}
                        className="p-2 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-all"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm">
          <span className="text-zinc-600">
            Página {page} de {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg bg-white/[0.03] border border-white/5 text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg bg-white/[0.03] border border-white/5 text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
