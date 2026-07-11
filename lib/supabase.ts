import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// --- INI BAGIAN TAMBAHAN BUAT DEBUG ---
console.log("DEBUG - URL:", supabaseUrl);
console.log("DEBUG - KEY:", supabaseAnonKey);
// --------------------------------------

export const supabase = createClient(supabaseUrl, supabaseAnonKey)