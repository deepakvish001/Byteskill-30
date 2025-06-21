import fs from "fs"
import path from "path"
import matter from "gray-matter"
import type { ProjectFrontmatter } from "./types"

const projectsDirectory = path.join(process.cwd(), "content/projects")

export function getProjectSlugs(): string[] {
  try {
    if (!fs.existsSync(projectsDirectory)) {
      console.warn(`[lib/projects] projectsDirectory does not exist: ${projectsDirectory}`)
      return []
    }
    const dirents = fs.readdirSync(projectsDirectory, { withFileTypes: true })
    return dirents
      .filter((dirent) => dirent.isFile() && (dirent.name.endsWith(".mdx") || dirent.name.endsWith(".md")))
      .map((dirent) => dirent.name.replace(/\.(mdx|md)$/, ""))
  } catch (error) {
    console.error("[lib/projects] Error reading project slugs:", error)
    return []
  }
}

export function getProjectBySlug(slug: string, includeContent = false): ProjectFrontmatter | null {
  const fullPath = path.join(projectsDirectory, `${slug}.mdx`)
  if (!fs.existsSync(fullPath)) {
    return null
  }

  try {
    const fileContents = fs.readFileSync(fullPath, "utf8")
    const { data, content } = matter(fileContents)

    if (!data.title || !data.date) {
      console.warn(`[lib/projects] Project "${slug}" is missing required frontmatter (title or date). Skipping.`)
      return null
    }

    const wordCount = content.split(/\s+/).length
    const readTime = Math.ceil(wordCount / 200) + " min read"

    const projectData: ProjectFrontmatter = {
      slug,
      title: data.title,
      date: data.date,
      tags: data.tags ? (Array.isArray(data.tags) ? data.tags.map(String) : [String(data.tags)]) : [],
      description: data.description || "",
      longDescription: data.longDescription || data.description || "",
      heroImage: data.heroImage && data.heroImage.trim() !== "" ? data.heroImage.trim() : null,
      heroBlurDataURL: data.heroBlurDataURL && data.heroBlurDataURL.trim() !== "" ? data.heroBlurDataURL.trim() : null,
      thumbnailImage:
        data.thumbnailImage && data.thumbnailImage.trim() !== ""
          ? data.thumbnailImage.trim()
          : data.heroImage && data.heroImage.trim() !== ""
            ? data.heroImage.trim()
            : null,
      thumbnailBlurDataURL:
        data.thumbnailBlurDataURL && data.thumbnailBlurDataURL.trim() !== ""
          ? data.thumbnailBlurDataURL.trim()
          : data.heroBlurDataURL && data.heroBlurDataURL.trim() !== ""
            ? data.heroBlurDataURL.trim()
            : null,
      liveUrl: data.liveUrl || null,
      repoUrl: data.repoUrl || null,
      lighthouseScoreImage:
        data.lighthouseScoreImage && data.lighthouseScoreImage.trim() !== "" ? data.lighthouseScoreImage.trim() : null,
      readTime,
      toc: data.toc || null,
      isPublished: data.isPublished === undefined ? true : data.isPublished,
      category: data.category || null,
      demoUrl: data.demoUrl || null,
      technologies: data.technologies
        ? Array.isArray(data.technologies)
          ? data.technologies.map(String)
          : [String(data.technologies)]
        : [],
      featured: data.featured || false, // Default to false if not specified
      isBookmarked: data.isBookmarked || false,
      ...(includeContent && { content }),
    }
    return projectData
  } catch (error) {
    console.error(`[lib/projects] Error processing project "${slug}":`, error)
    return null
  }
}

export function getAllProjects(): ProjectFrontmatter[] {
  const slugs = getProjectSlugs()
  if (!slugs || slugs.length === 0) {
    return []
  }
  return slugs
    .map((slug) => getProjectBySlug(slug))
    .filter((project): project is ProjectFrontmatter => project !== null && project.isPublished)
    .sort((project1, project2) => new Date(project2.date).getTime() - new Date(project1.date).getTime())
}

// Option 1: Keep filtering by `featured: true` (default)
export function getFeaturedProjects(projects: ProjectFrontmatter[], count: number): ProjectFrontmatter[] {
  // return projects.filter((p) => p.featured && p.isPublished).slice(0, count)
  return projects.filter((p) => p.isPublished).slice(0, count)
}

// Option 2: Show latest projects regardless of 'featured' flag (but ensure they are published)
// export function getFeaturedProjects(projects: ProjectFrontmatter[], count: number): ProjectFrontmatter[] {
//   return projects.filter(p => p.isPublished).slice(0, count);
// }

export function getRelatedProjects(
  currentProjectSlug: string,
  allProjects: ProjectFrontmatter[],
  count = 2,
): ProjectFrontmatter[] {
  const currentProject = allProjects.find((project) => project.slug === currentProjectSlug)
  if (!currentProject || !currentProject.tags || currentProject.tags.length === 0) {
    return []
  }
  const related = allProjects
    .filter((project) => project.slug !== currentProjectSlug && project.isPublished)
    .map((project) => {
      const commonTags = project.tags.filter((tag) => currentProject.tags.includes(tag))
      return { ...project, commonTagsCount: commonTags.length }
    })
    .filter((project) => project.commonTagsCount > 0)
    .sort((a, b) => {
      if (b.commonTagsCount !== a.commonTagsCount) {
        return b.commonTagsCount - a.commonTagsCount
      }
      return new Date(b.date).getTime() - new Date(a.date).getTime()
    })
  return related.slice(0, count)
}
