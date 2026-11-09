import { supabase } from '../lib/supabaseClient'

const BUCKET = 'images'

export const storageRepo = {
  upload: async (path, file) => {
    const res = await supabase.storage.from(BUCKET).upload(path, file, { cacheControl: '3600', upsert: false })
    if (res.error) return res
    return { data: supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl, error: null }
  },
}
