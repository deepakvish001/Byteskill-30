"use client"

import Image from "next/image"
import Link from "next/link"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeSlug from "rehype-slug"
import { mdxComponents } from "@/components/mdx-components"
import type { ProjectFrontmatter } from "@/lib/types"
import type { User } from "@supabase/supabase-js"
import { useAdvancedDynamicHeight } from "@/hooks/use-advanced-dynamic-height"
import { Breadcrumbs, type BreadcrumbItem } from "@/components/breadcrumbs"
import { TableOfContents, type HeadingData as TocHeadingData } from "@/components/table-of-contents"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ExternalLink, Github, CalendarDays, Clock, Tag, Briefcase } from "lucide-react"
import ProjectCard from "@/components/project-card"
import { BookmarkButton } from "@/components/bookmark-button" // Uncommented

const GENERIC_BLUR_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mN8/x8AAuMB8DtXNJsAAAAASUVORK5CYII="

interface ProjectDetailsProps {
  project: ProjectFrontmatter & { isBookmarked?: boolean; content?: string }
  mdxContent: string
  relatedProjects: ProjectFrontmatter[]
  currentUser: User | null
}

export function ProjectDetails({ project, mdxContent, relatedProjects, currentUser }: ProjectDetailsProps) {
  const headerHeight = useAdvancedDynamicHeight("site-header")
  const scrollOffset = headerHeight > 0 ? headerHeight + 24 : 90

  const tocHeadings: TocHeadingData[] =
    project.toc?.map((item: any) => ({
      id: item.href.startsWith("#") ? item.href.slice(1) : item.href,
      title: item.title,
      level: item.indent ? 3 : 2,
      node: null,
      icon: item.icon,
    })) ?? []

  const formattedDate = project.date
    ? new Date(project.date + "T00:00:00").toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "N/A"

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: "Home", href: "/" },
    { label: "Projects", href: "/projects" },
    { label: project.title, href: `/projects/${project.slug}`, isCurrentPage: true },
  ]

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex-grow py-8 md:py-12">
      <Breadcrumbs items={breadcrumbItems} />

      <article className="grid grid-cols-1 lg:grid-cols-4 gap-x-12">
        <div className="lg:col-span-3">
          {project.heroImage && (
            <div className="relative w-full aspect-[2.35/1] rounded-lg overflow-hidden mb-8 shadow-lg bg-neutral-800">
              <Image
                src={
                  project.heroImage ||
                  `/placeholder.svg?width=1200&height=510&query=${encodeURIComponent(project.title || "project hero")}`
                }
                alt={`${project.title || "Project"} hero image`}
                fill
                priority
                className="object-cover"
                sizes="(min-width: 1024px) 75vw, 90vw"
                placeholder="blur"
                blurDataURL={project.heroBlurDataURL || GENERIC_BLUR_DATA_URL}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            </div>
          )}

          <div className="flex justify-between items-start mb-3">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-neutral-100 tracking-tight">
              {project.title}
            </h1>
            {currentUser && project.slug && (
              <BookmarkButton
                itemId={project.slug}
                itemType="project"
                userId={currentUser.id}
                initialIsBookmarked={project.isBookmarked || false} // Use the passed prop
                size="lg"
                variant="ghost"
                className="text-neutral-400 hover:text-neutral-100"
              />
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-neutral-400 mb-6">
            <div className="flex items-center">
              <CalendarDays className="w-4 h-4 mr-1.5 text-green-400" />
              <span>{formattedDate}</span>
            </div>
            {project.readTime && (
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-1.5 text-green-400" />
                <span>{project.readTime}</span>
              </div>
            )}
          </div>

          {project.longDescription && (
            <p className="text-lg text-neutral-300 mb-8 leading-relaxed">{project.longDescription}</p>
          )}

          <div className="flex flex-wrap gap-3 mb-8">
            {project.liveUrl && (
              <Button
                asChild
                variant="outline"
                className="border-green-500 text-green-400 hover:bg-green-500/10 hover:text-green-300"
              >
                <Link href={project.liveUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Live Demo
                </Link>
              </Button>
            )}
            {project.repoUrl && (
              <Button
                asChild
                variant="outline"
                className="border-neutral-600 text-neutral-300 hover:bg-neutral-700/50 hover:text-neutral-200"
              >
                <Link href={project.repoUrl} target="_blank" rel="noopener noreferrer">
                  <Github className="w-4 h-4 mr-2" />
                  View Code
                </Link>
              </Button>
            )}
          </div>

          {project.tags && project.tags.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-neutral-100 mb-3 flex items-center">
                <Tag className="w-5 h-5 mr-2 text-green-400" />
                Technologies Used
              </h2>
              <div className="flex flex-wrap gap-2">
                {project.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="bg-neutral-700/50 text-neutral-300 border-neutral-600 hover:bg-neutral-600/50"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div
            className="prose prose-invert prose-neutral max-w-none 
                       prose-headings:text-neutral-100 prose-headings:font-semibold
                       prose-a:text-green-400 hover:prose-a:text-green-300
                       prose-strong:text-neutral-200
                       prose-code:bg-neutral-800 prose-code:text-green-300 prose-code:p-1 prose-code:rounded-md prose-code:font-mono prose-code:text-sm
                       prose-pre:bg-neutral-800 prose-pre:border prose-pre:border-neutral-700 prose-pre:rounded-lg
                       prose-blockquote:border-l-green-500 prose-blockquote:text-neutral-400
                       prose-li:marker:text-green-400"
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSlug]} components={mdxComponents as any}>
              {mdxContent}
            </ReactMarkdown>
          </div>

          {project.lighthouseScoreImage && (
            <div className="mt-12">
              <h2 className="text-2xl font-semibold text-neutral-100 mb-4">Performance Score</h2>
              <div className="relative w-full max-w-md mx-auto border border-neutral-700 rounded-lg overflow-hidden shadow-md aspect-[2/1] bg-neutral-800">
                <Image
                  src={
                    project.lighthouseScoreImage ||
                    `/placeholder.svg?width=600&height=300&query=${encodeURIComponent(project.title || "lighthouse score")}`
                  }
                  alt={`${project.title || "Project"} Lighthouse score`}
                  fill
                  className="object-contain"
                  sizes="(max-width: 448px) 100vw, 448px"
                />
              </div>
            </div>
          )}
        </div>

        <aside className="lg:col-span-1 mt-12 lg:mt-0">
          <div className="sticky top-24 min-h-[10rem]">
            <TableOfContents
              headings={tocHeadings}
              iconComponents={{}}
              scrollOffset={scrollOffset}
              title="On this page"
            />
          </div>
        </aside>
      </article>

      {relatedProjects && relatedProjects.length > 0 && (
        <section className="mt-16 pt-12 border-t border-neutral-800">
          <h2 className="text-2xl sm:text-3xl font-bold text-neutral-100 mb-8 flex items-center">
            <Briefcase className="w-7 h-7 mr-3 text-green-400" />
            Similar Projects
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {relatedProjects.map((relatedPrj) => (
              <ProjectCard
                key={relatedPrj.slug}
                project={{
                  ...relatedPrj,
                  imageUrl: relatedPrj.heroImage || relatedPrj.thumbnailImage || "/related-projects.png",
                  blurDataURL: relatedPrj.heroBlurDataURL || relatedPrj.thumbnailBlurDataURL || GENERIC_BLUR_DATA_URL,
                }}
                // Note: We'd need to fetch bookmark status for related projects too if we want to show it here
                // For now, initialIsBookmarked is not passed to related project cards
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
