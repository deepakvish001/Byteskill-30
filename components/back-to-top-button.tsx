"use client"

import { ArrowUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useEffect, useState, useCallback } from "react"

export function BackToTopButton() {
  const [isVisible, setIsVisible] = useState(false)
  const [mounted, setMounted] = useState(false)

  // This effect runs once after the component mounts on the client
  useEffect(() => {
    setMounted(true)
  }, [])

  // Memoized callback for scroll event handling
  const toggleVisibility = useCallback(() => {
    // Ensure window is available (it will be if mounted is true)
    if (typeof window !== "undefined" && window.pageYOffset > 300) {
      setIsVisible(true)
    } else {
      setIsVisible(false)
    }
  }, [])

  // This effect sets up and cleans up the scroll event listener
  useEffect(() => {
    // Only proceed if the component has mounted on the client
    if (mounted) {
      window.addEventListener("scroll", toggleVisibility)
      // Call handler once to set initial visibility
      toggleVisibility()
      // Cleanup function to remove the event listener
      return () => window.removeEventListener("scroll", toggleVisibility)
    }
  }, [mounted, toggleVisibility]) // Dependencies for the effect

  // Handler for the button click
  const scrollToTop = () => {
    // Ensure window is available (it will be if mounted is true and button is clicked)
    if (typeof window !== "undefined") {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      })
    }
  }

  // Don't render the button if not mounted or not set to be visible
  // This prevents rendering on the server and avoids hydration mismatches
  if (!mounted || !isVisible) {
    return null
  }

  return (
    <Button
      onClick={scrollToTop}
      className="fixed bottom-4 right-4 z-50 p-2 rounded-full shadow-lg bg-card hover:bg-card/90 border"
      variant="outline"
      size="icon"
      aria-label="Scroll to top"
    >
      <ArrowUp className="h-5 w-5" />
    </Button>
  )
}
