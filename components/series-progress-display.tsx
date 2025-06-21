"use client"

import { Progress } from "@/components/ui/progress"
import { CheckCircle, BookOpen } from "lucide-react" // Added BookOpen
import { useSeriesProgress } from "@/hooks/use-series-progress" // Import the new hook

interface SeriesProgressDisplayProps {
  seriesSlug: string
  totalPosts: number
  showCurrentlyReading?: boolean // New prop to control "Currently Reading" badge
}

export function SeriesProgressDisplay({
  seriesSlug,
  totalPosts,
  showCurrentlyReading = false,
}: SeriesProgressDisplayProps) {
  const { readPostsCount, isCompleted, isStarted, isLoading } = useSeriesProgress(seriesSlug, totalPosts)

  if (isLoading) {
    // Optional: render a loading skeleton or nothing
    return <div className="h-6 mt-4 mb-3" /> // Placeholder for height
  }

  const progressPercentage = totalPosts > 0 ? Math.min((readPostsCount / totalPosts) * 100, 100) : 0

  if (isCompleted) {
    return (
      <div className="mt-4 mb-3">
        <Progress value={100} className="h-2 w-full" aria-label={`Series ${seriesSlug} completed`} />
        <p className="text-xs text-green-400 font-medium mt-1.5 text-right flex items-center justify-end">
          <CheckCircle className="w-3.5 h-3.5 mr-1 flex-shrink-0" />
          Series Completed!
        </p>
      </div>
    )
  }

  if (isStarted) {
    return (
      <div className="mt-4 mb-3">
        {showCurrentlyReading && (
          <div className="mb-2 flex items-center text-xs text-orange-400">
            <BookOpen className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
            <span>Currently Reading</span>
          </div>
        )}
        <Progress
          value={progressPercentage}
          className="h-2 w-full"
          aria-label={`Progress for series ${seriesSlug}: ${readPostsCount} of ${totalPosts} posts read`}
        />
        <p className="text-xs text-neutral-400 mt-1.5 text-right">
          {readPostsCount} / {totalPosts} posts
        </p>
      </div>
    )
  }

  // If not started and not completed, and not loading, render nothing or a minimal placeholder
  // This ensures the layout doesn't jump if progress suddenly appears.
  return <div className="h-6 mt-4 mb-3" /> // Placeholder for height if no progress shown
}
