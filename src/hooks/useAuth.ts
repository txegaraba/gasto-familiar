import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { obtenerSesion, escucharSesion, autenticar, finalizarSesion } from '../services/authService'

export function useAuth() {
  const [usuario, setUsuario] = useState<User | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [cargandoSesion, setCargandoSesion] = useState(true)

  useEffect(() => {
    async function comprobarSesion() {
      const { data, error } = await obtenerSesion()

      if (error) {
        console.error('Error comprobando sesión:', error)
      }

      setUsuario(data.session?.user ?? null)
      setCargandoSesion(false)
    }

    comprobarSesion()

    const {
      data: { subscription },
    } = escucharSesion((_event, session) => {
      setUsuario(session?.user ?? null)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  async function iniciarSesion() {
    const { error } = await autenticar(email, password)

    if (error) {
      alert('Error al iniciar sesión: ' + error.message)
    }
  }

  async function cerrarSesion() {
    const { error } = await finalizarSesion()

    if (error) {
      console.error('Error cerrando sesión:', error)
    }
  }

  return { usuario, email, setEmail, password, setPassword, cargandoSesion, iniciarSesion, cerrarSesion }
}
