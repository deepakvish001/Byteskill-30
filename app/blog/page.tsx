import { getAllPosts } from "@/lib/posts"
import { ArticleCard } from "@/components/article-card"
import { PaginationControls } from "@/components/pagination-controls"
import { SortOrderSelector } from "@/components/sort-order-selector"
import { ItemsPerPageSelector } from "@/components/items-per-page-selector"
import type { PostFrontmatter } from "@/lib/types"
import { createClient } from "@/lib/supabase/server" // For server-side Supabase

export const metadata = {
  title: "Blog",
  description: "Explore articles on web development, software engineering, and technology.",
}

// Helper function for sorting posts
function sortPosts(posts: PostFrontmatter[], sortOrder: string): PostFrontmatter[] {
  // Create a shallow copy to avoid mutating the original array
  const sorted = [...posts]

  switch (sortOrder) {
    case "date-asc":
      return sorted.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    case "title-asc":
      return sorted.sort((a, b) => a.title.localeCompare(b.title))
    case "title-desc":
      return sorted.sort((a, b) => b.title.localeCompare(a.title))
    case "date-desc":
    default:
      return sorted.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }
}

// Make the page component async
export default async function BlogPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const allPosts = getAllPosts()

  const page = searchParams["page"] ?? "1"
  const perPage = searchParams["per_page"] ?? "9"
  const sortOrder = (searchParams["sort"] as string) ?? "date-desc"

  const sortedPosts = sortPosts(allPosts, sortOrder)

  const start = (Number(page) - 1) * Number(perPage)
  const end = start + Number(perPage)
  const paginatedPosts = sortedPosts.slice(start, end)

  const totalPages = Math.ceil(sortedPosts.length / Number(perPage))

  // --- Fetch bookmark statuses server-side ---
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  let bookmarkedPostSlugs = new Set<string>()

  if (user) {
    // Fetch IDs of all posts bookmarked by the current user
    const { data: bookmarks, error: bookmarksError } = await supabase
      .from("bookmarks")
      .select("item_id")
      .eq("user_id", user.id)
      .eq("item_type", "post") // Only fetch for posts

    if (bookmarksError) {
      console.error("Error fetching post bookmarks on blog page:", bookmarksError.message)
      // Continue without bookmark info if there's an error
    } else if (bookmarks) {
      bookmarkedPostSlugs = new Set(bookmarks.map((b) => b.item_id))
    }
  }
  // --- End fetch bookmark statuses ---

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <header className="mb-12 text-center">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-neutral-100 tracking-tight">Blog</h1>
        <p className="mt-4 text-lg text-neutral-400 max-w-2xl mx-auto">
          Explore articles on web development, software engineering, and technology.
        </p>
      </header>

      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
        <p className="text-sm text-neutral-400">
          Showing {paginatedPosts.length} of {allPosts.length} articles
        </p>
        <div className="flex items-center gap-4">
          <SortOrderSelector />
          <ItemsPerPageSelector />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {paginatedPosts.map((post) => (
          <ArticleCard
            key={post.slug}
            post={post}
            // Pass the initial bookmark status
            initialIsBookmarked={bookmarkedPostSlugs.has(post.slug)}
          />
        ))}
      </div>

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
