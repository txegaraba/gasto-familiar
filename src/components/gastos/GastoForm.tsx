import { useEffect, useRef } from 'react'
import type { Categoria } from '../../types/dominio'
import type { useFormularioGasto } from '../../hooks/useFormularioGasto'

type Props = {
  categorias: Categoria[]
  formulario: ReturnType<typeof useFormularioGasto>
}

export function GastoForm({ categorias, formulario }: Props) {
  const { gastoEditando, importe, setImporte, categoriaId, setCategoriaId, concepto, setConcepto, guardarGasto, cancelar } = formulario
  const dialogoRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialogo = dialogoRef.current
    const overflowAnterior = document.body.style.overflow
    dialogo?.showModal()
    document.body.style.overflow = 'hidden'
    return () => {
      dialogo?.close()
      document.body.style.overflow = overflowAnterior
    }
  }, [])

  return (
    <dialog
      ref={dialogoRef}
      className="modal-card gasto-form-modal"
      aria-labelledby="gasto-form-titulo"
      onCancel={(event) => {
        event.preventDefault()
        cancelar()
      }}
    >

      <h2 id="gasto-form-titulo">
        {gastoEditando ? 'Editar gasto' : 'Nuevo gasto'}
      </h2>

      <label htmlFor="gasto-importe">
        Importe
      </label>

      <input
        id="gasto-importe"
        type="text"
        inputMode="decimal"
        placeholder="0,00"
        value={importe}
        onChange={(e) => setImporte(e.target.value)}
      />

      <label htmlFor="gasto-categoria">
        Categoría
      </label>

      <select
        id="gasto-categoria"
        value={categoriaId}
        onChange={(e) => setCategoriaId(e.target.value)}
      >
        <option value="">
          Selecciona una categoría
        </option>

        {categorias.map((categoria) => (
          <option
            key={categoria.id}
            value={categoria.id}
          >
            {categoria.nombre}
          </option>
        ))}
      </select>

      <label htmlFor="gasto-concepto">
        Concepto
      </label>

      <input
        id="gasto-concepto"
        type="text"
        placeholder="Ej. Supermercado"
        value={concepto}
        onChange={(e) => setConcepto(e.target.value)}
      />

      <button onClick={guardarGasto}>
        {gastoEditando ? 'Guardar cambios' : 'Guardar gasto'}
      </button>

      <button
        className="boton-secundario"
        onClick={cancelar}
      >
        Cancelar
      </button>

    </dialog>
  )
}
