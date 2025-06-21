"use client"

import { Suspense } from "react"
import { AuthFormWrapper } from "@/components/auth/auth-form-wrapper"
import { createClient } from "@/lib/supabase/client"
import { Auth } from "@supabase/auth-ui-react"
import { ThemeSupa } from "@supabase/auth-ui-shared"
import type { Provider } from "@supabase/supabase-js"

export default function LoginPage() {
  const supabase = createClient()

  const getRedirectURL = () => {
    let url = process?.env?.NEXT_PUBLIC_SITE_URL ?? process?.env?.NEXT_PUBLIC_VERCEL_URL ?? "http://localhost:3000/"
    if (!url.startsWith("http")) url = `https://${url}`
    if (url.charAt(url.length - 1) !== "/") url = `${url}/`
    return `${url}auth/callback`
  }

  const handleOAuthSignIn = async (provider: Provider) => {
    // This function is now async to align with AuthFormWrapper's onGithubSignIn prop type
    // AuthFormWrapper will handle its own loading state for the GitHub button
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: getRedirectURL(),
      },
    })
  }

  return (
    <AuthFormWrapper
      title="Login to Your Account"
      description="Enter your credentials to access your dashboard."
      footerText="Don't have an account?"
      footerLinkHref="/signup"
      footerLinkText="Sign Up"
      showGithubLogin={true}
      onGithubSignIn={() => handleOAuthSignIn("github")}
    >
      <Suspense fallback={<div className="text-center text-neutral-400 py-4">Loading form...</div>}>
        <Auth
          supabaseClient={supabase}
          view="sign_in"
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: "rgb(34 197 94)", // Tailwind green-500
                  brandAccent: "rgb(22 163 74)", // Tailwind green-600
                  inputText: "rgb(209 213 219)", // neutral-300 for text
                  inputBackground: "rgb(55 65 81)", // neutral-700 for input bg
                  inputBorder: "rgb(75 85 99)", // neutral-600 for input border
                  inputPlaceholder: "rgb(107 114 128)", // neutral-500
                  messageText: "rgb(209 213 219)", // neutral-300
                  messageTextDanger: "rgb(239 68 68)", // red-500
                },
                radii: {
                  inputBorderRadius: "0.5rem", // Corresponds to --radius or rounded-md
                  buttonBorderRadius: "0.5rem",
                  containerBorderRadius: "0.5rem",
                },
              },
            },
          }}
          theme="dark"
          providers={[]}
          showLinks={true}
          // The password_forgotten view will use the PasswordInput if we customize it
          // For now, Supabase Auth UI handles its own password field.
          // If we wanted to replace it, we'd need to use the `fields` prop and provide custom components.
        />
      </Suspense>
    </AuthFormWrapper>
  )
}
