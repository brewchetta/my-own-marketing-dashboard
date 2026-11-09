import "server-only";
import { createClient } from "@supabase/supabase-js";

// Server-side Supabase client. Uses the secret key, so it must never be
// imported from a Client Component ("server-only" enforces that at build time).
export function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!url || !secretKey) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_SECRET_KEY. Add them to .env.local (see .env.example).",
    );
  }

  return createClient(url, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
