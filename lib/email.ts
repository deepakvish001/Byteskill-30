import { Resend } from "resend"
import type { ReactElement } from "react"
import { render } from "@react-email/render" // To render React components to HTML for email

const resend = new Resend(process.env.RESEND_API_KEY)
const fromEmail = process.env.EMAIL_FROM_ADDRESS
const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "Your Site Name" // Add NEXT_PUBLIC_SITE_NAME to your env

interface SendEmailOptions {
  to: string
  subject: string
  react: ReactElement
  text?: string // Optional plain text version
}

export async function sendEmail({ to, subject, react, text }: SendEmailOptions) {
  if (!fromEmail) {
    console.error("EMAIL_FROM_ADDRESS is not set. Email sending is disabled.")
    // In a real app, you might throw an error or handle this more gracefully
    return { success: false, error: "Email 'from' address not configured." }
  }
  if (!process.env.RESEND_API_KEY) {
    console.error("RESEND_API_KEY is not set. Email sending is disabled.")
    return { success: false, error: "Resend API key not configured." }
  }

  const htmlContent = render(react)

  try {
    const { data, error } = await resend.emails.send({
      from: `${siteName} <${fromEmail}>`,
      to: [to],
      subject: subject,
      html: htmlContent,
      text: text, // Optional: provide a plain text version for email clients that don't render HTML
    })

    if (error) {
      console.error("Error sending email:", error)
      return { success: false, error: error.message }
    }

    console.log("Email sent successfully:", data)
    return { success: true, data }
  } catch (exception) {
    console.error("Exception sending email:", exception)
    const errorMessage = exception instanceof Error ? exception.message : "Unknown error"
    return { success: false, error: errorMessage }
  }
}
