import { getAllProjects } from "@/lib/projects"
import ProjectCard from "@/components/project-card"
import { PaginationControls } from "@/components/pagination-controls"
import { SortOrderSelector } from "@/components/sort-order-selector"
import { ItemsPerPageSelector } from "@/components/items-per-page-selector"
import type { ProjectFrontmatter } from "@/lib/types"
import { PageHeader } from "@/components/page-header"
import { createClient } from "@/lib/supabase/server" // Import Supabase server client

export const metadata = {
  title: "Projects",
  description: "A collection of projects I've worked on, from web apps to open-source tools.",
}

function sortProjects(projects: ProjectFrontmatter[], sortOrder: string): ProjectFrontmatter[] {
  const sorted = [...projects]
  switch (sortOrder) {
    case "date-asc":
      return sorted.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    case "title-asc":
      return sorted.sort((a, b) => a.title.localeCompare(b.title))
    case "title-desc":
      return sorted.sort((a, b) => b.title.localeCompare(a.title))
    case "date-desc":
    default:
      return sorted.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }
}

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const allProjectsData = getAllProjects()

  if (!Array.isArray(allProjectsData)) {
    console.error("getAllProjects did not return an array:", allProjectsData)
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <PageHeader
          title="Projects"
          description="A collection of projects I've worked on, from web apps to open-source tools."
        />
        <p className="text-center text-red-500">Error loading projects.</p>
      </div>
    )
  }

  const page = searchParams["page"] ?? "1"
  const perPage = searchParams["per_page"] ?? "6"
  const sortOrder = (searchParams["sort"] as string) ?? "date-desc"

  const sortedProjects = sortProjects(allProjectsData, sortOrder)

  const start = (Number(page) - 1) * Number(perPage)
  const end = start + Number(perPage)
  const paginatedProjects = sortedProjects.slice(start, end)

  const totalPages = Math.ceil(sortedProjects.length / Number(perPage))

  // Fetch bookmarked project slugs for the current user
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let bookmarkedProjectSlugs = new Set<string>()
  if (user) {
    const { data: bookmarks, error: bookmarksError } = await supabase
      .from("bookmarks")
      .select("item_id")
      .eq("user_id", user.id)
      .eq("item_type", "project")

    if (bookmarksError) {
      console.error("Error fetching project bookmarks:", bookmarksError.message)
    } else if (bookmarks) {
      bookmarkedProjectSlugs = new Set(bookmarks.map((b) => b.item_id))
    }
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <PageHeader
        title="Projects"
        description="A collection of projects I've worked on, from web apps to open-source tools."
      />

      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
        <p className="text-sm text-neutral-400 dark:text-neutral-500">
          Showing {paginatedProjects.length} of {sortedProjects.length} projects
        </p>
        <div className="flex items-center gap-4">
          <SortOrderSelector />
          <ItemsPerPageSelector />
        </div>
      </div>

      {paginatedProjects.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {paginatedProjects.map((project) => (
            <ProjectCard
              key={project.slug}
              project={{
                slug: project.slug,
                title: project.title,
                heroImage: project.thumbnailImage || project.heroImage || "/project-thumbnail.png",
                description: project.description,
                date: project.date,
                tags: project.tags,
                category: project.category, // Ensure category is passed if used by ProjectCard
                // thumbnailImage and thumbnailBlurDataURL are part of ProjectCardDisplayInfo
                thumbnailImage: project.thumbnailImage,
                thumbnailBlurDataURL: project.thumbnailBlurDataURL,
                heroBlurDataURL: project.heroBlurDataURL, // Pass heroBlurDataURL as well
              }}
              initialIsBookmarked={bookmarkedProjectSlugs.has(project.slug)} // Pass initial bookmark status
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-lg text-neutral-500 dark:text-neutral-400">No projects found.</p>
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-12">
          <PaginationControls
            currentPage={Number(page)}
            totalPages={totalPages}
            hasNextPage={end < sortedProjects.length}
            hasPrevPage={start > 0}
          />
        </div>
      )}
    </div>
  )
}
