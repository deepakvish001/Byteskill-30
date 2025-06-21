import Link from "next/link"
import Image from "next/image"
import type { SeriesListingInfo } from "@/lib/types" // Ensure this type matches what getFeaturedSeriesFromDb returns
import { BookOpenText } from "lucide-react"

interface FeaturedSeriesProps {
  series: SeriesListingInfo[]
}

export function FeaturedSeries({ series }: FeaturedSeriesProps) {
  if (!series || series.length === 0) {
    return (
      <section aria-labelledby="featured-series-heading-fallback">
        <h2 id="featured-series-heading-fallback" className="text-2xl font-semibold text-neutral-100 mb-4">
          Featured Series
        </h2>
        <p className="text-neutral-400">No series to display at the moment.</p>
      </section>
    )
  }

  return (
    <section aria-labelledby="featured-series-heading">
      <div className="flex justify-between items-center mb-8">
        <h2 id="featured-series-heading" className="text-2xl font-semibold text-neutral-100">
          Featured Series
        </h2>
        <Link href="/series" className="text-sm text-green-400 hover:underline" aria-label="See all series">
          See all series
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {series.map((item) => (
          <Link
            key={item.slug}
            href={`/series/${item.slug}`}
            aria-label={`Explore series: ${item.title}`}
            className="block border border-neutral-700 rounded-lg hover:border-green-500 transition-colors group overflow-hidden bg-neutral-800/30 hover:bg-neutral-800/60"
          >
            {item.heroImage ? (
              <div className="aspect-video bg-neutral-800 overflow-hidden">
                <Image
                  src={item.heroImage || "/placeholder.svg"}
                  alt={`${item.title} series hero image`}
                  width={400}
                  height={225}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
            ) : (
              <div className="aspect-video bg-neutral-700 flex items-center justify-center">
                <BookOpenText className="w-12 h-12 text-neutral-500" />
              </div>
            )}
            <div className="p-4">
              <h3 className="font-medium text-neutral-100 group-hover:text-green-400 mb-1">{item.title}</h3>
              <p className="text-sm text-neutral-400 line-clamp-2 mb-2">{item.description}</p>
              <p className="text-xs text-neutral-500">
                {item.postCount} Article{item.postCount !== 1 ? "s" : ""}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}

export default FeaturedSeries
