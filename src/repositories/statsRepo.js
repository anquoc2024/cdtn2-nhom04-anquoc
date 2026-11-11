import { supabase } from '../lib/supabaseClient'

export const statsRepo = {
  get: (from, to) => supabase.rpc('get_stats', { p_from: from, p_to: to }),
}
