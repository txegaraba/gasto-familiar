import { useEffect, useRef, useState } from 'react'
import { useConfiguracion } from '../../hooks/useConfiguracion'
import { FamiliasConfiguracion } from './FamiliasConfiguracion'
import { CategoriasConfiguracion } from './CategoriasConfiguracion'
import { UsuariosConfiguracion } from './UsuariosConfiguracion'

type Props = {
  familiaId: number
  cerrar: () => void
}

export function ConfiguracionModal({ familiaId, cerrar }: Props) {
  const config = useConfiguracion(familiaId)
  const [seccion, setSeccion] = useState<'familias' | 'usuarios' | 'categorias'>('familias')
  const dialogoRef = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const dialogo = dialogoRef.current
    const overflow = document.body.style.overflow
    dialogo?.showModal()
    document.body.style.overflow = 'hidden'
    return () => {
      dialogo?.close()
      document.body.style.overflow = overflow
    }
  }, [])

  return (
    <dialog ref={dialogoRef} className="modal-card gasto-form-modal configuracion-modal" aria-labelledby="config-titulo" onCancel={(event) => {
      event.preventDefault()
      if (!config.guardando) cerrar()
    }}>
      <div className="config-cabecera">
        <h2 id="config-titulo">Configuración</h2>
        <button type="button" className="boton-secundario" onClick={cerrar} disabled={config.guardando}>Cerrar</button>
      </div>
      <nav className="config-secciones" aria-label="Apartados de configuración">
        {(['familias', 'usuarios', 'categorias'] as const).map((valor) => (
          <button type="button" key={valor} aria-pressed={seccion === valor} disabled={config.guardando} onClick={() => setSeccion(valor)}>
            {{ familias: 'Familias', usuarios: 'Usuarios', categorias: 'Categorías' }[valor]}
          </button>
        ))}
      </nav>
      <label htmlFor="config-familia">Familia</label>
      <select id="config-familia" value={config.familiaId} disabled={config.guardando || config.cargando} onChange={(event) => config.setFamiliaId(Number(event.target.value))}>
        {!config.familias.some((familia) => familia.id === config.familiaId) && <option value={config.familiaId}>Selecciona una familia</option>}
        {config.familias.map((familia) => <option key={familia.id} value={familia.id}>{familia.nombre}</option>)}
      </select>
      {config.error && <p role="alert">{config.error}</p>}
      {config.mensaje && <p role="status">{config.mensaje}</p>}
      {config.cargando ? <p role="status">Cargando configuración...</p> : (
        <div key={config.familiaId}>
          {seccion === 'familias' && <FamiliasConfiguracion config={config} />}
          {config.familias.some((familia) => familia.id === config.familiaId) && (
            <>
              {seccion === 'categorias' && <CategoriasConfiguracion config={config} />}
              {seccion === 'usuarios' && <UsuariosConfiguracion config={config} />}
            </>
          )}
        </div>
      )}
      {config.error && <button type="button" className="boton-secundario" disabled={config.guardando} onClick={config.recargar}>Volver a cargar</button>}
    </dialog>
  )
}
