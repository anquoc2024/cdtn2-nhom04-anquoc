import { supabase } from '../lib/supabaseClient'

export const userRepo = {
  list: ({ q, status, page, limit }) => {
    let query = supabase.from('profiles').select('*', { count: 'exact' }).order('created_at', { ascending: false })
    if (q) query = query.or(`full_name.ilike.%${q}%,phone.ilike.%${q}%,email.ilike.%${q}%`)
    if (status === 'locked') query = query.eq('is_locked', true)
    if (status === 'active') query = query.eq('is_locked', false)
    if (status === 'admin') query = query.eq('role', 'admin')
    return query.range((page - 1) * limit, page * limit - 1)
  },
  update: (id, patch) => supabase.from('profiles').update(patch).eq('id', id).select().single(),
  setLocked: (id, locked) => supabase.rpc('set_user_locked', { p_user_id: id, p_locked: locked }),
  setAdmin: (id, isAdmin) => supabase.rpc('set_admin_role', { p_user_id: id, p_is_admin: isAdmin }),
  findByPhone: (phone) => supabase.from('profiles').select('id, full_name, phone, email').eq('phone', phone).maybeSingle(),
}
