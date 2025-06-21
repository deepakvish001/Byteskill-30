import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getUserProfile } from "@/app/me/profile/actions"
import { getBookmarkedItems, getSeriesProgressForUser } from "./actions"
import { DashboardClient } from "./DashboardClient"
import type { UserProfile } from "@/lib/types"

export default async function DashboardPage() {
  const supabase = createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login?message=Please log in to view your dashboard.")
  }

  const [profileResult, bookmarksResult, seriesProgressResult] = await Promise.all([
    getUserProfile(),
    getBookmarkedItems(),
    getSeriesProgressForUser(),
  ])

  if (profileResult.error) {
    console.error("Error fetching profile for dashboard:", profileResult.error)
    redirect("/login?message=Error loading your profile.")
  }

  const userProfile = profileResult.profile as UserProfile | null

  return (
    <DashboardClient
      userProfile={userProfile}
      bookmarkedItems={bookmarksResult.bookmarkedItems}
      seriesProgress={seriesProgressResult.seriesProgress}
      initialError={bookmarksResult.error || seriesProgressResult.error}
    />
  )
}
