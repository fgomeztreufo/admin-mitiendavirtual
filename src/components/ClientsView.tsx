import { useState, useEffect, useCallback } from 'react'
import { Session } from '@supabase/supabase-js'
import { supabase } from '../supabaseClient'
import { formatDate } from '../utils/formatters'
import { motion } from 'framer-motion'
import { Search, ChevronLeft, ChevronRight, Pencil, Trash2 } from 'lucide-react'
import Swal from 'sweetalert2'

interface Client {
  id: string
  email: string
  plan_type: string
  business_type: string | null
  ai_credits_used: number
  bonus_credits: number
  current_products: number
  messages_used: number
  messages_used_tl: number
  messages_used_wpp: number
  trial_plan: string | null
  trial_ends_at: string | null
  plan_expires_at: string | null
  created_at: string
}

interface ClientsResponse {
  clients: Client[]
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

const PLAN_OPTIONS = [
  { value: 'free', label: 'Semilla' },
  { value: 'inicial', label: 'Inicial' },
  { value: 'pyme', label: 'Pyme' },
  { value: 'pro', label: 'Pro' },
  { value: 'escala', label: 'Escala' },
]

export default function ClientsView({ session: _session }: { session: Session }) {
  const [clients, setClients] = useState<Client[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [planFilter, setPlanFilter] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchClients = useCallback(async () => {
    setLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const params = new URLSearchParams({ page: String(page), limit: '20' })
    if (search) params.set('search', search)
    if (planFilter) params.set('plan', planFilter)

    const res = await fetch(`/api/admin-clients?${params}`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
    if (res.ok) {
      const data: ClientsResponse = await res.json()
      setClients(data.clients)
      setTotal(data.total)
    }
    setLoading(false)
  }, [page, search, planFilter])

  useEffect(() => {
    const timer = setTimeout(fetchClients, search ? 300 : 0)
    return () => clearTimeout(timer)
  }, [fetchClients, search])

  async function getToken() {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token
  }

  async function handleEdit(client: Client) {
    const { value: formValues } = await Swal.fire({
      title: 'Editar Cliente',
      html: `
        <div style="text-align:left; margin-bottom: 8px;">
          <label style="display:block; font-size:12px; color:#888; margin-bottom:4px;">Email</label>
          <input class="swal2-input" value="${client.email}" disabled style="opacity:0.5; margin:0; width:100%;" />
        </div>
        <div style="text-align:left; margin-bottom: 8px;">
          <label style="display:block; font-size:12px; color:#888; margin-bottom:4px;">Plan</label>
          <select id="swal-plan" class="swal2-select" style="margin:0; width:100%;">
            ${PLAN_OPTIONS.map(p => `<option value="${p.value}" ${p.value === client.plan_type ? 'selected' : ''}>${p.label}</option>`).join('')}
          </select>
        </div>
        <div style="text-align:left; margin-bottom: 8px;">
          <label style="display:block; font-size:12px; color:#888; margin-bottom:4px;">Tipo de negocio</label>
          <input id="swal-business" class="swal2-input" value="${client.business_type || ''}" placeholder="Ej: restaurante, tienda..." style="margin:0; width:100%;" />
        </div>
        <div style="display:flex; gap:12px;">
          <div style="flex:1; text-align:left;">
            <label style="display:block; font-size:12px; color:#888; margin-bottom:4px;">Créditos IA usados</label>
            <input id="swal-credits" type="number" class="swal2-input" value="${client.ai_credits_used || 0}" min="0" style="margin:0; width:100%;" />
          </div>
          <div style="flex:1; text-align:left;">
            <label style="display:block; font-size:12px; color:#888; margin-bottom:4px;">Créditos bonus</label>
            <input id="swal-bonus" type="number" class="swal2-input" value="${client.bonus_credits || 0}" min="0" style="margin:0; width:100%;" />
          </div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Guardar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#6366f1',
      background: '#111118',
      color: '#e4e4e7',
      preConfirm: () => ({
        plan_type: (document.getElementById('swal-plan') as HTMLSelectElement).value,
        business_type: (document.getElementById('swal-business') as HTMLInputElement).value || null,
        ai_credits_used: parseInt((document.getElementById('swal-credits') as HTMLInputElement).value) || 0,
        bonus_credits: parseInt((document.getElementById('swal-bonus') as HTMLInputElement).value) || 0,
      }),
    })

    if (!formValues) return

    const token = await getToken()
    if (!token) return

    const res = await fetch('/api/admin-clients', {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id: client.id, ...formValues }),
    })

    if (res.ok) {
      Swal.fire({
        icon: 'success',
        title: 'Actualizado',
        text: 'El cliente fue actualizado correctamente.',
        timer: 1500,
        showConfirmButton: false,
        background: '#111118',
        color: '#e4e4e7',
      })
      fetchClients()
    } else {
      const err = await res.json()
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.error || 'No se pudo actualizar el cliente.',
        background: '#111118',
        color: '#e4e4e7',
      })
    }
  }

  async function handleDelete(client: Client) {
    const result = await Swal.fire({
      title: '¿Eliminar cliente?',
      html: `<p style="color:#a1a1aa;">Se eliminará permanentemente a <strong style="color:#e4e4e7;">${client.email}</strong> y todos sus datos asociados.</p>`,
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

    const res = await fetch(`/api/admin-clients?id=${client.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })

    if (res.ok) {
      Swal.fire({
        icon: 'success',
        title: 'Eliminado',
        text: 'El cliente fue eliminado correctamente.',
        timer: 1500,
        showConfirmButton: false,
        background: '#111118',
        color: '#e4e4e7',
      })
      fetchClients()
    } else {
      const err = await res.json()
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.error || 'No se pudo eliminar el cliente.',
        background: '#111118',
        color: '#e4e4e7',
      })
    }
  }

  const totalPages = Math.ceil(total / 20)

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl font-bold text-white">Gestión de Clientes</h1>
        <p className="text-zinc-500 text-sm mt-1">{total} clientes registrados</p>
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
              <th className="px-5 py-4 border-b border-white/5">Negocio</th>
              <th className="px-5 py-4 border-b border-white/5 text-center">Créditos IA</th>
              <th className="px-5 py-4 border-b border-white/5 text-center">Productos</th>
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
            {!loading && clients.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-16 text-center text-zinc-700 italic">
                  No se encontraron clientes
                </td>
              </tr>
            )}
            {!loading && clients.map(client => {
              const badge = PLAN_BADGE[client.plan_type] || PLAN_BADGE.free
              return (
                <tr key={client.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3.5">
                    <p className="text-sm text-zinc-200 font-medium">{client.email}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-block px-2.5 py-0.5 text-[10px] font-bold rounded-full border ${badge.class}`}>
                      {badge.label}
                    </span>
                    {client.trial_plan && client.trial_ends_at && new Date(client.trial_ends_at) > new Date() && (
                      <span className="ml-1.5 px-1.5 py-0.5 text-[9px] font-bold bg-amber-500/15 text-amber-400 rounded-full border border-amber-500/20">
                        TRIAL
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-sm text-zinc-500 capitalize">{client.business_type || '—'}</span>
                  </td>
                  <td className="px-5 py-3.5 text-center text-sm font-mono text-zinc-400">
                    {client.ai_credits_used || 0}
                    {(client.bonus_credits || 0) > 0 && (
                      <span className="text-[10px] text-emerald-500 ml-1">+{client.bonus_credits}</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-center text-sm font-mono text-zinc-400">
                    {client.current_products || 0}
                  </td>
                  <td className="px-5 py-3.5 text-xs text-zinc-600">{formatDate(client.created_at)}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => handleEdit(client)}
                        className="p-2 rounded-lg text-zinc-600 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all"
                        title="Editar"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(client)}
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
