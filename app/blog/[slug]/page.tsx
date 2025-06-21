import { Suspense } from "react"
import { notFound } from "next/navigation"
import { getAllPosts, getPostBySlug, getRelatedPosts, getPostContentHtml } from "@/lib/posts"
import { createClient } from "@/lib/supabase/server"
import type { Metadata, ResolvingMetadata } from "next"
import { siteConfig } from "@/lib/site-config"
import { BlogPostPageClient } from "./BlogPostPageClient"
import type { PostFrontmatter } from "@/lib/types"

export async function generateStaticParams() {
  const posts = await getAllPosts() // getAllPosts is now async
  return posts.map((post) => ({
    slug: post.slug,
  }))
}

export async function generateMetadata(
  { params }: { params: { slug: string } },
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const post = await getPostBySlug(params.slug) // getPostBySlug is now async

  if (!post) {
    return {
      title: "Post Not Found",
    }
  }

  const previousImages = (await parent).openGraph?.images || []
  const ogImageSrc = post.heroImage || post.thumbnailImage || siteConfig.ogImage

  const absoluteOgImage = ogImageSrc.startsWith("http")
    ? ogImageSrc
    : `${siteConfig.url}${ogImageSrc.startsWith("/") ? "" : "/"}${ogImageSrc}`

  const ogImage = {
    url: absoluteOgImage,
    width: 1200,
    height: 630,
    alt: post.title,
  }

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Article", // Or BlogPosting, NewsArticle, TechArticle
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${siteConfig.url}/blog/${post.slug}`,
    },
    headline: post.title,
    description: post.description,
    image: {
      "@type": "ImageObject",
      url: absoluteOgImage,
      width: 1200,
      height: 630,
    },
    datePublished: new Date(post.date).toISOString(),
    dateModified: new Date(post.updated_at || post.date).toISOString(),
    author: {
      "@type": "Person", // Or Organization if it's a company blog
      name: post.author?.name || siteConfig.author.name,
      url: post.author?.url || siteConfig.author.url,
    },
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
      logo: {
        "@type": "ImageObject",
        url: `${siteConfig.url}${siteConfig.logo.startsWith("/") ? "" : "/"}${siteConfig.logo}`,
      },
    },
    keywords: post.originalTags?.join(", "),
  }

  return {
    title: post.title,
    description: post.description,
    alternates: {
      canonical: `${siteConfig.url}/blog/${post.slug}`,
    },
    openGraph: {
      title: `${post.title} | ${siteConfig.name}`,
      description: post.description,
      url: `${siteConfig.url}/blog/${post.slug}`,
      type: "article",
      publishedTime: new Date(post.date).toISOString(),
      modifiedTime: new Date(post.updated_at || post.date).toISOString(),
      authors: post.author?.name ? [post.author.name] : [siteConfig.author.name],
      images: [ogImage, ...previousImages.filter((img) => img.url !== ogImage.url)],
      tags: post.originalTags,
    },
    twitter: {
      card: "summary_large_image",
      title: `${post.title} | ${siteConfig.name}`,
      description: post.description,
      images: [ogImage.url],
      creator: siteConfig.author.twitterHandle ? `@${siteConfig.author.twitterHandle}` : undefined,
    },
    other: {
      "application/ld+json": JSON.stringify(structuredData),
    },
  }
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const post = await getPostBySlug(params.slug) // getPostBySlug is now async

  if (!post) {
    notFound()
  }

  // Ensure content is processed to HTML if not already
  const contentHtml = await getPostContentHtml(params.slug) // Use the new function

  // Fetch bookmark status if user is logged in
  if (user) {
    const { data: bookmark, error } = await supabase
      .from("bookmarks")
      .select("item_id")
      .eq("user_id", user.id)
      .eq("item_id", post.slug)
      .eq("item_type", "post")
      .maybeSingle()

    if (error) {
      console.error("Error fetching bookmark status:", error)
    }
    post.isBookmarked = !!bookmark
  } else {
    post.isBookmarked = false
  }

  // Fetch related posts and augment with their bookmark statuses
  const allPostsData = await getAllPosts() // getAllPosts is now async
  let relatedPosts = getRelatedPosts(post.slug, allPostsData, 3)

  if (user && relatedPosts.length > 0) {
    const relatedPostSlugs = relatedPosts.map((p) => p.slug)
    const { data: relatedBookmarks, error: relatedBookmarksError } = await supabase
      .from("bookmarks")
      .select("item_id")
      .eq("user_id", user.id)
      .eq("item_type", "post")
      .in("item_id", relatedPostSlugs)

    if (relatedBookmarksError) {
      console.error("Error fetching related posts bookmark status:", relatedBookmarksError)
    } else if (relatedBookmarks) {
      const bookmarkedRelatedSlugs = new Set(relatedBookmarks.map((b) => b.item_id))
      relatedPosts = relatedPosts.map((p) => ({
        ...p,
        isBookmarked: bookmarkedRelatedSlugs.has(p.slug),
      }))
    }
  }

  const postWithHtmlContent: PostFrontmatter & { contentHtml: string } = {
    ...post,
    contentHtml, // Add the processed HTML content
  }

  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-8">Loading post...</div>}>
      <BlogPostPageClient frontmatter={postWithHtmlContent} relatedPosts={relatedPosts} />
    </Suspense>
  )
}
