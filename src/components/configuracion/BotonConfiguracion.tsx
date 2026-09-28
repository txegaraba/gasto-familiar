type Props = {
  abrir: () => void
}

export function BotonConfiguracion({ abrir }: Props) {
  return (
    <button
      type="button"
      className="boton-configuracion"
      aria-label="Abrir configuración"
      title="Configuración"
      onClick={abrir}
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="m9.5 3-.5 2a8 8 0 0 0-1.5.9l-2-.6L3 9.7l1.5 1.4a8 8 0 0 0 0 1.8L3 14.3l2.5 4.4 2-.6A8 8 0 0 0 9 19l.5 2h5l.5-2a8 8 0 0 0 1.5-.9l2 .6 2.5-4.4-1.5-1.4a8 8 0 0 0 0-1.8L21 9.7l-2.5-4.4-2 .6A8 8 0 0 0 15 5l-.5-2z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    </button>
  )
}
