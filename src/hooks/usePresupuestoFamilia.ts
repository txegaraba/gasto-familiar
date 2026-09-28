import { useEffect, useState } from 'react'
import type { Gasto, ResumenPresupuesto } from '../types/dominio'
import { consultarPresupuestoFamilia } from '../services/presupuestoService'
import { calcularPresupuestoFamilia, fechaLocal } from '../utils/presupuesto'

type Resultado = {
  familiaId: number
  dia: string
  gastos: Gasto[]
  resumen: ResumenPresupuesto | null
  error: string | null
}

export function usePresupuestoFamilia(familiaId: number | null, gastos: Gasto[]) {
  const [dia, setDia] = useState(() => fechaLocal(new Date()))
  const [resultado, setResultado] = useState<Resultado | null>(null)

  useEffect(() => {
    let temporizador: ReturnType<typeof setTimeout>
    function actualizarDia() {
      const ahora = new Date()
      setDia(fechaLocal(ahora))
      clearTimeout(temporizador)
      const manana = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate() + 1)
      temporizador = setTimeout(actualizarDia, manana.getTime() - ahora.getTime() + 50)
    }
    actualizarDia()
    window.addEventListener('focus', actualizarDia)
    return () => {
      clearTimeout(temporizador)
      window.removeEventListener('focus', actualizarDia)
    }
  }, [])

  useEffect(() => {
    if (familiaId === null) return
    let cancelado = false
    const [ano, mes, fecha] = dia.split('-').map(Number)
    const hoy = new Date(ano, mes - 1, fecha)
    async function cargar() {
      try {
        const datos = await consultarPresupuestoFamilia(familiaId!, hoy)
        if (!cancelado) {
          setResultado({ familiaId: familiaId!, dia, gastos, resumen: calcularPresupuestoFamilia(datos, hoy), error: null })
        }
      } catch (error) {
        if (!cancelado) {
          setResultado({ familiaId: familiaId!, dia, gastos, resumen: null, error: error instanceof Error ? error.message : 'Error cargando el presupuesto' })
        }
      }
    }
    void cargar()
    return () => { cancelado = true }
    // La lista cambia tras altas, ediciones y borrados, también de gastos antiguos.
  }, [familiaId, dia, gastos])

  const actualizado = resultado?.familiaId === familiaId && resultado?.dia === dia && resultado?.gastos === gastos
  return {
    resumen: actualizado ? resultado.resumen : null,
    error: actualizado ? resultado.error : null,
    cargando: familiaId !== null && !actualizado,
  }
}
