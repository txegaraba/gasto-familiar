import type { Gasto } from '../../types/dominio'

type Props = {
  gasto: Gasto
  setGastoSeleccionado: (gasto: Gasto) => void
  obtenerNombreCategoria: (id: number | null) => string
  formatearFecha: (fecha: string) => string
}

export function GastoItem({ gasto, setGastoSeleccionado, obtenerNombreCategoria, formatearFecha }: Props) {
  return (
    <div
      className="movimiento movimiento-clickable"
      onClick={() => setGastoSeleccionado(gasto)}
    >

      <div>

        <strong>
          {gasto.persona}
        </strong>

        <span className="categoria-gasto">
          {obtenerNombreCategoria(gasto.categoria_id)}
        </span>

        <span>
          {gasto.concepto}
        </span>

        <span className="fecha-gasto">
          {formatearFecha(gasto.fecha_hora)}
        </span>

      </div>

      <div className="movimiento-importe">
        {Number(gasto.importe).toFixed(2)} €
      </div>

    </div>
  )
}
