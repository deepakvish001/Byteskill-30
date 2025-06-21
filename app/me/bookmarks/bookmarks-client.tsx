"use client"

import { useState } from "react"
import type { CardData, BookmarkItemType, PostFrontmatter, ProjectFrontmatter } from "@/lib/types"
import { ArticleCard } from "@/components/article-card"
import ProjectCard from "@/components/project-card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BookmarkX } from "lucide-react"

interface BookmarksClientProps {
  initialBookmarkedItems: (CardData & { itemType: BookmarkItemType; bookmarkedAt: string })[]
}

export default function BookmarksClient({ initialBookmarkedItems }: BookmarksClientProps) {
  const [bookmarkedItems, setBookmarkedItems] = useState(initialBookmarkedItems)

  const handleBookmarkToggle = (itemId: string, itemType: BookmarkItemType, newIsBookmarked: boolean) => {
    if (!newIsBookmarked) {
      // If item was unbookmarked, remove it from the local list
      setBookmarkedItems((prevItems) =>
        prevItems.filter((item) => !(item.slug === itemId && item.itemType === itemType)),
      )
    }
    // If an item is re-bookmarked (e.g., if a bug allowed it), this page currently doesn't add it back
    // without a refresh. The primary use case here is instant removal upon unbookmarking.
  }

  const posts = bookmarkedItems.filter((item) => item.itemType === "post") as (PostFrontmatter & {
    itemType: "post"
    bookmarkedAt: string
    slug: string
  })[]
  const projects = bookmarkedItems.filter((item) => item.itemType === "project") as (ProjectFrontmatter & {
    itemType: "project"
    bookmarkedAt: string
    slug: string
  })[]

  if (bookmarkedItems.length === 0 && initialBookmarkedItems.length > 0) {
    return (
      <div className="mt-12 flex flex-col items-center justify-center text-center">
        <BookmarkX className="h-16 w-16 text-neutral-500 mb-4" />
        <h2 className="text-2xl font-semibold text-neutral-300 mb-2">All Bookmarks Cleared</h2>
        <p className="text-neutral-400 max-w-md">
          You've unbookmarked all your items. Feel free to explore and save new content!
        </p>
      </div>
    )
  }

  if (initialBookmarkedItems.length === 0 && bookmarkedItems.length === 0) {
    return (
      <div className="mt-12 flex flex-col items-center justify-center text-center">
        <BookmarkX className="h-16 w-16 text-neutral-500 mb-4" />
        <h2 className="text-2xl font-semibold text-neutral-300 mb-2">No Bookmarks Yet</h2>
        <p className="text-neutral-400 max-w-md">
          You haven't bookmarked any articles or projects. Look for the bookmark icon on content you want to save for
          later.
        </p>
      </div>
    )
  }

  return (
    <div className="mt-8">
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto bg-neutral-800 border border-neutral-700">
          <TabsTrigger value="all" className="data-[state=active]:bg-neutral-700 data-[state=active]:text-neutral-100">
            All ({bookmarkedItems.length})
          </TabsTrigger>
          <TabsTrigger
            value="posts"
            className="data-[state=active]:bg-neutral-700 data-[state=active]:text-neutral-100"
          >
            Posts ({posts.length})
          </TabsTrigger>
          <TabsTrigger
            value="projects"
            className="data-[state=active]:bg-neutral-700 data-[state=active]:text-neutral-100"
          >
            Projects ({projects.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          {bookmarkedItems.length === 0 && <p className="text-neutral-500 text-center">No items bookmarked yet.</p>}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bookmarkedItems.map((item) => {
              if (item.itemType === "post") {
                return (
                  <ArticleCard
                    key={`post-${item.slug}`}
                    post={item as PostFrontmatter & { slug: string; itemType: "post" }}
                    initialIsBookmarked={true} // Pass true here
                    onToggleSuccess={handleBookmarkToggle}
                  />
                )
              } else if (item.itemType === "project") {
                return (
                  <ProjectCard
                    key={`project-${item.slug}`}
                    project={item as ProjectFrontmatter & { slug: string; itemType: "project" }}
                    initialIsBookmarked={true} // Pass true here
                    onToggleSuccess={handleBookmarkToggle}
                  />
                )
              }
              return null
            })}
          </div>
        </TabsContent>

        <TabsContent value="posts" className="mt-6">
          {posts.length === 0 && <p className="text-neutral-500 text-center">No posts bookmarked yet.</p>}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <ArticleCard
                key={post.slug}
                post={post}
                initialIsBookmarked={true} // Pass true here
                onToggleSuccess={handleBookmarkToggle}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="projects" className="mt-6">
          {projects.length === 0 && <p className="text-neutral-500 text-center">No projects bookmarked yet.</p>}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <ProjectCard
                key={project.slug}
                project={project}
                initialIsBookmarked={true} // Pass true here
                onToggleSuccess={handleBookmarkToggle}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
