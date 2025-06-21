"use server"

import { getAllProjects } from "@/lib/projects"
import type { ProjectFrontmatter } from "@/lib/types"

export async function getProjectsByAuthorUsername(
  username: string,
  page = 1,
  limit = 6, // Default items per page
): Promise<{
  projects: ProjectFrontmatter[]
  totalPages: number
  currentPage: number
  totalItems: number
  error?: string
}> {
  if (!username) {
    return { projects: [], totalPages: 0, currentPage: 1, totalItems: 0, error: "Username is required." }
  }

  try {
    const allProjects = await getAllProjects()
    const authorProjectsAll = allProjects
      .filter((project) => project.isPublished !== false && project.authorUsername === username)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    const totalItems = authorProjectsAll.length
    const totalPages = Math.ceil(totalItems / limit)
    const offset = (page - 1) * limit
    const paginatedProjects = authorProjectsAll.slice(offset, offset + limit)

    return { projects: paginatedProjects, totalPages, currentPage: page, totalItems, error: undefined }
  } catch (error: any) {
    console.error(`Error fetching projects for username ${username}:`, error)
    return {
      projects: [],
      totalPages: 0,
      currentPage: 1,
      totalItems: 0,
      error: "Could not load projects. " + error.message,
    }
  }
}
