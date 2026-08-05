import { useState, lazy, Suspense } from 'react'
import { Session } from '@supabase/supabase-js'
import { supabase } from '../supabaseClient'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  Users,
  Globe,
  Activity,
  Receipt,
  LogOut,
  Menu,
  X,
  Shield,
} from 'lucide-react'

const OverviewView = lazy(() => import('./OverviewView'))
const UsersView = lazy(() => import('./UsersView'))
const ChannelsView = lazy(() => import('./ChannelsView'))
const ActivityView = lazy(() => import('./ActivityView'))
const ContabilidadView = lazy(() => import('./ContabilidadView'))

type Tab = 'overview' | 'users' | 'channels' | 'activity' | 'contabilidad'

interface Props {
  session: Session
}

const NAV_ITEMS: { key: Tab; label: string; icon: typeof LayoutDashboard }[] = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard },
  { key: 'users', label: 'Usuarios', icon: Users },
  { key: 'channels', label: 'Canales', icon: Globe },
  { key: 'activity', label: 'Actividad', icon: Activity },
  { key: 'contabilidad', label: 'Contabilidad', icon: Receipt },
]

function LazyFallback() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

export default function AdminDashboard({ session }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  async function handleLogout() {
    await supabase.auth.signOut()
  }

  function renderContent() {
    switch (activeTab) {
      case 'overview':
        return <OverviewView session={session} />
      case 'users':
        return <UsersView session={session} />
      case 'channels':
        return <ChannelsView session={session} />
      case 'activity':
        return <ActivityView session={session} />
      case 'contabilidad':
        return <ContabilidadView />
      default:
        return <OverviewView session={session} />
    }
  }

  return (
    <div className="min-h-screen bg-[#050505] flex">
      {/* Sidebar — desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-[#0a0a0f]/80 backdrop-blur-md border-r border-white/5 fixed h-full z-30">
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold text-sm">MiTiendaVirtual</h1>
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Admin</span>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {NAV_ITEMS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === key
                  ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.03]'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/5">
          <p className="text-[10px] text-zinc-700 truncate mb-3 px-2">{session.user.email}</p>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-red-400/60 hover:text-red-400 hover:bg-red-500/5 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-[#0a0a0f]/95 backdrop-blur-md border-b border-white/5 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-bold text-sm">Admin</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="text-zinc-400 hover:text-white p-1"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile overlay menu */}
      {mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="lg:hidden fixed inset-0 z-30 bg-black/60 backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        >
          <motion.div
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            transition={{ type: 'spring', damping: 25 }}
            className="w-64 h-full bg-[#0a0a0f] border-r border-white/5 p-4 pt-20"
            onClick={(e) => e.stopPropagation()}
          >
            <nav className="space-y-1">
              {NAV_ITEMS.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => { setActiveTab(key); setMobileMenuOpen(false) }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    activeTab === key
                      ? 'bg-indigo-500/10 text-indigo-400'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </nav>
            <div className="mt-6 pt-4 border-t border-white/5">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-red-400/60 hover:text-red-400"
              >
                <LogOut className="w-4 h-4" />
                Cerrar sesión
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Main content */}
      <main className="flex-1 lg:ml-64 pt-14 lg:pt-0 min-h-screen">
        <Suspense fallback={<LazyFallback />}>
          {renderContent()}
        </Suspense>
      </main>
    </div>
  )
}
