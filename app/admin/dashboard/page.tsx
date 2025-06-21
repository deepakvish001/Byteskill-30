import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { PageHeader } from "@/components/page-header"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  ShieldCheck,
  UserCog,
  LayoutList,
  MessageSquareText,
  History,
  BarChart3,
  AlertTriangle,
  ShieldAlert,
} from "lucide-react"
import type { UserProfile } from "@/lib/types"
import UserList from "./user-list"
import ContentManagement from "./content-management"
import CommentManagement from "./comment-management"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import AnalyticsOverview from "./analytics-overview" // New import
import { getAdminDashboardAnalytics } from "./actions" // New import
import ReportedContentManagement from "./reported-content-management" // New import

export const metadata = {
  title: "Admin Dashboard",
  description: "Site administration area.",
}

export default async function AdminDashboardPage() {
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
    console.error("Admin Dashboard: Error fetching profile:", error)
    redirect("/?message=Error accessing admin area.")
  }

  const isAdminOrOwner = userProfile?.role === "admin" || userProfile?.role === "owner"

  if (!isAdminOrOwner) {
    redirect("/?message=You are not authorized to access this page.")
  }

  const analyticsResult = await getAdminDashboardAnalytics()

  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader title="Admin Dashboard" description="Welcome to the site administration area." className="mb-8" />

      <Alert variant="default" className="mb-6 border-green-500 bg-green-50 text-green-700">
        <ShieldCheck className="h-5 w-5 !text-green-700" />
        <AlertTitle className="!text-green-800">Access Granted</AlertTitle>
        <AlertDescription className="!text-green-700">You have {userProfile?.role} privileges.</AlertDescription>
      </Alert>

      <div className="space-y-12">
        <section>
          <div className="flex items-center mb-4">
            <BarChart3 className="h-6 w-6 mr-3 text-primary" />
            <h2 className="text-2xl font-semibold tracking-tight">Site Analytics Overview</h2>
          </div>
          {analyticsResult.success && analyticsResult.analytics ? (
            <AnalyticsOverview analytics={analyticsResult.analytics} />
          ) : (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{analyticsResult.message || "Could not load site analytics."}</AlertDescription>
            </Alert>
          )}
        </section>

        <section>
          <div className="flex items-center mb-4">
            <UserCog className="h-6 w-6 mr-3 text-primary" />
            <h2 className="text-2xl font-semibold tracking-tight">User Management</h2>
          </div>
          <div className="rounded-lg border bg-card p-0 shadow-sm">
            <UserList />
          </div>
        </section>

        <section>
          <div className="flex items-center mb-4">
            <LayoutList className="h-6 w-6 mr-3 text-primary" />
            <h2 className="text-2xl font-semibold tracking-tight">Content Management</h2>
          </div>
          <ContentManagement />
        </section>

        <section>
          <div className="flex items-center mb-4">
            <MessageSquareText className="h-6 w-6 mr-3 text-primary" />
            <h2 className="text-2xl font-semibold tracking-tight">Comment Moderation</h2>
          </div>
          <CommentManagement />
        </section>

        <section>
          <div className="flex items-center mb-4">
            <ShieldAlert className="h-6 w-6 mr-3 text-primary" />
            <h2 className="text-2xl font-semibold tracking-tight">Reported Content</h2>
          </div>
          <ReportedContentManagement />
        </section>

        <section>
          <div className="flex items-center mb-4">
            <History className="h-6 w-6 mr-3 text-primary" />
            <h2 className="text-2xl font-semibold tracking-tight">Site Auditing</h2>
          </div>
          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <p className="text-muted-foreground mb-4">
              Review actions performed by administrators across the site to ensure security and accountability.
            </p>
            <Button asChild>
              <Link href="/admin/dashboard/audit-logs">View Audit Logs</Link>
            </Button>
          </div>
        </section>
      </div>
    </div>
  )
}
