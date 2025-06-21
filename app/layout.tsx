import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Toaster } from "sonner"
import { UserProvider } from "@/app/contexts/UserContext"
// ThemeProvider removed
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/server"
import type { UserProfile } from "@/lib/types"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Astro Micro Clone",
  description: "A clone of the Astro Micro blog template, built with Next.js.",
    generator: 'v0.dev'
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  let initialProfile: UserProfile | null = null
  if (session?.user) {
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single<UserProfile>()
    initialProfile = profileData
  }

  return (
    // suppressHydrationWarning can likely be removed if next-themes was the main reason for it
    <html lang="en">
      <body className={cn("min-h-screen bg-background font-sans antialiased", inter.className)}>
        {/* ThemeProvider removed */}
        <UserProvider initialUser={session?.user ?? null} initialProfile={initialProfile}>
          <div className="relative flex min-h-dvh flex-col bg-background">
            <SiteHeader />
            <main className="flex-1">{children}</main>
            <SiteFooter />
          </div>
          <Toaster />
        </UserProvider>
        {/* ThemeProvider removed */}
      </body>
    </html>
  )
}
