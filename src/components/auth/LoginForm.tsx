type Props = {
  email: string
  password: string
  setEmail: (value: string) => void
  setPassword: (value: string) => void
  iniciarSesion: () => Promise<void>
}

export function LoginForm({ email, password, setEmail, setPassword, iniciarSesion }: Props) {
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
