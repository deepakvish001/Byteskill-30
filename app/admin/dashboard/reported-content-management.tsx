import { AlertTriangle } from "lucide-react"

/**
 * ReportedContentManagement
 * A minimal placeholder component so the Admin Dashboard renders.
 * Replace the mock data / TODO comments with real logic when ready.
 */
export default async function ReportedContentManagement() {
  // TODO: query your database (e.g., Supabase) for reported items
  // const reportedItems = await getReportedContent()

  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm">
      <h3 className="mb-4 text-xl font-semibold tracking-tight flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-primary" />
        Reported Content
      </h3>

      {/* Placeholder content */}
      <p className="text-muted-foreground">There is no reported content at the moment. 🎉</p>

      {/* Uncomment and render real data when ready */}
      {/* {reportedItems.length === 0 ? (
        <p className="text-muted-foreground">There is no reported content at the moment. 🎉</p>
      ) : (
        <ReportedContentTable items={reportedItems} />
      )} */}
    </div>
  )
}
