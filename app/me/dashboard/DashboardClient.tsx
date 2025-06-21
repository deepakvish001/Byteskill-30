"use client"

import Link from "next/link"
import type { UserProfile } from "@/lib/types"
import type { BookmarkedItem, EnrichedSeriesProgress } from "./actions"
import { ArticleCard } from "@/components/article-card"
import ProjectCard from "@/components/project-card"
import { SeriesProgressCard } from "@/components/series-progress-card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { AlertTriangle, Bookmark, ListChecks } from "lucide-react"

interface DashboardClientProps {
  userProfile: UserProfile | null
  bookmarkedItems: BookmarkedItem[]
  seriesProgress: EnrichedSeriesProgress[]
  initialError?: string
}

export function DashboardClient({ userProfile, bookmarkedItems, seriesProgress, initialError }: DashboardClientProps) {
  const bookmarkedPosts = bookmarkedItems.filter((item) => item.itemType === "post" && item.details)
  const bookmarkedProjects = bookmarkedItems.filter((item) => item.itemType === "project" && item.details)

  if (!userProfile) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h1 className="text-2xl font-semibold mb-2">Profile Not Found</h1>
        <p className="text-muted-foreground mb-4">
          We couldn't load your profile information. Please try logging out and back in.
        </p>
        <Button asChild>
          <Link href="/login">Go to Login</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto min-h-screen px-4 py-8 md:py-12">
      <header className="mb-8 md:mb-12">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-neutral-100">
          Welcome back, {userProfile?.full_name || userProfile?.username || "User"}!
        </h1>
        <p className="text-lg text-neutral-400 mt-2">Here's your personal dashboard.</p>
      </header>

      {initialError && (
        <div className="mb-6 rounded-md border border-destructive/50 bg-destructive/10 p-4 text-destructive">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            <p>Error loading your data: {initialError}</p>
          </div>
        </div>
      )}

      {/* New Series Progress Section */}
      <section id="series-progress" className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-neutral-100 flex items-center">
            <ListChecks className="mr-3 h-6 w-6 text-sky-400" />
            Your Series Progress
          </h2>
        </div>
        {seriesProgress.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {seriesProgress.map((progress) => (
              <SeriesProgressCard key={progress.seriesSlug} progress={progress} />
            ))}
          </div>
        ) : (
          <p className="text-neutral-400">
            You haven't started any series yet.{" "}
            <Link href="/series" className="text-sky-400 hover:underline">
              Explore series
            </Link>
            .
          </p>
        )}
      </section>

      <Separator className="my-8 bg-neutral-700" />

      <section id="bookmarks" className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-neutral-100 flex items-center">
            <Bookmark className="mr-3 h-6 w-6 text-sky-400" />
            Your Bookmarks
          </h2>
        </div>
        {bookmarkedItems.length > 0 ? (
          <>
            {bookmarkedPosts.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-medium text-neutral-200 mb-4">Bookmarked Posts</h3>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {bookmarkedPosts.map((item) => (
                    <ArticleCard key={item.id} post={item.details as any} />
                  ))}
                </div>
              </div>
            )}
            {bookmarkedProjects.length > 0 && (
              <>
                {bookmarkedPosts.length > 0 && <Separator className="my-8 bg-neutral-700" />}
                <h3 className="text-xl font-medium text-neutral-200 mb-4">Bookmarked Projects</h3>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {bookmarkedProjects.map((item) => (
                    <ProjectCard key={item.id} project={item.details as any} />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <p className="text-neutral-400">
            You haven't bookmarked anything yet.{" "}
            <Link href="/blog" className="text-sky-400 hover:underline">
              Find something to save
            </Link>
            .
          </p>
        )}
      </section>

      <Separator className="my-8 bg-neutral-700" />

      <section id="quick-actions" className="text-center">
        <h2 className="text-2xl font-semibold text-neutral-100 mb-6">Quick Actions</h2>
        <div className="flex flex-wrap justify-center gap-4">
          <Button
            variant="outline"
            asChild
            className="border-sky-500 text-sky-400 hover:bg-sky-500/10 hover:text-sky-300"
          >
            <Link href="/me/profile">Edit Your Profile</Link>
          </Button>
          <Button
            variant="outline"
            asChild
            className="border-neutral-600 text-neutral-300 hover:bg-neutral-700/50 hover:text-neutral-200"
          >
            <Link href="/blog">Explore Blog</Link>
          </Button>
          <Button
            variant="outline"
            asChild
            className="border-neutral-600 text-neutral-300 hover:bg-neutral-700/50 hover:text-neutral-200"
          >
            <Link href="/projects">Discover Projects</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
