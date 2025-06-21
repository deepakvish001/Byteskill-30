import { Suspense } from "react"
import { notFound } from "next/navigation"
import { getAllPosts, getPostBySlug, getRelatedPosts, getPostsBySeries } from "@/lib/posts"
import type { Metadata, ResolvingMetadata } from "next"
import { siteConfig } from "@/lib/site-config"
import { BlogPostPageClient } from "./BlogPostPageClient"
import type { PostFrontmatter, SeriesData } from "@/lib/types"

// This is the structure the client component expects after sanitization
interface ClientReadyTocEntry {
  slug: string
  title: string
  level: number
  children?: ClientReadyTocEntry[]
}

// This is the structure we aim for in PostFrontmatter after sanitization
interface ClientReadyPostFrontmatter extends Omit<PostFrontmatter, "toc" | "series" | "content"> {
  toc: ClientReadyTocEntry[] | null
  series: SeriesData | null
  // content is handled separately
}

// Simplified sanitize function, assuming lib/posts.ts now does most of the heavy lifting
// and returns consistently shaped PostFrontmatter objects (or null).
function prepareFrontmatterForClient(fm: PostFrontmatter | null): ClientReadyPostFrontmatter | null {
  if (!fm) return null

  // Create a new object to avoid mutating the original from lib/posts.ts cache
  const input: Partial<PostFrontmatter> = { ...fm }

  // Ensure dates are ISO strings (lib/posts.ts should already do this)
  const date =
    input.date && !isNaN(new Date(input.date).getTime()) ? new Date(input.date).toISOString() : new Date().toISOString()
  const lastUpdated =
    input.lastUpdated && !isNaN(new Date(input.lastUpdated).getTime())
      ? new Date(input.lastUpdated).toISOString()
      : date

  // Sanitize TOC specifically for client structure
  let clientToc: ClientReadyTocEntry[] | null = null
  if (Array.isArray(input.toc)) {
    clientToc = input.toc.reduce<ClientReadyTocEntry[]>((acc, item: any) => {
      const itemSlugSource = item.slug || item.href // Prefer slug, fallback to href
      if (
        item &&
        typeof itemSlugSource === "string" &&
        itemSlugSource.trim() &&
        typeof item.title === "string" &&
        item.title.trim() &&
        typeof item.level === "number"
      ) {
        const entry: ClientReadyTocEntry = {
          slug: String(itemSlugSource).replace(/^#/, "").trim(),
          title: String(item.title).trim(),
          level: Number(item.level),
        }
        // Basic children handling if present
        if (Array.isArray(item.children) && item.children.length > 0) {
          entry.children = item.children
            .map((child: any) => ({
              slug: String(child.slug || child.href || "")
                .replace(/^#/, "")
                .trim(),
              title: String(child.title || "").trim(),
              level: Number(child.level || entry.level + 1),
            }))
            .filter((c) => c.slug && c.title) as ClientReadyTocEntry[]
          if (entry.children.length === 0) delete entry.children
        }
        acc.push(entry)
      } else {
        // console.warn(`[prepareFrontmatterForClient] Skipping malformed TOC item for slug "${input.slug}":`, JSON.stringify(item));
      }
      return acc
    }, [])
    if (clientToc.length === 0) clientToc = null
  }

  const clientReady: ClientReadyPostFrontmatter = {
    slug: String(input.slug || `fallback-slug-${Date.now()}`),
    title: String(input.title || "Untitled Post"),
    date: date,
    tags: Array.isArray(input.tags) ? input.tags.map(String) : [],
    originalTags: Array.isArray(input.originalTags) ? input.originalTags.map(String) : [],
    description: String(input.description || ""),
    thumbnailImage: typeof input.thumbnailImage === "string" ? input.thumbnailImage : null,
    thumbnailBlurDataURL: typeof input.thumbnailBlurDataURL === "string" ? input.thumbnailBlurDataURL : null,
    heroImage: typeof input.heroImage === "string" ? input.heroImage : null,
    heroBlurDataURL: typeof input.heroBlurDataURL === "string" ? input.heroBlurDataURL : null,
    series:
      input.series && typeof input.series.slug === "string" && typeof input.series.title === "string"
        ? input.series
        : null,
    toc: clientToc,
    readTime: String(input.readTime || "N/A"),
    isPublished: typeof input.isPublished === "boolean" ? input.isPublished : true,
    author: String(
      input.author ||
        (typeof siteConfig.author === "object" && typeof siteConfig.author?.name === "string"
          ? siteConfig.author.name
          : "Byteskill Team"),
    ),
    category: String(input.category || "General"),
    lastUpdated: lastUpdated,
    featured: typeof input.featured === "boolean" ? input.featured : false,
    difficulty: String(input.difficulty || "Beginner"),
    codeLink: typeof input.codeLink === "string" ? input.codeLink : null,
    liveDemoLink: typeof input.liveDemoLink === "string" ? input.liveDemoLink : null,
    isBookmarked: typeof input.isBookmarked === "boolean" ? input.isBookmarked : false, // Default
    prevPost: input.prevPost || null,
    nextPost: input.nextPost || null,
  }

  try {
    return JSON.parse(JSON.stringify(clientReady))
  } catch (e: any) {
    console.error(
      `[prepareFrontmatterForClient] FAILED to stringify/parse clientReady frontmatter for ${clientReady.slug}: ${e.message}`,
    )
    // Return a super minimal fallback if stringify fails
    return {
      slug: clientReady.slug,
      title: "Error Loading Title",
      date: new Date().toISOString(),
      tags: [],
      originalTags: [],
      description: "Error",
      toc: null,
      series: null,
      readTime: "N/A",
      lastUpdated: new Date().toISOString(),
    } as ClientReadyPostFrontmatter
  }
}

export async function generateStaticParams() {
  // This now uses the more robust getAllPosts()
  const posts = getAllPosts()
  return posts.map((post) => ({
    slug: post.slug,
  }))
}

export async function generateMetadata(
  { params }: { params: { slug: string } },
  parent: ResolvingMetadata,
): Promise<Metadata> {
  // Uses the more robust getPostBySlug()
  const post = getPostBySlug(params.slug)

  if (!post) {
    return {
      title: "Post Not Found",
    }
  }

  const authorName =
    typeof siteConfig.author === "object" && typeof siteConfig.author?.name === "string"
      ? siteConfig.author.name
      : "Byteskill Team"

  const previousImages = (await parent).openGraph?.images || []
  const ogImageSrc = post.heroImage || post.thumbnailImage || siteConfig.ogImage
  const ogImage = {
    url:
      ogImageSrc && ogImageSrc.startsWith("http") // check ogImageSrc exists
        ? ogImageSrc
        : `${siteConfig.url}${ogImageSrc ? (ogImageSrc.startsWith("/") ? "" : "/") : "/"}${ogImageSrc || ""}`, // handle null/undefined ogImageSrc
    width: 1200,
    height: 630,
    alt: post.title,
  }
  return {
    title: post.title,
    description: post.description,
    openGraph: {
      title: `${post.title} | ${siteConfig.name}`,
      description: post.description,
      url: `${siteConfig.url}/blog/${post.slug}`,
      type: "article",
      publishedTime: new Date(post.date).toISOString(),
      authors: [authorName],
      images: [ogImage, ...previousImages.filter((img: any) => img.url !== ogImage.url)],
      tags: post.originalTags,
    },
    twitter: {
      card: "summary_large_image",
      title: `${post.title} | ${siteConfig.name}`,
      description: post.description,
      images: [ogImage.url],
    },
  }
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const DEBUG_SLUG = "stacks-queues" // The slug that was consistently erroring

  let mdxContentToRender: string
  let finalFrontmatterForClient: ClientReadyPostFrontmatter | null = null
  let finalRelatedPostsForClient: ClientReadyPostFrontmatter[] = []
  let finalPostsInSeriesForClient: ClientReadyPostFrontmatter[] = []

  console.log(`[page.tsx] Rendering for slug: ${params.slug}. DEBUG_SLUG is: ${DEBUG_SLUG}`)

  if (params.slug === DEBUG_SLUG) {
    console.log(`[page.tsx] DEBUG MODE ACTIVE for slug: ${params.slug}`)
    // For debug slug, create absolutely minimal data, bypassing lib/posts for this specific slug's main data
    finalFrontmatterForClient = prepareFrontmatterForClient({
      slug: params.slug,
      title: `Minimal Debug: ${params.slug}`,
      date: new Date().toISOString(),
      description: "Minimal debug description.",
      // ... other minimal fields, ensuring all are serializable
      tags: [],
      originalTags: [],
      toc: [],
      series: null,
      readTime: "0 min",
      isBookmarked: false,
      lastUpdated: new Date().toISOString(),
    } as PostFrontmatter) // Cast to PostFrontmatter for prepareFrontmatterForClient

    mdxContentToRender = "# Debug Content\n\nThis is minimal placeholder content."
    finalRelatedPostsForClient = [] // Empty for debug
    finalPostsInSeriesForClient = [] // Empty for debug

    if (!finalFrontmatterForClient) {
      // Should not happen with hardcoded data
      console.error(`[page.tsx] CRITICAL DEBUG ERROR: Minimal frontmatter for ${params.slug} became null.`)
      notFound()
    }

    console.log(
      `[page.tsx] For ${params.slug} (DEBUG), passing minimal frontmatter:`,
      JSON.stringify(finalFrontmatterForClient, null, 2).substring(0, 500) + "...",
    )
    console.log(`[page.tsx] For ${params.slug} (DEBUG), passing placeholder content.`)
    console.log(`[page.tsx] For ${params.slug} (DEBUG), passing EMPTY relatedPosts and postsInSeries.`)
  } else {
    console.log(`[page.tsx] NORMAL MODE for slug: ${params.slug}`)
    // Normal mode: Use robust functions from lib/posts.ts
    const postWithMdxContent = getPostBySlug(params.slug, true)

    if (!postWithMdxContent || !postWithMdxContent.content) {
      console.error(`[page.tsx] Post or content not found for slug: ${params.slug} using getPostBySlug.`)
      notFound()
    }
    mdxContentToRender = postWithMdxContent.content
    finalFrontmatterForClient = prepareFrontmatterForClient(postWithMdxContent)

    if (!finalFrontmatterForClient) {
      console.error(`[page.tsx] Frontmatter for ${params.slug} became null after preparation for client.`)
      notFound()
    }

    // Fetch all posts for related/series (uses robust getAllPosts)
    const allPosts = getAllPosts()
    const relatedPostsData = getRelatedPosts(params.slug, allPosts, 3)
    finalRelatedPostsForClient = relatedPostsData
      .map((p) => prepareFrontmatterForClient(p))
      .filter((p) => p !== null) as ClientReadyPostFrontmatter[]

    if (finalFrontmatterForClient.series && finalFrontmatterForClient.series.slug) {
      const seriesPostsData = getPostsBySeries(finalFrontmatterForClient.series.slug)
      finalPostsInSeriesForClient = seriesPostsData
        .map((p) => prepareFrontmatterForClient(p))
        .filter((p) => p !== null) as ClientReadyPostFrontmatter[]
    }
    // console.log(`[page.tsx] For ${params.slug} (NORMAL), passing frontmatter:`, JSON.stringify(finalFrontmatterForClient, null, 2).substring(0, 500) + "...")
  }

  if (!finalFrontmatterForClient) {
    // This case should ideally be caught earlier, but as a final safety net
    console.error(`[page.tsx] 최종 frontmatter가 null입니다 slug: ${params.slug}. Not found를 호출합니다.`)
    notFound()
  }

  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-8">Loading post...</div>}>
      <BlogPostPageClient
        content={mdxContentToRender}
        frontmatter={finalFrontmatterForClient as PostFrontmatter} // Cast back if BlogPostPageClient expects full PostFrontmatter
        relatedPosts={finalRelatedPostsForClient as PostFrontmatter[]}
        postsInSeries={finalPostsInSeriesForClient as PostFrontmatter[]}
      />
    </Suspense>
  )
}
