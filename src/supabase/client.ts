import { createClient } from '@supabase/supabase-js';
import { Database } from '../../database.types';

// Initialize the Supabase client with anonymous access (no auth)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL or Anon Key is missing!');
}

// Create a Supabase client with the anon key which provides anonymous access
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // Disable session persistence
    autoRefreshToken: false, // Disable token auto-refresh
  },
});

// Helper function to check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  return !!supabaseUrl && !!supabaseAnonKey;
}; 