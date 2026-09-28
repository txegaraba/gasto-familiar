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
