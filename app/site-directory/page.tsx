import { getAllPosts } from "@/lib/posts"
import { getAllProjects } from "@/lib/projects"
import { SiteHeader } from "@/components/site-header"
import { ThemeToggle } from "@/components/theme-toggle"
import { BackToTopButton } from "@/components/back-to-top-button"
import { SiteDirectoryToc } from "@/components/site-directory-toc"
import type { Metadata } from "next"
import { siteConfig } from "@/lib/site-config"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export const metadata: Metadata = {
  title: "Site Directory",
  description: `Browse all content on ${siteConfig.name}. Find articles and projects easily.`,
  openGraph: {
    title: `Site Directory | ${siteConfig.name}`,
    description: `Browse all content on ${siteConfig.name}.`,
    url: `${siteConfig.url}/site-directory`,
  },
  twitter: {
    title: `Site Directory | ${siteConfig.name}`,
    description: `Browse all content on ${siteConfig.name}.`,
  },
}

export default function SiteDirectoryPage() {
  const allPosts = getAllPosts()
  const allProjects = getAllProjects()

  return (
    <div className="bg-neutral-900 text-neutral-300 min-h-screen flex flex-col">
      <SiteHeader allPosts={allPosts} allProjects={allProjects} />

      <main
        id="main-content"
        tabIndex={-1}
        className="container mx-auto px-4 sm:px-6 lg:px-8 flex-grow py-12 outline-none flex flex-col items-center"
      >
        <div className="w-full max-w-md mb-8">
          <Link href="/" className="inline-flex items-center text-sm text-green-400 hover:underline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to home
          </Link>
        </div>

        <SiteDirectoryToc posts={allPosts} projects={allProjects} />
      </main>

      <footer className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-12 border-t border-neutral-800">
        <div className="flex flex-col sm:flex-row justify-between items-center text-sm">
          <p className="mb-4 sm:mb-0">
            © {new Date().getFullYear()} - {siteConfig.name}
          </p>
          <div className="flex items-center space-x-4">
            <BackToTopButton />
            <ThemeToggle />
          </div>
        </div>
      </footer>
    </div>
  )
}
