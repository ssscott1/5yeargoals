import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://mxjxmwgndrhatzvjjsdq.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_8RlwRVedYaTkvBXtHRC3Wg__3eGs3Kn'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL ?? SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY ?? SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
)
