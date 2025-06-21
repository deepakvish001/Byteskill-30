import Link from "next/link"
import Image from "next/image"
import { getAllSeries, type SeriesListingInfo } from "@/lib/posts"
import { ArrowLeft, ListOrdered, ChevronRight } from "lucide-react"
import type { Metadata } from "next"
import { siteConfig } from "@/lib/site-config"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { SeriesProgressDisplay } from "@/components/series-progress-display"

const GENERIC_BLUR_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mN8/x8AAuMB8DtXNJsAAAAASUVORK5CYII="

export const metadata: Metadata = {
  title: "Blog Series",
  description: `Browse collections of related articles on ${siteConfig.name}. Dive deep into topics with our curated series.`,
  openGraph: {
    title: `Blog Series | ${siteConfig.name}`,
    description: `Browse collections of related articles on ${siteConfig.name}.`,
    url: `${siteConfig.url}/series`,
  },
  twitter: {
    title: `Blog Series | ${siteConfig.name}`,
    description: `Browse collections of related articles on ${siteConfig.name}.`,
  },
}

export default function AllSeriesPage() {
  const allSeries = getAllSeries()

  return (
    <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <Link href="/blog" className="inline-flex items-center text-sm text-green-400 hover:underline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to all articles
        </Link>
      </div>
      <header className="mb-12 text-center">
        <ListOrdered className="w-12 h-12 text-green-400 mx-auto mb-4" />
        <h1 className="text-4xl font-bold text-neutral-100 mb-3">Explore Our Blog Series</h1>
        <p className="text-neutral-400 max-w-xl mx-auto">
          Dive deeper into specific topics with our curated collections of articles.
        </p>
      </header>

      {allSeries.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {allSeries.map((series: SeriesListingInfo) => (
            <Card
              key={series.slug}
              className="h-full flex flex-col bg-neutral-800/50 border-neutral-700/80 hover:border-green-500/70 transition-all duration-300 ease-in-out group hover:shadow-xl hover:shadow-green-900/20 overflow-hidden"
            >
              <div className="aspect-video relative w-full overflow-hidden bg-neutral-750">
                <Image
                  src={
                    series.heroImage ||
                    `/placeholder.svg?width=400&height=225&query=Series+${encodeURIComponent(series.title) || "series-placeholder"}`
                  }
                  alt={`${series.title} series hero image`}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="(min-width: 1280px) 30vw, (min-width: 768px) 45vw, 90vw"
                  placeholder="blur"
                  blurDataURL={series.heroBlurDataURL || GENERIC_BLUR_DATA_URL}
                  unoptimized={!series.heroImage}
                />
              </div>
              <CardHeader className="pb-3 pt-4">
                <CardTitle className="text-lg font-semibold text-neutral-100 group-hover:text-green-300 transition-colors">
                  {series.title}
                </CardTitle>
                <CardDescription className="text-xs text-neutral-500 group-hover:text-neutral-400 transition-colors">
                  {series.postCount} part{series.postCount !== 1 ? "s" : ""} • Last updated:{" "}
                  {new Date(series.lastUpdated + "T00:00:00").toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    timeZone: "UTC",
                  })}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow flex flex-col justify-between pt-0">
                <p className="text-sm text-neutral-400 line-clamp-3 mb-4 group-hover:text-neutral-300 transition-colors">
                  {series.description ||
                    `Explore the "${series.title}" series, covering various aspects of the topic in detail across multiple posts.`}
                </p>

                <SeriesProgressDisplay
                  seriesSlug={series.slug}
                  totalPosts={series.postCount}
                  showCurrentlyReading={true}
                />

                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="w-full mt-auto bg-neutral-700/50 border-neutral-600 text-neutral-300 group-hover:bg-green-500/20 group-hover:border-green-500/50 group-hover:text-green-300 transition-all"
                >
                  <Link href={`/series/${series.slug}`}>
                    View Series <ChevronRight className="w-4 h-4 ml-1.5" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <p className="text-neutral-400 text-center py-10">No series found at the moment. Check back soon!</p>
      )}
    </main>
  )
}
