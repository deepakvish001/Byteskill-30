import { Suspense } from "react"
import { AuthFormWrapper } from "@/components/auth/auth-form-wrapper"
import SignupForm from "./signup-form"
import { createClient } from "@/lib/supabase/client"
import type { Provider } from "@supabase/supabase-js"

export default function SignupPage() {
  const supabase = createClient()

  const getRedirectURL = () => {
    let url = process?.env?.NEXT_PUBLIC_SITE_URL ?? process?.env?.NEXT_PUBLIC_VERCEL_URL ?? "http://localhost:3000/"
    // Make sure to include `https://` when not localhost.
    if (!url.startsWith("http") && !url.includes("localhost")) url = `https://${url}`
    // Make sure to include a trailing `/`.
    if (url.charAt(url.length - 1) !== "/") url = `${url}/`
    return `${url}auth/callback`
  }

  const handleOAuthSignIn = async (provider: Provider) => {
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: getRedirectURL(),
      },
    })
  }

  return (
    <AuthFormWrapper
      title="Create an Account"
      description="Enter your details below to create your account."
      footerText="Already have an account?"
      footerLinkHref="/login"
      footerLinkText="Log In"
      showGithubLogin={true}
      onGithubSignIn={() => handleOAuthSignIn("github")}
    >
      <Suspense fallback={<div className="text-center text-neutral-400 py-4">Loading form...</div>}>
        <SignupForm />
      </Suspense>
    </AuthFormWrapper>
  )
}
