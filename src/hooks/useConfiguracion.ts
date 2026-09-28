import { useEffect, useState } from 'react'
import type { CategoriaAdministracion, Familia, MiembroAdministracion } from '../types/dominio'
import { listarCategorias, listarFamilias, listarMiembros } from '../services/configuracionService'

export function useConfiguracion(familiaInicial: number) {
  const [familias, setFamilias] = useState<Familia[]>([])
  const [familiaId, setFamiliaId] = useState(familiaInicial)
  const [revision, setRevision] = useState(0)
  const [estado, setEstado] = useState<{
    familiaId: number
    revision: number
    categorias: CategoriaAdministracion[]
    miembros: MiembroAdministracion[]
    error: string | null
  } | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [errorGuardado, setErrorGuardado] = useState<string | null>(null)
  const [mensaje, setMensaje] = useState('')

  useEffect(() => {
    let cancelado = false
    Promise.all([listarFamilias(), listarCategorias(familiaId), listarMiembros(familiaId)])
      .then(([nuevasFamilias, categorias, miembros]) => {
        if (!cancelado) {
          setFamilias(nuevasFamilias)
          setEstado({ familiaId, revision, categorias, miembros, error: null })
        }
      })
      .catch((error: unknown) => {
        if (!cancelado) setEstado({ familiaId, revision, categorias: [], miembros: [], error: error instanceof Error ? error.message : 'No se pudo cargar la configuración' })
      })
    return () => { cancelado = true }
  }, [familiaId, revision])

  async function guardar(accion: () => Promise<unknown>, texto: string): Promise<boolean> {
    setGuardando(true)
    setErrorGuardado(null)
    setMensaje('')
    try {
      await accion()
      setRevision((valor) => valor + 1)
      setMensaje(texto)
      return true
    } catch (error) {
      setErrorGuardado(error instanceof Error ? error.message : 'No se pudieron guardar los cambios')
      return false
    } finally {
      setGuardando(false)
    }
  }

  const actualizado = estado?.familiaId === familiaId && estado.revision === revision
  return {
    familias, familiaId, setFamiliaId, guardando, guardar, mensaje,
    cargando: !actualizado,
    error: errorGuardado ?? (actualizado ? estado.error : null),
    categorias: actualizado ? estado.categorias : [],
    miembros: actualizado ? estado.miembros : [],
    recargar: () => setRevision((valor) => valor + 1),
  }
}
