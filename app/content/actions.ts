"use server"

import { createClient } from "@/lib/supabase/server"
import type { Database } from "@/lib/types"
import { Ratelimit } from "@upstash/ratelimit"
import { kv } from "@vercel/kv"
import { headers } from "next/headers"
import { revalidatePath } from "next/cache"

const ratelimit = new Ratelimit({
  redis: kv,
  // Allow 5 requests from the same IP in a 10 second window
  limiter: Ratelimit.slidingWindow(5, "10 s"),
  analytics: true,
  prefix: "@upstash/ratelimit_content_view",
})

export async function incrementViewCount(
  itemId: string,
  itemType: "post" | "project",
): Promise<{ success: boolean; error?: string; newViewCount?: number }> {
  const ip = headers().get("x-forwarded-for") ?? "127.0.0.1"

  // Check if this IP has already viewed this specific item recently
  // We use a composite key: `view:${itemType}:${itemId}:${ip}`
  const viewKey = `view:${itemType}:${itemId}:${ip}`
  const alreadyViewed = await kv.get(viewKey)

  if (alreadyViewed) {
    // console.log(`User ${ip} already viewed ${itemType} ${itemId} recently. Not incrementing.`);
    // Optionally, you might still want to fetch and return the current view count
    // For simplicity, we'll just return success false or a specific status.
    // Or, fetch the current count without incrementing.
    const supabase = createClient()
    const tableName = itemType === "post" ? "posts" : "projects"
    const { data: currentItem, error: fetchError } = await supabase
      .from(tableName)
      .select("view_count")
      .eq("id", itemId)
      .single()

    if (fetchError || !currentItem) {
      return { success: false, error: `Failed to fetch current view count: ${fetchError?.message}` }
    }
    return { success: true, newViewCount: currentItem.view_count || 0 } // Return current count
  }

  // Rate limit general view increments per IP
  const { success: rateLimitSuccess, limit, remaining, reset } = await ratelimit.limit(`view_increment:${ip}`)

  if (!rateLimitSuccess) {
    return { success: false, error: "Rate limit exceeded. Try again later." }
  }

  const supabase = createClient<Database>()
  const tableName = itemType === "post" ? "posts" : "projects"

  // Use an RPC call to an SQL function for atomic increment
  // This is generally safer than read-modify-write from the app server
  const { error: rpcError } = await supabase.rpc("increment_view_count", {
    item_id_param: itemId,
    item_type_param: itemType,
  })

  if (rpcError) {
    console.error(`Error incrementing view count for ${itemType} ${itemId}:`, rpcError)
    return { success: false, error: rpcError.message }
  }

  // After successful increment, fetch the new view count
  const { data: updatedItem, error: fetchUpdatedError } = await supabase
    .from(tableName)
    .select("view_count, slug") // also fetch slug for revalidation
    .eq("id", itemId)
    .single()

  if (fetchUpdatedError || !updatedItem) {
    console.error(`Error fetching updated view count for ${itemType} ${itemId}:`, fetchUpdatedError)
    // Increment might have succeeded, but fetching failed.
    // This is a tricky state. For now, report success but without new count.
    return { success: true }
  }

  // Mark this IP as having viewed this item for a period (e.g., 1 hour)
  // to prevent multiple increments from the same user refreshing quickly.
  await kv.set(viewKey, "viewed", { ex: 3600 }) // Expires in 1 hour

  // Revalidate the path for the specific post or project
  const path = itemType === "post" ? `/blog/${updatedItem.slug}` : `/projects/${updatedItem.slug}`
  revalidatePath(path)
  if (itemType === "post") revalidatePath("/blog") // Revalidate blog listing
  if (itemType === "project") revalidatePath("/projects") // Revalidate projects listing

  return { success: true, newViewCount: updatedItem.view_count || 0 }
}
