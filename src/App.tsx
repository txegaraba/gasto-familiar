import { useState } from 'react'
import type { Gasto } from './types/dominio'
import { useAuth } from './hooks/useAuth'
import { useDatosFamilia } from './hooks/useDatosFamilia'
import { useFormularioGasto } from './hooks/useFormularioGasto'
import { PantallaCarga } from './components/PantallaCarga'
import { LoginForm } from './components/auth/LoginForm'
import { GastosPage } from './pages/GastosPage'

function App() {
  const auth = useAuth()
  const datos = useDatosFamilia(auth.usuario)
  // Los hooks permanecen montados al cambiar de pantalla, igual que el estado original.
  const formulario = useFormularioGasto(auth.usuario, datos.obtenerFamiliaUsuario, datos.recargarGastos)
  const [gastoSeleccionado, setGastoSeleccionado] = useState<Gasto | null>(null)

  if (auth.cargandoSesion) return <PantallaCarga />
  if (!auth.usuario) {
    return (
      <LoginForm
        email={auth.email}
        password={auth.password}
        setEmail={auth.setEmail}
        setPassword={auth.setPassword}
        iniciarSesion={auth.iniciarSesion}
      />
    )
  }

  return (
    <GastosPage
      datos={datos}
      formulario={formulario}
      gastoSeleccionado={gastoSeleccionado}
      setGastoSeleccionado={setGastoSeleccionado}
      cerrarSesion={auth.cerrarSesion}
    />
  )
}

export default App
