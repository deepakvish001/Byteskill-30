import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { SupabaseClient } from "@supabase/supabase-js"
// If you have generated database types, you can import them like this:
// import type { Database } from '@/lib/database.types';

// Define a unique key to store the client instance on the window object
const SUPABASE_CLIENT_SINGLETON_KEY = "__supabase_client_singleton_astro_micro_clone__"

// Extend the Window interface to inform TypeScript about our custom property
declare global {
  interface Window {
    [SUPABASE_CLIENT_SINGLETON_KEY]?: SupabaseClient // Use SupabaseClient<Database> if you have DB types
  }
}

export function createClient(): SupabaseClient {
  // Use SupabaseClient<Database> if you have DB types
  // This function is intended to be called only in a browser environment.
  // If window is not defined (e.g., during SSR attempts with this client),
  // this will error, which is correct as this client is for the browser.
  if (window[SUPABASE_CLIENT_SINGLETON_KEY]) {
    return window[SUPABASE_CLIENT_SINGLETON_KEY]!
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error(
      "Supabase environment variables NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required for the client-side client.",
    )
  }

  // Create the new Supabase client instance
  // Use createClientComponentClient<Database> if you have DB types
  const newSupabaseClient = createClientComponentClient({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  })

  // Store the instance on the window object
  window[SUPABASE_CLIENT_SINGLETON_KEY] = newSupabaseClient

  return newSupabaseClient
}
