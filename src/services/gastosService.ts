import { supabase } from '../lib/supabase'
import type { Gasto } from '../types/dominio'

type CambiosGasto = Pick<Gasto, 'categoria_id' | 'concepto' | 'importe'>
type NuevoGasto = CambiosGasto & { familia_id: number; usuario_id: string; persona: string }

export async function consultarGastos() {
  return supabase
    .from('gastos')
    .select(`
      id,
      persona,
      concepto,
      importe,
      fecha_hora,
      categoria_id
    `)
    .order('fecha_hora', { ascending: false })

}

export async function consultarGastosHoy() {
  const ahora = new Date()

  const inicioDia = new Date(
    ahora.getFullYear(),
    ahora.getMonth(),
    ahora.getDate(),
    0,
    0,
    0,
    0
  )

  const finDia = new Date(
    ahora.getFullYear(),
    ahora.getMonth(),
    ahora.getDate() + 1,
    0,
    0,
    0,
    0
  )

  return supabase
    .from('gastos')
    .select(`
      id,
      persona,
      concepto,
      importe,
      fecha_hora,
      categoria_id
    `)
    .gte('fecha_hora', inicioDia.toISOString())
    .lt('fecha_hora', finDia.toISOString())
    .order('fecha_hora', { ascending: false })

}

export function insertarGasto(gasto: NuevoGasto) {
  return supabase.from('gastos').insert(gasto)
}

export function actualizarGasto(id: number, cambios: CambiosGasto) {
  return supabase.from('gastos').update(cambios).eq('id', id)
}

export function eliminarGasto(id: number) {
  return supabase.from('gastos').delete().eq('id', id)
}
