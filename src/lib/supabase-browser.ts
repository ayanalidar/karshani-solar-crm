import { createClient } from "@supabase/supabase-js";

// Browser-side Supabase client using the ANON key (NEXT_PUBLIC_ prefix
// exposes it to the browser — this is safe, anon key is public by design
// and protected by Row Level Security on the database).
//
// Used only for Realtime subscriptions (listening to DB changes).
// All mutations still go through our own /api/* routes (cookie auth).
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        realtime: {
          params: {
            eventsPerSecond: 2,
          },
        },
      })
    : null;

export const isSupabaseConfigured = Boolean(supabase);
