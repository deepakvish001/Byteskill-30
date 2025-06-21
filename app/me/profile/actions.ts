"use server"

import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import { createServerClient } from "@/lib/supabase/server"
import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"
import type { UpdateUserProfilePayload, UserProfile } from "@/lib/types"

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

const checkedBucket = { done: false }

async function ensureAvatarBucketExists() {
  if (checkedBucket.done) return
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return

  try {
    const admin = createSupabaseAdminClient<Database>(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
    const { data: buckets, error: listErr } = await admin.storage.listBuckets()
    if (listErr) throw listErr

    const found = buckets?.some((b) => b.name === "avatars")
    if (!found) {
      const { error: createErr } = await admin.storage.createBucket("avatars", { public: true })
      if (createErr) throw createErr
    }
    checkedBucket.done = true
  } catch (error) {
    console.error("Error ensuring avatar bucket exists:", error)
    // Don't throw here, allow the upload to attempt and fail with a clearer message
  }
}

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9.\-_]/g, "_")
}

// ---------------------------------------------------------------------------
//  READ helpers – used by /me/dashboard, /u/[username], etc.
// ---------------------------------------------------------------------------

/** Return the signed-in user’s profile or an error string */
export async function getUserProfile(): Promise<{
  profile: UserProfile | null
  error?: string
}> {
  const cookieStore = cookies()
  const supabase = createServerClient<Database>(cookieStore)

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser()

  if (userErr || !user) {
    return { profile: null, error: "User not authenticated." }
  }

  try {
    const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single()

    if (error) {
      return { profile: null, error: error.message || "Failed to fetch profile." }
    }

    return { profile: data as UserProfile }
  } catch (e: any) {
    console.error("Unexpected error fetching profile:", e)
    return { profile: null, error: "Unexpected error." }
  }
}

/** Public lookup by username (used for /u/[username] pages) */
export async function getPublicProfileByUsername(
  username: string,
): Promise<{ profile: Partial<UserProfile> | null; error?: string }> {
  const cookieStore = cookies()
  const supabase = createServerClient<Database>(cookieStore)

  if (!username) {
    return { profile: null, error: "Username is required." }
  }

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("username, full_name, avatar_url, website, created_at, bio, mobile_number")
      .eq("username", username)
      .single()

    if (error) {
      return { profile: null, error: error.message || "Failed to fetch profile." }
    }

    return { profile: data }
  } catch (e: any) {
    console.error("Unexpected error fetching public profile:", e)
    return { profile: null, error: "Unexpected error." }
  }
}

/* -------------------------------------------------------------------------- */
/*  Server Action                                                             */
/* -------------------------------------------------------------------------- */

export async function updateUserProfile(
  payload: UpdateUserProfilePayload,
): Promise<{ success: true; data: UserProfile } | { success: false; error?: string; errors?: { message: string }[] }> {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient<Database>(cookieStore)

    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser()

    if (userErr || !user) {
      return { success: false, error: "Not authenticated" }
    }

    let avatar_url: string | undefined

    if (payload.avatarFile) {
      await ensureAvatarBucketExists()
      const safeName = sanitizeFileName(payload.avatarFile.name)
      const fileName = `${user.id}/${Date.now()}_${safeName}`

      const { error: uploadErr } = await supabase.storage
        .from("avatars")
        .upload(fileName, payload.avatarFile, { upsert: true, cacheControl: "3600" })

      if (uploadErr) {
        console.error("Error uploading avatar:", uploadErr)
        return { success: false, error: `Avatar upload failed: ${uploadErr.message}` }
      }

      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(fileName)
      if (!urlData || !urlData.publicUrl) {
        return { success: false, error: "Failed to get public URL for avatar." }
      }
      avatar_url = urlData.publicUrl
    }

    const updates: Record<string, unknown> = {}
    if (payload.username !== undefined) updates.username = payload.username
    if (payload.full_name !== undefined) updates.full_name = payload.full_name
    if (payload.website !== undefined) updates.website = payload.website
    if (payload.bio !== undefined) updates.bio = payload.bio
    if (payload.mobile_number !== undefined) updates.mobile_number = payload.mobile_number
    if (avatar_url) updates.avatar_url = avatar_url

    if (Object.keys(updates).length === 0) {
      return {
        success: true,
        data: (await supabase.from("profiles").select().eq("id", user.id).single()).data as UserProfile,
      }
    }

    updates.updated_at = new Date().toISOString()

    const { data, error } = await supabase.from("profiles").update(updates).eq("id", user.id).select().single()

    if (error) {
      console.error("Error updating profile in DB:", error)
      return { success: false, error: `Database error: ${error.message}` }
    }

    revalidatePath("/me/profile")
    if (updates.username) {
      revalidatePath(`/u/${updates.username}`)
    }
    revalidatePath("/app/layout", "layout")

    return { success: true, data: data as UserProfile }
  } catch (e: any) {
    console.error("Unhandled error in updateUserProfile:", e)
    return { success: false, error: `An unexpected server error occurred: ${e.message}` }
  }
}
