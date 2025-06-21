import Link from "next/link"
import Image from "next/image"
import { getAllSeries, getPostsBySeries, type PostFrontmatter } from "@/lib/posts"
import { ThemeToggle } from "@/components/theme-toggle"
import { BackToTopButton } from "@/components/back-to-top-button"
import { ArrowLeft, ChevronRight, ListOrdered } from "lucide-react"
import type { Metadata, ResolvingMetadata } from "next"
import { siteConfig } from "@/lib/site-config"
import { notFound } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"

const GENERIC_BLUR_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mN8/x8AAuMB8DtXNJsAAAAASUVORK5CYII="

export async function generateStaticParams() {
  const series = getAllSeries()
  return series.map(({ slug }) => ({
    seriesSlug: slug,
  }))
}

export async function generateMetadata(
  { params }: { params: { seriesSlug: string } },
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const seriesInfo = getAllSeries().find((s) => s.slug === params.seriesSlug)

  if (!seriesInfo) {
    return {
      title: "Series Not Found",
    }
  }

  const previousImages = (await parent).openGraph?.images || []
  const ogImage = seriesInfo.heroImage
    ? {
        url: seriesInfo.heroImage,
        width: 1200,
        height: 630,
        alt: seriesInfo.title,
      }
    : previousImages[0] || {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: `${siteConfig.name} Logo`,
      }

  return {
    title: `Series: ${seriesInfo.title}`,
    description: seriesInfo.description || `All articles in the series "${seriesInfo.title}" on ${siteConfig.name}.`,
    openGraph: {
      title: `Series: ${seriesInfo.title} | ${siteConfig.name}`,
      description: seriesInfo.description || `All articles in the series "${seriesInfo.title}" on ${siteConfig.name}.`,
      url: `${siteConfig.url}/series/${params.seriesSlug}`,
      images: [ogImage, ...previousImages.filter((img) => img.url !== ogImage.url)],
    },
    twitter: {
      title: `Series: ${seriesInfo.title} | ${siteConfig.name}`,
      description: seriesInfo.description || `All articles in the series "${seriesInfo.title}" on ${siteConfig.name}.`,
      images: [ogImage.url],
    },
  }
}

export default function SingleSeriesPage({ params }: { params: { seriesSlug: string } }) {
  const postsInSeries = getPostsBySeries(params.seriesSlug)

  if (postsInSeries.length === 0) {
    notFound()
  }

  const currentSeriesInfo = getAllSeries().find((s) => s.slug === params.seriesSlug)

  const seriesTitle = currentSeriesInfo?.title || "Series"
  const seriesDescription = currentSeriesInfo?.description
  const seriesHeroImage = currentSeriesInfo?.heroImage
  const seriesHeroBlurDataURL = currentSeriesInfo?.heroBlurDataURL

  const totalParts = postsInSeries.length

  return (
    <div className="bg-neutral-900 text-neutral-300 min-h-screen flex flex-col">
      <main
        id="main-content"
        tabIndex={-1}
        className="container mx-auto px-4 sm:px-6 lg:px-8 flex-grow py-12 outline-none"
      >
        <div className="mb-8">
          <Link href="/series" className="inline-flex items-center text-sm text-green-400 hover:underline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to all series
          </Link>
        </div>

        <header className="mb-12 overflow-hidden bg-neutral-800/40 border border-neutral-700/60 rounded-lg">
          {seriesHeroImage && (
            <div className="w-full h-48 md:h-64 relative bg-neutral-800">
              <Image
                src={
                  seriesHeroImage ||
                  `/placeholder.svg?width=1200&height=400&query=${encodeURIComponent(seriesTitle) || "/placeholder.svg"}+series+hero`
                }
                alt={`${seriesTitle} hero image`}
                fill
                className="object-cover"
                priority
                placeholder="blur"
                blurDataURL={seriesHeroBlurDataURL || GENERIC_BLUR_DATA_URL}
                sizes="(max-width: 1400px) 100vw, 1400px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-neutral-800/80 via-neutral-800/40 to-transparent" />
            </div>
          )}
          <div className={`p-6 ${seriesHeroImage ? "relative -mt-12 sm:-mt-16 z-10" : ""}`}>
            <div className="flex items-center mb-2">
              <ListOrdered className="w-8 h-8 mr-3 text-green-400 flex-shrink-0" />
              <div>
                <p className="text-sm text-neutral-400 uppercase tracking-wider">Series</p>
                <h1 className="text-3xl sm:text-4xl font-bold text-green-400">{seriesTitle}</h1>
              </div>
            </div>
            <p className="text-neutral-200 mt-3 mb-4 text-base max-w-2xl">{seriesDescription}</p>
            <p className="text-neutral-400 text-sm">
              {postsInSeries.length} part{postsInSeries.length > 1 ? "s" : ""} in this series. Read them in order or
              jump to any part.
            </p>
          </div>
        </header>

        <div className="space-y-8">
          {postsInSeries.map((post: PostFrontmatter, index: number) => {
            const currentPart = post.series?.part || index + 1
            const progressValue = totalParts > 0 ? (currentPart / totalParts) * 100 : 0

            return (
              <Card
                key={post.slug}
                className="relative bg-neutral-800/30 border-neutral-700/70 hover:border-green-500/50 transition-all duration-300 ease-in-out group overflow-hidden"
              >
                <Link href={`/blog/${post.slug}`} className="block">
                  <div className="flex flex-col md:flex-row">
                    {post.thumbnailImage && (
                      <div className="md:w-1/3 lg:w-1/4 flex-shrink-0 bg-neutral-800/50 aspect-[16/9] md:aspect-auto overflow-hidden">
                        <Image
                          src={
                            post.thumbnailImage ||
                            `/placeholder.svg?width=300&height=170&query=Article+${encodeURIComponent(post.title) || "/placeholder.svg"}`
                          }
                          alt={`${post.title} thumbnail`}
                          width={300}
                          height={170}
                          placeholder="blur"
                          blurDataURL={post.thumbnailBlurDataURL || GENERIC_BLUR_DATA_URL}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 90vw"
                        />
                      </div>
                    )}
                    <div className="p-5 md:p-6 flex-grow flex flex-col justify-between">
                      <div>
                        <Badge
                          variant="outline"
                          className="mb-2 text-xs px-2 py-0.5 border-green-600 text-green-300 bg-green-700/20"
                        >
                          Part {post.series?.part || index + 1}
                        </Badge>
                        <h2 className="text-xl font-semibold text-neutral-100 group-hover:text-green-300 transition-colors mb-1.5">
                          {post.title}
                        </h2>
                        <p className="text-sm text-neutral-400 line-clamp-2 mb-3 group-hover:text-neutral-300 transition-colors">
                          {post.description}
                        </p>
                      </div>
                      <div className="flex items-center justify-between text-xs text-neutral-500 group-hover:text-neutral-400 transition-colors">
                        <span>
                          {new Date(post.date + "T00:00:00").toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                          {post.tag && <span className="mx-1.5">•</span>}
                          {post.tag && (
                            <span className="inline-block bg-neutral-700/50 text-neutral-400 px-1.5 py-0.5 rounded">
                              {post.tag}
                            </span>
                          )}
                        </span>
                        <span className="flex items-center justify-between text-xs text-neutral-500 group-hover:text-neutral-400 transition-colors">
                          <span>
                            {new Date(post.date + "T00:00:00").toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                            {post.tag && <span className="mx-1.5">•</span>}
                            {post.tag && (
                              <span className="inline-block bg-neutral-700/50 text-neutral-400 px-1.5 py-0.5 rounded">
                                {post.tag}
                              </span>
                            )}
                          </span>
                          <span className="flex items-center text-green-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            Read post <ChevronRight className="w-4 h-4 ml-1" />
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
                <div className="absolute bottom-0 left-0 h-1 w-full bg-neutral-700/50" aria-hidden="true">
                  <div
                    className="h-full bg-green-500 transition-all duration-500 ease-out group-hover:bg-green-400"
                    style={{ width: `${progressValue}%` }}
                  />
                </div>
              </Card>
            )
          })}
        </div>
      </main>

      <footer className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-12 border-t border-neutral-800">
        <div className="flex flex-col sm:flex-row justify-between items-center text-sm">
          <p className="mb-4 sm:mb-0">
            © {new Date().getFullYear()} - {siteConfig.name}
          </p>
          <div className="flex items-center space-x-4">
            <BackToTopButton />
            <ThemeToggle />
          </div>
        </div>
      </footer>
    </div>
  )
}
