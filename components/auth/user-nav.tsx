"use client"
import { LogOut, UserIcon, Settings, LayoutDashboard } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation" // Use next/navigation for App Router
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { useUser } from "@/app/contexts/UserContext" // Assuming this hook exists
import { createClient } from "@/lib/supabase/client" // Ensure this is the client-side Supabase instance

export function UserNav() {
  const { user, profile } = useUser()
  const router = useRouter() // For client-side navigation

  // Ensure Supabase client is only created/used on the client
  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    // router.refresh() // Refresh server components if needed
    router.push("/") // Redirect to homepage after sign out
  }

  if (!user) {
    // Or return a login button, or null if handled by SiteHeader
    return (
      <Link href="/login" legacyBehavior passHref>
        <Button variant="ghost">Login</Button>
      </Link>
    )
  }

  const getInitials = (name?: string | null) => {
    if (!name) return ""
    const names = name.split(" ")
    if (names.length === 1) return names[0].substring(0, 2).toUpperCase()
    return (names[0][0] + names[names.length - 1][0]).toUpperCase()
  }

  const displayName = profile?.full_name || user.email
  const avatarUrl = profile?.avatar_url

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            {avatarUrl ? (
              <AvatarImage src={avatarUrl || "/placeholder.svg"} alt={displayName || "User Avatar"} />
            ) : null}
            <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{displayName}</p>
            {user.email && <p className="text-xs leading-none text-muted-foreground">{user.email}</p>}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <Link href="/me/dashboard" passHref legacyBehavior>
            <DropdownMenuItem>
              <LayoutDashboard className="mr-2 h-4 w-4" />
              <span>Dashboard</span>
            </DropdownMenuItem>
          </Link>
          <Link href="/me/profile" passHref legacyBehavior>
            <DropdownMenuItem>
              <UserIcon className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
          </Link>
          <Link href="/me/bookmarks" passHref legacyBehavior>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" /> {/* Replace with Bookmark icon if available */}
              <span>Bookmarks</span>
            </DropdownMenuItem>
          </Link>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
