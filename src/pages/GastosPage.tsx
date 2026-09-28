import type { Gasto } from '../types/dominio'
import type { useDatosFamilia } from '../hooks/useDatosFamilia'
import type { useFormularioGasto } from '../hooks/useFormularioGasto'
import { usePresupuestoFamilia } from '../hooks/usePresupuestoFamilia'
import { ResumenDiario } from '../components/gastos/ResumenDiario'
import { GastoForm } from '../components/gastos/GastoForm'
import { ListaGastos } from '../components/gastos/ListaGastos'

type Props = {
  datos: ReturnType<typeof useDatosFamilia>
  formulario: ReturnType<typeof useFormularioGasto>
  gastoSeleccionado: Gasto | null
  setGastoSeleccionado: (gasto: Gasto | null) => void
  cerrarSesion: () => Promise<void>
}

export function GastosPage({ datos, formulario, gastoSeleccionado, setGastoSeleccionado, cerrarSesion }: Props) {
  const { miembroActual, categorias, gastos, obtenerNombreCategoria, borrarGasto } = datos
  const presupuesto = usePresupuestoFamilia(miembroActual?.familia_id ?? null, gastos)
  return (
    <div className="app">
      <div className="container">
        <h1>Gastos Familia</h1>
        {miembroActual && (
          <p style={{ textAlign: 'center' }}>
            {miembroActual.nombre} · {miembroActual.rol}
          </p>
        )}
        <ResumenDiario presupuesto={presupuesto} nuevoGasto={formulario.nuevoGasto} cerrarSesion={cerrarSesion} />
        {formulario.mostrarFormulario && <GastoForm categorias={categorias} formulario={formulario} />}
        <ListaGastos
          gastos={gastos}
          gastoSeleccionado={gastoSeleccionado}
          setGastoSeleccionado={setGastoSeleccionado}
          obtenerNombreCategoria={obtenerNombreCategoria}
          editarGasto={formulario.editarGasto}
          borrarGasto={borrarGasto}
        />
      </div>
    </div>
  )
}
