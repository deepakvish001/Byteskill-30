import { getAllPosts } from "@/lib/posts"
import { ArticleCard } from "@/components/article-card"
import { PaginationControls } from "@/components/pagination-controls"
import { SortOrderSelector } from "@/components/sort-order-selector"
import { ItemsPerPageSelector } from "@/components/items-per-page-selector"
import type { PostFrontmatter } from "@/lib/types"
import { createClient } from "@/lib/supabase/server"
import { PageHeader } from "@/components/page-header" // Added for consistency
import { MostViewedPosts } from "@/components/most-viewed-posts" // Added
import { Separator } from "@/components/ui/separator" // Added

export const metadata = {
  title: "Blog",
  description: "Explore articles on web development, software engineering, and technology.",
}

function sortPosts(posts: PostFrontmatter[], sortOrder: string): PostFrontmatter[] {
  const sorted = [...posts]
  switch (sortOrder) {
    case "date-asc":
      return sorted.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    case "title-asc":
      return sorted.sort((a, b) => a.title.localeCompare(b.title))
    case "title-desc":
      return sorted.sort((a, b) => b.title.localeCompare(a.title))
    case "views-desc": // New
      return sorted.sort((a, b) => (b.view_count || 0) - (a.view_count || 0))
    case "views-asc": // New
      return sorted.sort((a, b) => (a.view_count || 0) - (b.view_count || 0))
    case "date-desc":
    default:
      return sorted.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const allPosts = await getAllPosts()

  const page = searchParams["page"] ?? "1"
  const perPage = searchParams["per_page"] ?? "9"
  const sortOrder = (searchParams["sort"] as string) ?? "date-desc"

  const sortedPosts = sortPosts(allPosts, sortOrder)

  const start = (Number(page) - 1) * Number(perPage)
  const end = start + Number(perPage)
  const paginatedPosts = sortedPosts.slice(start, end)

  const totalPages = Math.ceil(sortedPosts.length / Number(perPage))

  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  let bookmarkedPostSlugs = new Set<string>()

  if (user) {
    const { data: bookmarks, error: bookmarksError } = await supabase
      .from("bookmarks")
      .select("item_id")
      .eq("user_id", user.id)
      .eq("item_type", "post")

    if (bookmarksError) {
      console.error("Error fetching post bookmarks on blog page:", bookmarksError.message)
    } else if (bookmarks) {
      bookmarkedPostSlugs = new Set(bookmarks.map((b) => b.item_id))
    }
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <PageHeader
        title="Blog"
        description="Explore articles on web development, software engineering, and technology."
        className="mb-12 text-center"
      />

      <MostViewedPosts count={3} className="mb-12" />
      <Separator className="mb-12 bg-neutral-700" />

      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
        <p className="text-sm text-neutral-400">
          Showing {paginatedPosts.length} of {allPosts.length} articles
        </p>
        <div className="flex items-center gap-4">
          <SortOrderSelector
            options={[
              { value: "date-desc", label: "Newest" },
              { value: "date-asc", label: "Oldest" },
              { value: "title-asc", label: "Title (A-Z)" },
              { value: "title-desc", label: "Title (Z-A)" },
              { value: "views-desc", label: "Most Viewed" },
              { value: "views-asc", label: "Least Viewed" },
            ]}
          />
          <ItemsPerPageSelector />
        </div>
      </div>

      {paginatedPosts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {paginatedPosts.map((post) => (
            <ArticleCard key={post.slug} post={post} initialIsBookmarked={bookmarkedPostSlugs.has(post.slug)} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-lg text-neutral-500 dark:text-neutral-400">No articles found matching your criteria.</p>
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-12">
          <PaginationControls
            currentPage={Number(page)}
            totalPages={totalPages}
            hasNextPage={end < allPosts.length}
            hasPrevPage={start > 0}
          />
        </div>
      )}
    </div>
  )
}
