import { useState } from 'react'
import type { CategoriaAdministracion } from '../../types/dominio'
import type { useConfiguracion } from '../../hooks/useConfiguracion'
import { guardarCategoria } from '../../services/configuracionService'

type Config = ReturnType<typeof useConfiguracion>

function CategoriaForm({ categoria, config }: { categoria?: CategoriaAdministracion; config: Config }) {
  return (
    <form onSubmit={async (event) => {
      event.preventDefault()
      const form = event.currentTarget
      const valores = new FormData(form)
      const nombre = String(valores.get('nombre') ?? '').trim()
      const orden = Number(valores.get('orden'))
      if (!nombre || !Number.isSafeInteger(orden)) return
      const ok = await config.guardar(() => guardarCategoria(categoria?.id ?? null, config.familiaId, {
        nombre, orden, activa: valores.get('activa') === 'on',
      }), categoria ? 'Categoría actualizada.' : 'Categoría creada.')
      if (ok && !categoria) form.reset()
    }}>
      <fieldset disabled={config.guardando}>
        <legend>{categoria ? 'Editar categoría' : 'Nueva categoría'}</legend>
        <label>Nombre<input name="nombre" required maxLength={150} defaultValue={categoria?.nombre ?? ''} /></label>
        <label>Orden<input name="orden" type="number" required step="1" min="-2147483648" max="2147483647" defaultValue={categoria?.orden ?? 0} /></label>
        <label className="config-checkbox"><input name="activa" type="checkbox" defaultChecked={categoria?.activa ?? true} /> Activa</label>
        <button type="submit">{config.guardando ? 'Guardando...' : 'Guardar categoría'}</button>
      </fieldset>
    </form>
  )
}

export function CategoriasConfiguracion({ config }: { config: Config }) {
  const [nueva, setNueva] = useState(false)
  return (
    <section>
      <h3>Categorías</h3>
      <button type="button" className="boton-secundario" disabled={config.guardando} onClick={() => setNueva(!nueva)}>
        {nueva ? 'Cerrar nueva categoría' : '+ Nueva categoría'}
      </button>
      {nueva && <CategoriaForm config={config} />}
      {config.categorias.length === 0 && <p>Esta familia no tiene categorías.</p>}
      {config.categorias.map((categoria) => (
        <details className="config-elemento" key={categoria.id}>
          <summary>{categoria.nombre} · {categoria.activa ? 'Activa' : 'Inactiva'}</summary>
          <CategoriaForm categoria={categoria} config={config} />
        </details>
      ))}
    </section>
  )
}
