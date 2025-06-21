/* Server Route – generates sitemap XML
   NOTE: Must export GET (not default) so Next treats it as a server file. */
import { getAllPosts, getAllSeries } from "@/lib/posts"
import { getAllProjects } from "@/lib/projects"
import type { PostFrontmatter, SeriesListingInfo } from "@/lib/posts"
import type { ProjectFrontmatter } from "@/lib/projects"
import { siteConfig } from "@/lib/site-config"

function generateSiteMap(
  posts: PostFrontmatter[],
  projects: ProjectFrontmatter[],
  series: SeriesListingInfo[],
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
    <lastmod>${new Date(post.date).toISOString().split("T")[0]}</lastmod>
    <priority>0.7</priority>
    <changefreq>monthly</changefreq>
  </url>`
  })

  // Projects
  projects.forEach((project) => {
    xml += `
  <url>
    <loc>${siteConfig.url}/projects/${project.slug}</loc>
    <lastmod>${new Date(project.date).toISOString().split("T")[0]}</lastmod>
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

  xml += `</urlset>`
  return xml
}

export async function GET() {
  const posts = getAllPosts()
  const projects = getAllProjects()
  const series = getAllSeries()

  return new Response(generateSiteMap(posts, projects, series), {
    status: 200,
    headers: {
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate",
      "Content-Type": "application/xml",
    },
  })
}
