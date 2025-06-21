"use client"

import type { User, UserProfile } from "@/lib/types"
import { createContext, useContext, useEffect, useState, useMemo } from "react"
import type { ReactNode } from "react"
import { createClient } from "@/lib/supabase/client"

interface UserContextType {
  user: User | null
  profile: UserProfile | null
  isLoading: boolean
  setProfile: (profile: UserProfile | null) => void
}

// Create the context with a default undefined value
export const UserContext = createContext<UserContextType | undefined>(undefined)

interface UserProviderProps {
  children: ReactNode
  initialUser: User | null
  initialProfile: UserProfile | null
}

export function UserProvider({ children, initialUser, initialProfile }: UserProviderProps) {
  const [user, setUser] = useState<User | null>(initialUser)
  const [profile, setProfile] = useState<UserProfile | null>(initialProfile)
  // Start loading only if we don't have an initial user, otherwise, we assume we're hydrated.
  const [isLoading, setIsLoading] = useState(!initialUser)

  useEffect(() => {
    const supabase = createClient()

    // Fetch user on mount if not provided, to ensure client-side session is checked.
    // This also handles cases where the initialUser from server might be stale by the time client hydrates.
    const fetchUserSession = async () => {
      setIsLoading(true) // Set loading true when we start fetching
      const {
        data: { session },
      } = await supabase.auth.getSession() // getSession is fine on client for initial check
      const currentUser = session?.user ?? null
      setUser(currentUser)

      if (currentUser) {
        // If there's a user but no profile, or profile is for a different user
        if (!profile || profile.id !== currentUser.id) {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", currentUser.id)
            .single<UserProfile>()
          setProfile(profileData)
        }
      } else {
        setProfile(null) // Clear profile if no user
      }
      setIsLoading(false)
    }

    // If initialUser was not provided (e.g. static page or error during SSR fetch),
    // or if the user state on client might be different (e.g. logged in/out in another tab)
    // then fetch the current session.
    if (!initialUser) {
      fetchUserSession()
    } else {
      // If initialUser was provided, we are likely hydrated, so set loading to false.
      // The onAuthStateChange listener below will handle subsequent changes.
      setIsLoading(false)
    }

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setIsLoading(true)
      const currentUser = session?.user ?? null
      setUser(currentUser)

      if (currentUser) {
        // Fetch profile if user logs in or if current profile doesn't match
        if (event === "SIGNED_IN" || (currentUser && (!profile || profile.id !== currentUser.id))) {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", currentUser.id)
            .single<UserProfile>()
          setProfile(profileData)
        }
      } else if (event === "SIGNED_OUT") {
        setProfile(null)
      }
      setIsLoading(false)
    })

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe()
    }
  }, [initialUser, profile]) // Dependencies for the effect

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(
    () => ({
      user,
      profile,
      isLoading,
      setProfile, // Allow components to update profile if needed (e.g., after profile edit)
    }),
    [user, profile, isLoading],
  )

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}

// Custom hook to use the UserContext
export const useUser = (): UserContextType => {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider")
  }
  return context
}
