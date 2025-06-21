import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import { PageHeader } from "@/components/page-header"
import { ArticleCard } from "@/components/article-card" // Assuming ArticleCard can take PostFrontmatter
import { getSeriesDetailsBySlug, getPostsForSeriesBySlug, getAllSeriesSlugs } from "@/lib/series"
import type { Metadata, ResolvingMetadata } from "next"
import { siteConfig } from "@/lib/site-config"
import { createClient } from "@/lib/supabase/server"
import type { PostFrontmatter } from "@/lib/types"
import { BookOpenText } from "lucide-react"

export async function generateStaticParams() {
  const slugs = await getAllSeriesSlugs()
  return slugs.map((slug) => ({ seriesSlug: slug }))
}

export async function generateMetadata(
  { params }: { params: { seriesSlug: string } },
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const series = await getSeriesDetailsBySlug(params.seriesSlug)

  if (!series) {
    return { title: "Series Not Found" }
  }

  const previousImages = (await parent).openGraph?.images || []
  const ogImageSrc = series.hero_image_url || siteConfig.ogImage

  const ogImage = {
    url: ogImageSrc.startsWith("http")
      ? ogImageSrc
      : `${siteConfig.url}${ogImageSrc.startsWith("/") ? "" : "/"}${ogImageSrc}`,
    width: 1200,
    height: 630,
    alt: series.title,
  }

  return {
    title: `${series.title} Series`,
    description: series.description || `Explore the "${series.title}" series of articles.`,
    openGraph: {
      title: `${series.title} Series | ${siteConfig.name}`,
      description: series.description || `Explore the "${series.title}" series of articles.`,
      url: `${siteConfig.url}/series/${series.slug}`,
      images: [ogImage, ...previousImages.filter((img) => img.url !== ogImage.url)],
    },
    twitter: {
      card: "summary_large_image",
      title: `${series.title} Series | ${siteConfig.name}`,
      description: series.description || `Explore the "${series.title}" series of articles.`,
      images: [ogImage.url],
    },
  }
}

export default async function SingleSeriesPage({ params }: { params: { seriesSlug: string } }) {
  const series = await getSeriesDetailsBySlug(params.seriesSlug)

  if (!series) {
    notFound()
  }

  const postsInSeries = await getPostsForSeriesBySlug(params.seriesSlug)

  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  let bookmarkedPostSlugs = new Set<string>()

  if (user && postsInSeries.length > 0) {
    const postIds = postsInSeries.map((p) => p.slug)
    const { data: bookmarks, error: bookmarksError } = await supabase
      .from("bookmarks")
      .select("item_id")
      .eq("user_id", user.id)
      .eq("item_type", "post")
      .in("item_id", postIds)

    if (bookmarksError) {
      console.error("Error fetching post bookmarks for series:", bookmarksError.message)
    } else if (bookmarks) {
      bookmarkedPostSlugs = new Set(bookmarks.map((b) => b.item_id))
    }
  }

  const postsWithBookmarkStatus: PostFrontmatter[] = postsInSeries.map((post) => ({
    ...post,
    isBookmarked: bookmarkedPostSlugs.has(post.slug),
  }))

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <PageHeader
        title={series.title}
        description={series.description || "A collection of articles in this series."}
        isSeriesPage={true}
      />

      {series.hero_image_url && (
        <div className="mb-8 rounded-lg overflow-hidden aspect-[16/7] bg-neutral-800">
          <Image
            src={series.hero_image_url || "/placeholder.svg"}
            alt={`${series.title} series hero image`}
            width={1200}
            height={525}
            className="w-full h-full object-cover"
            priority
          />
        </div>
      )}

      {postsWithBookmarkStatus.length > 0 ? (
        <div className="space-y-10">
          {postsWithBookmarkStatus.map((post, index) => (
            <div key={post.slug} className="flex flex-col md:flex-row items-start gap-6">
              <div className="flex-shrink-0 md:w-16 text-center md:text-left">
                <div className="text-3xl font-bold text-green-400 md:text-4xl">
                  {post.series_part_number || index + 1}
                </div>
                <div className="text-xs text-neutral-500 mt-1">PART</div>
              </div>
              <div className="flex-grow w-full">
                <ArticleCard article={post} orientation="horizontal" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-neutral-800/30 rounded-lg border border-neutral-700/50">
          <BookOpenText className="mx-auto w-16 h-16 text-neutral-500 mb-4" />
          <p className="text-lg text-neutral-400">No articles published in this series yet.</p>
          <p className="text-sm text-neutral-500 mt-2">
            Check back soon, or explore other{" "}
            <Link href="/series" className="text-green-400 hover:underline">
              series
            </Link>
            .
          </p>
        </div>
      )}
    </div>
  )
}
