import Link from "next/link"
import { ListOrdered, CheckCircle2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { PostFrontmatter } from "@/lib/posts" // Assuming PostFrontmatter is correctly typed in lib/posts
import { cn } from "@/lib/utils"
import { Progress } from "@/components/ui/progress"

/**
 * Props for the SeriesNavigationBox component.
 */
interface SeriesNavigationBoxProps {
  /** The slug of the current post being viewed. */
  currentPostSlug: string
  /** The title of the series. */
  seriesTitle: string
  /** The slug for the series page (e.g., /series/[seriesSlug]). */
  seriesSlug: string
  /** An array of post frontmatter objects belonging to the series, already sorted by part number. */
  postsInSeries: PostFrontmatter[]
}

/**
 * Displays a navigation box for a blog post series.
 * It shows the series title, a list of posts in the series with links,
 * highlights the current post, and displays a progress bar.
 *
 * @param {SeriesNavigationBoxProps} props - The props for the component.
 * @returns {JSX.Element | null} A card component with series navigation, or null if no posts are in the series.
 */
export function SeriesNavigationBox({
  currentPostSlug,
  seriesTitle,
  seriesSlug,
  postsInSeries,
}: SeriesNavigationBoxProps) {
  if (!postsInSeries || postsInSeries.length === 0) {
    return null
  }

  const totalParts = postsInSeries.length
  const currentPost = postsInSeries.find((p) => p.slug === currentPostSlug)
  // Ensure series and part exist before trying to access them
  const currentPart = currentPost?.series?.part

  let progressValue = 0
  if (currentPart && totalParts > 0) {
    progressValue = (currentPart / totalParts) * 100
  }

  return (
    <Card className="my-10 bg-neutral-800 border-neutral-700 shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-neutral-100 flex items-center">
          <ListOrdered className="w-5 h-5 mr-2.5 text-green-400" />
          Part of the series:{" "}
          <Link href={`/series/${seriesSlug}`} className="ml-1 text-green-400 hover:underline">
            {seriesTitle}
          </Link>
        </CardTitle>
        <p className="text-xs text-neutral-400">
          {postsInSeries.length} part{postsInSeries.length > 1 ? "s" : ""} in this series.
        </p>
        {currentPart && totalParts > 0 && (
          <div className="mt-4">
            <div className="flex justify-between items-center mb-1.5 text-xs text-neutral-400">
              <span>Progress</span>
              <span className="font-medium text-neutral-300">
                Part {currentPart} of {totalParts}
              </span>
            </div>
            <Progress
              value={progressValue}
              className="h-2 bg-neutral-700 [&>div]:bg-green-400"
              aria-label={`${Math.round(progressValue)}% complete`}
            />
          </div>
        )}
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 text-sm">
          {postsInSeries.map((post) => (
            <li key={post.slug}>
              <Link
                href={`/blog/${post.slug}`}
                className={cn(
                  "flex items-center p-2 rounded-md transition-colors",
                  post.slug === currentPostSlug
                    ? "bg-green-700/20 text-green-300 font-medium" // Current post styling
                    : "text-neutral-300 hover:bg-neutral-700/50 hover:text-green-400", // Other posts styling
                )}
              >
                {post.slug === currentPostSlug ? (
                  <CheckCircle2 className="w-4 h-4 mr-2 text-green-400 flex-shrink-0" /> // Icon for current post
                ) : (
                  <span className="w-4 h-4 mr-2 text-neutral-500 flex-shrink-0 text-center">
                    {/* Ensure series and part exist before trying to access them */}
                    {post.series?.part || "•"}
                  </span>
                )}
                <span className="flex-grow">{post.title}</span>
                {post.slug === currentPostSlug && <span className="text-xs text-green-400 ml-2">(You are here)</span>}{" "}
                {/* Text label for current post */}
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
