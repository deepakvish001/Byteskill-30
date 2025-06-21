import Link from "next/link"
import { getPostsByTag, getAllUniqueTags } from "@/lib/posts"
import { ArrowLeft } from "lucide-react"
import type { Metadata, ResolvingMetadata } from "next"
import { siteConfig } from "@/lib/site-config"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ArticleCard } from "@/components/article-card"

export async function generateStaticParams() {
  const tags = getAllUniqueTags()
  return tags.map(({ tag }) => ({
    tag: tag,
  }))
}

export async function generateMetadata(
  { params }: { params: { tag: string } },
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const tagSlug = params.tag
  const tagsWithCounts = getAllUniqueTags()
  const originalTagInfo = tagsWithCounts.find((t) => t.tag === tagSlug)

  if (!originalTagInfo) {
    return {
      title: "Tag not found",
    }
  }
  const displayTag = originalTagInfo.displayName

  return {
    title: `Articles tagged with "${displayTag}"`,
    description: `Find all articles on ${siteConfig.name} tagged with "${displayTag}". Explore topics like ${displayTag} and more.`,
    openGraph: {
      title: `Articles tagged with "${displayTag}" | ${siteConfig.name}`,
      description: `Find all articles on ${siteConfig.name} tagged with "${displayTag}".`,
      url: `${siteConfig.url}/tags/${tagSlug}`,
    },
    twitter: {
      title: `Articles tagged with "${displayTag}" | ${siteConfig.name}`,
      description: `Find all articles on ${siteConfig.name} tagged with "${displayTag}".`,
    },
  }
}

export default async function TagPage({ params }: { params: { tag: string } }) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const tagSlug = params.tag
  const postsForTag = getPostsByTag(tagSlug)

  const allUniqueTags = getAllUniqueTags()
  const currentTagInfo = allUniqueTags.find((t) => t.tag === tagSlug)

  if (postsForTag.length === 0 || !currentTagInfo) {
    notFound()
  }

  const displayTag = currentTagInfo.displayName

  const bookmarkedPostSlugs = new Set<string>()
  if (user) {
    const { data: bookmarks, error: bookmarksError } = await supabase
      .from("bookmarks")
      .select("item_id")
      .eq("user_id", user.id)
      .eq("item_type", "post")

    if (bookmarksError) {
      console.error("Error fetching bookmarks for tag page:", bookmarksError.message)
    } else if (bookmarks) {
      bookmarks.forEach((b) => bookmarkedPostSlugs.add(b.item_id))
    }
  }

  const articlesToDisplay = postsForTag.map((post) => ({
    ...post,
  }))

  return (
    <div className="bg-neutral-900 text-neutral-300 min-h-screen flex flex-col">
      <main
        id="main-content"
        tabIndex={-1}
        className="container mx-auto px-4 sm:px-6 lg:px-8 flex-grow py-12 outline-none"
      >
        <div className="mb-8">
          <Link href="/tags" className="inline-flex items-center text-sm text-green-400 hover:underline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to all tags
          </Link>
        </div>
        <h1 className="text-3xl font-bold text-neutral-100 mb-10">
          Articles tagged with: <span className="text-green-400">{displayTag}</span>
        </h1>

        {articlesToDisplay.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articlesToDisplay.map((post) => (
              <ArticleCard
                key={post.slug}
                post={post}
                initialIsBookmarked={bookmarkedPostSlugs.has(post.slug)}
                className="
                  transition-all duration-300 ease-in-out 
                  hover:border-green-400 
                  lg:hover:scale-[1.015] 
                  lg:hover:shadow-2xl 
                  lg:hover:shadow-green-500/20
                "
              />
            ))}
          </div>
        ) : (
          <p className="text-neutral-400">No articles found for this tag.</p>
        )}
      </main>
    </div>
  )
}
