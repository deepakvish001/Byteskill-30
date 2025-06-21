import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { UserProvider } from "@/app/contexts/UserContext"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { ClientToaster } from "@/components/client-toaster"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/server" // Server client for initial fetch
import type { UserProfile } from "@/lib/types"
import { getAllPosts } from "@/lib/posts"
import { getAllProjects } from "@/lib/projects"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Astro Micro Clone",
  description: "A clone of the Astro Micro blog template, built with Next.js.",
    generator: 'v0.dev'
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient() // This is the server client from @/lib/supabase/server

  // Use supabase.auth.getUser() for server-side session fetching as recommended
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let initialProfile: UserProfile | null = null
  if (user) {
    const { data: profileData } = await supabase.from("profiles").select("*").eq("id", user.id).single<UserProfile>()
    initialProfile = profileData
  }

  const allPosts = getAllPosts()
  const allProjects = getAllProjects()

  return (
    <html lang="en">
      <body className={cn("min-h-screen bg-background font-sans antialiased", inter.className)}>
        {/* Pass the server-fetched user and profile to UserProvider */}
        <UserProvider initialUser={user ?? null} initialProfile={initialProfile}>
          <div className="relative flex min-h-dvh flex-col bg-background">
            <SiteHeader allPosts={allPosts} allProjects={allProjects} />
            <main className="flex-1">{children}</main>
            <SiteFooter />
          </div>
          <ClientToaster />
        </UserProvider>
      </body>
    </html>
  )
}
