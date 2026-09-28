import { supabase } from '../lib/supabase'

export function consultarMiembro(usuarioId: string) {
  return supabase
    .from('miembros_familia')
    .select('familia_id, nombre, rol, activo')
    .eq('usuario_id', usuarioId)
    .single()
}
