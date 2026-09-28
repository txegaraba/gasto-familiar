import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { ejecutarCreacionUsuario } from './netlify/functions/crear-usuario.ts'
import { existsSync, readFileSync } from 'node:fs'
import { parseEnv } from 'node:util'
import { resolve } from 'node:path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const entorno = loadEnv(mode, process.cwd(), '')
  // Leer los valores locales explícitos evita reutilizar variables antiguas del proceso
  // cuando Vite reinicia su configuración sin terminar el proceso de Node.
  const archivoLocal = resolve(process.cwd(), '.env.local')
  const local = existsSync(archivoLocal) ? parseEnv(readFileSync(archivoLocal, 'utf8')) : {}
  const configuracionServidor = {
    url: local.SUPABASE_URL || local.VITE_SUPABASE_URL || entorno.SUPABASE_URL || entorno.VITE_SUPABASE_URL,
    clave: local.SUPABASE_SERVICE_ROLE_KEY || entorno.SUPABASE_SERVICE_ROLE_KEY,
  }

  return {
    plugins: [react(), {
      name: 'usuarios-servidor-local',
      apply: 'serve',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (req.url?.split('?')[0] !== '/.netlify/functions/crear-usuario') return next()
          try {
            const fragmentos: Buffer[] = []
            let bytes = 0
            for await (const fragmento of req) {
              const buffer = Buffer.from(fragmento)
              bytes += buffer.length
              if (bytes > 16384) {
                res.writeHead(413, { 'Content-Type': 'application/json' })
                res.end(JSON.stringify({ error: 'La solicitud es demasiado grande' }))
                return
              }
              fragmentos.push(buffer)
            }
            const respuesta = await ejecutarCreacionUsuario(new Request('http://localhost/.netlify/functions/crear-usuario', {
              method: req.method,
              headers: {
                Authorization: req.headers.authorization ?? '',
                'Content-Type': req.headers['content-type'] ?? 'application/json',
              },
              body: req.method === 'GET' || req.method === 'HEAD' ? undefined : Buffer.concat(fragmentos).toString('utf8'),
            }), configuracionServidor)
            res.writeHead(respuesta.status, Object.fromEntries(respuesta.headers))
            res.end(await respuesta.text())
          } catch {
            res.writeHead(500, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: 'No se pudo ejecutar la creación de usuarios en el servidor local' }))
          }
        })
      },
    }],
  }
})
