import { useState, useEffect, lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Session } from '@supabase/supabase-js'
import { supabase } from './supabaseClient'
import { isAdminEmail } from './config/adminEmails'
import LoginPage from './components/LoginPage'
import Swal from 'sweetalert2'

const AdminDashboard = lazy(() => import('./components/AdminDashboard'))

function LazyFallback() {
  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && !isAdminEmail(session.user.email)) {
        supabase.auth.signOut()
        Swal.fire({
          icon: 'error',
          title: 'Acceso denegado',
          text: 'Solo administradores autorizados pueden acceder.',
        })
        setSession(null)
      } else {
        setSession(session)
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session && !isAdminEmail(session.user.email)) {
        supabase.auth.signOut()
        Swal.fire({
          icon: 'error',
          title: 'Acceso denegado',
          text: 'Solo administradores autorizados pueden acceder.',
        })
        setSession(null)
        return
      }
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) return <LazyFallback />

  return (
    <Suspense fallback={<LazyFallback />}>
      <Routes>
        <Route
          path="/login"
          element={session ? <Navigate to="/dashboard" replace /> : <LoginPage />}
        />
        <Route
          path="/dashboard"
          element={session ? <AdminDashboard session={session} /> : <Navigate to="/login" replace />}
        />
        <Route path="*" element={<Navigate to={session ? '/dashboard' : '/login'} replace />} />
      </Routes>
    </Suspense>
  )
}
