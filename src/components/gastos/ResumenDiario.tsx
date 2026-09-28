import type { usePresupuestoFamilia } from '../../hooks/usePresupuestoFamilia'

type Props = {
  presupuesto: ReturnType<typeof usePresupuestoFamilia>
  nuevoGasto: () => void
  cerrarSesion: () => Promise<void>
}

export function ResumenDiario({ presupuesto, nuevoGasto, cerrarSesion }: Props) {
  const { resumen, cargando, error } = presupuesto
  return (
    <section className="card principal">
      <span className="etiqueta">HOY</span>
      {cargando && <p role="status">Cargando presupuesto...</p>}
      {error && <p role="alert">No se pudo cargar el presupuesto: {error}</p>}
      {!cargando && !error && !resumen && <p>Esperando los datos de la familia.</p>}
      {resumen && !resumen.tienePresupuesto && <p>No hay presupuesto para hoy ni meses anteriores.</p>}
      {resumen?.tienePresupuesto && (
        <>
          <div className="resumen">
            <div>
              <span>Presupuesto mensual</span>
              <strong>{resumen.presupuestoMensual.toFixed(2)} €</strong>
            </div>
            <div>
              <span>Base diaria</span>
              <strong>{resumen.baseDiaria.toFixed(2)} €</strong>
            </div>
          </div>
          {!resumen.tienePresupuestoMesActual && <p>Sin presupuesto este mes: la base diaria es 0 € y se conserva el arrastre.</p>}
          <div className="resumen">
            <div>
              <span>Arrastre anterior</span>
              <strong>{resumen.arrastreAnterior.toFixed(2)} €</strong>
            </div>
            <div>
              <span>Ajustes hoy</span>
              <strong>{resumen.ajustesHoy.toFixed(2)} €</strong>
            </div>
          </div>
          <div className="resumen">
            <div>
              <span>Gastado hoy</span>
              <strong>{resumen.gastadoHoy.toFixed(2)} €</strong>
            </div>
          </div>
          <div className="importe-principal">{resumen.disponible.toFixed(2)} €</div>
          <div className="subtitulo">Disponible</div>
        </>
      )}
      <button onClick={nuevoGasto}>+ Nuevo gasto</button>
      <button className="boton-secundario" onClick={cerrarSesion}>Cerrar sesión</button>
    </section>
  )
}
