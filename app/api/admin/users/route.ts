import { NextResponse, type NextRequest } from "next/server"
import { getAllUsers } from "@/app/admin/dashboard/actions"

// GET /api/admin/users?search=<q>&role=<role>
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const searchTerm = searchParams.get("search") ?? undefined
  const filterRole = searchParams.get("role") ?? undefined

  const result = await getAllUsers({ searchTerm, filterRole })

  if (!result.success) {
    return NextResponse.json({ error: result.message }, { status: 401 })
  }

  return NextResponse.json(result.users ?? [])
}
