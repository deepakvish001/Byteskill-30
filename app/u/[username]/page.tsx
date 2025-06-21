import Link from "next/link"
import { getPublicProfileByUsername } from "@/app/me/profile/actions"
import { getProjectsByAuthorUsername } from "@/app/projects/actions"
import { Globe, CalendarDays, Briefcase, Newspaper } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { getPostsByAuthorUsername } from "@/app/blog/actions"
import { ArticleCard } from "@/components/article-card"
import { ProjectCard } from "@/components/project-card"
import { PaginationControls } from "@/components/pagination-controls"
// No need to import specific ProfilePostFrontmatter or ProfileProjectFrontmatter from lib/types here
// as the cards now expect ArticleCardDisplayInfo and ProjectCardDisplayInfo,
// and the server actions return full PostFrontmatter/ProjectFrontmatter which are compatible.
import type { PostFrontmatter, ProjectFrontmatter } from "@/lib/types"

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
  const { profile } = await getPublicProfileByUsername(params.username)
  if (!profile) {
    return {
      title: "User Not Found",
    }
  }
  return {
    title: `${profile.full_name || profile.username}'s Profile`,
    description: `View the public profile and contributions of ${profile.full_name || profile.username}.`,
  }
}

const ITEMS_PER_PAGE = 6

export default async function PublicProfilePage({ params: routeParams, searchParams }: PublicProfilePageProps) {
  const { username } = routeParams
  const { profile, error: profileError } = await getPublicProfileByUsername(username)

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

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8 md:py-16">
      <div className="flex flex-col items-center md:flex-row md:items-start gap-6 md:gap-8 mb-10">
        <Avatar className="h-32 w-32 md:h-40 md:w-40 border-4 border-neutral-700 shadow-lg">
          <AvatarImage src={profile.avatar_url || ""} alt={profile.full_name || profile.username || "User Avatar"} />
          <AvatarFallback className="text-4xl bg-neutral-700 text-neutral-300">
            {getInitials(profile.full_name || profile.username)}
          </AvatarFallback>
        </Avatar>
        <div className="text-center md:text-left flex-grow pt-2">
          <h1 className="text-3xl sm:text-4xl font-bold text-neutral-100">{profile.full_name || "Anonymous User"}</h1>
          {profile.username && <p className="text-xl text-sky-400">@{profile.username}</p>}
          {profile.created_at && (
            <div className="mt-2 flex items-center justify-center md:justify-start text-sm text-neutral-400">
              <CalendarDays className="mr-1.5 h-4 w-4" />
              Joined {new Date(profile.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </div>
          )}
          {profile.website && (
            <div className="mt-1 flex items-center justify-center md:justify-start text-sm text-neutral-400">
              <Globe className="mr-1.5 h-4 w-4" />
              <a
                href={profile.website.startsWith("http") ? profile.website : `https://${profile.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sky-400 hover:underline"
              >
                {profile.website.replace(/^https?:\/\//, "")}
              </a>
            </div>
          )}
          {profile.bio && (
            <p className="mt-4 text-neutral-300 text-center md:text-left whitespace-pre-wrap max-w-prose">
              {profile.bio}
            </p>
          )}
        </div>
      </div>

      {hasContent && <Separator className="my-10 bg-neutral-700" />}

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
                  // PostFrontmatter is assignable to ArticleCardDisplayInfo
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
                  // ProjectFrontmatter is assignable to ProjectCardDisplayInfo
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
  )
}
