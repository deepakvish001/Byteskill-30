import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import type { Database } from "@/lib/types"

export const createClient = () => createServerComponentClient<Database>({ cookies })

// Alias so existing imports using `createServerClient` keep working
export const createServerClient = createClient
