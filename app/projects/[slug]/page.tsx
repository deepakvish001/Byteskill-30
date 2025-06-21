// Import the server-side Supabase client and User type
import { createClient } from "@/lib/supabase/server" // Assuming this is your server client

import ProjectPageClient from "./ProjectPageClient"
import { getAllProjects, getProjectBySlug, getRelatedProjects, getProjectSlugs } from "@/lib/projects"
import { siteConfig } from "@/lib/site-config"
import type { Metadata, ResolvingMetadata } from "next"
import { notFound } from "next/navigation"
import { Suspense } from "react"
import type { ProjectFrontmatter } from "@/lib/types"

export async function generateStaticParams() {
  const projects = getProjectSlugs()
  return projects.map((slug) => ({
    slug: slug,
  }))
}

export async function generateMetadata(
  { params }: { params: { slug: string } },
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const project = getProjectBySlug(params.slug)

  if (!project) {
    return {
      title: "Project Not Found",
    }
  }

  const previousImages = (await parent).openGraph?.images || []
  const ogImage = project.heroImage
    ? {
        url: project.heroImage.startsWith("http") ? project.heroImage : `${siteConfig.url}${project.heroImage}`,
        width: 1200,
        height: 630,
        alt: project.title,
      }
    : previousImages[0] || {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: `${siteConfig.name} Logo`,
      }

  return {
    title: project.title,
    description: project.description,
    openGraph: {
      title: `${project.title} | ${siteConfig.name}`,
      description: project.description,
      url: `${siteConfig.url}/projects/${project.slug}`,
      images: [ogImage, ...previousImages.filter((img) => img.url !== ogImage.url)],
    },
    twitter: {
      card: "summary_large_image",
      title: `${project.title} | ${siteConfig.name}`,
      description: project.description,
      images: [ogImage.url],
    },
  }
}

export default async function SingleProjectPage({ params }: { params: { slug: string } }) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const projectData = getProjectBySlug(params.slug, true /* includeContent */)

  if (!projectData || !projectData.content) {
    notFound()
  }

  let isBookmarked = false
  if (user && projectData) {
    const { data: bookmark, error: bookmarkError } = await supabase
      .from("bookmarks")
      .select("id")
      .eq("user_id", user.id)
      .eq("item_id", projectData.slug)
      .eq("item_type", "project")
      .maybeSingle()

    if (bookmarkError) {
      console.error("Error fetching project bookmark status:", bookmarkError.message)
      // Optionally handle error, for now, defaults to false
    }
    if (bookmark) {
      isBookmarked = true
    }
  }

  // Augment projectData with isBookmarked status
  const project: ProjectFrontmatter & { content: string; isBookmarked?: boolean } = {
    ...projectData,
    content: projectData.content, // Ensure content is explicitly passed
    isBookmarked: isBookmarked,
  }

  const allProjectsData = getAllProjects()
  const relatedProjectsData = getRelatedProjects(project.slug, allProjectsData, 2)

  return (
    <Suspense fallback={<div className="container mx-auto py-10 text-center">Loading project details...</div>}>
      <ProjectPageClient
        project={project}
        mdxContent={project.content}
        relatedProjects={relatedProjectsData}
        currentUser={user} // Pass the fetched user object
      />
    </Suspense>
  )
}
