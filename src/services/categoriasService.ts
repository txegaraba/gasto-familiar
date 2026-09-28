import { supabase } from '../lib/supabase'

export function consultarCategorias(familiaId: number) {
  return supabase
    .from('categorias')
    .select('*')
    .eq('familia_id', familiaId)
    .eq('activa', true)
    .order('orden', { ascending: true })
}
