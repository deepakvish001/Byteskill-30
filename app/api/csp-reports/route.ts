import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const report = await request.json()
    console.warn("CSP Violation Report:", JSON.stringify(report, null, 2))
    // In a production environment, you might send this report to a logging service
    // or a dedicated CSP monitoring tool.
  } catch (error) {
    console.error("Error processing CSP report:", error)
    return NextResponse.json({ message: "Error processing report" }, { status: 500 })
  }
  return NextResponse.json({ message: "Report received" }, { status: 200 })
}
