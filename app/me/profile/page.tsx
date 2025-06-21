import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import ProfileForm from "./profile-form" // Corrected import
import { PageHeader } from "@/components/page-header"
import type { UserProfile } from "@/lib/types"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Terminal } from "lucide-react"

export const metadata = {
  title: "My Profile",
  description: "Manage your user profile settings.",
}

export default async function ProfilePage() {
  const supabase = createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    console.error("Profile Page: Auth error or no user, redirecting to login.", authError)
    redirect("/login?message=Please log in to view your profile.")
  }

  let userProfile: UserProfile | null = null
  let profileError: string | null = null
  let isProfileIncomplete = false

  try {
    const { data, error: fetchProfileError } = await supabase.from("profiles").select("*").eq("id", user.id).single()

    if (fetchProfileError && fetchProfileError.code !== "PGRST116") {
      console.error("Profile Page: Error fetching profile:", fetchProfileError)
      throw fetchProfileError
    }
    userProfile = data

    if (userProfile) {
      // Check if essential profile details are missing
      if (!userProfile.username || !userProfile.full_name || !userProfile.mobile_number) {
        isProfileIncomplete = true
      }
    } else if (!fetchProfileError || fetchProfileError.code === "PGRST116") {
      // Profile doesn't exist (PGRST116 or data is null)
      isProfileIncomplete = true // Mark as incomplete if profile record itself is missing
      userProfile = {
        // Create a shell for the form
        id: user.id,
        username: user.email?.split("@")[0] || null,
        full_name: null,
        avatar_url: null,
        website: null,
        bio: null,
        mobile_number: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    }
  } catch (e: any) {
    console.error("Profile Page: Catch block error fetching profile:", e)
    profileError = "Could not load your profile. Please try again later."
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader title="My Profile" description="View and update your profile information." className="mb-8" />

      {isProfileIncomplete && !profileError && (
        <Alert variant="default" className="mb-6 border-yellow-500 bg-yellow-50 text-yellow-700">
          <Terminal className="h-4 w-4 !text-yellow-700" />
          <AlertTitle className="!text-yellow-800">Complete Your Profile</AlertTitle>
          <AlertDescription className="!text-yellow-700">
            Please fill in all required fields (username, full name, mobile number) to complete your profile setup.
          </AlertDescription>
        </Alert>
      )}

      {profileError ? (
        <Alert variant="destructive" className="mb-6">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{profileError}</AlertDescription>
        </Alert>
      ) : userProfile && user ? ( // Ensure user is also available for ProfileForm
        <ProfileForm user={user} profile={userProfile} />
      ) : (
        <Alert variant="default" className="mb-6">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Loading Profile...</AlertTitle>
          <AlertDescription>If this message persists, please try refreshing the page.</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
