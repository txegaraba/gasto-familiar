import { supabase } from '../lib/supabase'
import type { CategoriaAdministracion, Familia, MiembroAdministracion, NuevoUsuario } from '../types/dominio'

async function listar<T>(consulta: (desde: number, hasta: number) => PromiseLike<{
  data: T[] | null
  error: { message: string } | null
}>): Promise<T[]> {
  const filas: T[] = []
  while (true) {
    const { data, error } = await consulta(filas.length, filas.length + 499)
    if (error) throw new Error(error.message)
    if (!data?.length) return filas
    filas.push(...data)
  }
}

export function listarFamilias() {
  return listar<Familia>((desde, hasta) => supabase.from('familias')
    .select('id, nombre').order('nombre').order('id').range(desde, hasta))
}

export function listarCategorias(familiaId: number) {
  return listar<CategoriaAdministracion>((desde, hasta) => supabase.from('categorias')
    .select('id, familia_id, nombre, orden, activa').eq('familia_id', familiaId)
    .order('orden').order('id').range(desde, hasta))
}

export function listarMiembros(familiaId: number) {
  return listar<MiembroAdministracion>((desde, hasta) => supabase.from('miembros_familia')
    .select('familia_id, usuario_id, nombre, rol, activo').eq('familia_id', familiaId)
    .order('nombre').order('usuario_id').range(desde, hasta))
}

export async function guardarFamilia(id: number | null, nombre: string) {
  const consulta = id === null
    ? supabase.from('familias').insert({ nombre })
    : supabase.from('familias').update({ nombre }).eq('id', id)
  const { data, error } = await consulta.select('id, nombre').single()
  if (error) throw new Error(error.message)
  return data as Familia
}

export async function guardarCategoria(id: number | null, familiaId: number, cambios: Pick<CategoriaAdministracion, 'nombre' | 'orden' | 'activa'>) {
  const consulta = id === null
    ? supabase.from('categorias').insert({ ...cambios, familia_id: familiaId })
    : supabase.from('categorias').update(cambios).eq('id', id).eq('familia_id', familiaId)
  const { error } = await consulta.select('id').single()
  if (error) throw new Error(error.message)
}

export async function guardarMiembro(miembro: MiembroAdministracion) {
  const { error } = await supabase.from('miembros_familia')
    .update({ nombre: miembro.nombre, rol: miembro.rol, activo: miembro.activo })
    .eq('familia_id', miembro.familia_id).eq('usuario_id', miembro.usuario_id)
    .select('usuario_id').single()
  if (error) throw new Error(error.message)
}

export async function crearUsuario(usuario: NuevoUsuario) {
  const { data, error } = await supabase.auth.getSession()
  if (error) throw new Error(error.message)
  if (!data.session) throw new Error('La sesión ha caducado. Vuelve a iniciar sesión.')
  const enviar = (token: string) => fetch('/.netlify/functions/crear-usuario', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(usuario),
  })
  let respuesta = await enviar(data.session.access_token)
  let resultado = await respuesta.json().catch(() => null)
  // Solo reintentar tras rechazo de autenticación: aún no se ha creado ninguna cuenta.
  if (respuesta.status === 401 && resultado?.codigo === 'SESION_INVALIDA') {
    const renovacion = await supabase.auth.refreshSession()
    if (renovacion.error || !renovacion.data.session) {
      throw new Error('No se pudo renovar la sesión. Cierra sesión y vuelve a entrar.')
    }
    respuesta = await enviar(renovacion.data.session.access_token)
    resultado = await respuesta.json().catch(() => null)
  }
  if (!resultado) {
    throw new Error(import.meta.env.DEV
      ? 'El servidor local no está ejecutando la creación de usuarios. Reinicia npm run dev.'
      : 'La función de creación de usuarios no está disponible en este despliegue de Netlify.')
  }
  if (!respuesta.ok || !resultado?.usuario_id) {
    throw new Error(resultado?.error ?? 'La creación de usuarios no está disponible. Comprueba la función de servidor en Netlify.')
  }
}
