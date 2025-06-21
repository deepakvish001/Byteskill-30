"use client"

import Image from "next/image"
import Link from "next/link"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowUpRight, Clock } from "lucide-react"
import type { ArticleCardDisplayInfo, BookmarkItemType } from "@/lib/types"
import { BookmarkButton } from "./bookmark-button"
import { cn } from "@/lib/utils"

const GENERIC_BLUR_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mN8/x8AAuMB8DtXNJsAAAAASUVORK5CYII="

interface ArticleCardProps {
  post: ArticleCardDisplayInfo
  className?: string
  initialIsBookmarked?: boolean
  onToggleSuccess?: (itemId: string, itemType: BookmarkItemType, newIsBookmarked: boolean) => void
}

export function ArticleCard({ post, className, initialIsBookmarked, onToggleSuccess }: ArticleCardProps) {
  if (!post || typeof post.slug !== "string" || typeof post.title !== "string") {
    console.error("ArticleCard received invalid or undefined 'post' prop:", post)
    return null
  }

  return (
    <Card
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-lg border border-neutral-700 bg-neutral-850 text-neutral-300 shadow-md transition-all duration-300 ease-in-out hover:border-green-400/70 hover:shadow-lg hover:shadow-green-500/20",
        className,
      )}
    >
      <Link
        href={`/blog/${post.slug}`}
        className="absolute inset-0 z-10 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-green-500 focus-visible:ring-offset-neutral-850"
        aria-label={`Read article: ${post.title}`} // Added aria-label here
      >
        <span className="sr-only">View {post.title}</span>
      </Link>
      {post.thumbnailImage && (
        <div className="relative aspect-video overflow-hidden bg-neutral-750">
          <Image
            src={post.thumbnailImage || "/placeholder.svg?width=400&height=225&query=blog+thumbnail"}
            alt={`${post.title} thumbnail`}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
            placeholder="blur"
            blurDataURL={post.thumbnailBlurDataURL || GENERIC_BLUR_DATA_URL}
          />
        </div>
      )}
      <CardHeader className="pb-3 pt-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center text-lg font-semibold text-neutral-100 transition-colors group-hover:text-green-300">
            {post.title}
            <ArrowUpRight className="ml-1 h-4 w-4 text-green-300 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          </CardTitle>
          <BookmarkButton
            itemId={post.slug}
            itemType="post"
            className="relative z-20"
            initialIsBookmarked={initialIsBookmarked}
            onToggleSuccess={onToggleSuccess}
          />
        </div>
        <p className="text-xs text-neutral-500 pt-1">
          {new Date(post.date + "T00:00:00").toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </CardHeader>
      <CardContent className="flex-grow pb-3">
        <p className="text-sm text-neutral-400 line-clamp-3 transition-colors group-hover:text-neutral-300">
          {post.description || "No description available."}
        </p>
      </CardContent>
      <CardFooter className="flex flex-wrap items-center justify-between gap-2 pt-2 pb-4 text-xs text-neutral-500">
        <div className="flex flex-wrap gap-2">
          {post.originalTags?.slice(0, 2).map((tag, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="cursor-default border-green-600/30 bg-green-700/10 px-1.5 py-0.5 text-xs text-green-300" // Changed from text-green-300/80
            >
              {tag}
            </Badge>
          ))}
        </div>
        {post.readTime && (
          <div className="flex items-center">
            <Clock className="mr-1 h-3 w-3" />
            <span>{post.readTime}</span>
          </div>
        )}
      </CardFooter>
    </Card>
  )
}
