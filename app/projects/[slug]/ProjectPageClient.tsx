"use client"

import type { ProjectFrontmatter } from "@/lib/types" // Ensure this path is correct
import type { User } from "@supabase/supabase-js"
import { ProjectDetails } from "@/components/project-details"
import { notFound } from "next/navigation"

interface ProjectPageClientProps {
  project: ProjectFrontmatter & { content?: string; isBookmarked?: boolean } // content is mdxContent
  mdxContent: string
  relatedProjects: ProjectFrontmatter[]
  currentUser: User | null
}

export default function ProjectPageClient({
  project,
  mdxContent,
  relatedProjects,
  currentUser,
}: ProjectPageClientProps) {
  if (!project) {
    notFound() // Should be caught by server component, but good practice
  }

  return (
    <main id="main-content" tabIndex={-1} className="outline-none focus:ring-2 focus:ring-sky-500">
      <ProjectDetails
        project={project}
        mdxContent={mdxContent}
        relatedProjects={relatedProjects}
        currentUser={currentUser}
      />
    </main>
  )
}
