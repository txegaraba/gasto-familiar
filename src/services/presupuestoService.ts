import { supabase } from '../lib/supabase'
import type { AjusteDiario, DatosPresupuestoFamilia, GastoPresupuesto, PresupuestoMensual } from '../types/dominio'
import { fechaLocal, primerMesPresupuestado } from '../utils/presupuesto'

// El saldo necesita todas las filas: una única consulta puede quedar truncada.
async function leerTodasLasFilas<T>(
  consultar: (desde: number, hasta: number) => PromiseLike<{
    data: T[] | null
    error: { message: string } | null
  }>,
): Promise<T[]> {
  const filas: T[] = []
  while (true) {
    const { data, error } = await consultar(filas.length, filas.length + 499)
    if (error) throw new Error(error.message)
    if (!data?.length) return filas
    filas.push(...data)
  }
}

export async function consultarPresupuestoFamilia(familiaId: number, hoy: Date): Promise<DatosPresupuestoFamilia> {
  const presupuestos = await leerTodasLasFilas<PresupuestoMensual>((desde, hasta) => supabase
    .from('presupuestos_mensuales')
    .select('id, familia_id, ano, mes, limite_mensual, created_at')
    .eq('familia_id', familiaId)
    .order('ano').order('mes').order('id')
    .range(desde, hasta))

  const inicio = primerMesPresupuestado(presupuestos)
  if (!inicio || inicio > hoy) return { presupuestos, ajustes: [], gastos: [] }

  const finHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 1)
  const [ajustes, gastos] = await Promise.all([
    leerTodasLasFilas<AjusteDiario>((desde, hasta) => supabase
      .from('ajustes_diarios')
      .select('id, familia_id, fecha, importe, motivo, usuario_id, created_at')
      .eq('familia_id', familiaId)
      .gte('fecha', fechaLocal(inicio))
      .lte('fecha', fechaLocal(hoy))
      .order('fecha').order('id')
      .range(desde, hasta)),
    leerTodasLasFilas<GastoPresupuesto>((desde, hasta) => supabase
      .from('gastos')
      .select('id, importe, fecha_hora')
      .eq('familia_id', familiaId)
      .gte('fecha_hora', inicio.toISOString())
      .lt('fecha_hora', finHoy.toISOString())
      .order('fecha_hora').order('id')
      .range(desde, hasta)),
  ])
  return { presupuestos, ajustes, gastos }
}
