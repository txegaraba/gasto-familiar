export type Gasto = {
  id: number
  persona: string
  concepto: string
  importe: number
  fecha_hora: string
  categoria_id: number | null
}

export type Categoria = {
  id: number
  familia_id: number
  nombre: string
  orden: number
}
export type MiembroFamilia = {
  familia_id: number
  nombre: string
  rol: 'administrador' | 'usuario'
  activo: boolean
}

export type PresupuestoMensual = {
  id: number
  familia_id: number
  ano: number
  mes: number
  limite_mensual: number
  created_at: string
}

export type AjusteDiario = {
  id: number
  familia_id: number
  fecha: string
  importe: number
  motivo: string | null
  usuario_id: string
  created_at: string
}

export type GastoPresupuesto = Pick<Gasto, 'id' | 'importe' | 'fecha_hora'>

export type DatosPresupuestoFamilia = {
  presupuestos: PresupuestoMensual[]
  ajustes: AjusteDiario[]
  gastos: GastoPresupuesto[]
}

export type ResumenPresupuesto = {
  tienePresupuesto: boolean
  tienePresupuestoMesActual: boolean
  presupuestoMensual: number
  baseDiaria: number
  arrastreAnterior: number
  ajustesHoy: number
  gastadoHoy: number
  disponible: number
}
