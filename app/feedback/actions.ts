"use server"

import { z } from "zod"
import { Resend } from "resend"
import { siteConfig } from "@/lib/site-config"

const resend = new Resend(process.env.RESEND_API_KEY)

// Export the schema so it can be used on the client
export const feedbackSchema = z.object({
  feedbackType: z.string().min(1, "Feedback type is required"),
  pageUrl: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  description: z.string().min(10, "Description must be at least 10 characters long"),
  email: z.string().email("Please enter a valid email address").optional().or(z.literal("")),
})

export type FeedbackFormData = z.infer<typeof feedbackSchema>

export interface FeedbackFormState {
  message: string
  type: "success" | "error" | null
  errors?: {
    // This will now primarily be for server-side/action errors, not Zod field errors
    feedbackType?: string[]
    pageUrl?: string[]
    description?: string[]
    email?: string[]
    _action?: string[] // For general action errors
  }
}

export async function submitFeedback(prevState: FeedbackFormState, formData: FormData): Promise<FeedbackFormState> {
  if (!process.env.RESEND_API_KEY) {
    console.error("RESEND_API_KEY is not set. Email will not be sent.")
    return {
      message: "Feedback submission is currently unavailable. Please try again later.",
      type: "error",
      errors: { _action: ["Server configuration error."] },
    }
  }

  const rawFormData = {
    feedbackType: formData.get("feedbackType"),
    pageUrl: formData.get("pageUrl"),
    description: formData.get("description"),
    email: formData.get("email"),
  }

  const validatedFields = feedbackSchema.safeParse(rawFormData)

  if (!validatedFields.success) {
    // This case should ideally not be hit if client-side validation is working,
    // but it's a good fallback.
    return {
      message: "Invalid data submitted. Please check the form.",
      type: "error",
      // react-hook-form handles field errors on client, so this is more for unexpected server validation failure
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }

  const { feedbackType, pageUrl, description, email: submitterEmail } = validatedFields.data

  const recipientEmail = siteConfig.feedbackRecipientEmail
  if (!recipientEmail) {
    console.error("feedbackRecipientEmail is not set in siteConfig. Email will not be sent.")
    return {
      message: "Feedback system configuration error. Please contact support.",
      type: "error",
      errors: { _action: ["System configuration error."] },
    }
  }

  const subject = `New Feedback: ${feedbackType} - ${siteConfig.name}`
  const body = `
    <h2>New Feedback Received</h2>
    <p><strong>Feedback Type:</strong> ${feedbackType}</p>
    <p><strong>Page URL:</strong> ${pageUrl || "N/A"}</p>
    <p><strong>Description:</strong></p>
    <p>${description.replace(/\n/g, "<br>")}</p>
    <p><strong>Submitter's Email:</strong> ${submitterEmail || "Not provided"}</p>
    <hr>
    <p>This feedback was submitted via the ${siteConfig.name} website.</p>
  `

  try {
    const { data, error } = await resend.emails.send({
      from: `${siteConfig.name} Feedback <feedback@${siteConfig.domain}>`,
      to: [recipientEmail],
      subject: subject,
      html: body,
      reply_to: submitterEmail || undefined,
    })

    if (error) {
      console.error("Resend error:", error)
      return {
        message: `Error sending feedback: ${error.message}`,
        type: "error",
        errors: { _action: [error.message] },
      }
    }

    console.log("Feedback email sent successfully:", data)
    return {
      message: "Thank you for your feedback! We've received your submission.",
      type: "success",
    }
  } catch (e: unknown) {
    const error = e as Error
    console.error("Error submitting feedback:", error)
    return {
      message: `An unexpected error occurred: ${error.message}`,
      type: "error",
      errors: { _action: [error.message] },
    }
  }
}
