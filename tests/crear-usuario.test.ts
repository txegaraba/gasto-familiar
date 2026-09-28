import assert from 'node:assert/strict'
import test, { type TestContext } from 'node:test'
import crearUsuario, { ejecutarCreacionUsuario } from '../netlify/functions/crear-usuario.ts'

const entrada = { email: 'nuevo@example.com', password: 'contraseña-prueba', nombre: 'Nuevo', familia_id: 2, rol: 'usuario' }
const cuenta = { id: '00000000-0000-4000-8000-000000000002', email: entrada.email, aud: 'authenticated', created_at: '2026-09-28T00:00:00Z' }

function solicitud(body: unknown = entrada) {
  return new Request('https://app.example/.netlify/functions/crear-usuario', {
    method: 'POST', headers: { Authorization: 'Bearer token-prueba', 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

type Opciones = { autorizado?: boolean; sesionValida?: boolean; falloMiembro?: boolean; falloLimpieza?: boolean; claveInvalida?: boolean; claveEsperada?: string }
function simular(t: TestContext, opciones: Opciones = {}) {
  const llamadas: { url: string; method: string; body: unknown }[] = []
  const urlAnterior = process.env.SUPABASE_URL
  const claveAnterior = process.env.SUPABASE_SERVICE_ROLE_KEY
  process.env.SUPABASE_URL = 'https://supabase.example'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'clave-simulada-solo-test'
  t.after(() => {
    if (urlAnterior === undefined) delete process.env.SUPABASE_URL
    else process.env.SUPABASE_URL = urlAnterior
    if (claveAnterior === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY
    else process.env.SUPABASE_SERVICE_ROLE_KEY = claveAnterior
  })
  t.mock.method(globalThis, 'fetch', async (url: string | URL | Request, init?: RequestInit) => {
    const direccion = String(url)
    if (opciones.claveEsperada) {
      assert.equal(new Headers(init?.headers).get('apikey'), opciones.claveEsperada)
      assert.equal(new URL(direccion).hostname, 'supabase.example')
    }
    const method = init?.method ?? 'GET'
    llamadas.push({ url: direccion, method, body: init?.body ? JSON.parse(String(init.body)) : null })
    if (direccion.endsWith('/auth/v1/user') && opciones.claveInvalida) return Response.json({ message: 'Invalid API key' }, { status: 401 })
    if (direccion.endsWith('/auth/v1/user')) return opciones.sesionValida === false
      ? Response.json({ message: 'Token inválido' }, { status: 401 })
      : Response.json({ ...cuenta, id: 'admin-id' })
    if (direccion.includes('/rest/v1/miembros_familia') && method === 'GET') {
      assert.ok(direccion.includes('rol=eq.administrador'))
      assert.ok(direccion.includes('activo=eq.true'))
      assert.ok(direccion.includes('usuario_id=eq.admin-id'))
      return Response.json(opciones.autorizado === false ? [] : [{ usuario_id: 'admin-id' }])
    }
    if (direccion.includes('/rest/v1/familias')) return Response.json({ id: 2 })
    if (direccion.endsWith('/auth/v1/admin/users') && method === 'POST') return Response.json(cuenta)
    if (direccion.includes('/rest/v1/miembros_familia') && method === 'POST') return opciones.falloMiembro
      ? Response.json({ message: 'Fallo insert' }, { status: 400 })
      : new Response(null, { status: 201 })
    if (direccion.endsWith('/auth/v1/admin/users/00000000-0000-4000-8000-000000000002') && method === 'DELETE') return opciones.falloLimpieza
      ? Response.json({ message: 'Fallo delete' }, { status: 400 })
      : Response.json(cuenta)
    throw new Error(`Petición inesperada: ${method} ${direccion}`)
  })
  return llamadas
}

test('rechaza solicitudes sin sesión y métodos no admitidos', async () => {
  assert.equal((await crearUsuario(new Request('https://app.example', { method: 'POST' }))).status, 401)
  assert.equal((await crearUsuario(new Request('https://app.example'))).status, 405)
})

test('la configuración local explícita prevalece sobre variables antiguas del proceso', async (t) => {
  simular(t, { claveEsperada: 'clave-actual' })
  process.env.SUPABASE_URL = 'https://proyecto-antiguo.example'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'clave-antigua'
  const respuesta = await ejecutarCreacionUsuario(solicitud(), {
    url: 'https://supabase.example', clave: 'clave-actual',
  })
  assert.equal(respuesta.status, 201)
})

test('rechaza un token inválido antes de consultar permisos', async (t) => {
  const llamadas = simular(t, { sesionValida: false })
  const respuesta = await crearUsuario(solicitud())
  assert.equal(respuesta.status, 401)
  assert.equal((await respuesta.json()).codigo, 'SESION_INVALIDA')
  assert.equal(llamadas.length, 1)
})

test('distingue una clave de servidor inválida de una sesión caducada', async (t) => {
  const llamadas = simular(t, { claveInvalida: true })
  const respuesta = await crearUsuario(solicitud())
  assert.equal(respuesta.status, 503)
  assert.match((await respuesta.json()).error, /clave del servidor/)
  assert.equal(llamadas.length, 1)
})

test('no permite crear usuarios a un miembro sin rol administrador activo', async (t) => {
  const llamadas = simular(t, { autorizado: false })
  assert.equal((await crearUsuario(solicitud())).status, 403)
  assert.equal(llamadas.some((item) => item.method === 'POST'), false)
})

test('valida los datos antes de crear cuentas', async (t) => {
  const llamadas = simular(t)
  assert.equal((await crearUsuario(solicitud({ ...entrada, rol: 'superadmin' }))).status, 400)
  assert.equal(llamadas.some((item) => item.method === 'POST'), false)
})

test('crea cuenta confirmada y miembro en la familia solicitada', async (t) => {
  const llamadas = simular(t)
  const respuesta = await crearUsuario(solicitud())
  assert.equal(respuesta.status, 201)
  assert.deepEqual(await respuesta.json(), { usuario_id: '00000000-0000-4000-8000-000000000002' })
  const alta = llamadas.find((item) => item.url.endsWith('/auth/v1/admin/users'))!
  assert.equal((alta.body as { email_confirm: boolean }).email_confirm, true)
  const miembro = llamadas.find((item) => item.url.includes('/rest/v1/miembros_familia') && item.method === 'POST')!
  assert.deepEqual(miembro.body, { usuario_id: '00000000-0000-4000-8000-000000000002', familia_id: 2, nombre: 'Nuevo', rol: 'usuario', activo: true })
})

test('elimina la cuenta recién creada si falla la asignación a la familia', async (t) => {
  const llamadas = simular(t, { falloMiembro: true })
  const respuesta = await crearUsuario(solicitud())
  assert.equal(respuesta.status, 500)
  assert.ok(llamadas.some((item) => item.method === 'DELETE' && item.url.endsWith('/00000000-0000-4000-8000-000000000002')))
  assert.match((await respuesta.json()).error, /deshecho/)
})

test('informa si también falla la compensación del alta', async (t) => {
  simular(t, { falloMiembro: true, falloLimpieza: true })
  const respuesta = await crearUsuario(solicitud())
  assert.equal(respuesta.status, 500)
  assert.match((await respuesta.json()).error, /antes de reintentar/)
})
