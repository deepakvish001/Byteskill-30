"use client"

import Link from "next/link"

export function SkipToContentLink() {
  return (
    <Link
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-green-500 focus:text-neutral-900 focus:font-semibold focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-green-300 focus:ring-offset-2 focus:ring-offset-neutral-900 transition-opacity duration-150"
      onClick={(e) => {
        const mainContent = document.getElementById("main-content")
        if (mainContent) {
          mainContent.focus()
        }
      }}
    >
      Skip to main content
    </Link>
  )
}
