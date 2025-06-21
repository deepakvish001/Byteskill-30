"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client" // Use client-side Supabase
import { Chrome } from "lucide-react" // Using Chrome icon for Google
import type { Provider } from "@supabase/supabase-js"

interface OAuthButtonProps {
  provider: Provider
  label: string
  icon?: React.ReactNode
  redirectTo?: string // Optional: URL to redirect to after successful login
}

export function OAuthButton({ provider, label, icon, redirectTo }: OAuthButtonProps) {
  const supabase = createClient()

  const handleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: provider,
      options: {
        redirectTo: redirectTo || `${window.location.origin}/auth/callback`,
        // You can add scopes here if needed, e.g.,
        // scopes: 'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile',
      },
    })
    if (error) {
      console.error(`Error signing in with ${provider}:`, error.message)
      // Potentially show a toast notification to the user
      // toast({ title: "Sign-in Error", description: error.message, variant: "destructive" });
    }
  }

  return (
    <Button variant="outline" className="w-full" onClick={handleSignIn} type="button">
      {icon || (provider === "google" && <Chrome className="mr-2 h-4 w-4" />)}
      {label}
    </Button>
  )
}
