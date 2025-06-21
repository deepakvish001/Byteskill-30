import Link from "next/link"
import { Eye } from "lucide-react"
import { getMostViewedPosts } from "@/lib/posts" // We created this function earlier
import { ArticleCard } from "@/components/article-card"
import type { PostFrontmatter } from "@/lib/types"

interface MostViewedPostsProps {
  count?: number
  className?: string
}

export async function MostViewedPosts({ count = 3, className }: MostViewedPostsProps) {
  const posts: PostFrontmatter[] = await getMostViewedPosts(count)

  if (!posts || posts.length === 0) {
    return null // Or a fallback message if preferred
  }

  return (
    <section aria-labelledby="most-viewed-posts-heading" className={className}>
      <div className="flex justify-between items-center mb-6">
        <h2 id="most-viewed-posts-heading" className="text-xl font-semibold text-neutral-100 flex items-center">
          <Eye className="mr-2 h-5 w-5 text-sky-400" />
          Most Viewed Articles
        </h2>
        <Link href="/blog?sort=views_desc" className="text-sm text-sky-400 hover:underline">
          View all
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post) => (
          <ArticleCard key={post.slug} post={post} />
        ))}
      </div>
    </section>
  )
}
