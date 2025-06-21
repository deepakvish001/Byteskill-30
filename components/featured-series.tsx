import Link from "next/link"
import Image from "next/image"
import type { Series } from "@/lib/posts" // Assuming Series type is defined here
import { Badge } from "@/components/ui/badge"

interface FeaturedSeriesProps {
  series: Series[]
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
        {series.map((s) => (
          <Link
            key={s.slug}
            href={`/series/${s.slug}`}
            aria-label={`View series: ${s.title}`}
            className="block border border-neutral-700 rounded-lg hover:border-green-500 transition-colors group overflow-hidden bg-neutral-800/30 hover:bg-neutral-800/60"
          >
            {s.heroImage && (
              <div className="aspect-video bg-neutral-800 overflow-hidden">
                <Image
                  src={s.heroImage || "/placeholder.svg"}
                  alt={`${s.title} thumbnail`}
                  width={400}
                  height={225}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
            )}
            <div className="p-4">
              <h3 className="font-medium text-neutral-100 group-hover:text-green-400 mb-1">{s.title}</h3>
              <p className="text-sm text-neutral-400 line-clamp-2 mb-2">{s.description}</p>
              <Badge variant="secondary" className="text-xs bg-neutral-700 text-neutral-300">
                {s.posts.length} Part{s.posts.length === 1 ? "" : "s"}
              </Badge>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}

export default FeaturedSeries
