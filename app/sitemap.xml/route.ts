/* Server Route – generates sitemap XML */
import { getAllPosts, getAllSeries } from "@/lib/posts"
import { getAllProjects } from "@/lib/projects"
import { createClient } from "@/lib/supabase/server" // For fetching users
import type { PostFrontmatter, SeriesListingInfo, UserProfile } from "@/lib/types" // Updated types
import type { ProjectFrontmatter } from "@/lib/types" // Updated types
import { siteConfig } from "@/lib/site-config"

async function getAllPublicUsernames(): Promise<Pick<UserProfile, "username" | "updated_at">[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("profiles")
    .select("username, updated_at") // Assuming profiles have an updated_at or use created_at
    .not("username", "is", null) // Ensure username exists

  if (error) {
    console.error("Error fetching user profiles for sitemap:", error)
    return []
  }
  return data.map((profile) => ({
    username: profile.username!, // Assert username is not null due to filter
    updated_at: profile.updated_at || new Date().toISOString(), // Fallback if updated_at is null
  }))
}

function generateSiteMap(
  posts: PostFrontmatter[],
  projects: ProjectFrontmatter[],
  series: SeriesListingInfo[],
  users: Pick<UserProfile, "username" | "updated_at">[], // Add users
): string {
  const today = new Date().toISOString().split("T")[0]

  let xml = `<?xml version="1.0" encoding="UTF-8"?>`
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`

  // Static pages
  const staticPages = [
    { url: "", priority: 1.0, changeFrequency: "weekly", lastModified: today },
    { url: "/blog", priority: 0.8, changeFrequency: "weekly", lastModified: today },
    { url: "/projects", priority: 0.8, changeFrequency: "weekly", lastModified: today },
    { url: "/tags", priority: 0.7, changeFrequency: "weekly", lastModified: today },
    { url: "/series", priority: 0.7, changeFrequency: "weekly", lastModified: today },
    { url: "/about", priority: 0.5, changeFrequency: "monthly", lastModified: today },
    { url: "/site-directory", priority: 0.4, changeFrequency: "monthly", lastModified: today },
  ]

  staticPages.forEach((page) => {
    xml += `
  <url>
    <loc>${siteConfig.url}${page.url}</loc>
    <lastmod>${page.lastModified}</lastmod>
    <priority>${page.priority.toFixed(1)}</priority>
    <changefreq>${page.changeFrequency}</changefreq>
  </url>`
  })

  // Blog posts
  posts.forEach((post) => {
    xml += `
  <url>
    <loc>${siteConfig.url}/blog/${post.slug}</loc>
    <lastmod>${new Date(post.updated_at || post.date).toISOString().split("T")[0]}</lastmod>
    <priority>0.7</priority>
    <changefreq>monthly</changefreq>
  </url>`
  })

  // Projects
  projects.forEach((project) => {
    xml += `
  <url>
    <loc>${siteConfig.url}/projects/${project.slug}</loc>
    <lastmod>${new Date(project.updated_at || project.date).toISOString().split("T")[0]}</lastmod>
    <priority>0.7</priority>
    <changefreq>monthly</changefreq>
  </url>`
  })

  // Series pages
  series.forEach((s) => {
    xml += `
  <url>
    <loc>${siteConfig.url}/series/${s.slug}</loc>
    <lastmod>${new Date(s.lastUpdated).toISOString().split("T")[0]}</lastmod>
    <priority>0.6</priority>
    <changefreq>weekly</changefreq>
  </url>`
  })

  // User profiles
  users.forEach((user) => {
    xml += `
  <url>
    <loc>${siteConfig.url}/u/${user.username}</loc>
    <lastmod>${new Date(user.updated_at || today).toISOString().split("T")[0]}</lastmod>
    <priority>0.5</priority>
    <changefreq>monthly</changefreq>
  </url>`
  })

  xml += `</urlset>`
  return xml
}

export async function GET() {
  const posts = await getAllPosts() // Assuming these are now async
  const projects = await getAllProjects() // Assuming these are now async
  const series = await getAllSeries() // Assuming these are now async
  const users = await getAllPublicUsernames()

  return new Response(generateSiteMap(posts, projects, series, users), {
    status: 200,
    headers: {
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate", // Cache for 1 day
      "Content-Type": "application/xml",
    },
  })
}
