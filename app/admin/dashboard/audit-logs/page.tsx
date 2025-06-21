import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { PageHeader } from "@/components/page-header"
import type { UserProfile } from "@/lib/types"
import AuditLogClient from "./audit-log-client"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ShieldCheck, AlertCircle } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"

export const metadata = {
  title: "Audit Logs - Admin Dashboard",
  description: "Review site administration audit logs.",
}

export default async function AuditLogsPage() {
  const supabase = createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect("/login?message=Please log in to access this page.")
  }

  let userProfile: UserProfile | null = null
  try {
    const { data, error: profileError } = await supabase
      .from("profiles")
      .select("id, username, role")
      .eq("id", user.id)
      .single()

    if (profileError) throw profileError
    userProfile = data
  } catch (error) {
    console.error("Audit Logs Page: Error fetching profile:", error)
    // Potentially redirect to a generic error page or show an error message
    return (
      <div className="container mx-auto px-4 py-8">
        <PageHeader title="Error" description="Could not load your profile." />
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Profile Error</AlertTitle>
          <AlertDescription>
            There was an issue fetching your profile. Please try again later or contact support.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const isAdminOrOwner = userProfile?.role === "admin" || userProfile?.role === "owner"

  if (!isAdminOrOwner) {
    redirect("/?message=You are not authorized to access this page.")
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Button asChild variant="outline" className="mb-6">
        <Link href="/admin/dashboard">
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Link>
      </Button>
      <PageHeader
        title="Audit Logs"
        description="Review actions performed by administrators across the site."
        className="mb-8"
      />

      {userProfile?.role === "owner" && (
        <Alert variant="default" className="mb-6 border-blue-500 bg-blue-50 text-blue-700">
          <ShieldCheck className="h-5 w-5 !text-blue-700" />
          <AlertTitle className="!text-blue-800">Owner Privileges</AlertTitle>
          <AlertDescription className="!text-blue-700">
            You are viewing this page with full owner privileges.
          </AlertDescription>
        </Alert>
      )}

      <AuditLogClient />
    </div>
  )
}
