"use server"

import { getAllPosts } from "@/lib/posts"
import type { PostFrontmatter } from "@/lib/types"

export async function getPostsByAuthorUsername(
  username: string,
  page = 1,
  limit = 6, // Default items per page
): Promise<{
  posts: PostFrontmatter[]
  totalPages: number
  currentPage: number
  totalItems: number
  error?: string
}> {
  if (!username) {
    return { posts: [], totalPages: 0, currentPage: 1, totalItems: 0, error: "Username is required." }
  }

  try {
    const allPosts = await getAllPosts()
    const authorPostsAll = allPosts
      .filter((post) => post.isPublished && post.authorUsername === username)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    const totalItems = authorPostsAll.length
    const totalPages = Math.ceil(totalItems / limit)
    const offset = (page - 1) * limit
    const paginatedPosts = authorPostsAll.slice(offset, offset + limit)

    return { posts: paginatedPosts, totalPages, currentPage: page, totalItems, error: undefined }
  } catch (e: any) {
    console.error(`Error fetching posts for author ${username}:`, e.message)
    return { posts: [], totalPages: 0, currentPage: 1, totalItems: 0, error: "Failed to fetch author's posts." }
  }
}
