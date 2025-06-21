/* Server Component –
   Renders the three most-recent featured (or latest) projects. */
import Link from "next/link"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import type { ProjectFrontmatter } from "@/lib/projects"
import { getAllProjects, getFeaturedProjects } from "@/lib/projects"

interface FeaturedProjectsProps {
  projects?: ProjectFrontmatter[]
}

function FeaturedProjectsComponent() {
  const projects = getFeaturedProjects(getAllProjects(), 3)

  if (!projects || projects.length === 0) {
    return (
      <section id="projects" aria-labelledby="featured-projects-heading-fallback">
        <h2 id="featured-projects-heading-fallback" className="text-2xl font-semibold text-neutral-100 mb-4">
          Featured Projects
        </h2>
        <p className="text-neutral-400">No projects to display at the moment.</p>
      </section>
    )
  }
  return (
    <section id="projects" aria-labelledby="featured-projects-heading">
      <div className="flex justify-between items-center mb-8">
        <h2 id="featured-projects-heading" className="text-2xl font-semibold text-neutral-100">
          Featured Projects
        </h2>
        <Link href="/projects" className="text-sm text-green-400 hover:underline" aria-label="See all projects">
          See all projects
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <Link
            key={project.slug}
            href={`/projects/${project.slug}`}
            aria-label={`View project: ${project.title}`}
            className="block border border-neutral-700 rounded-lg hover:border-green-500 transition-colors group overflow-hidden bg-neutral-800/30 hover:bg-neutral-800/60"
          >
            <div className="aspect-video bg-neutral-800 overflow-hidden">
              <Image
                src={
                  project.heroImage ||
                  `/placeholder.svg?width=400&height=225&query=${encodeURIComponent(project.title) || "/placeholder.svg"}`
                }
                alt={`${project.title} thumbnail`}
                width={400}
                height={225}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                unoptimized // Add if using placeholder URLs that might not be in next.config.js images.remotePatterns
              />
            </div>
            <div className="p-4">
              <h3 className="font-medium text-neutral-100 group-hover:text-green-400 mb-1">{project.title}</h3>
              <p className="text-sm text-neutral-400 line-clamp-2 mb-2">{project.description}</p>
              {project.tags && project.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {project.tags.slice(0, 3).map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="text-xs px-1.5 py-0.5 border-neutral-600 text-neutral-400 bg-neutral-700/40 group-hover:border-green-600 group-hover:text-green-300"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}

export function FeaturedProjects({ projects }: FeaturedProjectsProps) {
  if (!projects || projects.length === 0) {
    return (
      <section id="projects" aria-labelledby="featured-projects-heading-fallback">
        <h2 id="featured-projects-heading-fallback" className="text-2xl font-semibold text-neutral-100 mb-4">
          Featured Projects
        </h2>
        <p className="text-neutral-400">No projects to display at the moment.</p>
      </section>
    )
  }
  return (
    <section id="projects" aria-labelledby="featured-projects-heading">
      <div className="flex justify-between items-center mb-8">
        <h2 id="featured-projects-heading" className="text-2xl font-semibold text-neutral-100">
          Featured Projects
        </h2>
        <Link href="/projects" className="text-sm text-green-400 hover:underline" aria-label="See all projects">
          See all projects
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <Link
            key={project.slug}
            href={`/projects/${project.slug}`}
            aria-label={`View project: ${project.title}`}
            className="block border border-neutral-700 rounded-lg hover:border-green-500 transition-colors group overflow-hidden bg-neutral-800/30 hover:bg-neutral-800/60"
          >
            <div className="aspect-video bg-neutral-800 overflow-hidden">
              <Image
                src={
                  project.heroImage ||
                  `/placeholder.svg?width=400&height=225&query=${encodeURIComponent(project.title) || "/placeholder.svg"}`
                }
                alt={`${project.title} thumbnail`}
                width={400}
                height={225}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                unoptimized // Add if using placeholder URLs that might not be in next.config.js images.remotePatterns
              />
            </div>
            <div className="p-4">
              <h3 className="font-medium text-neutral-100 group-hover:text-green-400 mb-1">{project.title}</h3>
              <p className="text-sm text-neutral-400 line-clamp-2 mb-2">{project.description}</p>
              {project.tags && project.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {project.tags.slice(0, 3).map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="text-xs px-1.5 py-0.5 border-neutral-600 text-neutral-400 bg-neutral-700/40 group-hover:border-green-600 group-hover:text-green-300"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}

export default FeaturedProjectsComponent // default export (unchanged)
