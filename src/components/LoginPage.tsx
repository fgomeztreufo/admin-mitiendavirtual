import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { supabase } from '../supabaseClient'
import { motion } from 'framer-motion'
import { Shield } from 'lucide-react'

export default function LoginPage() {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#050505]">
      {/* Glow orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/8 rounded-full blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        <div className="bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mb-4">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
            <p className="text-zinc-500 text-sm mt-1">MiTiendaVirtual.cl</p>
          </div>

          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: '#6366f1',
                    brandAccent: '#4f46e5',
                    inputBackground: 'rgba(255,255,255,0.04)',
                    inputText: '#e5e7eb',
                    inputBorder: 'rgba(255,255,255,0.1)',
                    inputBorderFocus: '#6366f1',
                    inputBorderHover: 'rgba(255,255,255,0.15)',
                    inputPlaceholder: '#4b5563',
                  },
                  radii: {
                    borderRadiusButton: '0.75rem',
                    inputBorderRadius: '0.75rem',
                  },
                },
              },
              className: {
                button: 'font-semibold',
                input: 'text-sm',
                label: 'text-zinc-400 text-sm',
              },
            }}
            providers={[]}
            view="sign_in"
            showLinks={false}
            localization={{
              variables: {
                sign_in: {
                  email_label: 'Correo electrónico',
                  password_label: 'Contraseña',
                  email_input_placeholder: 'admin@mitiendavirtual.cl',
                  password_input_placeholder: 'Tu contraseña',
                  button_label: 'Iniciar sesión',
                  loading_button_label: 'Verificando...',
                },
              },
            }}
          />
        </div>

        <p className="text-center text-zinc-700 text-xs mt-6">
          Acceso restringido a administradores
        </p>
      </motion.div>
    </div>
  )
}
