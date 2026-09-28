import type { AuthChangeEvent, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

export function obtenerSesion() {
  return supabase.auth.getSession()
}

export function escucharSesion(callback: (event: AuthChangeEvent, session: Session | null) => void) {
  return supabase.auth.onAuthStateChange(callback)
}

export function autenticar(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password })
}

export function finalizarSesion() {
  return supabase.auth.signOut()
}
