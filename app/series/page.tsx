import Link from "next/link"
import Image from "next/image"
import { PageHeader } from "@/components/page-header"
import { getAllSeriesWithPostCount } from "@/lib/series" // Updated import
import type { SeriesListingInfo } from "@/lib/types"
import { BookOpenText } from "lucide-react"

export const metadata = {
  title: "Blog Series",
  description: "Explore organized collections of articles on specific topics and learning paths.",
}

export default async function SeriesListPage() {
  const seriesList = await getAllSeriesWithPostCount() // Fetches published series with details

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <PageHeader
        title="Blog Series"
        description="Explore organized collections of articles on specific topics and learning paths."
      />

      {seriesList.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {seriesList.map((series: SeriesListingInfo) => (
            <Link
              key={series.slug}
              href={`/series/${series.slug}`}
              className="block border border-neutral-700 rounded-lg hover:border-green-500 transition-colors group overflow-hidden bg-neutral-800/30 hover:bg-neutral-800/60"
            >
              {series.heroImage ? (
                <div className="aspect-video bg-neutral-800 overflow-hidden">
                  <Image
                    src={series.heroImage || "/placeholder.svg"}
                    alt={`${series.title} series hero image`}
                    width={400}
                    height={225}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              ) : (
                <div className="aspect-video bg-neutral-700 flex items-center justify-center">
                  <BookOpenText className="w-16 h-16 text-neutral-500" />
                </div>
              )}
              <div className="p-4">
                <h2 className="text-xl font-semibold text-neutral-100 group-hover:text-green-400 mb-2">
                  {series.title}
                </h2>
                <p className="text-sm text-neutral-400 line-clamp-3 mb-3">{series.description}</p>
                <div className="flex justify-between items-center text-xs text-neutral-500">
                  <span>
                    {series.postCount} Article{series.postCount !== 1 ? "s" : ""}
                  </span>
                  <span>
                    Last updated:{" "}
                    {new Date(series.lastUpdated).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-lg text-neutral-500 dark:text-neutral-400">No series available at the moment.</p>
          <p className="text-sm text-neutral-600 dark:text-neutral-300 mt-2">
            Check back soon for curated learning paths!
          </p>
        </div>
      )}
    </div>
  )
}
