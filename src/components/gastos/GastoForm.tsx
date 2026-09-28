import type { Categoria } from '../../types/dominio'
import type { useFormularioGasto } from '../../hooks/useFormularioGasto'

type Props = {
  categorias: Categoria[]
  formulario: ReturnType<typeof useFormularioGasto>
}

export function GastoForm({ categorias, formulario }: Props) {
  const { gastoEditando, importe, setImporte, categoriaId, setCategoriaId, concepto, setConcepto, guardarGasto, cancelar } = formulario
  return (
    <section className="card">

      <h2>
        {gastoEditando ? 'Editar gasto' : 'Nuevo gasto'}
      </h2>

      <label>
        Importe
      </label>

      <input
        type="text"
        inputMode="decimal"
        placeholder="0,00"
        value={importe}
        onChange={(e) => setImporte(e.target.value)}
      />

      <label>
        Categoría
      </label>

      <select
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

      <label>
        Concepto
      </label>

      <input
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

    </section>
  )
}
