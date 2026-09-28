import type { DatosPresupuestoFamilia, ResumenPresupuesto } from '../types/dominio'

// Las fechas de ajustes son días civiles, no instantes UTC.
export function fechaLocal(fecha: Date): string {
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`
}

export function primerMesPresupuestado(presupuestos: DatosPresupuestoFamilia['presupuestos']): Date | null {
  if (presupuestos.length === 0) return null
  return new Date(Math.min(...presupuestos.map(({ ano, mes }) => new Date(ano, mes - 1, 1).getTime())))
}

export function calcularPresupuestoFamilia(
  { presupuestos, ajustes, gastos }: DatosPresupuestoFamilia,
  hoy: Date,
): ResumenPresupuesto {
  const inicio = primerMesPresupuestado(presupuestos)
  const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())
  const finHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 1)
  const resumen: ResumenPresupuesto = {
    tienePresupuesto: inicio !== null && inicio <= inicioHoy,
    tienePresupuestoMesActual: false,
    presupuestoMensual: 0,
    baseDiaria: 0,
    arrastreAnterior: 0,
    ajustesHoy: 0,
    gastadoHoy: 0,
    disponible: 0,
  }
  if (!inicio || inicio > inicioHoy) return resumen

  const mesActual = hoy.getFullYear() * 12 + hoy.getMonth()
  let presupuestosAnteriores = 0
  for (const presupuesto of presupuestos) {
    const mes = presupuesto.ano * 12 + presupuesto.mes - 1
    if (mes < mesActual) {
      // Se suma el mes completo, nunca una base diaria previamente redondeada.
      presupuestosAnteriores += Number(presupuesto.limite_mensual)
    } else if (mes === mesActual) {
      resumen.tienePresupuestoMesActual = true
      resumen.presupuestoMensual = Number(presupuesto.limite_mensual)
    }
  }

  const diasDelMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate()
  resumen.baseDiaria = resumen.presupuestoMensual / diasDelMes
  const fechaHoy = fechaLocal(hoy)
  const fechaInicio = fechaLocal(inicio)
  let ajustesAnteriores = 0
  for (const ajuste of ajustes) {
    if (ajuste.fecha < fechaInicio || ajuste.fecha > fechaHoy) continue
    if (ajuste.fecha === fechaHoy) resumen.ajustesHoy += Number(ajuste.importe)
    else ajustesAnteriores += Number(ajuste.importe)
  }

  let gastosAnteriores = 0
  for (const gasto of gastos) {
    const fecha = new Date(gasto.fecha_hora)
    if (fecha < inicio || fecha >= finHoy) continue
    if (fecha >= inicioHoy) resumen.gastadoHoy += Number(gasto.importe)
    else gastosAnteriores += Number(gasto.importe)
  }

  resumen.arrastreAnterior = presupuestosAnteriores
    + resumen.baseDiaria * (hoy.getDate() - 1)
    + ajustesAnteriores - gastosAnteriores
  resumen.disponible = resumen.arrastreAnterior + resumen.baseDiaria
    + resumen.ajustesHoy - resumen.gastadoHoy
  return resumen
}
