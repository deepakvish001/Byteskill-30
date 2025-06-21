import { Suspense } from "react"
import { notFound } from "next/navigation"
import { getAllProjects, getProjectBySlug, getProjectContentHtml } from "@/lib/projects"
import { createClient } from "@/lib/supabase/server"
import type { Metadata, ResolvingMetadata } from "next"
import { siteConfig } from "@/lib/site-config"
import ProjectPageClient from "./ProjectPageClient"
import type { ProjectFrontmatter } from "@/lib/types"

export async function generateStaticParams() {
  const projects = await getAllProjects() // getAllProjects is now async
  return projects.map((project) => ({
    slug: project.slug,
  }))
}

export async function generateMetadata(
  { params }: { params: { slug: string } },
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const project = await getProjectBySlug(params.slug) // getProjectBySlug is now async

  if (!project) {
    return {
      title: "Project Not Found",
    }
  }

  const previousImages = (await parent).openGraph?.images || []
  const ogImageSrc = project.heroImage || project.thumbnailImage || siteConfig.ogImage

  const absoluteOgImage = ogImageSrc.startsWith("http")
    ? ogImageSrc
    : `${siteConfig.url}${ogImageSrc.startsWith("/") ? "" : "/"}${ogImageSrc}`

  const ogImage = {
    url: absoluteOgImage,
    width: 1200,
    height: 630,
    alt: project.title,
  }

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication", // Or Product, CreativeWork
    name: project.title,
    description: project.description,
    applicationCategory: project.category || "Utility",
    operatingSystem: "Web", // Or specify if it's for a particular OS
    image: {
      "@type": "ImageObject",
      url: absoluteOgImage,
      width: 1200,
      height: 630,
    },
    url: `${siteConfig.url}/projects/${project.slug}`,
    author: {
      "@type": "Person", // Or Organization
      name: project.author?.name || siteConfig.author.name,
      url: project.author?.url || siteConfig.author.url,
    },
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
      logo: {
        "@type": "ImageObject",
        url: `${siteConfig.url}${siteConfig.logo.startsWith("/") ? "" : "/"}${siteConfig.logo}`,
      },
    },
    datePublished: new Date(project.date).toISOString(),
    dateModified: new Date(project.updated_at || project.date).toISOString(),
    keywords: project.originalTags?.join(", ") || project.technologies?.join(", "),
    ...(project.liveUrl && { downloadUrl: project.liveUrl }), // Or "installUrl"
    ...(project.repoUrl && { codeRepository: project.repoUrl }),
  }

  return {
    title: project.title,
    description: project.description,
    alternates: {
      canonical: `${siteConfig.url}/projects/${project.slug}`,
    },
    openGraph: {
      title: `${project.title} | ${siteConfig.name}`,
      description: project.description,
      url: `${siteConfig.url}/projects/${project.slug}`,
      type: "object", // Or "profile" if it's more of a portfolio piece
      images: [ogImage, ...previousImages.filter((img) => img.url !== ogImage.url)],
      tags: project.originalTags,
    },
    twitter: {
      card: "summary_large_image",
      title: `${project.title} | ${siteConfig.name}`,
      description: project.description,
      images: [ogImage.url],
      creator: siteConfig.author.twitterHandle ? `@${siteConfig.author.twitterHandle}` : undefined,
    },
    other: {
      "application/ld+json": JSON.stringify(structuredData),
    },
  }
}

export default async function ProjectPage({ params }: { params: { slug: string } }) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const project = await getProjectBySlug(params.slug) // getProjectBySlug is now async

  if (!project) {
    notFound()
  }

  const contentHtml = await getProjectContentHtml(params.slug)

  if (user) {
    const { data: bookmark, error } = await supabase
      .from("bookmarks")
      .select("item_id")
      .eq("user_id", user.id)
      .eq("item_id", project.slug)
      .eq("item_type", "project")
      .maybeSingle()

    if (error) {
      console.error("Error fetching bookmark status:", error)
    }
    project.isBookmarked = !!bookmark
  } else {
    project.isBookmarked = false
  }

  const projectWithHtmlContent: ProjectFrontmatter & { contentHtml: string } = {
    ...project,
    contentHtml,
  }

  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-8">Loading project...</div>}>
      <ProjectPageClient project={projectWithHtmlContent} />
    </Suspense>
  )
}
