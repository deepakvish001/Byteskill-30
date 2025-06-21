import Link from "next/link"
import { Eye } from "lucide-react"
import { getMostViewedProjects } from "@/lib/projects" // We created this function earlier
import { ProjectCard } from "@/components/project-card"
import type { ProjectFrontmatter } from "@/lib/types"

interface MostViewedProjectsProps {
  count?: number
  className?: string
}

export async function MostViewedProjects({ count = 3, className }: MostViewedProjectsProps) {
  const projects: ProjectFrontmatter[] = await getMostViewedProjects(count)

  if (!projects || projects.length === 0) {
    return null // Or a fallback message
  }

  return (
    <section aria-labelledby="most-viewed-projects-heading" className={className}>
      <div className="flex justify-between items-center mb-6">
        <h2 id="most-viewed-projects-heading" className="text-xl font-semibold text-neutral-100 flex items-center">
          <Eye className="mr-2 h-5 w-5 text-green-400" />
          Most Viewed Projects
        </h2>
        <Link href="/projects?sort=views_desc" className="text-sm text-green-400 hover:underline">
          View all
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <ProjectCard key={project.slug} project={project} />
        ))}
      </div>
    </section>
  )
}
