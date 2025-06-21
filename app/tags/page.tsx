import Link from "next/link"
import { getAllUniqueTags } from "@/lib/posts"
import { ArrowLeft } from "lucide-react"
import type { Metadata } from "next"
import { siteConfig } from "@/lib/site-config"
import { Badge } from "@/components/ui/badge"
import { PageHeader } from "@/components/page-header"

export const metadata: Metadata = {
  title: "Browse by Tag",
  description: `Explore articles on ${siteConfig.name} by specific tags. Find content related to your interests in programming, AI, data science, and more.`,
  openGraph: {
    title: `Browse by Tag | ${siteConfig.name}`,
    description: `Explore articles on ${siteConfig.name} by specific tags.`,
    url: `${siteConfig.url}/tags`,
  },
  twitter: {
    title: `Browse by Tag | ${siteConfig.name}`,
    description: `Explore articles on ${siteConfig.name} by specific tags.`,
  },
}

export default function AllTagsPage() {
  const uniqueTags = getAllUniqueTags()

  return (
    <div className="bg-neutral-900 text-neutral-300 flex-grow">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <Link href="/blog" className="inline-flex items-center text-sm text-green-400 hover:underline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to all articles
          </Link>
        </div>

        <PageHeader title="Browse Articles by Tag" description="Click on a tag to see all related articles." />

        {uniqueTags.length > 0 ? (
          <div className="flex flex-wrap gap-3 justify-center">
            {uniqueTags.map(({ tag, count, displayName }) => (
              <Link
                key={tag}
                href={`/tags/${tag}`}
                className="transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-neutral-900 rounded-md"
              >
                <Badge
                  variant="outline"
                  className="px-4 py-2 text-sm border-green-500/50 text-green-300 bg-green-700/10 hover:bg-green-700/20 cursor-pointer"
                >
                  {displayName}
                  <span className="ml-1.5 text-xs text-neutral-400">({count})</span>
                </Badge>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-center text-neutral-400">No tags found.</p>
        )}
      </div>
    </div>
  )
}
