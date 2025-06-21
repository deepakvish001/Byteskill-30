import Link from "next/link"
import { Github, Mail, Twitter } from "lucide-react"
import { getFeaturedPosts } from "@/lib/posts"
import { getFeaturedProjects } from "@/lib/projects"
import { getFeaturedSeriesFromDb } from "@/lib/series"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { HeroSection } from "@/components/hero-section"
import { FeaturedPosts } from "@/components/featured-posts"
import { FeaturedProjects } from "@/components/featured-projects"
import { FeaturedSeries } from "@/components/featured-series"
import { MostViewedPosts } from "@/components/most-viewed-posts" // New import
import { MostViewedProjects } from "@/components/most-viewed-projects" // New import
import { CTASection } from "@/components/cta-section"
import type { Metadata } from "next"
import { siteConfig } from "@/lib/site-config"

export const metadata: Metadata = {
  title: siteConfig.defaultTitle,
  description: `Welcome to ${siteConfig.name}. ${siteConfig.description}`,
  openGraph: {
    title: siteConfig.defaultTitle,
    description: `Welcome to ${siteConfig.name}. ${siteConfig.description}`,
    url: siteConfig.url,
  },
  twitter: {
    title: siteConfig.defaultTitle,
    description: `Welcome to ${siteConfig.name}. ${siteConfig.description}`,
  },
}

export default async function HomePage() {
  const featuredPosts = await getFeaturedPosts(3)
  const featuredProjects = await getFeaturedProjects(3)
  const featuredSeries = await getFeaturedSeriesFromDb(3)

  return (
    <TooltipProvider delayDuration={100}>
      <div className="bg-neutral-900 text-neutral-300 min-h-screen flex flex-col">
        <HeroSection />

        <main id="main-content" tabIndex={-1} className="flex-grow outline-none">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 space-y-16 md:space-y-20 py-12 md:py-16">
            <FeaturedPosts posts={featuredPosts} />
            <MostViewedPosts count={3} className="mt-12 md:mt-16" /> {/* Added */}
            <FeaturedProjects projects={featuredProjects} />
            <MostViewedProjects count={3} className="mt-12 md:mt-16" /> {/* Added */}
            <FeaturedSeries series={featuredSeries} />
            <section className="bg-neutral-800/30 p-6 sm:p-8 rounded-lg border border-neutral-700/50">
              <h2 className="text-xl font-semibold text-neutral-100 mb-4">Connect with Byteskill</h2>
              <p className="mb-6 text-neutral-400">
                Follow us on social media or reach out via email for collaborations and inquiries.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link
                      href={siteConfig.links.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center space-x-3 rounded-md px-3 py-2.5 hover:bg-neutral-700/50 transition-all duration-200"
                    >
                      <Twitter className="h-5 w-5 flex-shrink-0 text-neutral-400 group-hover:text-green-400 transition-colors" />
                      <span className="text-neutral-300 group-hover:text-green-400 transition-colors">Follow on X</span>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent className="bg-neutral-700 text-neutral-200 border-neutral-600">
                    <p>Stay updated on X</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link
                      href={siteConfig.links.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center space-x-3 rounded-md px-3 py-2.5 hover:bg-neutral-700/50 transition-all duration-200"
                    >
                      <Github className="h-5 w-5 flex-shrink-0 text-neutral-400 group-hover:text-green-400 transition-colors" />
                      <span className="text-neutral-300 group-hover:text-green-400 transition-colors">
                        View on GitHub
                      </span>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent className="bg-neutral-700 text-neutral-200 border-neutral-600">
                    <p>Explore our code repositories</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link
                      href={`mailto:${siteConfig.email}`}
                      className="group flex items-center space-x-3 rounded-md px-3 py-2.5 hover:bg-neutral-700/50 transition-all duration-200"
                    >
                      <Mail className="h-5 w-5 flex-shrink-0 text-neutral-400 group-hover:text-green-400 transition-colors" />
                      <span className="text-neutral-300 group-hover:text-green-400 transition-colors">
                        {siteConfig.email}
                      </span>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent className="bg-neutral-700 text-neutral-200 border-neutral-600">
                    <p>Send us an email</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </section>
            <CTASection />
          </div>
        </main>
      </div>
    </TooltipProvider>
  )
}
