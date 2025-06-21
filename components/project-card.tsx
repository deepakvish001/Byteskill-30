import type React from "react"
import Link from "next/link"
import Image from "next/image"
import type { ProjectCardDisplayInfo, BookmarkItemType } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowUpRight } from "lucide-react"
import { BookmarkButton } from "./bookmark-button"

interface ProjectCardProps {
  project: ProjectCardDisplayInfo
  initialIsBookmarked?: boolean // Add prop for initial bookmark status
  onToggleSuccess?: (itemId: string, itemType: BookmarkItemType, newIsBookmarked: boolean) => void
}

const GENERIC_BLUR_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mN8/x8AAuMB8DtXNJsAAAAASUVORK5CYII="

const ProjectCard: React.FC<ProjectCardProps> = ({ project, initialIsBookmarked, onToggleSuccess }) => {
  const imageToUse =
    project.thumbnailImage ||
    project.heroImage ||
    `/placeholder.svg?width=400&height=225&query=${encodeURIComponent(project.title || "project")}`
  const blurToUse = project.thumbnailBlurDataURL || project.heroBlurDataURL || GENERIC_BLUR_DATA_URL

  return (
    <Card className="group h-full flex flex-col overflow-hidden rounded-lg border border-neutral-700 bg-neutral-850 text-neutral-300 shadow-md transition-all duration-300 ease-in-out hover:border-sky-500/40 hover:shadow-lg dark:hover:shadow-neutral-700/50">
      <Link
        href={`/projects/${project.slug}`}
        className="flex flex-col h-full rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-sky-500 focus-visible:ring-offset-neutral-850"
      >
        <div className="relative w-full aspect-[16/9] bg-neutral-800 overflow-hidden">
          <Image
            src={imageToUse || "/placeholder.svg"}
            alt={project.title || "Project image"}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 30vw"
            placeholder="blur"
            blurDataURL={blurToUse}
          />
        </div>
        <CardHeader className="p-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center text-lg font-semibold leading-tight text-neutral-100 transition-colors group-hover:text-sky-500 dark:group-hover:text-sky-400">
              {project.title || "Untitled Project"}
              <ArrowUpRight className="ml-1 h-4 w-4 text-sky-400 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            </CardTitle>
            <BookmarkButton
              itemId={project.slug}
              itemType="project"
              className="relative z-20"
              initialIsBookmarked={initialIsBookmarked} // Pass prop to BookmarkButton
              onToggleSuccess={onToggleSuccess}
            />
          </div>
        </CardHeader>
        {(project.category || project.tags?.[0]) && (
          <CardContent className="p-4 pt-0">
            <Badge
              variant="secondary"
              className="text-xs border-sky-500/40 bg-sky-700/20 px-1.5 py-0.5 text-sky-300/90"
            >
              {project.category || project.tags?.[0]}
            </Badge>
          </CardContent>
        )}
      </Link>
    </Card>
  )
}

export default ProjectCard
export { ProjectCard }
