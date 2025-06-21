"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { usePathname, useSearchParams, useRouter } from "next/navigation" // Import useSearchParams & useRouter
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface PaginationControlsProps {
  currentPage: number
  totalPages: number
  pageParamName: string // e.g., "postsPage" or "projectsPage"
  className?: string
}

export function PaginationControls({ currentPage, totalPages, pageParamName, className }: PaginationControlsProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams() // Get current search params
  const router = useRouter() // For programmatic navigation
  const [jumpToPage, setJumpToPage] = useState("")

  if (totalPages <= 1) {
    return null
  }

  const generatePageLink = (page: number) => {
    const params = new URLSearchParams(searchParams.toString()) // Clone existing params

    if (page > 1) {
      params.set(pageParamName, String(page))
    } else {
      params.delete(pageParamName) // Remove param if page is 1 for cleaner URL
    }
    const queryString = params.toString()
    return queryString ? `${pathname}?${queryString}` : pathname
  }

  const handleJumpToPage = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const pageNum = Number.parseInt(jumpToPage, 10)
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
      router.push(generatePageLink(pageNum)) // Use Next.js router
      setJumpToPage("")
    }
  }

  const pagesToShow = new Set<number>()
  pagesToShow.add(1)
  pagesToShow.add(totalPages)
  for (let i = Math.max(1, currentPage - 1); i <= Math.min(totalPages, currentPage + 1); i++) {
    pagesToShow.add(i)
  }
  if (currentPage > 3 && totalPages > 5) pagesToShow.add(currentPage - 2)
  if (currentPage < totalPages - 2 && totalPages > 5) pagesToShow.add(currentPage + 2)

  const sortedPages = Array.from(pagesToShow).sort((a, b) => a - b)
  const pageLinks: (number | "...")[] = []
  let lastPageAdded: number | null = null
  for (const page of sortedPages) {
    if (lastPageAdded !== null && page > lastPageAdded + 1) {
      pageLinks.push("...")
    }
    pageLinks.push(page)
    lastPageAdded = page
  }

  return (
    <nav aria-label="Pagination" className={cn("flex items-center justify-center flex-wrap gap-2 mt-12", className)}>
      <div className="flex items-center justify-center space-x-1 sm:space-x-2">
        {currentPage > 1 && (
          <Button
            variant="outline"
            size="sm"
            asChild
            className="text-neutral-300 border-neutral-700 hover:bg-neutral-750 hover:text-green-400 hover:border-neutral-600 px-2.5 sm:px-3 bg-neutral-800 hover:text-white"
          >
            <Link href={generatePageLink(currentPage - 1)}>
              <ChevronLeft className="w-4 h-4 sm:mr-1" />
              <span className="hidden sm:inline">Previous</span>
            </Link>
          </Button>
        )}

        {pageLinks.map((page, index) =>
          typeof page === "number" ? (
            <Button
              key={page}
              variant={currentPage === page ? "default" : "outline"}
              size="icon"
              asChild
              className={cn(
                "h-9 w-9 sm:h-10 sm:w-10 text-sm",
                currentPage === page
                  ? "bg-green-500 hover:bg-green-600 text-neutral-900 border-green-500"
                  : "text-neutral-300 border-neutral-700 hover:bg-neutral-750 hover:text-green-400 hover:border-neutral-600 bg-neutral-800 hover:text-white",
              )}
            >
              <Link href={generatePageLink(page)} aria-label={`Go to page ${page}`}>
                {page}
              </Link>
            </Button>
          ) : (
            <span
              key={`ellipsis-${index}`}
              className="flex items-center justify-center h-9 w-9 sm:h-10 sm:w-10 px-1.5 sm:px-2 text-neutral-500"
            >
              ...
            </span>
          ),
        )}

        {currentPage < totalPages && (
          <Button
            variant="outline"
            size="sm"
            asChild
            className="text-neutral-300 border-neutral-700 hover:bg-neutral-750 hover:text-green-400 hover:border-neutral-600 px-2.5 sm:px-3 bg-neutral-800 hover:text-white"
          >
            <Link href={generatePageLink(currentPage + 1)}>
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="w-4 h-4 sm:ml-1" />
            </Link>
          </Button>
        )}
      </div>

      {totalPages > 5 && (
        <form onSubmit={handleJumpToPage} className="flex items-center space-x-2 ml-0 mt-2 sm:mt-0 sm:ml-4">
          <Input
            type="number"
            min="1"
            max={totalPages}
            value={jumpToPage}
            onChange={(e) => setJumpToPage(e.target.value)}
            placeholder="Page..."
            aria-label="Jump to page number"
            className="h-9 sm:h-10 w-20 bg-neutral-800 border-neutral-700 focus:ring-green-500 focus:border-green-500 text-neutral-100"
          />
          <Button
            type="submit"
            variant="outline"
            size="sm"
            className="h-9 sm:h-10 text-neutral-300 border-neutral-700 hover:bg-neutral-750 hover:text-green-400 hover:border-neutral-600 bg-neutral-800 hover:text-white"
          >
            Go
          </Button>
        </form>
      )}
    </nav>
  )
}
