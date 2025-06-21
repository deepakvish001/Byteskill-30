"use client"

import { useState, useEffect } from "react"

export function ReadingProgressBar() {
  const [completion, setCompletion] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const scrollableHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight
      const scrolled = window.scrollY

      if (scrollableHeight > 0) {
        setCompletion((scrolled / scrollableHeight) * 100)
      } else {
        setCompletion(0)
      }
    }

    window.addEventListener("scroll", handleScroll)

    // Call handler once on mount to set initial state
    handleScroll()

    return () => {
      window.removeEventListener("scroll", handleScroll)
    }
  }, [])

  return (
    <div className="fixed top-0 left-0 right-0 h-1 z-50 w-full bg-neutral-800">
      <div className="h-full bg-green-500 transition-all duration-150 ease-out" style={{ width: `${completion}%` }} />
    </div>
  )
}
