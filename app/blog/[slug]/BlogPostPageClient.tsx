"use client"

import { useEffect, useState, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeSlug from "rehype-slug"
import { TableOfContents } from "@/components/table-of-contents"
// Ensure TocEntry type matches what sanitizeFrontmatterForClient produces for `toc`
import type { PostFrontmatter, TocEntry as ClientTocEntryConfig } from "@/lib/types"
import { SeriesNavigationBox } from "@/components/series-navigation-box"
import { mdxComponents } from "@/components/mdx-components"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, Clock, Tag, ChevronsLeft, ChevronsRight, BookOpenText } from "lucide-react"
import { Breadcrumbs, type BreadcrumbItem } from "@/components/breadcrumbs"
import { ArticleCard } from "@/components/article-card"
import { useUser } from "@/app/contexts/UserContext"
import { markPostAsReadInSeries } from "@/app/series/actions"
import { useToast } from "@/hooks/use-toast"
import { BookmarkButton } from "@/components/bookmark-button"

const GENERIC_BLUR_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mN8/x8AAuMB8DtXNJsAAAAASUVORK5CYII="

const FALLBACK_HEADER_HEIGHT = 90

interface BlogPostPageClientProps {
  content: string
  frontmatter: PostFrontmatter // This now receives ClientReadyPostFrontmatter structure
  relatedPosts: PostFrontmatter[]
  postsInSeries: PostFrontmatter[]
}

export function BlogPostPageClient({ content, frontmatter, relatedPosts, postsInSeries }: BlogPostPageClientProps) {
  const [headerHeight, setHeaderHeight] = useState(FALLBACK_HEADER_HEIGHT)
  const { user, isLoading: isUserLoading } = useUser()
  const { toast } = useToast()
  const hasMarkedAsReadRef = useRef(false)
  const endOfContentRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const siteHeaderElement = document.getElementById("site-header")
    if (siteHeaderElement) {
      const observer = new ResizeObserver((entries) => {
        for (const entry of entries) {
          setHeaderHeight(entry.target.clientHeight)
        }
      })
      observer.observe(siteHeaderElement)
      setHeaderHeight(siteHeaderElement.clientHeight)
      return () => observer.disconnect()
    }
  }, [])

  const scrollOffset = headerHeight > 0 ? headerHeight + 24 : FALLBACK_HEADER_HEIGHT + 24

  // frontmatter.toc should now be ClientReadyTocEntry[] | null
  const tocEntries: ClientTocEntryConfig[] =
    frontmatter.toc && Array.isArray(frontmatter.toc)
      ? frontmatter.toc.filter((item: any): item is ClientTocEntryConfig => {
          // Perform a stricter check on the item structure
          const isValid =
            typeof item.slug === "string" && typeof item.title === "string" && typeof item.level === "number"
          if (!isValid) {
            console.warn("[TOC Client] Skipping malformed TOC entry (received from server):", JSON.stringify(item))
          }
          return isValid
        })
      : []

  useEffect(() => {
    if (isUserLoading || !user || !frontmatter.series || !endOfContentRef.current) {
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry.isIntersecting && !hasMarkedAsReadRef.current) {
          hasMarkedAsReadRef.current = true
          observer.disconnect()

          markPostAsReadInSeries(frontmatter.series!.slug, frontmatter.slug)
            .then((result) => {
              if (result.success) {
                toast({
                  title: "Progress Saved",
                  description: `"${frontmatter.title}" marked as read in the series.`,
                })
              } else {
                console.error("Failed to mark post as read:", result.error)
              }
            })
            .catch((error) => {
              console.error("Error calling markPostAsReadInSeries:", error)
            })
        }
      },
      { rootMargin: "0px", threshold: 0.1 },
    )
    observer.observe(endOfContentRef.current)
    return () => {
      observer.disconnect()
    }
  }, [user, isUserLoading, frontmatter.series, frontmatter.slug, frontmatter.title, toast])

  const formattedDate = frontmatter.date
    ? new Date(frontmatter.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : "N/A"

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: "Home", href: "/" },
    { label: "Blog", href: "/blog" },
  ]
  if (frontmatter.series) {
    breadcrumbItems.push({ label: "Series", href: "/series" })
    breadcrumbItems.push({ label: frontmatter.series.title, href: `/series/${frontmatter.series.slug}` })
  }
  breadcrumbItems.push({ label: frontmatter.title, href: `/blog/${frontmatter.slug}`, isCurrentPage: true })

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="container mx-auto px-4 sm:px-6 lg:px-8 flex-grow py-8 md:py-12 outline-none"
    >
      <Breadcrumbs items={breadcrumbItems} className="mb-6 md:mb-8" />
      <article className="grid grid-cols-1 lg:grid-cols-4 gap-x-12">
        <div className="lg:col-span-3">
          {(frontmatter.heroImage || frontmatter.thumbnailImage) && (
            <div className="relative w-full aspect-[2.35/1] rounded-lg overflow-hidden mb-8 shadow-lg bg-neutral-800">
              <Image
                src={
                  frontmatter.heroImage ||
                  frontmatter.thumbnailImage ||
                  `/placeholder.svg?width=1200&height=510&query=${encodeURIComponent(frontmatter.title) || "blog post hero"}`
                }
                alt={`${frontmatter.title} hero image`}
                fill
                priority
                className="object-cover"
                sizes="(min-width: 1024px) 75vw, 90vw"
                placeholder="blur"
                blurDataURL={frontmatter.heroBlurDataURL || frontmatter.thumbnailBlurDataURL || GENERIC_BLUR_DATA_URL}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            </div>
          )}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-neutral-100 mb-3 tracking-tight">
            {frontmatter.title}
          </h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-neutral-400 mb-6">
            <div className="flex items-center">
              <CalendarDays className="w-4 h-4 mr-1.5 text-green-400" />
              <span>{formattedDate}</span>
            </div>
            {frontmatter.readTime && (
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-1.5 text-green-400" />
                <span>{frontmatter.readTime}</span>
              </div>
            )}
            <BookmarkButton
              itemId={frontmatter.slug}
              itemType="post"
              initialIsBookmarked={frontmatter.isBookmarked || false}
            />
          </div>
          {frontmatter.originalTags && frontmatter.originalTags.length > 0 && (
            <div className="flex items-center gap-x-2 mb-6">
              <Tag className="w-4 h-4 text-green-400" />
              <div className="flex flex-wrap gap-2">
                {frontmatter.originalTags.map((displayTag, index) => {
                  const normalizedTag = frontmatter.tags?.[index]
                  if (!normalizedTag) return null
                  return (
                    <Link href={`/tags/${normalizedTag}`} key={normalizedTag}>
                      <Badge
                        variant="secondary"
                        className="bg-green-700/20 text-green-300 border-green-600/50 hover:bg-green-600/20 text-xs px-1.5 py-0.5 cursor-pointer"
                      >
                        {displayTag}
                      </Badge>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}
          {frontmatter.series && postsInSeries.length > 0 && (
            <SeriesNavigationBox
              currentPostSlug={frontmatter.slug}
              seriesTitle={frontmatter.series.title}
              seriesSlug={frontmatter.series.slug}
              postsInSeries={postsInSeries}
            />
          )}
          <div className="prose prose-invert prose-neutral max-w-none prose-headings:text-neutral-100 prose-headings:font-semibold prose-a:text-green-400 hover:prose-a:text-green-300 prose-strong:text-neutral-200 prose-code:bg-neutral-800 prose-code:text-green-300 prose-code:p-1 prose-code:rounded-md prose-code:font-mono prose-code:text-sm prose-pre:bg-neutral-800 prose-pre:border prose-pre:border-neutral-700 prose-pre:rounded-lg prose-blockquote:border-l-green-500 prose-blockquote:text-neutral-400 prose-li:marker:text-green-400">
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSlug]} components={mdxComponents as any}>
              {content}
            </ReactMarkdown>
          </div>
          <div ref={endOfContentRef} className="h-4" />
          {(frontmatter.prevPost || frontmatter.nextPost) && (
            <nav className="mt-12 pt-8 border-t border-neutral-800 flex flex-col sm:flex-row justify-between gap-6">
              {frontmatter.prevPost ? (
                <Link
                  href={frontmatter.prevPost.href}
                  className="group flex-1 p-4 border border-neutral-700 rounded-lg hover:border-green-500 transition-colors text-left bg-neutral-800/30 hover:bg-neutral-800/60"
                >
                  <div className="text-xs text-neutral-400 mb-1 group-hover:text-green-400 flex items-center">
                    <ChevronsLeft className="w-4 h-4 mr-1.5" /> Previous Post
                  </div>
                  <span className="font-medium text-neutral-200 group-hover:text-green-300">
                    {frontmatter.prevPost.title}
                  </span>
                </Link>
              ) : (
                <div className="flex-1"></div>
              )}
              {frontmatter.nextPost ? (
                <Link
                  href={frontmatter.nextPost.href}
                  className="group flex-1 p-4 border border-neutral-700 rounded-lg hover:border-green-500 transition-colors text-right bg-neutral-800/30 hover:bg-neutral-800/60"
                >
                  <div className="text-xs text-neutral-400 mb-1 group-hover:text-green-400 flex items-center justify-end">
                    Next Post <ChevronsRight className="w-4 h-4 ml-1.5" />
                  </div>
                  <span className="font-medium text-neutral-200 group-hover:text-green-300">
                    {frontmatter.nextPost.title}
                  </span>
                </Link>
              ) : (
                <div className="flex-1"></div>
              )}
            </nav>
          )}
          {relatedPosts && relatedPosts.length > 0 && (
            <section className="mt-16 pt-12 border-t border-neutral-800">
              <h2 className="text-2xl sm:text-3xl font-bold text-neutral-100 mb-8 flex items-center">
                <BookOpenText className="w-7 h-7 mr-3 text-green-400" /> Related Articles
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {relatedPosts.map((post) => (
                  <ArticleCard key={post.slug} post={post} initialIsBookmarked={post.isBookmarked || false} />
                ))}
              </div>
            </section>
          )}
        </div>
        <aside className="lg:col-span-1 mt-12 lg:mt-0">
          <div className="sticky min-h-[10rem]" style={{ top: `${scrollOffset}px` }}>
            <TableOfContents toc={tocEntries} scrollOffset={scrollOffset} title="In this article" />
          </div>
        </aside>
      </article>
    </main>
  )
}
