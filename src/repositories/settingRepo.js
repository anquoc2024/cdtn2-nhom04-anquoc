import { supabase } from '../lib/supabaseClient'

export const settingRepo = {
  get: () => supabase.from('store_settings').select('*').eq('id', 1).single(),
  update: (patch) => supabase.from('store_settings').update(patch).eq('id', 1).select().single(),
  blocked: (fromDate) => supabase.from('blocked_slots').select('*').gte('end_date', fromDate).order('start_date'),
  addBlocked: (row) => supabase.from('blocked_slots').insert(row).select().single(),
  removeBlocked: (id) => supabase.from('blocked_slots').delete().eq('id', id),
}
