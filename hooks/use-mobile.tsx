"use client"

import { useState, useEffect, useCallback } from "react"

export function useMobile(query = "(max-width: 768px)"): boolean {
  const [isMobile, setIsMobile] = useState(false) // Default to false, determine in useEffect

  const updateMatch = useCallback(() => {
    if (typeof window !== "undefined") {
      const mediaQuery = window.matchMedia(query)
      setIsMobile(mediaQuery.matches)
    }
  }, [query])

  useEffect(() => {
    // Initial check once mounted on client
    updateMatch()

    // Set up listener for changes
    if (typeof window !== "undefined") {
      const mediaQuery = window.matchMedia(query)
      const handler = () => updateMatch()

      // Using addEventListener/removeEventListener for modern browsers
      try {
        mediaQuery.addEventListener("change", handler)
      } catch (e) {
        // Fallback for older browsers that might not support addEventListener on MediaQueryList
        mediaQuery.addListener(handler)
      }

      // Cleanup
      return () => {
        try {
          mediaQuery.removeEventListener("change", handler)
        } catch (e) {
          mediaQuery.removeListener(handler)
        }
      }
    }
  }, [query, updateMatch])

  return isMobile
}
