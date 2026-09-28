import { createClient } from '@supabase/supabase-js'

function responder(status: number, datos: object) {
  return Response.json(datos, { status, headers: { 'Cache-Control': 'no-store' } })
}

export default async function crearUsuario(request: Request): Promise<Response> {
  return ejecutarCreacionUsuario(request, {
    url: process.env.SUPABASE_URL,
    clave: process.env.SUPABASE_SERVICE_ROLE_KEY,
  })
}

export async function ejecutarCreacionUsuario(request: Request, configuracion: { url?: string; clave?: string }): Promise<Response> {
  if (request.method !== 'POST') return responder(405, { error: 'Método no permitido' })
  const token = request.headers.get('authorization')?.match(/^Bearer (.+)$/i)?.[1]
  if (!token) return responder(401, { error: 'Debes iniciar sesión' })

  const { url, clave } = configuracion
  if (!url || !clave) return responder(503, { error: 'Falta configurar SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en el servidor (en local: .env.local; en Netlify: variables de Functions).' })

  const admin = createClient(url, clave, { auth: { persistSession: false, autoRefreshToken: false } })
  try {
    // Verificación remota de identidad; no se confía en el rol enviado por el navegador.
    const { data: sesion, error: errorSesion } = await admin.auth.getUser(token)
    if (errorSesion) {
      if (/invalid api key/i.test(errorSesion.message)) {
        return responder(503, { error: 'Supabase ha rechazado la clave del servidor. Revisa la configuración y reinicia el servidor local.' })
      }
      if (!errorSesion.status || errorSesion.status >= 500) {
        return responder(503, { error: 'No se pudo conectar con Supabase para comprobar la sesión. Inténtalo de nuevo.' })
      }
      return responder(401, { codigo: 'SESION_INVALIDA', error: 'La sesión ha caducado o ya no es válida. Cierra sesión y vuelve a entrar.' })
    }
    if (!sesion.user) return responder(401, { codigo: 'SESION_INVALIDA', error: 'Cierra sesión y vuelve a entrar antes de crear usuarios.' })
    const { data: permisos, error: errorPermisos } = await admin.from('miembros_familia')
      .select('usuario_id').eq('usuario_id', sesion.user.id)
      .eq('rol', 'administrador').eq('activo', true).limit(1)
    if (errorPermisos) return responder(500, { error: 'No se pudieron comprobar los permisos' })
    if (!permisos?.length) return responder(403, { error: 'Solo un administrador activo puede crear usuarios' })

    let entrada: Record<string, unknown>
    try {
      const body: unknown = await request.json()
      if (!body || typeof body !== 'object' || Array.isArray(body)) return responder(400, { error: 'Datos no válidos' })
      entrada = body as Record<string, unknown>
    } catch {
      return responder(400, { error: 'Datos no válidos' })
    }
    const { email, password, nombre, familia_id, rol } = entrada
    if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
      || typeof password !== 'string' || password.length < 8 || password.length > 128
      || typeof nombre !== 'string' || !nombre.trim() || nombre.trim().length > 150
      || typeof familia_id !== 'number' || !Number.isSafeInteger(familia_id) || familia_id <= 0
      || (rol !== 'administrador' && rol !== 'usuario')) {
      return responder(400, { error: 'Revisa el email, nombre, familia, rol y contraseña (entre 8 y 128 caracteres).' })
    }
    const { data: familia, error: errorFamilia } = await admin.from('familias').select('id').eq('id', familia_id).single()
    if (errorFamilia || !familia) return responder(400, { error: 'La familia no existe o no se pudo consultar' })

    const { data: nuevaCuenta, error: errorCuenta } = await admin.auth.admin.createUser({
      email: email.trim(), password, email_confirm: true,
    })
    if (errorCuenta || !nuevaCuenta.user) return responder(400, { error: errorCuenta?.message ?? 'No se pudo crear la cuenta' })

    const { error: errorMiembro } = await admin.from('miembros_familia').insert({
      usuario_id: nuevaCuenta.user.id, familia_id, nombre: nombre.trim(), rol, activo: true,
    })
    if (errorMiembro) {
      // Compensación: no dejar una cuenta de acceso sin familia si falla el alta del miembro.
      const { error: errorLimpieza } = await admin.auth.admin.deleteUser(nuevaCuenta.user.id)
      return responder(500, { error: errorLimpieza
        ? 'La cuenta se creó, pero no se pudo asignar a la familia ni deshacer el alta. Revisa el usuario en Supabase antes de reintentar.'
        : 'No se pudo asignar el usuario a la familia. Se ha deshecho la creación de la cuenta.' })
    }
    return responder(201, { usuario_id: nuevaCuenta.user.id })
  } catch {
    return responder(500, { error: 'No se pudo completar la creación del usuario' })
  }
}
