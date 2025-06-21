"use server"

import { createClient } from "@/lib/supabase/server"
import type { SearchResultItem } from "@/lib/types"

interface SearchActionResult {
  success: boolean
  results?: SearchResultItem[]
  message?: string
}

export async function performSearchAction(query: string): Promise<SearchActionResult> {
  if (!query || query.trim().length < 2) {
    return { success: true, results: [] } // Or a message: "Search term too short"
  }

  const supabase = createClient()

  try {
    const { data, error } = await supabase.rpc("search_content", {
      search_term: query.trim(),
      result_limit: 15, // Adjust limit as needed
    })

    if (error) {
      console.error("Search RPC error:", error)
      return { success: false, message: `Search failed: ${error.message}` }
    }

    return { success: true, results: (data as SearchResultItem[]) || [] }
  } catch (e: any) {
    console.error("Unexpected error during search:", e)
    return { success: false, message: "An unexpected error occurred during search." }
  }
}
