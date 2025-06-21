"use client"

import { useState, useEffect, forwardRef, useMemo } from "react"
import Link from "next/link"
import { SearchIcon, Menu, X, BrainCircuit, Loader2, Bell } from "lucide-react"
import { SearchModal } from "@/components/search-modal"
import type { PostFrontmatter } from "@/lib/posts"
import type { ProjectFrontmatter } from "@/lib/projects"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { NotificationList } from "@/components/notifications/notification-list"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { siteConfig } from "@/lib/site-config"
import { UserNav } from "@/components/auth/user-nav"
import { useUser } from "@/app/contexts/UserContext"

interface SiteHeaderProps {
  allPosts: PostFrontmatter[]
  allProjects: ProjectFrontmatter[]
  // We can't pass initialNotifications directly here easily without making SiteHeader a server component
  // or fetching them in layout.tsx and passing down.
  // For now, NotificationList will fetch its own data.
}

export const SiteHeader = forwardRef<HTMLElement, SiteHeaderProps>(({ allPosts, allProjects }, ref) => {
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const pathname = usePathname()
  const { user, profile, isLoading: isUserLoading } = useUser()

  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0)
  const [isNotificationPopoverOpen, setIsNotificationPopoverOpen] = useState(false)

  useEffect(() => {
    if (!user) {
      setUnreadNotificationCount(0)
      return
    }
    ;(async () => {
      try {
        const res = await fetch("/api/notifications/unread-count", {
          cache: "no-store",
        })
        if (res.ok) {
          const json = (await res.json()) as { count: number }
          setUnreadNotificationCount(json.count)
        }
      } catch (e) {
        console.error("Failed to load unread notifications", e)
      }
    })()
  }, [user])

  const navLinks = useMemo(
    () => [
      // useMemo for navLinks
      { href: "/blog", label: "Blog" },
      { href: "/projects", label: "Projects" },
      { href: "/series", label: "Series" },
      { href: "/tags", label: "Tags" },
      { href: "/about", label: "About" },
    ],
    [],
  )

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen)
  const closeMobileMenu = () => setIsMobileMenuOpen(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener("scroll", handleScroll)
    handleScroll() // Call on mount
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const outlineButtonClasses =
    "bg-neutral-800 border-neutral-700 text-neutral-300 hover:bg-neutral-750 hover:text-green-400 hover:border-neutral-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-900 focus-visible:ring-green-500"

  const linkFocusClasses =
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-900 rounded-md"

  const handleNotificationUpdate = () => {
    // This function is called when notifications are read inside the popover
    // Re-fetch unread count
    if (user) {
      ;(async () => {
        try {
          const res = await fetch("/api/notifications/unread-count", {
            cache: "no-store",
          })
          if (res.ok) {
            const json = (await res.json()) as { count: number }
            setUnreadNotificationCount(json.count)
          }
        } catch (e) {
          console.error("Failed to load unread notifications", e)
        }
      })()
    }
  }

  return (
    <>
      <header
        id="site-header"
        ref={ref}
        className={cn(
          "container mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center sticky top-0 z-50 bg-neutral-900/80 backdrop-blur-md border-b border-neutral-700/50 transition-all duration-300 ease-in-out",
          isScrolled ? "py-3 header-scrolled" : "py-6",
        )}
      >
        <Link
          href="/"
          className={cn(
            "text-xl font-semibold text-neutral-100 hover:text-green-400 transition-colors flex items-center",
            linkFocusClasses,
          )}
          onClick={closeMobileMenu}
        >
          <BrainCircuit
            className={cn(
              "w-6 h-6 mr-2 text-green-400 transition-all duration-300 ease-in-out",
              isScrolled ? "w-5 h-5" : "w-6 h-6",
            )}
          />
          <span className={cn("transition-all duration-300 ease-in-out", isScrolled ? "text-lg" : "text-xl")}>
            {siteConfig.name}
          </span>
        </Link>
        <nav className="hidden md:flex items-center space-x-6 text-sm">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "hover:text-green-400 transition-colors px-2 py-1 rounded-md",
                pathname === link.href || (pathname.startsWith(link.href) && link.href !== "/")
                  ? "text-green-400 bg-green-700/20"
                  : "text-neutral-300",
                linkFocusClasses,
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSearchModalOpen(true)}
            aria-label="Search"
            className="text-neutral-400 hover:text-green-400 hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-900 rounded-md"
          >
            <SearchIcon className="w-5 h-5" />
          </Button>

          {isUserLoading ? (
            <div className="flex items-center justify-center h-10 w-10">
              {" "}
              {/* Placeholder for UserNav width */}
              <Loader2 className="h-5 w-5 animate-spin text-neutral-400" />
            </div>
          ) : user && profile ? (
            <>
              <Popover open={isNotificationPopoverOpen} onOpenChange={setIsNotificationPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="View notifications"
                    className="text-neutral-400 hover:text-green-400 hover:bg-neutral-800 relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-900 rounded-md"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadNotificationCount > 0 && (
                      <span className="absolute top-1 right-1 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 border-neutral-700 bg-neutral-850 shadow-xl" align="end">
                  <NotificationList
                    userId={user.id}
                    onAllRead={handleNotificationUpdate}
                    onNotificationRead={handleNotificationUpdate}
                  />
                </PopoverContent>
              </Popover>
              <UserNav user={user} profile={profile} />
            </>
          ) : (
            <div className="hidden md:flex items-center space-x-2">
              <Button asChild variant="outline" size="sm" className={outlineButtonClasses}>
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild variant="default" size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                <Link href="/signup">Sign Up</Link>
              </Button>
            </div>
          )}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMobileMenu}
              aria-label="Toggle menu"
              className="text-neutral-400 hover:text-green-400 hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-900 rounded-md"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </header>

      {isMobileMenuOpen && (
        <div
          className={cn(
            "md:hidden fixed inset-0 z-40 bg-neutral-900/95 backdrop-blur-sm p-6 transition-all duration-300 ease-in-out",
            isScrolled ? "top-[61px]" : "top-[77px]", // Adjust based on scrolled header height
          )}
        >
          <nav className="flex flex-col space-y-6 text-lg">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={closeMobileMenu}
                className={cn(
                  "hover:text-green-400 transition-colors py-2 px-3 rounded-md text-center",
                  pathname === link.href || (pathname.startsWith(link.href) && link.href !== "/")
                    ? "text-green-400 bg-green-700/20"
                    : "text-neutral-200",
                  linkFocusClasses,
                )}
              >
                {link.label}
              </Link>
            ))}
            {!isUserLoading && !user && (
              <div className="flex flex-col space-y-4 pt-4 border-t border-neutral-700/50">
                <Button
                  asChild
                  variant="outline"
                  className={cn("w-full", outlineButtonClasses)}
                  onClick={closeMobileMenu}
                >
                  <Link href="/login">Login</Link>
                </Button>
                <Button
                  asChild
                  variant="default"
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  onClick={closeMobileMenu}
                >
                  <Link href="/signup">Sign Up</Link>
                </Button>
              </div>
            )}
            {isUserLoading && (
              <div className="flex justify-center pt-4 border-t border-neutral-700/50">
                <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
              </div>
            )}
          </nav>
        </div>
      )}

      <SearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        allPosts={allPosts}
        allProjects={allProjects}
      />
    </>
  )
})

SiteHeader.displayName = "SiteHeader"
