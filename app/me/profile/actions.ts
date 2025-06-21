"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import type { UpdateUserProfilePayload, UserProfile } from "@/lib/types"
import { deleteFileFromSupabase, uploadFileToSupabase } from "@/lib/supabase/storage"
import { awardReputation } from "@/lib/reputation" // Import reputation service

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"]

const profileUpdateSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters.")
    .max(30, "Username must be at most 30 characters.")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores.")
    .optional(),
  full_name: z.string().max(100, "Full name must be at most 100 characters.").optional().nullable(),
  bio: z.string().max(500, "Bio must be at most 500 characters.").optional().nullable(),
  website: z
    .string()
    .url("Invalid URL format.")
    .max(100, "Website URL too long.")
    .optional()
    .nullable()
    .or(z.literal("")),
  location: z.string().max(100, "Location too long.").optional().nullable(),
  company: z.string().max(100, "Company name too long.").optional().nullable(),
  job_title: z.string().max(100, "Job title too long.").optional().nullable(),
  github_username: z
    .string()
    .max(50, "GitHub username too long.")
    .regex(/^[a-zA-Z0-9-]+$/, { message: "Invalid GitHub username format." })
    .optional()
    .nullable(),
  twitter_username: z
    .string()
    .max(50, "Twitter username too long.")
    .regex(/^[a-zA-Z0-9_]+$/, { message: "Invalid Twitter username format (no @)." })
    .optional()
    .nullable(),
  linkedin_url: z
    .string()
    .url("Invalid LinkedIn URL.")
    .max(200, "LinkedIn URL too long.")
    .optional()
    .nullable()
    .or(z.literal("")),
  skills: z.string().optional().nullable(), // Comma-separated string from FormData
  interests: z.string().optional().nullable(), // Comma-separated string from FormData
  avatarFile: z
    .instanceof(File)
    .refine((file) => file.size <= MAX_FILE_SIZE, `Max image size is 5MB.`)
    .refine(
      (file) => ACCEPTED_IMAGE_TYPES.includes(file.type),
      "Only .jpg, .jpeg, .png, .webp and .gif formats are supported.",
    )
    .optional()
    .nullable(),
  notification_preferences: z.string().optional().nullable(), // JSON string from FormData
})

interface UpdateUserProfileActionState {
  success: boolean
  message: string
  errors?: Record<string, string[]>
  updatedProfile?: Partial<UserProfile>
}

export async function updateUserProfileAction(
  prevState: UpdateUserProfileActionState,
  formData: FormData,
): Promise<UpdateUserProfileActionState> {
  const supabase = createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, message: "You must be logged in to update your profile." }
  }

  // Fetch the current profile to compare against
  const { data: currentProfile, error: currentProfileError } = await supabase
    .from("profiles")
    .select("full_name, bio, avatar_url")
    .eq("id", user.id)
    .single()

  if (currentProfileError) {
    return { success: false, message: "Could not retrieve your current profile." }
  }

  const rawFormData: Record<string, any> = {}
  formData.forEach((value, key) => {
    if (key === "avatarFile" && value instanceof File && value.size > 0) {
      rawFormData[key] = value
    } else if (key !== "avatarFile") {
      rawFormData[key] = value
    }
  })

  const validatedFields = profileUpdateSchema.safeParse(rawFormData)

  if (!validatedFields.success) {
    console.error("Profile update validation errors:", validatedFields.error.flatten().fieldErrors)
    return {
      success: false,
      message: "Validation failed. Please check your input.",
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }

  const {
    avatarFile,
    skills: skillsString,
    interests: interestsString,
    notification_preferences: prefsString,
    ...profileData
  } = validatedFields.data

  const updatePayload: Partial<UpdateUserProfilePayload> = { ...profileData }

  if (skillsString) {
    updatePayload.skills = skillsString
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  } else if (formData.has("skills") && skillsString === "") {
    updatePayload.skills = []
  }

  if (interestsString) {
    updatePayload.interests = interestsString
      .split(",")
      .map((i) => i.trim())
      .filter(Boolean)
  } else if (formData.has("interests") && interestsString === "") {
    updatePayload.interests = []
  }

  if (prefsString) {
    try {
      const parsedPrefs = JSON.parse(prefsString)
      if (
        typeof parsedPrefs === "object" &&
        parsedPrefs !== null &&
        Object.values(parsedPrefs).every((val) => typeof val === "boolean")
      ) {
        updatePayload.notification_preferences = parsedPrefs
      } else {
        throw new Error("Invalid notification preferences format")
      }
    } catch (e) {
      console.error("Error parsing notification_preferences:", e)
      return { success: false, message: "Invalid notification preferences format." }
    }
  }

  if (avatarFile) {
    try {
      if (currentProfile?.avatar_url) {
        await deleteFileFromSupabase("avatars", currentProfile.avatar_url)
      }
      const avatarUrl = await uploadFileToSupabase(avatarFile, "avatars", user.id)
      updatePayload.avatar_url = avatarUrl
    } catch (error: any) {
      console.error("Avatar upload error:", error)
      return { success: false, message: `Avatar upload failed: ${error.message}` }
    }
  }

  Object.keys(updatePayload).forEach((key) => {
    const typedKey = key as keyof typeof updatePayload
    if (updatePayload[typedKey] === "") {
      if (
        [
          "website",
          "bio",
          "location",
          "company",
          "job_title",
          "github_username",
          "twitter_username",
          "linkedin_url",
        ].includes(key)
      ) {
        ;(updatePayload as any)[typedKey] = null
      }
    }
  })

  const { data: updatedProfileData, error: updateError } = await supabase
    .from("profiles")
    .update({ ...updatePayload, updated_at: new Date().toISOString() })
    .eq("id", user.id)
    .select()
    .single()

  if (updateError) {
    console.error("Profile update error:", updateError)
    let message = "Failed to update profile."
    if (updateError.code === "23505" && updateError.message.includes("profiles_username_key")) {
      message = "This username is already taken. Please choose another one."
      return { success: false, message, errors: { username: [message] } }
    }
    return { success: false, message }
  }

  // --- Award Reputation for Profile Completion ---
  const reputationPromises = []
  if (!currentProfile.full_name && updatedProfileData.full_name) {
    reputationPromises.push(awardReputation(supabase, user.id, "complete_profile_full_name"))
  }
  if (!currentProfile.bio && updatedProfileData.bio) {
    reputationPromises.push(awardReputation(supabase, user.id, "complete_profile_bio"))
  }
  if (!currentProfile.avatar_url && updatedProfileData.avatar_url) {
    reputationPromises.push(awardReputation(supabase, user.id, "complete_profile_avatar"))
  }
  // Fire and forget
  Promise.all(reputationPromises).catch((err) => console.error("Failed to award profile completion reputation:", err))
  // --- End Award Reputation ---

  revalidatePath("/me/profile")
  revalidatePath(`/u/${updatedProfileData.username}`)

  return {
    success: true,
    message: "Profile updated successfully!",
    updatedProfile: updatedProfileData as Partial<UserProfile>,
  }
}

interface DeleteAvatarActionState {
  success: boolean
  message: string
}

export async function deleteUserAvatarAction(
  prevState: DeleteAvatarActionState,
  formData: FormData,
): Promise<DeleteAvatarActionState> {
  const supabase = createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, message: "Authentication required." }
  }

  try {
    const { data: currentProfile, error: fetchError } = await supabase
      .from("profiles")
      .select("avatar_url, username")
      .eq("id", user.id)
      .single()

    if (fetchError || !currentProfile) {
      return { success: false, message: "Could not retrieve profile information." }
    }

    if (currentProfile.avatar_url) {
      await deleteFileFromSupabase("avatars", currentProfile.avatar_url)
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: null, updated_at: new Date().toISOString() })
        .eq("id", user.id)

      if (updateError) {
        throw updateError
      }
      revalidatePath("/me/profile")
      if (currentProfile.username) {
        revalidatePath(`/u/${currentProfile.username}`)
      }
      return { success: true, message: "Avatar removed successfully." }
    } else {
      return { success: false, message: "No avatar to remove." }
    }
  } catch (error: any) {
    console.error("Error deleting avatar:", error)
    return { success: false, message: `Failed to remove avatar: ${error.message}` }
  }
}

export async function getPublicProfileByUsername(
  username: string,
): Promise<{ profile: UserProfile | null; error?: string }> {
  const supabase = createClient()
  try {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select(
        "id, username, full_name, avatar_url, bio, website, created_at, location, company, job_title, github_username, twitter_username, linkedin_url, skills, interests, view_count, reputation_score",
      )
      .eq("username", username)
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        return { profile: null, error: "User not found." }
      }
      console.error("Error fetching public profile:", error.message)
      return { profile: null, error: error.message }
    }
    return { profile }
  } catch (e: any) {
    console.error("Unexpected error fetching public profile:", e.message)
    return { profile: null, error: "An unexpected error occurred." }
  }
}
