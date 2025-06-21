"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useRef, useCallback, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import type { User, SupabaseClient } from "@supabase/supabase-js"
import type { UserProfile } from "@/lib/types"

interface UserContextType {
  user: User | null
  profile: UserProfile | null
  isLoading: boolean
  fetchProfile: () => Promise<void>
}

interface UserProviderProps {
  children: React.ReactNode
  initialUser?: User | null
  initialProfile?: UserProfile | null
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children, initialUser = null, initialProfile = null }: UserProviderProps) {
  const supabaseRef = useRef<SupabaseClient>(createClient())
  const lastProfileFetch = useRef(0)

  const [user, setUser] = useState<User | null>(initialUser)
  const [profile, setProfile] = useState<UserProfile | null>(initialProfile)
  const [isLoading, setIsLoading] = useState<boolean>(!initialUser) // True if no initial user, means we need to check

  const fetchUserProfile = useCallback(
    async (userParam: User) => {
      const now = Date.now()
      // Check if profile exists, matches userParam.id, and was fetched recently
      if (profile && profile.id === userParam.id && now - lastProfileFetch.current < 30000) {
        return // Profile is fresh, do nothing. isLoading is handled by caller.
      }

      // Caller (onAuthStateChange or performFetchProfile) should manage isLoading state around this call
      try {
        const { data, error, status } = await supabaseRef.current
          .from("profiles")
          .select("*")
          .eq("id", userParam.id)
          .throwOnError(false)
          .maybeSingle<UserProfile>()

        if (status === 429 || status === 0) {
          console.warn("Supabase rate limit or network issue while fetching profile (status:", status, ").")
          return
        }
        if (error && status !== 406) {
          console.warn("Supabase returned error when fetching profile:", error)
          return
        }

        // Only update if data is different to prevent unnecessary re-renders
        // Using JSON.stringify for simple comparison; for complex objects, consider a deep-diff library or specific field checks
        setProfile((prevProfile) => {
          const newProfileData = data ?? null
          if (JSON.stringify(prevProfile) === JSON.stringify(newProfileData)) {
            return prevProfile
          }
          return newProfileData
        })
        lastProfileFetch.current = Date.now()
      } catch (e: any) {
        console.warn("Non-JSON or unexpected response while fetching profile.", e?.message)
      }
    },
    [profile], // Dependency: profile (for cache check). setProfile is stable.
  )

  const performFetchProfile = useCallback(async () => {
    if (user) {
      setIsLoading(true)
      lastProfileFetch.current = 0 // Force fetch
      await fetchUserProfile(user)
      setIsLoading(false)
    }
  }, [user, fetchUserProfile, setIsLoading]) // Added setIsLoading

  useEffect(() => {
    const getInitialSessionOnClient = async () => {
      setIsLoading(true)
      try {
        const {
          data: { session },
        } = await supabaseRef.current.auth.getSession()
        const fetchedUser = session?.user ?? null

        setUser((prevUser) => {
          if (prevUser?.id === fetchedUser?.id) return prevUser
          return fetchedUser
        })

        if (fetchedUser) {
          await fetchUserProfile(fetchedUser)
        } else {
          setProfile(null)
        }
      } catch (e) {
        console.error("Error getting initial session on client:", e)
        setUser(null)
        setProfile(null)
      } finally {
        setIsLoading(false)
      }
    }

    if (!initialUser) {
      getInitialSessionOnClient()
    }

    const {
      data: { subscription },
    } = supabaseRef.current.auth.onAuthStateChange(async (event, session) => {
      setIsLoading(true)
      const currentUser = session?.user ?? null

      setUser((prevUser) => {
        if (prevUser?.id === currentUser?.id) {
          // Only update if user ID actually changes
          return prevUser
        }
        return currentUser
      })

      if (currentUser) {
        // If user changes or logs in, fetch their profile.
        // Reset lastProfileFetch if profile is for a different user or doesn't exist.
        if (!profile || profile.id !== currentUser.id) {
          lastProfileFetch.current = 0
        }
        await fetchUserProfile(currentUser)
      } else {
        setProfile(null) // Clear profile on logout
      }
      setIsLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [initialUser, fetchUserProfile, profile]) // Added fetchUserProfile and profile to dependencies

  const value = useMemo(
    () => ({
      user,
      profile,
      isLoading,
      fetchProfile: performFetchProfile,
    }),
    [user, profile, isLoading, performFetchProfile],
  )

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}

export const useUser = () => {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider")
  }
  return context
}
