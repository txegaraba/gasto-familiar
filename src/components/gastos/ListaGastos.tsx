import type { Gasto } from '../../types/dominio'
import { GastoItem } from './GastoItem'
import { DetalleGastoModal } from './DetalleGastoModal'

type Props = {
  gastos: Gasto[]
  gastoSeleccionado: Gasto | null
  setGastoSeleccionado: (gasto: Gasto | null) => void
  obtenerNombreCategoria: (id: number | null) => string
  editarGasto: (gasto: Gasto) => void
  borrarGasto: (gasto: Gasto) => Promise<void>
}

function formatearFecha(fechaTexto: string) {
  const fecha = new Date(fechaTexto)
  const hoy = new Date()

  const esHoy =
    fecha.getFullYear() === hoy.getFullYear() &&
    fecha.getMonth() === hoy.getMonth() &&
    fecha.getDate() === hoy.getDate()

  const ayer = new Date(hoy)
  ayer.setDate(hoy.getDate() - 1)

  const esAyer =
    fecha.getFullYear() === ayer.getFullYear() &&
    fecha.getMonth() === ayer.getMonth() &&
    fecha.getDate() === ayer.getDate()

  const hora = fecha.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  })

  if (esHoy) {
    return `Hoy ${hora}`
  }

  if (esAyer) {
    return `Ayer ${hora}`
  }

  return fecha.toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function ListaGastos({ gastos, gastoSeleccionado, setGastoSeleccionado, obtenerNombreCategoria, editarGasto, borrarGasto }: Props) {
  return (
    <section className="card">
      <h2>Últimos movimientos</h2>
      {gastos.length === 0 && <p>No hay gastos registrados.</p>}
      {gastoSeleccionado && (
        <DetalleGastoModal
          gastoSeleccionado={gastoSeleccionado}
          setGastoSeleccionado={setGastoSeleccionado}
          obtenerNombreCategoria={obtenerNombreCategoria}
          formatearFecha={formatearFecha}
          editarGasto={editarGasto}
          borrarGasto={borrarGasto}
        />
      )}
      {gastos.map((gasto) => (
        <GastoItem
          key={gasto.id}
          gasto={gasto}
          setGastoSeleccionado={setGastoSeleccionado}
          obtenerNombreCategoria={obtenerNombreCategoria}
          formatearFecha={formatearFecha}
        />
      ))}
    </section>
  )
}
