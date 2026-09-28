import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import type { Gasto, Categoria, MiembroFamilia } from '../types/dominio'
import { consultarMiembro } from '../services/familiaService'
import { consultarCategorias } from '../services/categoriasService'
import { consultarGastos, consultarGastosHoy, eliminarGasto } from '../services/gastosService'

export function useDatosFamilia(usuario: User | null) {
  const [gastos, setGastos] = useState<Gasto[]>([])
  const [gastosHoy, setGastosHoy] = useState<Gasto[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [miembroActual, setMiembroActual] = useState<MiembroFamilia | null>(null)

  useEffect(() => {
    if (usuario) {
      cargarDatosUsuario()
    } else {
      setGastos([])
      setGastosHoy([])
      setMiembroActual(null)
    }
  }, [usuario])

  async function obtenerFamiliaUsuario(): Promise<MiembroFamilia | null> {
    if (!usuario) return null

    const { data, error } = await consultarMiembro(usuario.id)

    if (error) {
      console.error('Error obteniendo familia:', error)
      return null
    }

    return data
  }

  async function cargarGastos() {
    const { data, error } = await consultarGastos()

    if (error) {
      console.error('Error cargando gastos:', error)
      return
    }

    setGastos(data ?? [])
  }

  async function cargarGastosHoy() {
    const { data, error } = await consultarGastosHoy()

    if (error) {
      console.error('Error cargando gastos de hoy:', error)
      return
    }

    setGastosHoy(data ?? [])
  }

  async function cargarCategorias(familiaId: number) {
    const { data, error } = await consultarCategorias(familiaId)

    if (error) {
      console.error('Error cargando categorías:', error)
      return
    }

    setCategorias(data ?? [])
  }

  function obtenerNombreCategoria(categoriaId: number | null) {
    if (!categoriaId) {
      return 'Sin categoría'
    }

    const categoria = categorias.find(
      (c) => c.id === categoriaId
    )

    return categoria?.nombre ?? 'Sin categoría'
  }

  async function cargarDatosUsuario() {
    const miembro = await obtenerFamiliaUsuario()

    if (!miembro) {
      console.error('No se ha encontrado la familia del usuario')
      return
    }

    setMiembroActual(miembro)

    await Promise.all([
      cargarCategorias(miembro.familia_id),
      cargarGastos(),
      cargarGastosHoy(),
    ])
  }

  async function borrarGasto(gasto: Gasto) {
    const confirmar = window.confirm(
      `¿Quieres borrar el gasto "${gasto.concepto}" de ${Number(
        gasto.importe
      ).toFixed(2)} €?`
    )

    if (!confirmar) {
      return
    }

    const { error } = await eliminarGasto(gasto.id)

    if (error) {
      console.error('Error borrando gasto:', error)
      alert('No se pudo borrar el gasto')
      return
    }

    await Promise.all([
      cargarGastos(),
      cargarGastosHoy(),
    ])
  }

  async function recargarGastos() {
    await Promise.all([cargarGastos(), cargarGastosHoy()])
  }

  return { gastos, gastosHoy, categorias, miembroActual, obtenerFamiliaUsuario, obtenerNombreCategoria, borrarGasto, recargarGastos }
}
