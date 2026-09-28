import type { Gasto } from '../../types/dominio'

type Props = {
  gastoSeleccionado: Gasto
  setGastoSeleccionado: (gasto: Gasto | null) => void
  obtenerNombreCategoria: (id: number | null) => string
  formatearFecha: (fecha: string) => string
  editarGasto: (gasto: Gasto) => void
  borrarGasto: (gasto: Gasto) => Promise<void>
}

export function DetalleGastoModal({ gastoSeleccionado, setGastoSeleccionado, obtenerNombreCategoria, formatearFecha, editarGasto, borrarGasto }: Props) {
  return (
    <div
      className="modal-fondo"
      onClick={() => setGastoSeleccionado(null)}
    >

      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
      >

        <h2>Detalle del gasto</h2>

        <div className="detalle-gasto">

          <div>
            <span>Persona</span>
            <strong>
              {gastoSeleccionado.persona}
            </strong>
          </div>

          <div>
            <span>Categoría</span>
            <strong>
              {obtenerNombreCategoria(
                gastoSeleccionado.categoria_id
              )}
            </strong>
          </div>

          <div>
            <span>Concepto</span>
            <strong>
              {gastoSeleccionado.concepto}
            </strong>
          </div>

          <div>
            <span>Fecha</span>
            <strong>
              {formatearFecha(
                gastoSeleccionado.fecha_hora
              )}
            </strong>
          </div>

          <div>
            <span>Importe</span>
            <strong className="detalle-importe">
              {Number(
                gastoSeleccionado.importe
              ).toFixed(2)} €
            </strong>
          </div>

        </div>

        <button
          onClick={() => {
            editarGasto(gastoSeleccionado)
            setGastoSeleccionado(null)
          }}
        >
          Editar
        </button>

        <button
          className="boton-borrar-modal"
          onClick={async () => {
            await borrarGasto(gastoSeleccionado)
            setGastoSeleccionado(null)
          }}
        >
          Borrar
        </button>

        <button
          className="boton-secundario"
          onClick={() => setGastoSeleccionado(null)}
        >
          Cerrar
        </button>

      </div>

    </div>
  )
}
