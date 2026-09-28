import { useState } from 'react'
import type { Gasto } from '../types/dominio'
import { BotonConfiguracion } from '../components/configuracion/BotonConfiguracion'
import { ConfiguracionModal } from '../components/configuracion/ConfiguracionModal'
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
  const [mostrarConfiguracion, setMostrarConfiguracion] = useState(false)
  const esAdministrador = miembroActual?.rol === 'administrador' && miembroActual.activo
  return (
    <div className="app">
      <div className="container">
        <header className="cabecera-app">
          <h1>Gastos Familia</h1>
          {esAdministrador && <BotonConfiguracion abrir={() => setMostrarConfiguracion(true)} />}
        </header>
        {mostrarConfiguracion && esAdministrador && miembroActual && (
          <ConfiguracionModal familiaId={miembroActual.familia_id} cerrar={() => {
            setMostrarConfiguracion(false)
            void datos.recargarDatosUsuario()
          }} />
        )}
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
