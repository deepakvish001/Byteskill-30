"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server" // Server client for actions

interface MarkPostAsReadResult {
  success: boolean
  message?: string
  error?: string
}

export async function markPostAsReadInSeries(seriesSlug: string, postSlug: string): Promise<MarkPostAsReadResult> {
  if (!seriesSlug || !postSlug) {
    return { success: false, error: "Series slug and post slug are required." }
  }

  const supabase = createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { success: false, error: "User not authenticated." }
  }

  try {
    // Fetch existing progress first to handle array update correctly
    const { data: existingProgress, error: fetchError } = await supabase
      .from("series_progress")
      .select("read_posts_slugs")
      .eq("user_id", user.id)
      .eq("series_slug", seriesSlug)
      .single()

    if (fetchError && fetchError.code !== "PGRST116") {
      // PGRST116 means no rows found, which is fine for an upsert logic
      console.error("Error fetching series progress:", fetchError.message)
      return { success: false, error: "Failed to fetch existing progress." }
    }

    let updatedReadSlugs: string[]
    if (existingProgress) {
      // Record exists, update array if slug isn't already present
      if (existingProgress.read_posts_slugs.includes(postSlug)) {
        // Already marked as read, no update needed, but still success
        // console.log(`Post ${postSlug} already marked as read in series ${seriesSlug}.`)
        // Revalidate paths just in case, though data hasn't changed
        revalidatePath(`/series/${seriesSlug}`)
        revalidatePath(`/blog/${postSlug}`)
        revalidatePath("/me/dashboard") // For dashboard series progress
        return { success: true, message: "Post already marked as read." }
      }
      updatedReadSlugs = [...existingProgress.read_posts_slugs, postSlug]
    } else {
      // No record exists, create new array
      updatedReadSlugs = [postSlug]
    }

    const { error: upsertError } = await supabase.from("series_progress").upsert(
      {
        user_id: user.id,
        series_slug: seriesSlug,
        read_posts_slugs: updatedReadSlugs,
        // created_at and updated_at are handled by DB defaults/triggers
      },
      {
        onConflict: "user_id, series_slug", // Specify conflict target for upsert
      },
    )

    if (upsertError) {
      console.error("Error upserting series progress:", upsertError.message)
      return { success: false, error: "Failed to update series progress." }
    }

    // Revalidate paths to ensure UI updates
    revalidatePath(`/series/${seriesSlug}`) // Series page
    revalidatePath(`/blog/${postSlug}`) // Current blog post page
    revalidatePath("/me/dashboard") // For dashboard series progress

    return { success: true, message: "Series progress updated." }
  } catch (e: any) {
    console.error("Unexpected error in markPostAsReadInSeries:", e.message)
    return { success: false, error: "An unexpected error occurred." }
  }
}
