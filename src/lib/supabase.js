import { createClient } from '@supabase/supabase-js';

// Public browser configuration for the existing project. RLS and database functions enforce access.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://eqrpklxgnkgzbezlntsf.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_nOkZOCJEVEqcRURGcVyjfA_ZAKdg-ua';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;
