import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { getAllPosts } from "@/lib/posts"
import { getAllProjects } from "@/lib/projects"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "404: Page Not Found",
  description: "The page you were looking for could not be found.",
}

export default function NotFound() {
  // We need to fetch posts and projects because the SiteHeader requires them
  // for its search functionality.
  const allPosts = getAllPosts()
  const allProjects = getAllProjects()

  return (
    <div className="flex min-h-dvh flex-col bg-neutral-900 text-neutral-100">
      <SiteHeader allPosts={allPosts} allProjects={allProjects} />
      <main id="main-content" tabIndex={-1} className="flex flex-grow items-center justify-center px-4 text-center">
        <div className="space-y-8">
          <div>
            <p className="text-2xl font-bold text-green-400 sm:text-4xl">404</p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight text-neutral-50 sm:text-6xl">Page Not Found</h1>
            <p className="mt-4 text-lg text-neutral-400">Sorry, we couldn’t find the page you’re looking for.</p>
          </div>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-md bg-green-500 px-4 py-2 text-sm font-medium text-neutral-900 shadow-sm transition-colors hover:bg-green-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-neutral-900"
            >
              <ArrowLeft className="-ml-1 mr-2 h-5 w-5" />
              Go back home
            </Link>
            <Link
              href="/blog"
              className="inline-flex items-center justify-center rounded-md border border-neutral-700 bg-transparent px-4 py-2 text-sm font-medium text-neutral-300 shadow-sm transition-colors hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-neutral-900"
            >
              Read the blog
            </Link>
          </div>
          <div className="text-sm text-neutral-500">
            <p>You can also try searching for what you need using the search icon in the header.</p>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
