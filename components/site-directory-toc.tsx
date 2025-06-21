"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronDown, ChevronRight, FileText, FolderKanban } from "lucide-react"
import type { PostFrontmatter } from "@/lib/posts"
import type { ProjectFrontmatter } from "@/lib/projects"
import { DirectoryLinkItem } from "./directory-link-item" // Import the new component

interface SiteDirectoryTocProps {
  posts: PostFrontmatter[]
  projects: ProjectFrontmatter[]
  initiallyOpen?: boolean
  maxItemsPerSection?: number
}

export function SiteDirectoryToc({
  posts,
  projects,
  initiallyOpen = true,
  maxItemsPerSection = 10,
}: SiteDirectoryTocProps) {
  const [isPostsOpen, setIsPostsOpen] = useState(initiallyOpen)
  const [isProjectsOpen, setIsProjectsOpen] = useState(initiallyOpen)
  const pathname = usePathname()

  const displayedPosts = posts.slice(0, maxItemsPerSection)
  const displayedProjects = projects.slice(0, maxItemsPerSection)

  const checkIsActive = (href: string) => pathname === href

  return (
    <div className="w-full max-w-md bg-neutral-800 border border-neutral-700 rounded-lg shadow-md text-neutral-300">
      <div className="p-4 border-b border-neutral-700">
        <h2 className="text-lg font-semibold text-neutral-100">Site Directory</h2>
      </div>

      {/* Blog Posts Section */}
      <div className="border-b border-neutral-700">
        <button
          onClick={() => setIsPostsOpen(!isPostsOpen)}
          className="flex items-center justify-between w-full text-left py-3 px-4 group"
          aria-expanded={isPostsOpen}
          aria-controls="toc-posts-content"
        >
          <div className="flex items-center">
            {isPostsOpen ? (
              <ChevronDown className="w-5 h-5 mr-2 text-neutral-400 group-hover:text-neutral-200 transition-colors" />
            ) : (
              <ChevronRight className="w-5 h-5 mr-2 text-neutral-400 group-hover:text-neutral-200 transition-colors" />
            )}
            <FileText className="w-4 h-4 mr-2 text-green-400" />
            <span className="font-medium text-neutral-200 group-hover:text-neutral-100 transition-colors">
              Recent Articles
            </span>
          </div>
          <span className="text-xs text-neutral-500 group-hover:text-neutral-400 transition-colors">
            {posts.length} total
          </span>
        </button>
        {isPostsOpen && (
          <div id="toc-posts-content" className="pb-3 px-4">
            {displayedPosts.length > 0 ? (
              <ul className="space-y-1.5 list-none p-0 pl-5">
                {displayedPosts.map((post) => {
                  const postHref = `/blog/${post.slug}`
                  return (
                    <DirectoryLinkItem
                      key={post.slug}
                      href={postHref}
                      title={post.title}
                      isActive={checkIsActive(postHref)}
                    />
                  )
                })}
                {posts.length > maxItemsPerSection && (
                  <li className="relative mt-2">
                    <span
                      className="absolute left-[-12px] top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-neutral-500"
                      aria-hidden="true"
                    />
                    <Link
                      href="/blog"
                      className={`block py-0.5 text-sm font-medium hover:underline transition-colors ${
                        checkIsActive("/blog") ? "text-green-300 font-semibold" : "text-green-400 hover:text-green-300"
                      }`}
                    >
                      View all articles...
                    </Link>
                  </li>
                )}
              </ul>
            ) : (
              <p className="text-neutral-500 text-sm pl-5 py-2">No articles found.</p>
            )}
          </div>
        )}
      </div>

      {/* Projects Section */}
      <div>
        <button
          onClick={() => setIsProjectsOpen(!isProjectsOpen)}
          className="flex items-center justify-between w-full text-left py-3 px-4 group"
          aria-expanded={isProjectsOpen}
          aria-controls="toc-projects-content"
        >
          <div className="flex items-center">
            {isProjectsOpen ? (
              <ChevronDown className="w-5 h-5 mr-2 text-neutral-400 group-hover:text-neutral-200 transition-colors" />
            ) : (
              <ChevronRight className="w-5 h-5 mr-2 text-neutral-400 group-hover:text-neutral-200 transition-colors" />
            )}
            <FolderKanban className="w-4 h-4 mr-2 text-green-400" />
            <span className="font-medium text-neutral-200 group-hover:text-neutral-100 transition-colors">
              Featured Projects
            </span>
          </div>
          <span className="text-xs text-neutral-500 group-hover:text-neutral-400 transition-colors">
            {projects.length} total
          </span>
        </button>
        {isProjectsOpen && (
          <div id="toc-projects-content" className="pb-3 px-4">
            {displayedProjects.length > 0 ? (
              <ul className="space-y-1.5 list-none p-0 pl-5">
                {displayedProjects.map((project) => {
                  const projectHref = `/projects/${project.slug}`
                  return (
                    <DirectoryLinkItem
                      key={project.slug}
                      href={projectHref}
                      title={project.title}
                      isActive={checkIsActive(projectHref)}
                    />
                  )
                })}
                {projects.length > maxItemsPerSection && (
                  <li className="relative mt-2">
                    <span
                      className="absolute left-[-12px] top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-neutral-500"
                      aria-hidden="true"
                    />
                    <Link
                      href="/projects"
                      className={`block py-0.5 text-sm font-medium hover:underline transition-colors ${
                        checkIsActive("/projects")
                          ? "text-green-300 font-semibold"
                          : "text-green-400 hover:text-green-300"
                      }`}
                    >
                      View all projects...
                    </Link>
                  </li>
                )}
              </ul>
            ) : (
              <p className="text-neutral-500 text-sm pl-5 py-2">No projects found.</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
