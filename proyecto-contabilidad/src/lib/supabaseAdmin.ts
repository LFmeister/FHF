import { createClient } from '@supabase/supabase-js'

// Server-side Supabase admin client using the Service Role key
// IMPORTANT: SUPABASE_SERVICE_ROLE_KEY must ONLY be used on the server.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string

if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
}

if (!serviceRoleKey) {
  // We do not throw here to avoid breaking the whole app at import time during build,
  // but routes importing this should handle the missing key.
  console.warn('Warning: SUPABASE_SERVICE_ROLE_KEY is not set. Admin API routes will fail with 500.')
}

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey || 'invalid-key')
