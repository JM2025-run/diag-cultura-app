import { createClient } from '@supabase/supabase-js'

// FIX: Reverted to Vite's standard `import.meta.env` for accessing environment variables.
// The previous use of `process.env` was incorrect for a client-side build environment and caused build failures.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL and Anon Key must be provided in environment variables.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);