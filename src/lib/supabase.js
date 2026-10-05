import {createClient} from '@supabase/supabase-js'

const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID?.trim()
const explicitUrl = import.meta.env.VITE_SUPABASE_URL?.trim()
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim()

export const supabaseUrl = explicitUrl || (projectId ? `https://${projectId}.supabase.co` : '')
export const supabaseBucket = import.meta.env.VITE_SUPABASE_STORAGE_BUCKET?.trim() || 'portfolio'
export const isSupabaseConfigured = Boolean(supabaseUrl && publishableKey)

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, publishableKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    })
  : null

export const getPublicImageUrl = (storagePath) => {
  if (!storagePath || !supabase) return ''

  const {data} = supabase.storage
    .from(supabaseBucket)
    .getPublicUrl(storagePath)

  return data.publicUrl
}
