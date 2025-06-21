"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { Eye } from "lucide-react"
import { TableOfContents } from "@/components/table-of-contents"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { SocialShareButtons } from "@/components/social-share-buttons"
import { BookmarkButton } from "@/components/bookmark-button"
import { SeriesNavigationBox } from "@/components/series-navigation-box"
import { ArticleCard } from "@/components/article-card"
import { siteConfig } from "@/lib/site-config"
import type { PostFrontmatter } from "@/lib/types"
import { createClient } from "@/lib/supabase/client"
import { CommentsSection } from "@/components/comments/comments-section"
import type { User } from "@supabase/supabase-js"
import { incrementViewCount } from "@/app/content/actions" // New action
import { useToast } from "@/hooks/use-toast"

interface BlogPostPageClientProps {
  frontmatter: PostFrontmatter & { contentHtml: string }
  relatedPosts: PostFrontmatter[]
}

export function BlogPostPageClient({ frontmatter, relatedPosts }: BlogPostPageClientProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [currentViewCount, setCurrentViewCount] = useState<number>(frontmatter.view_count || 0)
  const viewIncrementedRef = useRef(false) // To ensure view count is incremented only once per page load/client session
  const { toast } = useToast()

  useEffect(() => {
    const supabase = createClient()
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setCurrentUser(user)
    }
    fetchUser()

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setCurrentUser(session?.user ?? null)
    })

    return () => {
      authListener?.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (frontmatter.id && !viewIncrementedRef.current) {
      const doIncrement = async () => {
        try {
          // console.log(`Attempting to increment view count for post ID: ${frontmatter.id}`);
          const result = await incrementViewCount(frontmatter.id, "post")
          if (result.success && result.newViewCount !== undefined) {
            // console.log(`View count incremented successfully. New count: ${result.newViewCount}`);
            setCurrentViewCount(result.newViewCount)
          } else if (!result.success && result.error) {
            // console.warn(`Failed to increment view count: ${result.error}`);
            // Don't show toast for rate limit or already viewed, it's expected.
            // if (result.error !== "Rate limit exceeded. Try again later.") {
            //   toast({ title: "View Count", description: result.error, variant: "destructive" });
            // }
          }
        } catch (error) {
          console.error("Error in incrementViewCount effect:", error)
          // toast({ title: "Error", description: "Could not update view count.", variant: "destructive" });
        } finally {
          viewIncrementedRef.current = true
        }
      }
      doIncrement()
    }
  }, [frontmatter.id, toast])

  const {
    id: postId,
    title,
    date,
    updated_at,
    author,
    heroImage,
    tags,
    originalTags,
    series,
    prevPost,
    nextPost,
    contentHtml,
    isBookmarked: initialIsBookmarked,
  } = frontmatter

  const publishedDate = new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
  const updatedDate = updated_at
    ? new Date(updated_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null

  const pageUrl = `${siteConfig.url}/blog/${frontmatter.slug}`

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumbs
        segments={[
          { title: "Home", href: "/" },
          { title: "Blog", href: "/blog" },
          { title: frontmatter.title, href: `/blog/${frontmatter.slug}` },
        ]}
        className="mb-6"
      />

      <article className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 xl:col-span-9 space-y-8">
          <header className="space-y-4">
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground">{title}</h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
              <span>
                Published on <time dateTime={date}>{publishedDate}</time>
              </span>
              {updatedDate && updatedDate !== publishedDate && (
                <span>
                  Updated on <time dateTime={updated_at!}>{updatedDate}</time>
                </span>
              )}
              {author && (
                <span>
                  By{" "}
                  <Link href={author.url || "#"} className="hover:text-primary hover:underline">
                    {author.name}
                  </Link>
                </span>
              )}
              <span className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                {currentViewCount.toLocaleString()} views
              </span>
            </div>
            {heroImage && (
              <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-border">
                <Image src={heroImage || "/placeholder.svg"} alt={title} layout="fill" objectFit="cover" priority />
              </div>
            )}
          </header>

          {series && <SeriesNavigationBox series={series} currentPostSlug={frontmatter.slug} />}

          <div
            className="prose prose-quoteless prose-neutral dark:prose-invert max-w-none 
                       prose-headings:font-semibold prose-a:text-primary hover:prose-a:underline 
                       prose-img:rounded-md prose-img:border prose-img:border-border"
            dangerouslySetInnerHTML={{ __html: contentHtml }}
          />

          <footer className="space-y-6 pt-6 border-t border-border">
            {tags && tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <span className="font-medium">Tags:</span>
                {originalTags?.map((tag, index) => (
                  <Link
                    key={tag}
                    href={`/tags/${tags[index]}`}
                    className="px-2 py-0.5 text-xs bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground rounded-full transition-colors"
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            )}

            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <SocialShareButtons url={pageUrl} title={title} />
              <BookmarkButton
                itemId={frontmatter.slug} // slug is used as itemId for posts in bookmarking
                itemType="post"
                initialBookmarked={initialIsBookmarked || false}
                userId={currentUser?.id}
                className="w-full sm:w-auto"
              />
            </div>

            {(prevPost || nextPost) && (
              <nav className="flex flex-col sm:flex-row justify-between gap-4 pt-4 border-t border-border">
                {prevPost ? (
                  <Link href={`/blog/${prevPost.slug}`} className="text-sm text-muted-foreground hover:text-primary">
                    &larr; Previous: {prevPost.title}
                  </Link>
                ) : (
                  <span />
                )}
                {nextPost ? (
                  <Link
                    href={`/blog/${nextPost.slug}`}
                    className="text-sm text-muted-foreground hover:text-primary text-right"
                  >
                    Next: {nextPost.title} &rarr;
                  </Link>
                ) : (
                  <span />
                )}
              </nav>
            )}
          </footer>

          {postId && <CommentsSection postId={postId} currentUser={currentUser} />}
        </div>

        <aside className="lg:col-span-4 xl:col-span-3 lg:sticky lg:top-20 self-start space-y-8">
          <TableOfContents content={frontmatter.content || ""} />
          {relatedPosts.length > 0 && (
            <section>
              <h3 className="text-xl font-semibold mb-4 text-foreground">Related Articles</h3>
              <div className="space-y-4">
                {relatedPosts.map((post) => (
                  <ArticleCard key={post.slug} post={post} compact />
                ))}
              </div>
            </section>
          )}
        </aside>
      </article>
    </div>
  )
}
