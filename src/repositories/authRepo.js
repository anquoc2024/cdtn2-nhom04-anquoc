import { supabase } from '../lib/supabaseClient'

// Truy cập Supabase Auth và bảng profiles
export const authRepo = {
  signUp: (email, password, meta) => supabase.auth.signUp({ email, password, options: { data: meta } }),
  signIn: (email, password) => supabase.auth.signInWithPassword({ email, password }),
  signOut: () => supabase.auth.signOut(),
  getSession: () => supabase.auth.getSession(),
  onChange: (cb) => supabase.auth.onAuthStateChange(cb),
  updatePassword: (password) => supabase.auth.updateUser({ password }),
  getProfile: (id) => supabase.from('profiles').select('*').eq('id', id).single(),
  updateProfile: (id, patch) => supabase.from('profiles').update(patch).eq('id', id).select().single(),
}
