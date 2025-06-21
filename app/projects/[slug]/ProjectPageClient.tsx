"use client"

import { useState, useEffect, useRef } from "react"
import type { ProjectFrontmatter } from "@/lib/types"
import type { User } from "@supabase/supabase-js"
import { ProjectDetails } from "@/components/project-details"
import { notFound } from "next/navigation"
import { incrementViewCount } from "@/app/content/actions" // New action
import { useToast } from "@/hooks/use-toast"

interface ProjectPageClientProps {
  project: ProjectFrontmatter & { content?: string; isBookmarked?: boolean }
  mdxContent: string
  relatedProjects: ProjectFrontmatter[]
  currentUser: User | null
}

export default function ProjectPageClient({
  project: initialProject,
  mdxContent,
  relatedProjects,
  currentUser,
}: ProjectPageClientProps) {
  const [project, setProject] = useState(initialProject)
  const viewIncrementedRef = useRef(false)
  const { toast } = useToast()

  useEffect(() => {
    setProject(initialProject) // Update project state if initialProject changes
  }, [initialProject])

  useEffect(() => {
    if (project.id && !viewIncrementedRef.current) {
      const doIncrement = async () => {
        try {
          // console.log(`Attempting to increment view count for project ID: ${project.id}`);
          const result = await incrementViewCount(project.id, "project")
          if (result.success && result.newViewCount !== undefined) {
            // console.log(`View count incremented successfully. New count: ${result.newViewCount}`);
            setProject((prevProject) => ({
              ...prevProject,
              view_count: result.newViewCount,
            }))
          } else if (!result.success && result.error) {
            // console.warn(`Failed to increment view count: ${result.error}`);
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
  }, [project.id, toast])

  if (!project) {
    notFound()
  }

  return (
    <main id="main-content" tabIndex={-1} className="outline-none focus:ring-2 focus:ring-sky-500">
      <ProjectDetails
        project={project} // Pass the stateful project object
        mdxContent={mdxContent}
        relatedProjects={relatedProjects}
        currentUser={currentUser}
      />
    </main>
  )
}
