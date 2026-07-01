import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { ensureProfile } from '../lib/api'
import { prettyName } from '../lib/format'

interface AuthState {
  loading: boolean
  session: Session | null
  user: User | null
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<{ needsConfirmation: boolean }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<Session | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    })
    if (error) throw translateError(error.message)
  }, [])

  const signUp = useCallback(async (email: string, password: string) => {
    const clean = email.trim().toLowerCase()
    const { data, error } = await supabase.auth.signUp({
      email: clean,
      password,
      options: { data: { name: prettyName(clean) } },
    })
    if (error) throw translateError(error.message)

    // Confirmação de e-mail desativada → já vem com sessão ativa.
    if (data.session) {
      await ensureProfile(data.user!.id, clean, prettyName(clean))
      return { needsConfirmation: false }
    }

    // Tenta login imediato (funciona quando a confirmação não é exigida).
    const signInRes = await supabase.auth.signInWithPassword({ email: clean, password })
    if (!signInRes.error && signInRes.data.session) {
      await ensureProfile(signInRes.data.user!.id, clean, prettyName(clean))
      return { needsConfirmation: false }
    }
    return { needsConfirmation: true }
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
  }, [])

  const value = useMemo<AuthState>(
    () => ({ loading, session, user: session?.user ?? null, signIn, signUp, signOut }),
    [loading, session, signIn, signUp, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth precisa estar dentro de <AuthProvider>')
  return ctx
}

function translateError(message: string): Error {
  const m = message.toLowerCase()
  if (m.includes('invalid login credentials')) return new Error('E-mail ou senha incorretos.')
  if (m.includes('email not confirmed'))
    return new Error('Confirme seu e-mail antes de entrar (verifique sua caixa de entrada).')
  if (m.includes('user already registered') || m.includes('already been registered'))
    return new Error('Este e-mail já possui uma conta. Faça login.')
  if (m.includes('password should be at least'))
    return new Error('A senha deve ter ao menos 6 caracteres.')
  if (m.includes('unable to validate email') || m.includes('invalid email'))
    return new Error('Informe um e-mail válido.')
  return new Error(message)
}
