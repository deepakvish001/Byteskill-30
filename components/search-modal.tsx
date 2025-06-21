"use client"

import type React from "react"

import { Fragment, useCallback, useEffect, useState, useRef } from "react"
import { Dialog, Transition } from "@headlessui/react"
import { SearchIcon, X } from "lucide-react"
import { useRouter } from "next/navigation"
import type { PostFrontmatter } from "@/lib/posts"
import type { ProjectFrontmatter } from "@/lib/projects"
import { HighlightMatches } from "./highlight-matches"
import { siteConfig } from "@/lib/site-config"
import { cn } from "@/lib/utils"

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
  allPosts: PostFrontmatter[]
  allProjects: ProjectFrontmatter[]
}

type SearchResult = (PostFrontmatter & { type: "post" }) | (ProjectFrontmatter & { type: "project" })

export function SearchModal({ isOpen, onClose, allPosts, allProjects }: SearchModalProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const resultsContainerRef = useRef<HTMLUListElement>(null) // Ref for the results list
  const [mounted, setMounted] = useState(false)
  const combinedContent: SearchResult[] = [
    ...allPosts.map((post) => ({ ...post, type: "post" as const })),
    ...allProjects.map((project) => ({ ...project, type: "project" as const })),
  ]

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    if (query.length > 1) {
      const lowerCaseQuery = query.toLowerCase()
      const filteredResults = combinedContent.filter(
        (item) =>
          item.title.toLowerCase().includes(lowerCaseQuery) ||
          (item.description && item.description.toLowerCase().includes(lowerCaseQuery)) ||
          (item.tags && item.tags.some((tag) => tag.toLowerCase().includes(lowerCaseQuery))),
      )
      setResults(filteredResults.slice(0, 10))
    } else {
      setResults([])
    }
    setActiveIndex(0)
  }, [query, allPosts, allProjects, mounted])

  const handleSelect = useCallback(
    (item: SearchResult) => {
      const path = item.type === "post" ? `/blog/${item.slug}` : `/projects/${item.slug}`
      router.push(path)
      onClose()
      setQuery("")
    },
    [router, onClose],
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!results.length) return

      if (e.key === "ArrowDown") {
        e.preventDefault()
        setActiveIndex((prev) => (prev + 1) % results.length)
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setActiveIndex((prev) => (prev - 1 + results.length) % results.length)
      } else if (e.key === "Enter" && results[activeIndex]) {
        e.preventDefault()
        handleSelect(results[activeIndex])
      } else if (e.key === "Escape") {
        onClose()
      }
    },
    [results, activeIndex, onClose, handleSelect],
  )

  useEffect(() => {
    if (mounted && isOpen && inputRef.current) {
      // Delay focus slightly to ensure modal is fully rendered
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen, mounted])

  useEffect(() => {
    if (mounted && resultsContainerRef.current && results.length > 0) {
      const activeItem = resultsContainerRef.current.children[activeIndex] as HTMLElement
      activeItem?.scrollIntoView({ block: "nearest" })
    }
  }, [activeIndex, mounted, results.length])

  if (!mounted) {
    return null // Don't render anything on the server or before hydration
  }

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[100]" onClose={onClose} initialFocus={inputRef}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-neutral-900/80 backdrop-blur-sm transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-[100] overflow-y-auto">
          <div className="flex min-h-full items-start justify-center p-4 text-center sm:p-6">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="relative w-full max-w-xl transform overflow-hidden rounded-xl bg-neutral-800 text-left align-middle shadow-2xl transition-all">
                <div className="flex items-center border-b border-neutral-700 px-4">
                  <SearchIcon className="h-5 w-5 text-neutral-500" aria-hidden="true" />
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder={`Search ${siteConfig.name}...`}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-full bg-transparent p-4 text-neutral-100 placeholder-neutral-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    className="rounded-md p-1 text-neutral-400 hover:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-neutral-800"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close search</span>
                    <X className="h-5 w-5" aria-hidden="true" />
                  </button>
                </div>

                {results.length > 0 && (
                  <ul
                    ref={resultsContainerRef}
                    className="max-h-[60vh] divide-y divide-neutral-700 overflow-y-auto p-2"
                  >
                    {results.map((item, index) => (
                      <li key={`${item.type}-${item.slug}`}>
                        <a
                          href={item.type === "post" ? `/blog/${item.slug}` : `/projects/${item.slug}`}
                          onClick={(e) => {
                            e.preventDefault()
                            handleSelect(item)
                          }}
                          onFocus={() => setActiveIndex(index)}
                          className={cn(
                            "block rounded-md p-3 hover:bg-neutral-700/50 focus:bg-neutral-700/50 focus:outline-none",
                            activeIndex === index && "bg-neutral-700/50",
                          )}
                          // tabIndex should not be -1 if we want keyboard navigation to focus these items
                        >
                          <p className="text-sm font-medium text-green-400">
                            <HighlightMatches text={item.title} query={query} />
                          </p>
                          {item.description && (
                            <p className="mt-1 text-xs text-neutral-400">
                              <HighlightMatches text={item.description} query={query} />
                            </p>
                          )}
                          <p className="mt-1 text-xs text-neutral-500">
                            {item.type === "post" ? "Blog Post" : "Project"}
                          </p>
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
                {mounted && query.length > 1 && results.length === 0 && (
                  <p className="p-6 text-center text-sm text-neutral-400">No results found.</p>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}
