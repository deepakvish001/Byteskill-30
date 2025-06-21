// Server Component – fetches data on the server, so `fs` is safe to use
import Link from "next/link"
import Image from "next/image"
import { getFeaturedPosts } from "@/lib/posts"
import type { PostFrontmatter } from "@/lib/posts"

interface FeaturedPostsProps {
  posts: PostFrontmatter[]
}

export async function FeaturedPostsComponent() {
  const posts = await getFeaturedPosts(3)
  return <FeaturedPosts posts={posts} />
}

export function FeaturedPosts({ posts }: FeaturedPostsProps) {
  if (!posts || posts.length === 0) {
    return (
      <section aria-labelledby="latest-articles-heading-fallback">
        <h2 id="latest-articles-heading-fallback" className="text-2xl font-semibold text-neutral-100 mb-4">
          Latest Articles
        </h2>
        <p className="text-neutral-400">No articles to display at the moment.</p>
      </section>
    )
  }
  return (
    <section aria-labelledby="latest-articles-heading">
      <div className="flex justify-between items-center mb-8">
        <h2 id="latest-articles-heading" className="text-2xl font-semibold text-neutral-100">
          Latest Articles
        </h2>
        <Link href="/blog" className="text-sm text-green-400 hover:underline" aria-label="See all articles">
          See all articles
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            aria-label={`Read article: ${post.title}`}
            className="block border border-neutral-700 rounded-lg hover:border-green-500 transition-colors group overflow-hidden bg-neutral-800/30 hover:bg-neutral-800/60"
          >
            {post.thumbnailImage && (
              <div className="aspect-video bg-neutral-800 overflow-hidden">
                <Image
                  src={post.thumbnailImage || "/placeholder.svg"}
                  alt={`${post.title} thumbnail`}
                  width={400}
                  height={225}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  unoptimized // Add if using placeholder URLs that might not be in next.config.js images.remotePatterns
                />
              </div>
            )}
            <div className="p-4">
              <h3 className="font-medium text-neutral-100 group-hover:text-green-400 mb-1">{post.title}</h3>
              <p className="text-sm text-neutral-400 line-clamp-2 mb-2">{post.description}</p>
              <p className="text-xs text-neutral-500">
                {new Date(post.date + "T00:00:00").toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
                {post.tag && (
                  <>
                    <span className="mx-1.5">•</span>
                    <span className="inline-block bg-green-700/20 text-green-400 text-xs px-2 py-0.5 rounded-full">
                      {post.tag}
                    </span>
                  </>
                )}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}

// Ensure both default and named exports are available if needed elsewhere
export default FeaturedPosts
