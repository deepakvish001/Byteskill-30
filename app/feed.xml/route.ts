import RSS from "rss"
import { getAllPosts } from "@/lib/posts"
import { siteConfig } from "@/lib/site-config"
import { absoluteUrl } from "@/lib/utils" // Assuming you have or will create this utility

// Utility function to create absolute URLs (if not already present)
// You might already have this in lib/utils.ts
// const absoluteUrl = (path: string) => `${siteConfig.url}${path}`;

export async function GET() {
  const allPosts = await getAllPosts({
    sortBy: "date",
    sortOrder: "desc",
    includeUnpublished: false, // Ensure only published posts are in the feed
  })

  const feed = new RSS({
    title: `${siteConfig.name} Blog`,
    description: siteConfig.description,
    site_url: siteConfig.url,
    feed_url: absoluteUrl("/feed.xml"),
    language: "en", // Or your site's primary language
    pubDate: new Date(), // Current date as publication date of the feed
    copyright: `${new Date().getFullYear()} ${siteConfig.name}`,
    managingEditor: siteConfig.email, // Or a relevant contact
    webMaster: siteConfig.email, // Or a relevant contact
    ttl: 60, // Time to live in minutes
  })

  allPosts.forEach((post) => {
    feed.item({
      title: post.title,
      description: post.description || "", // Use post description, or an excerpt
      url: absoluteUrl(`/blog/${post.slug}`), // Full URL to the post
      guid: absoluteUrl(`/blog/${post.slug}`), // A unique identifier for the item
      categories: post.tags.map((tag) => tag.name), // Post tags as categories
      author: post.author?.name || siteConfig.author, // Post author or site author
      date: new Date(post.date), // Publication date of the post
      // enclosure: post.heroImage ? { url: absoluteUrl(post.heroImage) } : undefined, // Optional: if you want to include an image
    })
  })

  const xml = feed.xml({ indent: true })

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      // Optional: Cache control headers
      // "Cache-Control": "public, s-maxage=1200, stale-while-revalidate=600",
    },
  })
}
