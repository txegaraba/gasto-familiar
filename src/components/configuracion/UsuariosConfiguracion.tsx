import { useState } from 'react'
import type { MiembroAdministracion, MiembroFamilia } from '../../types/dominio'
import type { useConfiguracion } from '../../hooks/useConfiguracion'
import { crearUsuario, guardarMiembro } from '../../services/configuracionService'

type Config = ReturnType<typeof useConfiguracion>

function Rol({ valor = 'usuario' }: { valor?: MiembroFamilia['rol'] }) {
  return (
    <label>Rol
      <select name="rol" defaultValue={valor}>
        <option value="usuario">Usuario</option>
        <option value="administrador">Administrador (todas las familias)</option>
      </select>
    </label>
  )
}

function MiembroForm({ miembro, config }: { miembro: MiembroAdministracion; config: Config }) {
  return (
    <form onSubmit={async (event) => {
      event.preventDefault()
      const valores = new FormData(event.currentTarget)
      const nombre = String(valores.get('nombre') ?? '').trim()
      if (!nombre) return
      await config.guardar(() => guardarMiembro({
        ...miembro, nombre, rol: valores.get('rol') as MiembroFamilia['rol'], activo: valores.get('activo') === 'on',
      }), 'Miembro actualizado.')
    }}>
      <fieldset disabled={config.guardando}>
        <legend>Editar miembro</legend>
        <label>Nombre<input name="nombre" required maxLength={150} defaultValue={miembro.nombre} /></label>
        <Rol valor={miembro.rol} />
        <label className="config-checkbox"><input name="activo" type="checkbox" defaultChecked={miembro.activo} /> Activo en la familia</label>
        <button type="submit">{config.guardando ? 'Guardando...' : 'Guardar miembro'}</button>
      </fieldset>
    </form>
  )
}

export function UsuariosConfiguracion({ config }: { config: Config }) {
  const [nuevo, setNuevo] = useState(false)
  return (
    <section>
      <h3>Usuarios</h3>
      <button type="button" className="boton-secundario" disabled={config.guardando} onClick={() => setNuevo(!nuevo)}>
        {nuevo ? 'Cancelar nuevo usuario' : '+ Nuevo usuario'}
      </button>
      {nuevo && (
        <form onSubmit={async (event) => {
          event.preventDefault()
          const valores = new FormData(event.currentTarget)
          const ok = await config.guardar(() => crearUsuario({
            familia_id: config.familiaId,
            nombre: String(valores.get('nombre') ?? '').trim(),
            email: String(valores.get('email') ?? '').trim(),
            password: String(valores.get('password') ?? ''),
            rol: valores.get('rol') as MiembroFamilia['rol'],
          }), 'Usuario creado. Ya puede entrar con su email y contraseña.')
          if (ok) setNuevo(false)
        }}>
          <fieldset disabled={config.guardando}>
            <legend>Crear cuenta en la familia seleccionada</legend>
            <label>Nombre<input name="nombre" required maxLength={150} autoComplete="off" /></label>
            <label>Email<input name="email" type="email" required autoComplete="off" /></label>
            <label>Contraseña<input name="password" type="password" required minLength={8} maxLength={128} autoComplete="new-password" /></label>
            <p>Al menos 8 caracteres. Comunica las credenciales al nuevo usuario.</p>
            <Rol />
            <button type="submit">{config.guardando ? 'Creando...' : 'Crear usuario'}</button>
          </fieldset>
        </form>
      )}
      {config.miembros.length === 0 && <p>Esta familia no tiene miembros.</p>}
      {config.miembros.map((miembro) => (
        <details className="config-elemento" key={miembro.usuario_id}>
          <summary>{miembro.nombre} · {miembro.rol}{!miembro.activo && ' · Inactivo'}</summary>
          <MiembroForm miembro={miembro} config={config} />
        </details>
      ))}
    </section>
  )
}
