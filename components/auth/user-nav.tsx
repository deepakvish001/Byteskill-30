"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LogOut, UserIcon, LayoutDashboard, BookmarkIcon, ShieldCheck } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useUser } from "@/app/contexts/UserContext"

/**
 * Navigation dropdown shown in the site-header once a user is signed in.
 * Relies on the global `UserProvider` (Supabase) for auth/session data.
 */
export function UserNav() {
  const router = useRouter()
  const supabase = createClient()
  const { user, profile } = useUser()

  if (!user) return null // not signed in – caller should render Sign-in button instead

  const isAdminOrOwner = profile?.role === "admin" || profile?.role === "owner"

  const getInitials = (name?: string | null): string => {
    if (!name) return user.email?.[0]?.toUpperCase() || "??"
    const parts = name.split(" ")
    if (parts.length > 1 && parts[0] && parts[parts.length - 1]) {
      // Ensure parts[0] and parts[parts.length - 1] are not empty
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    // back to landing page
    router.push("/")
    router.refresh() // Ensures context and server components re-evaluate
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10 border-2 border-transparent hover:border-sky-500 transition-colors">
            <AvatarImage
              src={profile?.avatar_url || ""}
              alt={profile?.full_name || profile?.username || "User avatar"}
            />
            <AvatarFallback className="bg-neutral-700 text-neutral-300">
              {getInitials(profile?.full_name || profile?.username)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-56 bg-neutral-800 border-neutral-700 text-neutral-200" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none text-neutral-50">
              {profile?.full_name || profile?.username || "User"}
            </p>
            {user.email && <p className="text-xs leading-none text-neutral-400">{user.email}</p>}
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator className="bg-neutral-700" />

        <DropdownMenuGroup>
          <DropdownMenuItem asChild className="cursor-pointer hover:bg-neutral-700/50 focus:bg-neutral-700/50">
            <Link href="/me/dashboard">
              <LayoutDashboard className="mr-2 h-4 w-4 text-sky-400" />
              <span>Dashboard</span>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild className="cursor-pointer hover:bg-neutral-700/50 focus:bg-neutral-700/50">
            <Link href="/me/profile">
              <UserIcon className="mr-2 h-4 w-4 text-green-400" />
              <span>Profile</span>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild className="cursor-pointer hover:bg-neutral-700/50 focus:bg-neutral-700/50">
            <Link href="/me/bookmarks">
              <BookmarkIcon className="mr-2 h-4 w-4 text-yellow-400" />
              <span>My Bookmarks</span>
            </Link>
          </DropdownMenuItem>

          {isAdminOrOwner && (
            <DropdownMenuItem asChild className="cursor-pointer hover:bg-neutral-700/50 focus:bg-neutral-700/50">
              <Link href="/admin/dashboard">
                <ShieldCheck className="mr-2 h-4 w-4 text-purple-400" />
                <span>Admin Dashboard</span>
              </Link>
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>

        <DropdownMenuSeparator className="bg-neutral-700" />

        <DropdownMenuItem
          onClick={handleSignOut}
          className="cursor-pointer hover:bg-neutral-700/50 focus:bg-neutral-700/50"
        >
          <LogOut className="mr-2 h-4 w-4 text-red-400" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
