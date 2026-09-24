import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'

type Gasto = {
  id: number
  persona: string
  concepto: string
  importe: number
  fecha_hora: string
  categoria_id: number | null
}

type Categoria = {
  id: number
  familia_id: number
  nombre: string
  orden: number
}
type MiembroFamilia = {
  familia_id: number
  nombre: string
}

function App() {
  // =========================
  // ESTADOS
  // =========================

  const [gastos, setGastos] = useState<Gasto[]>([])
  const [gastosHoy, setGastosHoy] = useState<Gasto[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [categoriaId, setCategoriaId] = useState('')
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [importe, setImporte] = useState('')
  const [concepto, setConcepto] = useState('')

  const [usuario, setUsuario] = useState<any>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [cargandoSesion, setCargandoSesion] = useState(true)
  const [gastoEditando, setGastoEditando] = useState<Gasto | null>(null)
  const [presupuestoDiario, setPresupuestoDiario] = useState(0)
  const [gastoSeleccionado, setGastoSeleccionado] = useState<Gasto | null>(null)
  // =========================
  // CÁLCULOS DEL DÍA ACTUAL
  // =========================



  const gastadoHoy = gastosHoy.reduce(
    (total, gasto) => total + Number(gasto.importe),
    0
  )

  const disponible = presupuestoDiario - gastadoHoy

  const porcentaje =
    presupuestoDiario > 0
      ? (gastadoHoy / presupuestoDiario) * 100
      : 0

  // =========================
  // CONTROL DE SESIÓN
  // =========================

  useEffect(() => {
    async function comprobarSesion() {
      const { data, error } = await supabase.auth.getSession()

      if (error) {
        console.error('Error comprobando sesión:', error)
      }

      setUsuario(data.session?.user ?? null)
      setCargandoSesion(false)
    }

    comprobarSesion()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUsuario(session?.user ?? null)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // =========================
  // CARGAR DATOS AL CAMBIAR USUARIO
  // =========================

  useEffect(() => {
    if (usuario) {
      cargarDatosUsuario()
    } else {
      setGastos([])
      setGastosHoy([])
      setPresupuestoDiario(0)
    }
  }, [usuario])

  // =========================
  // AUTENTICACIÓN
  // =========================

  async function iniciarSesion() {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      alert('Error al iniciar sesión: ' + error.message)
    }
  }

  async function cerrarSesion() {
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error('Error cerrando sesión:', error)
    }
  }

  // =========================
  // OBTENER FAMILIA DEL USUARIO
  // =========================

  async function obtenerFamiliaUsuario(): Promise<MiembroFamilia | null> {
    if (!usuario) return null

    const { data, error } = await supabase
      .from('miembros_familia')
      .select('familia_id, nombre')
      .eq('usuario_id', usuario.id)
      .single()

    if (error) {
      console.error('Error obteniendo familia:', error)
      return null
    }

    return data
  }

  // =========================
  // CARGAR PRESUPUESTO
  // =========================

  async function cargarPresupuesto(familiaId: number) {
    const { data, error } = await supabase
      .from('familias')
      .select('presupuesto_diario')
      .eq('id', familiaId)
      .single()

    if (error) {
      console.error('Error cargando presupuesto:', error)
      return
    }

    setPresupuestoDiario(Number(data.presupuesto_diario))
  }

  // =========================
  // CARGAR GASTOS
  // =========================

async function cargarGastos() {
  const { data, error } = await supabase
    .from('gastos')
    .select(`
      id,
      persona,
      concepto,
      importe,
      fecha_hora,
      categoria_id
    `)
    .order('fecha_hora', { ascending: false })

  if (error) {
    console.error('Error cargando gastos:', error)
    return
  }

  setGastos(data ?? [])
}
  async function cargarGastosHoy() {
  const ahora = new Date()

  const inicioDia = new Date(
    ahora.getFullYear(),
    ahora.getMonth(),
    ahora.getDate(),
    0,
    0,
    0,
    0
  )

  const finDia = new Date(
    ahora.getFullYear(),
    ahora.getMonth(),
    ahora.getDate() + 1,
    0,
    0,
    0,
    0
  )

  const { data, error } = await supabase
    .from('gastos')
    .select(`
      id,
      persona,
      concepto,
      importe,
      fecha_hora,
      categoria_id
    `)
    .gte('fecha_hora', inicioDia.toISOString())
    .lt('fecha_hora', finDia.toISOString())
    .order('fecha_hora', { ascending: false })

  if (error) {
    console.error('Error cargando gastos de hoy:', error)
    return
  }

  setGastosHoy(data ?? [])
}
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
 // =========================
  // CARGAR CATEGORIAS
  // =========================

async function cargarCategorias(familiaId: number) {
  const { data, error } = await supabase
    .from('categorias')
    .select('*')
    .eq('familia_id', familiaId)
    .eq('activa', true)
    .order('orden', { ascending: true })

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
  // =========================
  // CARGAR TODOS LOS DATOS DEL USUARIO
  // =========================

  async function cargarDatosUsuario() {
    const miembro = await obtenerFamiliaUsuario()

    if (!miembro) {
      console.error('No se ha encontrado la familia del usuario')
      return
    }

    await Promise.all([
      cargarPresupuesto(miembro.familia_id),
      cargarCategorias(miembro.familia_id),
      cargarGastos(),
      cargarGastosHoy(),
    ])
  }
function formatearFecha(fechaTexto: string) {
  const fecha = new Date(fechaTexto)
  const hoy = new Date()

  const esHoy =
    fecha.getFullYear() === hoy.getFullYear() &&
    fecha.getMonth() === hoy.getMonth() &&
    fecha.getDate() === hoy.getDate()

  const ayer = new Date(hoy)
  ayer.setDate(hoy.getDate() - 1)

  const esAyer =
    fecha.getFullYear() === ayer.getFullYear() &&
    fecha.getMonth() === ayer.getMonth() &&
    fecha.getDate() === ayer.getDate()

  const hora = fecha.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  })

  if (esHoy) {
    return `Hoy ${hora}`
  }

  if (esAyer) {
    return `Ayer ${hora}`
  }

  return fecha.toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

  // =========================
  // GUARDAR GASTO
  // =========================
async function borrarGasto(gasto: Gasto) {
  const confirmar = window.confirm(
    `¿Quieres borrar el gasto "${gasto.concepto}" de ${Number(
      gasto.importe
    ).toFixed(2)} €?`
  )

  if (!confirmar) {
    return
  }

  const { error } = await supabase
    .from('gastos')
    .delete()
    .eq('id', gasto.id)

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
    const { error } = await supabase
      .from('gastos')
      .update({
        categoria_id: Number(categoriaId),
        concepto: concepto.trim() || 'Sin concepto',
        importe: importeNumero,
      })
      .eq('id', gastoEditando.id)

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

    const { error } = await supabase
      .from('gastos')
      .insert({
        familia_id: miembro.familia_id,
        usuario_id: usuario.id,
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

  await Promise.all([
    cargarGastos(),
    cargarGastosHoy(),
  ])
}

  // =========================
  // PANTALLA DE CARGA
  // =========================

  if (cargandoSesion) {
    return (
      <div className="app">
        <div className="container">
          <section className="card">
            <h1>Gastos Familia</h1>
            <p>Cargando...</p>
          </section>
        </div>
      </div>
    )
  }

  // =========================
  // LOGIN
  // =========================

  if (!usuario) {
    return (
      <div className="app">
        <div className="container">
          <section className="card">
            <h1>Gastos Familia</h1>

            <label>Email</label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <label>Contraseña</label>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button onClick={iniciarSesion}>
              Entrar
            </button>
          </section>
        </div>
      </div>
    )
  }

  // =========================
  // APLICACIÓN PRINCIPAL
  // =========================

  return (
    <div className="app">
      <div className="container">

        <h1>Gastos Familia</h1>

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

        {mostrarFormulario && (

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
              onClick={() => {
                setMostrarFormulario(false)
                setGastoEditando(null)
                setImporte('')
                setConcepto('')
                setCategoriaId('')
              }}
            >
              Cancelar
            </button>

          </section>

        )}

        <section className="card">

          <h2>Últimos movimientos</h2>

          {gastos.length === 0 && (
            <p>No hay gastos registrados.</p>
          )}
{gastoSeleccionado && (

  <div
    className="modal-fondo"
    onClick={() => setGastoSeleccionado(null)}
  >

    <div
      className="modal-card"
      onClick={(e) => e.stopPropagation()}
    >

      <h2>Detalle del gasto</h2>

      <div className="detalle-gasto">

        <div>
          <span>Persona</span>
          <strong>
            {gastoSeleccionado.persona}
          </strong>
        </div>

        <div>
          <span>Categoría</span>
          <strong>
            {obtenerNombreCategoria(
              gastoSeleccionado.categoria_id
            )}
          </strong>
        </div>

        <div>
          <span>Concepto</span>
          <strong>
            {gastoSeleccionado.concepto}
          </strong>
        </div>

        <div>
          <span>Fecha</span>
          <strong>
            {formatearFecha(
              gastoSeleccionado.fecha_hora
            )}
          </strong>
        </div>

        <div>
          <span>Importe</span>
          <strong className="detalle-importe">
            {Number(
              gastoSeleccionado.importe
            ).toFixed(2)} €
          </strong>
        </div>

      </div>

      <button
        onClick={() => {
          editarGasto(gastoSeleccionado)
          setGastoSeleccionado(null)
        }}
      >
        Editar
      </button>

      <button
        className="boton-borrar-modal"
        onClick={async () => {
          await borrarGasto(gastoSeleccionado)
          setGastoSeleccionado(null)
        }}
      >
        Borrar
      </button>

      <button
        className="boton-secundario"
        onClick={() => setGastoSeleccionado(null)}
      >
        Cerrar
      </button>

    </div>

  </div>

)}
{gastos.map((gasto) => (

  <div
    className="movimiento movimiento-clickable"
    key={gasto.id}
    onClick={() => setGastoSeleccionado(gasto)}
  >

    <div>

      <strong>
        {gasto.persona}
      </strong>

      <span className="categoria-gasto">
        {obtenerNombreCategoria(gasto.categoria_id)}
      </span>

      <span>
        {gasto.concepto}
      </span>

      <span className="fecha-gasto">
        {formatearFecha(gasto.fecha_hora)}
      </span>

    </div>

    <div className="movimiento-importe">
      {Number(gasto.importe).toFixed(2)} €
    </div>

  </div>

))}

        </section>

      </div>
    </div>
  )
}

export default App