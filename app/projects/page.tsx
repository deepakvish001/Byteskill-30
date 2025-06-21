import { getAllProjects } from "@/lib/projects"
import ProjectCard from "@/components/project-card"
import { PaginationControls } from "@/components/pagination-controls"
import { SortOrderSelector } from "@/components/sort-order-selector"
import { ItemsPerPageSelector } from "@/components/items-per-page-selector"
import type { ProjectFrontmatter } from "@/lib/types"
import { PageHeader } from "@/components/page-header"
import { createClient } from "@/lib/supabase/server"
import { MostViewedProjects } from "@/components/most-viewed-projects" // Added
import { Separator } from "@/components/ui/separator" // Added

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
    case "views-desc": // New
      return sorted.sort((a, b) => (b.view_count || 0) - (a.view_count || 0))
    case "views-asc": // New
      return sorted.sort((a, b) => (a.view_count || 0) - (b.view_count || 0))
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
  const allProjectsData = await getAllProjects()

  if (!Array.isArray(allProjectsData)) {
    console.error("getAllProjects did not return an array:", allProjectsData)
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <PageHeader
          title="Projects"
          description="A collection of projects I've worked on, from web apps to open-source tools."
          className="mb-12 text-center"
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
        className="mb-12 text-center"
      />

      <MostViewedProjects count={3} className="mb-12" />
      <Separator className="mb-12 bg-neutral-700" />

      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
        <p className="text-sm text-neutral-400">
          Showing {paginatedProjects.length} of {sortedProjects.length} projects
        </p>
        <div className="flex items-center gap-4">
          <SortOrderSelector
            options={[
              { value: "date-desc", label: "Newest" },
              { value: "date-asc", label: "Oldest" },
              { value: "title-asc", label: "Title (A-Z)" },
              { value: "title-desc", label: "Title (Z-A)" },
              { value: "views-desc", label: "Most Viewed" },
              { value: "views-asc", label: "Least Viewed" },
            ]}
          />
          <ItemsPerPageSelector />
        </div>
      </div>

      {paginatedProjects.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {paginatedProjects.map((project) => (
            <ProjectCard
              key={project.slug}
              project={{
                ...project, // Spread existing project data
                heroImage: project.thumbnailImage || project.heroImage || "/project-thumbnail.png",
              }}
              initialIsBookmarked={bookmarkedProjectSlugs.has(project.slug)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-lg text-neutral-500 dark:text-neutral-400">No projects found matching your criteria.</p>
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
