"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client" // Updated import
import { useUser } from "@/app/contexts/UserContext"

export interface SeriesProgressState {
  readPostsCount: number
  isCompleted: boolean
  isStarted: boolean
  isLoading: boolean
}

export function useSeriesProgress(seriesSlug: string, totalPostsInSeries: number): SeriesProgressState {
  const { user, isLoading: isUserLoading } = useUser()
  const [progress, setProgress] = useState<SeriesProgressState>({
    readPostsCount: 0,
    isCompleted: false,
    isStarted: false,
    isLoading: true,
  })

  const fetchProgress = useCallback(async () => {
    // If the user is still being loaded, or if there's no user (guest),
    // we can determine the state without a DB call.
    if (isUserLoading) {
      setProgress((prev) => ({ ...prev, isLoading: true }))
      return
    }

    if (!user) {
      // Guest user, no progress is tracked.
      setProgress({
        readPostsCount: 0,
        isCompleted: false,
        isStarted: false,
        isLoading: false,
      })
      return
    }

    // Logged-in user, fetch from Supabase.
    const supabase = createClient() // Updated line
    const { data, error } = await supabase
      .from("series_progress")
      .select("read_posts_slugs")
      .eq("user_id", user.id)
      .eq("series_slug", seriesSlug)
      .single()

    let readCount = 0
    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows found
      console.error("Error fetching series progress:", error)
    } else if (data) {
      readCount = data.read_posts_slugs?.length || 0
    }

    const isStarted = readCount > 0
    const isCompleted = isStarted && readCount >= totalPostsInSeries

    setProgress({
      readPostsCount: readCount,
      isCompleted: isCompleted,
      isStarted: isStarted,
      isLoading: false,
    })
  }, [seriesSlug, totalPostsInSeries, user, isUserLoading])

  useEffect(() => {
    fetchProgress()
  }, [fetchProgress])

  return progress
}
