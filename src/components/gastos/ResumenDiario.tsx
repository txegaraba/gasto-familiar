import type { Gasto } from '../../types/dominio'

type Props = {
  gastosHoy: Gasto[]
  nuevoGasto: () => void
  cerrarSesion: () => Promise<void>
}

export function ResumenDiario({ gastosHoy, nuevoGasto, cerrarSesion }: Props) {
  // Se conserva el presupuesto inicial: no se consulta ni se actualiza.
  const presupuestoDiario: number = 0
  const gastadoHoy = gastosHoy.reduce(
    (total, gasto) => total + Number(gasto.importe),
    0
  )

  const disponible = presupuestoDiario - gastadoHoy

  const porcentaje =
    presupuestoDiario > 0
      ? (gastadoHoy / presupuestoDiario) * 100
      : 0
  return (
    <section className="card principal">

      <span className="etiqueta">
        HOY
      </span>

      <div className="importe-principal">
        {gastadoHoy.toFixed(2)} €
      </div>

      <div className="subtitulo">
        gastados
      </div>

      <div className="resumen">

        <div>
          <span>Presupuesto</span>
          <strong>
            {presupuestoDiario.toFixed(2)} €
          </strong>
        </div>

        <div>
          <span>Disponible</span>
          <strong>
            {disponible.toFixed(2)} €
          </strong>
        </div>

      </div>

      <div className="barra">

        <div
          className="barra-progreso"
          style={{
            width: `${Math.min(porcentaje, 100)}%`,
          }}
        />

      </div>

      <button
        onClick={nuevoGasto}
      >
        + Nuevo gasto
      </button>

      <button
        className="boton-secundario"
        onClick={cerrarSesion}
      >
        Cerrar sesión
      </button>

    </section>
  )
}
