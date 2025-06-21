import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * Responds with { count: number }  — the amount of unread in-app notifications
 * for the currently authenticated user (0 if no session).
 */
export async function GET() {
  const supabase = createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ count: 0 })
  }

  const { count, error } = await supabase
    .from("notifications")
    .select("*", { head: true, count: "exact" })
    .eq("user_id", session.user.id)
    .eq("is_read", false)

  if (error) {
    console.error("Unread-count route error:", error)
    return NextResponse.json({ count: 0 }, { status: 500 })
  }

  return NextResponse.json({ count: count ?? 0 })
}
