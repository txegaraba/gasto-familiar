import { useState } from 'react'
import type { User } from '@supabase/supabase-js'
import type { Gasto, MiembroFamilia } from '../types/dominio'
import { actualizarGasto, insertarGasto } from '../services/gastosService'

export function useFormularioGasto(
  usuario: User | null,
  obtenerFamiliaUsuario: () => Promise<MiembroFamilia | null>,
  recargarGastos: () => Promise<void>,
) {
  const [categoriaId, setCategoriaId] = useState('')
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [importe, setImporte] = useState('')
  const [concepto, setConcepto] = useState('')
  const [gastoEditando, setGastoEditando] = useState<Gasto | null>(null)

  function nuevoGasto() {
    setGastoEditando(null)
    setImporte('')
    setConcepto('')
    setCategoriaId('')
    setMostrarFormulario(true)
  }

  function editarGasto(gasto: Gasto) {
    setGastoEditando(gasto)

    setImporte(
      Number(gasto.importe)
        .toFixed(2)
        .replace('.', ',')
    )

    setConcepto(gasto.concepto)

    setCategoriaId(
      gasto.categoria_id
        ? String(gasto.categoria_id)
        : ''
    )

    setMostrarFormulario(true)
  }

  async function guardarGasto() {
    const importeNumero = Number(importe.replace(',', '.'))

    if (!importeNumero || importeNumero <= 0) {
      alert('Introduce un importe válido')
      return
    }

    if (!categoriaId) {
      alert('Selecciona una categoría')
      return
    }

    // =========================
    // MODIFICAR GASTO EXISTENTE
    // =========================

    if (gastoEditando) {
      const { error } = await actualizarGasto(gastoEditando.id, {
        categoria_id: Number(categoriaId),
        concepto: concepto.trim() || 'Sin concepto',
        importe: importeNumero,
      })

      if (error) {
        console.error('Error modificando gasto:', error)
        alert('No se pudo modificar el gasto')
        return
      }
    }

    // =========================
    // CREAR NUEVO GASTO
    // =========================

    else {
      const miembro = await obtenerFamiliaUsuario()

      if (!miembro) {
        alert('No se ha encontrado la familia del usuario')
        return
      }

      const { error } = await insertarGasto({
        familia_id: miembro.familia_id,
        usuario_id: usuario!.id,
        persona: miembro.nombre,
        categoria_id: Number(categoriaId),
        concepto: concepto.trim() || 'Sin concepto',
        importe: importeNumero,
      })

      if (error) {
        console.error('Error guardando gasto:', error)
        alert('No se pudo guardar el gasto')
        return
      }
    }

    setImporte('')
    setConcepto('')
    setCategoriaId('')
    setGastoEditando(null)
    setMostrarFormulario(false)

    await recargarGastos()
  }

  function cancelar() {
    setMostrarFormulario(false)
    setGastoEditando(null)
    setImporte('')
    setConcepto('')
    setCategoriaId('')
  }

  return { categoriaId, setCategoriaId, mostrarFormulario, importe, setImporte, concepto, setConcepto, gastoEditando, nuevoGasto, editarGasto, guardarGasto, cancelar }
}
