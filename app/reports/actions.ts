"use server"

import { createClient } from "@/lib/supabase/server"
import type { Database } from "@/lib/types" // Assuming your generated types are here
import { z } from "zod"

type ReportedContentType = Database["public"]["Enums"]["reported_content_type_enum"]

const reportContentSchema = z.object({
  contentId: z.string().uuid("Invalid content ID format."),
  contentType: z.enum(["comment", "post", "project", "user_profile"] as const), // Keep in sync with ENUM
  reason: z
    .string()
    .min(10, "Reason must be at least 10 characters.")
    .max(1000, "Reason cannot exceed 1000 characters."),
})

interface ReportContentActionState {
  success: boolean
  message: string
  errors?: Partial<Record<keyof z.infer<typeof reportContentSchema> | "form", string>>
}

export async function reportContentAction(
  prevState: ReportContentActionState,
  formData: FormData,
): Promise<ReportContentActionState> {
  const supabase = createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, message: "You must be logged in to report content." }
  }

  const rawData = {
    contentId: formData.get("contentId"),
    contentType: formData.get("contentType"),
    reason: formData.get("reason"),
  }

  const validatedFields = reportContentSchema.safeParse(rawData)

  if (!validatedFields.success) {
    const fieldErrors: ReportContentActionState["errors"] = {}
    for (const issue of validatedFields.error.issues) {
      fieldErrors[issue.path[0] as keyof z.infer<typeof reportContentSchema>] = issue.message
    }
    return {
      success: false,
      message: "Validation failed. Please check your input.",
      errors: fieldErrors,
    }
  }

  const { contentId, contentType, reason } = validatedFields.data

  // Check if the user is trying to report their own content (optional, based on policy)
  // For comments, this might involve fetching the comment to check its author_id.
  // For now, we'll allow self-reporting as it might be a way to flag accidental problematic content.

  // Check for existing pending report by the same user for the same content
  const { data: existingReport, error: existingReportError } = await supabase
    .from("reported_content")
    .select("id")
    .eq("reporter_id", user.id)
    .eq("content_id", contentId)
    .eq("content_type", contentType as ReportedContentType)
    .eq("status", "pending_review")
    .maybeSingle()

  if (existingReportError) {
    console.error("Error checking for existing report:", existingReportError)
    return { success: false, message: "Could not submit report. Please try again." }
  }

  if (existingReport) {
    return { success: false, message: "You have already reported this content, and it is pending review." }
  }

  const { error: insertError } = await supabase.from("reported_content").insert({
    reporter_id: user.id,
    content_id: contentId,
    content_type: contentType as ReportedContentType,
    reason: reason,
    status: "pending_review",
  })

  if (insertError) {
    console.error("Error inserting report:", insertError)
    // Handle specific errors like unique constraint violation if not caught by the above check
    if (insertError.code === "23505") {
      // unique_violation
      return { success: false, message: "You have already reported this content, and it is pending review." }
    }
    return { success: false, message: "Failed to submit report. Please try again later." }
  }

  // Optionally, revalidate paths if reports are displayed somewhere publicly (unlikely for pending reports)
  // Revalidate admin paths if an admin dashboard shows new reports immediately.
  // For now, no revalidation needed for the user submitting.

  // Consider sending an email/notification to admins about the new report. (Future enhancement)

  return { success: true, message: "Content reported successfully. Our team will review it shortly." }
}
