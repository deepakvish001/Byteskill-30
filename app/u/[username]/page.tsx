import Link from "next/link"
import { getPublicProfileByUsername } from "@/app/me/profile/actions"
import { getProjectsByAuthorUsername } from "@/app/projects/actions"
import {
  Globe,
  CalendarDays,
  Briefcase,
  Newspaper,
  MapPin,
  Github,
  Twitter,
  Linkedin,
  Sparkles,
  Brain,
  Building,
  Medal,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { getPostsByAuthorUsername } from "@/app/blog/actions"
import { ArticleCard } from "@/components/article-card"
import { ProjectCard } from "@/components/project-card"
import { PaginationControls } from "@/components/pagination-controls"
import type { PostFrontmatter, ProjectFrontmatter, UserProfile } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { siteConfig } from "@/lib/site-config"
import { JsonLd } from "@/components/json-ld"

interface PublicProfilePageProps {
  params: {
    username: string
  }
  searchParams: {
    postsPage?: string
    projectsPage?: string
  }
}

export async function generateMetadata({ params }: PublicProfilePageProps) {
  const { profile } = (await getPublicProfileByUsername(params.username)) as {
    profile: Partial<UserProfile> | null
    error?: string
  }

  if (!profile) {
    return {
      title: "User Not Found",
    }
  }

  const name = profile.full_name || profile.username || "User"
  const title = `${name}'s Profile${profile.job_title ? ` | ${profile.job_title}` : ""} | ${siteConfig.name}`
  const description = profile.bio || `View the public profile, projects, and posts by ${name} on ${siteConfig.name}.`
  const imageUrl = profile.avatar_url || siteConfig.logo

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "profile",
      username: profile.username,
      firstName: profile.full_name?.split(" ")[0],
      lastName: profile.full_name?.split(" ").slice(1).join(" "),
      url: `${siteConfig.url}/u/${profile.username}`,
      images: imageUrl ? [{ url: imageUrl, alt: `${name}'s avatar` }] : [],
      siteName: siteConfig.name,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      creator: profile.twitter_username ? `@${profile.twitter_username}` : siteConfig.links.twitter.split("/").pop(),
      images: imageUrl ? [imageUrl] : [],
    },
  }
}

const ITEMS_PER_PAGE = 6

export default async function PublicProfilePage({ params: routeParams, searchParams }: PublicProfilePageProps) {
  const { username } = routeParams
  const { profile, error: profileError } = (await getPublicProfileByUsername(username)) as {
    profile: UserProfile | null
    error?: string
  }

  if (profileError === "User not found." || !profile) {
    return (
      <div className="container mx-auto min-h-[calc(100vh-200px)] flex flex-col items-center justify-center px-4 py-12 text-center">
        <h1 className="text-4xl font-bold mb-4">User Not Found</h1>
        <p className="text-lg text-neutral-400 mb-8">Sorry, we couldn't find a user with the username "{username}".</p>
        <Button asChild variant="outline" className="bg-transparent hover:bg-neutral-800 text-neutral-100">
          <Link href="/">Go to Homepage</Link>
        </Button>
      </div>
    )
  }

  if (profileError) {
    return (
      <div className="container mx-auto min-h-[calc(100vh-200px)] flex flex-col items-center justify-center px-4 py-12 text-center">
        <h1 className="text-4xl font-bold mb-4">Error</h1>
        <p className="text-lg text-neutral-400 mb-8">Could not load profile: {profileError}</p>
        <Button asChild variant="outline" className="bg-transparent hover:bg-neutral-800 text-neutral-100">
          <Link href="/">Go to Homepage</Link>
        </Button>
      </div>
    )
  }

  const postsCurrentPage = Number(searchParams?.postsPage) || 1
  const projectsCurrentPage = Number(searchParams?.projectsPage) || 1

  let postsData: Awaited<ReturnType<typeof getPostsByAuthorUsername>> = {
    posts: [],
    totalPages: 0,
    currentPage: 1,
    totalItems: 0,
    error: undefined,
  }
  let projectsData: Awaited<ReturnType<typeof getProjectsByAuthorUsername>> = {
    projects: [],
    totalPages: 0,
    currentPage: 1,
    totalItems: 0,
    error: undefined,
  }

  if (profile?.username) {
    postsData = await getPostsByAuthorUsername(profile.username, postsCurrentPage, ITEMS_PER_PAGE)
    projectsData = await getProjectsByAuthorUsername(profile.username, projectsCurrentPage, ITEMS_PER_PAGE)
  }

  const getInitials = (name: string | undefined | null): string => {
    if (!name) return "??"
    const names = name.split(" ")
    if (names.length > 1 && names[0] && names[names.length - 1]) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  const hasContent = postsData.posts.length > 0 || projectsData.projects.length > 0

  const personSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile.full_name || profile.username,
    alternateName: profile.username,
    url: `${siteConfig.url}/u/${profile.username}`,
    image: profile.avatar_url,
    description: profile.bio,
    jobTitle: profile.job_title,
    worksFor: profile.company ? { "@type": "Organization", name: profile.company } : undefined,
    address: profile.location ? { "@type": "PostalAddress", addressLocality: profile.location } : undefined,
    sameAs: [
      profile.website,
      profile.github_username ? `https://github.com/${profile.github_username}` : undefined,
      profile.twitter_username ? `https://twitter.com/${profile.twitter_username}` : undefined,
      profile.linkedin_url,
    ].filter(Boolean),
    knowsAbout: [...(profile.skills || []), ...(profile.interests || [])].filter(Boolean),
    mainEntityOfPage: {
      "@type": "ProfilePage",
      "@id": `${siteConfig.url}/u/${profile.username}`,
    },
  }

  return (
    <>
      <JsonLd data={personSchema} />
      <div className="container mx-auto max-w-5xl px-4 py-8 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 mb-12">
          <div className="md:col-span-1 flex flex-col items-center md:items-start text-center md:text-left">
            <Avatar className="h-32 w-32 md:h-40 md:w-40 border-4 border-neutral-700 shadow-lg mb-4">
              <AvatarImage
                src={profile.avatar_url || ""}
                alt={profile.full_name || profile.username || "User Avatar"}
              />
              <AvatarFallback className="text-4xl bg-neutral-700 text-neutral-300">
                {getInitials(profile.full_name || profile.username)}
              </AvatarFallback>
            </Avatar>
            <h1 className="text-3xl sm:text-4xl font-bold text-neutral-100">{profile.full_name || "Anonymous User"}</h1>
            {profile.username && <p className="text-xl text-sky-400 mb-1">@{profile.username}</p>}

            <div className="mt-2 flex items-center justify-center md:justify-start gap-2 text-amber-400">
              <Medal className="h-5 w-5" />
              <span className="text-lg font-semibold">{profile.reputation_score || 0} Reputation</span>
            </div>

            <div className="mt-3 text-md text-neutral-300 space-y-0.5">
              {profile.job_title && (
                <div className="flex items-center justify-center md:justify-start">
                  <Briefcase className="mr-2 h-4 w-4 flex-shrink-0 text-neutral-400" />
                  <span>{profile.job_title}</span>
                </div>
              )}
              {profile.company && (
                <div className="flex items-center justify-center md:justify-start">
                  <Building className="mr-2 h-4 w-4 flex-shrink-0" />
                  <span>{profile.company}</span>
                </div>
              )}
            </div>

            <div className="mt-4 space-y-1.5 text-sm text-neutral-400">
              {profile.location && (
                <div className="flex items-center justify-center md:justify-start">
                  <MapPin className="mr-2 h-4 w-4 flex-shrink-0" />
                  <span>{profile.location}</span>
                </div>
              )}
              {profile.created_at && (
                <div className="flex items-center justify-center md:justify-start">
                  <CalendarDays className="mr-2 h-4 w-4 flex-shrink-0" />
                  Joined {new Date(profile.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                </div>
              )}
              {profile.website && (
                <div className="flex items-center justify-center md:justify-start">
                  <Globe className="mr-2 h-4 w-4 flex-shrink-0" />
                  <a
                    href={profile.website.startsWith("http") ? profile.website : `https://${profile.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sky-400 hover:underline truncate"
                  >
                    {profile.website.replace(/^https?:\/\//, "")}
                  </a>
                </div>
              )}
              {profile.github_username && (
                <div className="flex items-center justify-center md:justify-start">
                  <Github className="mr-2 h-4 w-4 flex-shrink-0" />
                  <a
                    href={`https://github.com/${profile.github_username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sky-400 hover:underline"
                  >
                    {profile.github_username}
                  </a>
                </div>
              )}
              {profile.twitter_username && (
                <div className="flex items-center justify-center md:justify-start">
                  <Twitter className="mr-2 h-4 w-4 flex-shrink-0" />
                  <a
                    href={`https://twitter.com/${profile.twitter_username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sky-400 hover:underline"
                  >
                    @{profile.twitter_username}
                  </a>
                </div>
              )}
              {profile.linkedin_url && (
                <div className="flex items-center justify-center md:justify-start">
                  <Linkedin className="mr-2 h-4 w-4 flex-shrink-0" />
                  <a
                    href={profile.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sky-400 hover:underline truncate"
                  >
                    LinkedIn Profile
                  </a>
                </div>
              )}
            </div>
          </div>

          <div className="md:col-span-2">
            {profile.bio && (
              <section className="mb-8">
                <h2 className="text-xl font-semibold text-neutral-100 mb-2">About Me</h2>
                <p className="text-neutral-300 whitespace-pre-wrap prose prose-sm dark:prose-invert max-w-none">
                  {profile.bio}
                </p>
              </section>
            )}

            {profile.skills && profile.skills.length > 0 && (
              <section className="mb-8">
                <h2 className="text-xl font-semibold text-neutral-100 mb-3 flex items-center">
                  <Sparkles className="mr-2 h-5 w-5 text-sky-400" /> Skills
                </h2>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill) => (
                    <Badge key={skill} variant="secondary" className="bg-sky-700/20 border-sky-500/40 text-sky-300">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </section>
            )}

            {profile.interests && profile.interests.length > 0 && (
              <section>
                <h2 className="text-xl font-semibold text-neutral-100 mb-3 flex items-center">
                  <Brain className="mr-2 h-5 w-5 text-green-400" /> Interests
                </h2>
                <div className="flex flex-wrap gap-2">
                  {profile.interests.map((interest) => (
                    <Badge
                      key={interest}
                      variant="outline"
                      className="border-green-500/40 text-green-300 bg-green-700/10"
                    >
                      {interest}
                    </Badge>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>

        {(hasContent || postsData.error || projectsData.error) && <Separator className="my-10 bg-neutral-700" />}

        {postsData.posts.length > 0 || postsData.error ? (
          <section id="user-posts" className="mb-12">
            <h2 className="text-2xl font-semibold text-neutral-100 mb-6 flex items-center">
              <Newspaper className="mr-3 h-6 w-6 text-sky-400" />
              Recent Posts by {profile.full_name || profile.username}
            </h2>
            {postsData.error && <p className="text-destructive">Could not load posts: {postsData.error}</p>}
            {postsData.posts.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {postsData.posts.map((post) => (
                    <ArticleCard key={post.slug} post={post as PostFrontmatter} />
                  ))}
                </div>
                {postsData.totalPages > 1 && (
                  <PaginationControls
                    currentPage={postsData.currentPage}
                    totalPages={postsData.totalPages}
                    pageParamName="postsPage"
                    className="mt-8"
                  />
                )}
              </>
            ) : (
              !postsData.error && (
                <p className="text-neutral-500">
                  {profile.full_name || profile.username} hasn't published any posts yet.
                </p>
              )
            )}
          </section>
        ) : null}

        {projectsData.projects.length > 0 || projectsData.error ? (
          <section id="user-projects">
            <h2 className="text-2xl font-semibold text-neutral-100 mb-6 flex items-center">
              <Briefcase className="mr-3 h-6 w-6 text-sky-400" />
              Projects by {profile.full_name || profile.username}
            </h2>
            {projectsData.error && <p className="text-destructive">Could not load projects: {projectsData.error}</p>}
            {projectsData.projects.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {projectsData.projects.map((project) => (
                    <ProjectCard key={project.slug} project={project as ProjectFrontmatter} />
                  ))}
                </div>
                {projectsData.totalPages > 1 && (
                  <PaginationControls
                    currentPage={projectsData.currentPage}
                    totalPages={projectsData.totalPages}
                    pageParamName="projectsPage"
                    className="mt-8"
                  />
                )}
              </>
            ) : (
              !projectsData.error && (
                <p className="text-neutral-500">
                  {profile.full_name || profile.username} hasn't published any projects yet.
                </p>
              )
            )}
          </section>
        ) : null}

        {!hasContent && !postsData.error && !projectsData.error && (
          <div className="text-center py-12">
            <p className="text-xl text-neutral-500">This user hasn't shared any public content yet.</p>
          </div>
        )}
      </div>
    </>
  )
}
