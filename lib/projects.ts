import { createClient } from "@/lib/supabase/server"
import type { ProjectFrontmatter, DbProject as DbProjectType } from "./types"
import { cache } from "react"
import { siteConfig } from "./site-config"

function dbProjectToProjectFrontmatter(project: DbProjectType): ProjectFrontmatter {
  const authorName = project.author?.full_name || project.author?.username || siteConfig.author.name
  const authorUrl = project.author?.username ? `${siteConfig.url}/u/${project.author.username}` : siteConfig.author.url

  return {
    id: project.id, // Ensure ID is included
    slug: project.slug,
    title: project.title,
    date: project.published_at || project.created_at,
    updated_at: project.updated_at || project.published_at || project.created_at,
    tags: project.tags?.map((t: any) => t.slug) || [],
    originalTags: project.tags?.map((t: any) => t.name) || [],
    description: project.description || "",
    longDescription: project.long_description || project.description || "",
    heroImage: project.hero_image_url
      ? project.hero_image_url.startsWith("http")
        ? project.hero_image_url
        : `${siteConfig.url}${project.hero_image_url}`
      : undefined,
    thumbnailImage: project.thumbnail_image_url || project.hero_image_url,
    heroBlurDataURL: null,
    thumbnailBlurDataURL: null,
    liveUrl: project.live_url,
    repoUrl: project.repo_url,
    demoUrl: project.demo_url,
    technologies: project.technologies || [],
    isPublished: project.status === "published",
    category: project.category,
    featured: project.featured || false,
    content: project.content || "",
    readTime: project.content ? Math.ceil(project.content.split(/\s+/).length / 200) + " min read" : "N/A",
    isBookmarked: false,
    author: { name: authorName, url: authorUrl },
    view_count: project.view_count || 0, // Added view_count
  }
}

const PROJECT_SELECT_QUERY = `
  id, slug, title, description, long_description, content, hero_image_url, thumbnail_image_url,
  live_url, repo_url, demo_url, technologies, status, published_at, created_at, updated_at,
  featured, category, view_count,
  author:profiles (id, username, full_name, avatar_url),
  tags (id, name, slug)
`

export const getAllProjectSlugs = cache(async (): Promise<string[]> => {
  const supabase = createClient()
  const { data, error } = await supabase.from("projects").select("slug").eq("status", "published")

  if (error) {
    console.error("Error fetching project slugs:", error)
    return []
  }
  return data.map((p) => p.slug)
})

export const getAllProjects = cache(async (includeUnpublished = false): Promise<ProjectFrontmatter[]> => {
  const supabase = createClient()
  let query = supabase
    .from("projects")
    .select(PROJECT_SELECT_QUERY)
    .order("published_at", { ascending: false, nullsFirst: false })

  if (!includeUnpublished) {
    query = query.eq("status", "published")
  }

  const { data: projects, error } = await query

  if (error) {
    console.error("Error fetching all projects:", error)
    return []
  }
  return projects.map(dbProjectToProjectFrontmatter)
})

export const getProjectBySlug = cache(async (slug: string): Promise<ProjectFrontmatter | null> => {
  const supabase = createClient()
  const { data: project, error } = await supabase
    .from("projects")
    .select(PROJECT_SELECT_QUERY)
    .eq("slug", slug)
    .single()

  if (error || !project) {
    return null
  }
  return dbProjectToProjectFrontmatter(project)
})

export const getFeaturedProjects = cache(async (limit = 3): Promise<ProjectFrontmatter[]> => {
  const supabase = createClient()
  const { data: projects, error } = await supabase
    .from("projects")
    .select(PROJECT_SELECT_QUERY)
    .eq("status", "published")
    .eq("featured", true)
    .order("published_at", { ascending: false })
    .limit(limit)

  if (error) {
    console.error("Error fetching featured projects:", error)
    return []
  }
  return projects.map(dbProjectToProjectFrontmatter)
})

export const getRelatedProjects = cache(
  async (currentProjectSlug: string, limit = 2): Promise<ProjectFrontmatter[]> => {
    const supabase = createClient()
    const currentProject = await getProjectBySlug(currentProjectSlug)
    if (!currentProject || !currentProject.tags || currentProject.tags.length === 0) {
      return []
    }

    const { data: projects, error } = await supabase
      .from("projects")
      .select(PROJECT_SELECT_QUERY.replace("tags (id, name, slug)", "tags (name, slug)"))
      .eq("status", "published")
      .neq("slug", currentProjectSlug)
      .or(`category.eq.${currentProject.category},tags.slug.in.(${currentProject.tags.map((t) => `"${t}"`).join(",")})`)
      .order("published_at", { ascending: false })
      .limit(limit + 5)

    if (error) {
      console.error("Error fetching related projects:", error)
      return []
    }

    const related = projects
      .map(dbProjectToProjectFrontmatter)
      .map((project) => {
        const commonTags = project.tags.filter((tag) => currentProject.tags.includes(tag))
        return { ...project, commonTagsCount: commonTags.length }
      })
      .filter((project) => project.commonTagsCount > 0 || project.category === currentProject.category)
      .sort((a, b) => {
        if (b.commonTagsCount !== a.commonTagsCount) {
          return b.commonTagsCount - a.commonTagsCount
        }
        return new Date(b.date).getTime() - new Date(a.date).getTime()
      })

    return related.slice(0, limit)
  },
)

export const getMostViewedProjects = cache(async (limit = 5): Promise<ProjectFrontmatter[]> => {
  const supabase = createClient()
  const { data: projects, error } = await supabase
    .from("projects")
    .select(PROJECT_SELECT_QUERY)
    .eq("status", "published")
    .order("view_count", { ascending: false, nullsLast: true })
    .limit(limit)

  if (error) {
    console.error("Error fetching most viewed projects:", error.message)
    return []
  }
  return projects.map(dbProjectToProjectFrontmatter)
})
