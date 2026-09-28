import assert from 'node:assert/strict'
import test from 'node:test'
import { calcularPresupuestoFamilia, fechaLocal } from '../src/utils/presupuesto.ts'
import type { AjusteDiario, DatosPresupuestoFamilia, GastoPresupuesto, PresupuestoMensual } from '../src/types/dominio.ts'

function presupuesto(ano: number, mes: number, limite: number): PresupuestoMensual {
  return { id: ano * 12 + mes, familia_id: 1, ano, mes, limite_mensual: limite, created_at: '' }
}

function gasto(fecha: string, importe: number, id = 1): GastoPresupuesto {
  return { id, fecha_hora: new Date(`${fecha}T12:00:00`).toISOString(), importe }
}

function ajuste(fecha: string, importe: number): AjusteDiario {
  return { id: 1, familia_id: 1, fecha, importe, motivo: null, usuario_id: 'usuario', created_at: '' }
}

function datos(presupuestos: PresupuestoMensual[], gastos: GastoPresupuesto[] = [], ajustes: AjusteDiario[] = []): DatosPresupuestoFamilia {
  return { presupuestos, gastos, ajustes }
}

function cerca(actual: number, esperado: number) {
  assert.ok(Math.abs(actual - esperado) < 1e-9, `${actual} != ${esperado}`)
}

test('primer día: base mensual / días naturales, con ajustes y gastos de hoy', () => {
  const resumen = calcularPresupuestoFamilia(datos(
    [presupuesto(2026, 9, 900)], [gasto('2026-09-01', 12)],
    [ajuste('2026-09-01', 5), ajuste('2026-09-01', -2)],
  ), new Date(2026, 8, 1))
  assert.equal(resumen.arrastreAnterior, 0)
  assert.equal(resumen.baseDiaria, 30)
  assert.equal(resumen.ajustesHoy, 3)
  assert.equal(resumen.disponible, 21)
})

test('arrastra meses y años, positivos y negativos, sin incluir meses futuros', () => {
  const entrada = datos(
    [presupuesto(2025, 12, 310), presupuesto(2026, 1, 620), presupuesto(2026, 2, 999)],
    [gasto('2025-12-20', 400), gasto('2026-01-01', 10), gasto('2026-01-02', 7)],
    [ajuste('2025-12-20', 5), ajuste('2026-01-01', -3), ajuste('2026-01-02', 2)],
  )
  const resumen = calcularPresupuestoFamilia(entrada, new Date(2026, 0, 2))
  assert.equal(resumen.arrastreAnterior, 310 + 20 + 5 - 3 - 400 - 10)
  assert.equal(resumen.disponible, -63)
})

test('no redondea la base ni el arrastre y respeta febrero bisiesto', () => {
  const resumen = calcularPresupuestoFamilia(datos([presupuesto(2024, 2, 100)]), new Date(2024, 1, 29))
  assert.equal(resumen.baseDiaria, 100 / 29)
  assert.equal(resumen.arrastreAnterior, (100 / 29) * 28)
  cerca(resumen.disponible, 100)
  const marzo = calcularPresupuestoFamilia(datos([presupuesto(2024, 2, 100)]), new Date(2024, 2, 1))
  assert.equal(marzo.arrastreAnterior, 100)
})

test('meses de 28, 30 y 31 días', () => {
  for (const [mes, dias] of [[2, 28], [4, 30], [7, 31]]) {
    const resumen = calcularPresupuestoFamilia(datos([presupuesto(2026, mes, 100)]), new Date(2026, mes - 1, dias))
    assert.equal(resumen.baseDiaria, 100 / dias)
    cerca(resumen.disponible, 100)
  }
})

test('excluye gastos y ajustes anteriores al primer presupuesto y posteriores a hoy', () => {
  const resumen = calcularPresupuestoFamilia(datos(
    [presupuesto(2026, 9, 300)],
    [gasto('2026-08-31', 1000), gasto('2026-09-02', 1000), gasto('2026-09-01', 4)],
    [ajuste('2026-08-31', -1000), ajuste('2026-09-02', -1000), ajuste('2026-09-01', 1)],
  ), new Date(2026, 8, 1))
  assert.equal(resumen.disponible, 7)
})

test('mes sin presupuesto conserva el arrastre y contabiliza gastos y ajustes', () => {
  const resumen = calcularPresupuestoFamilia(datos(
    [presupuesto(2026, 1, 100), presupuesto(2026, 4, 1000)],
    [gasto('2026-02-05', 40), gasto('2026-03-02', 3)],
    [ajuste('2026-02-10', -5), ajuste('2026-03-02', 2)],
  ), new Date(2026, 2, 2))
  assert.equal(resumen.tienePresupuestoMesActual, false)
  assert.equal(resumen.baseDiaria, 0)
  assert.equal(resumen.arrastreAnterior, 55)
  assert.equal(resumen.disponible, 54)
})

test('editar o borrar un gasto antiguo cambia el saldo actual', () => {
  const entrada = datos([presupuesto(2026, 1, 100)], [gasto('2026-01-01', 50)])
  const hoy = new Date(2026, 1, 1)
  assert.equal(calcularPresupuestoFamilia(entrada, hoy).disponible, 50)
  entrada.gastos[0].importe = 75
  assert.equal(calcularPresupuestoFamilia(entrada, hoy).disponible, 25)
  entrada.gastos = []
  assert.equal(calcularPresupuestoFamilia(entrada, hoy).disponible, 100)
})

test('sin presupuesto o con solo presupuestos futuros no inicia el saldo', () => {
  for (const presupuestos of [[], [presupuesto(2027, 1, 100)]]) {
    const resumen = calcularPresupuestoFamilia(datos(presupuestos), new Date(2026, 8, 1))
    assert.equal(resumen.tienePresupuesto, false)
    assert.equal(resumen.disponible, 0)
  }
})

test('respeta límites del día local, incluso en cambios de horario', () => {
  const hoy = new Date(2026, 2, 29)
  const inicio = new Date(2026, 2, 29)
  const fin = new Date(2026, 2, 30)
  const resumen = calcularPresupuestoFamilia(datos([presupuesto(2026, 3, 310)], [
    { id: 1, fecha_hora: new Date(inicio.getTime() - 1).toISOString(), importe: 2 },
    { id: 2, fecha_hora: inicio.toISOString(), importe: 3 },
    { id: 3, fecha_hora: new Date(fin.getTime() - 1).toISOString(), importe: 4 },
    { id: 4, fecha_hora: fin.toISOString(), importe: 1000 },
  ]), hoy)
  assert.equal(fechaLocal(hoy), '2026-03-29')
  assert.equal(resumen.arrastreAnterior, 278)
  assert.equal(resumen.gastadoHoy, 7)
  assert.equal(resumen.disponible, 281)
})

test('incluye más de mil gastos en el cálculo', () => {
  const resumen = calcularPresupuestoFamilia(datos([presupuesto(2026, 1, 2000)],
    Array.from({ length: 1501 }, (_, id) => gasto('2026-01-01', 1, id)),
  ), new Date(2026, 1, 1))
  assert.equal(resumen.disponible, 499)
})
