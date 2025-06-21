import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { ListChecks } from "lucide-react"
import type { EnrichedSeriesProgress } from "@/app/me/dashboard/actions"

interface SeriesProgressCardProps {
  progress: EnrichedSeriesProgress
}

export function SeriesProgressCard({ progress }: SeriesProgressCardProps) {
  const percentage = progress.totalPostsCount > 0 ? (progress.readPostsCount / progress.totalPostsCount) * 100 : 0

  return (
    <Card className="bg-neutral-800/50 border-neutral-700 hover:border-sky-500/50 transition-colors duration-300">
      <CardHeader>
        <CardTitle className="flex items-start justify-between">
          <span className="text-lg font-semibold text-neutral-100">{progress.seriesTitle}</span>
          <ListChecks className="h-5 w-5 text-neutral-400" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Progress value={percentage} className="h-2 [&>div]:bg-sky-400" />
          <div className="flex justify-between items-center mt-2 text-sm text-neutral-400">
            <span>
              {progress.readPostsCount} / {progress.totalPostsCount} posts completed
            </span>
            <span className="font-medium text-neutral-200">{Math.round(percentage)}%</span>
          </div>
        </div>
        <Button
          asChild
          variant="outline"
          className="w-full border-neutral-600 text-neutral-300 hover:bg-neutral-700 hover:text-neutral-100"
        >
          <Link href={`/series/${progress.seriesSlug}`}>
            {progress.isCompleted ? "Review Series" : "Continue Series"}
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
