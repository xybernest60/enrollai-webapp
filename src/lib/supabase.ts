import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase URL or anonymous key.');
}

// This is the public client that can be used on the server or the client.
// It will use the anon key and RLS.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
