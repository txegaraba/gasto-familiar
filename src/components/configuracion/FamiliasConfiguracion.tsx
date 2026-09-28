import { useState } from 'react'
import type { useConfiguracion } from '../../hooks/useConfiguracion'
import { guardarFamilia } from '../../services/configuracionService'

export function FamiliasConfiguracion({ config }: { config: ReturnType<typeof useConfiguracion> }) {
  const [nueva, setNueva] = useState(false)
  const familia = config.familias.find((item) => item.id === config.familiaId)
  return (
    <section>
      <h3>Familias</h3>
      <button type="button" className="boton-secundario" disabled={config.guardando} onClick={() => setNueva(!nueva)}>
        {nueva ? 'Volver a editar la familia seleccionada' : '+ Nueva familia'}
      </button>
      {(nueva || familia) && (
        <form key={nueva ? 'nueva' : `${familia!.id}-${familia!.nombre}`} onSubmit={async (event) => {
          event.preventDefault()
          const nombre = String(new FormData(event.currentTarget).get('nombre') ?? '').trim()
          if (!nombre) { event.currentTarget.querySelector('input')?.focus(); return }
          const ok = await config.guardar(async () => {
            const resultado = await guardarFamilia(nueva ? null : familia!.id, nombre)
            config.setFamiliaId(resultado.id)
          }, nueva ? 'Familia creada.' : 'Familia actualizada.')
          if (ok) setNueva(false)
        }}>
          <fieldset disabled={config.guardando}>
            <legend>{nueva ? 'Nueva familia' : 'Editar familia'}</legend>
            <label htmlFor="familia-nombre">Nombre</label>
            <input id="familia-nombre" name="nombre" required maxLength={150} defaultValue={nueva ? '' : familia?.nombre} />
            <button type="submit">{config.guardando ? 'Guardando...' : 'Guardar familia'}</button>
          </fieldset>
        </form>
      )}
    </section>
  )
}
