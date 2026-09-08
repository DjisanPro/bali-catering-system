/**
 * Supabase client configuration for Bali Catering Service.
 * This is the SINGLE SOURCE OF TRUTH for all database/auth/storage access.
 * 
 * Security: Only the anon/publishable key is used here (safe for browser).
 * Service role key is NEVER exposed to the frontend.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error(
    '[Bali] Supabase não configurado. Define VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no .env'
  );
}

let supabaseInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!supabaseInstance) {
    supabaseInstance = createClient(
      SUPABASE_URL || 'https://placeholder.supabase.co',
      SUPABASE_ANON_KEY || 'placeholder',
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: false,
        },
        db: {
          schema: 'public',
        },
      }
    );
  }
  return supabaseInstance;
}

export const supabase = getSupabase();
