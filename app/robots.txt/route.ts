/* Server Route – generates robots.txt
   Again, we export GET so it compiles as a Node function. */
import { siteConfig } from "@/lib/site-config"

const robotsTxt = `
User-agent: *
Allow: /

Sitemap: ${siteConfig.url}/sitemap.xml
`.trim()

export async function GET() {
  return new Response(robotsTxt, {
    status: 200,
    headers: { "Content-Type": "text/plain" },
  })
}
