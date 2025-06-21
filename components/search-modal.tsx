"use client"

import { useCallback, useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Command as CommandPrimitive } from "cmdk"
import { Search, FileText, Briefcase, CalendarDays } from "lucide-react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { useDebounce } from "@/hooks/use-debounce"
import { performSearchAction } from "@/app/search/actions"
import type { SearchResultItem } from "@/lib/types"
import { HighlightMatches } from "./highlight-matches" // Assuming this component exists and works
import { Badge } from "@/components/ui/badge"

export function SearchModal() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const debouncedSearchQuery = useDebounce(searchQuery, 300)
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([])
  const [isSearching, startSearchTransition] = useTransition()
  const [searchError, setSearchError] = useState<string | null>(null)

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setIsOpen((open) => !open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  useEffect(() => {
    if (debouncedSearchQuery.length > 1) {
      startSearchTransition(async () => {
        setSearchError(null)
        const result = await performSearchAction(debouncedSearchQuery)
        if (result.success && result.results) {
          setSearchResults(result.results)
        } else {
          setSearchResults([])
          setSearchError(result.message || "Search failed.")
        }
      })
    } else {
      setSearchResults([])
      setSearchError(null)
    }
  }, [debouncedSearchQuery])

  const runCommand = useCallback((command: () => unknown) => {
    setIsOpen(false)
    command()
  }, [])

  const handleSelectResult = (item: SearchResultItem) => {
    runCommand(() => router.push(item.type === "post" ? `/blog/${item.slug}` : `/projects/${item.slug}`))
  }

  const formatResultDate = (dateString: string | null) => {
    if (!dateString) return ""
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        aria-label="Open search"
      >
        <Search className="h-4 w-4" />
        <span>Search...</span>
        <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="overflow-hidden p-0 shadow-lg sm:max-w-2xl">
          <CommandPrimitive
            shouldFilter={false} // We are doing server-side search
            className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5"
          >
            <div className="flex items-center border-b px-3">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <CommandPrimitive.Input
                value={searchQuery}
                onValueChange={setSearchQuery}
                placeholder="Search posts and projects..."
                className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <CommandPrimitive.List className="max-h-[400px] overflow-y-auto overflow-x-hidden">
              {isSearching && debouncedSearchQuery.length > 1 && (
                <CommandPrimitive.Loading>
                  <div className="p-4 text-center text-sm text-muted-foreground">Searching...</div>
                </CommandPrimitive.Loading>
              )}
              {!isSearching && searchError && <div className="p-4 text-center text-sm text-red-500">{searchError}</div>}
              {!isSearching && !searchError && debouncedSearchQuery.length > 1 && searchResults.length === 0 && (
                <CommandPrimitive.Empty className="py-6 text-center text-sm">
                  No results found for &quot;{debouncedSearchQuery}&quot;.
                </CommandPrimitive.Empty>
              )}

              {searchResults.length > 0 && (
                <CommandPrimitive.Group heading="Search Results">
                  {searchResults.map((item) => (
                    <CommandPrimitive.Item
                      key={item.id}
                      value={`${item.type}-${item.slug}`}
                      onSelect={() => handleSelectResult(item)}
                      className="cursor-pointer data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground"
                    >
                      <div className="flex items-start space-x-3">
                        {item.type === "post" ? (
                          <FileText className="mt-1 h-5 w-5 text-sky-500" />
                        ) : (
                          <Briefcase className="mt-1 h-5 w-5 text-green-500" />
                        )}
                        <div className="flex-1">
                          <HighlightMatches
                            text={item.title}
                            query={debouncedSearchQuery}
                            className="text-sm font-medium"
                            highlightClassName="bg-yellow-200/50 dark:bg-yellow-500/30"
                          />
                          <HighlightMatches
                            text={item.snippet}
                            query={debouncedSearchQuery}
                            className="mt-1 text-xs text-muted-foreground"
                            highlightClassName="font-semibold text-foreground dark:text-yellow-300"
                            customTagMap={{ b: "strong", "**": "strong" }} // Ensure ** is handled by HighlightMatches
                          />
                          <div className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground/80">
                            <Badge
                              variant={item.type === "post" ? "default" : "secondary"}
                              className="capitalize text-xs px-1.5 py-0.5"
                            >
                              {item.type}
                            </Badge>
                            {item.published_at && (
                              <>
                                <CalendarDays className="h-3 w-3" />
                                <span>{formatResultDate(item.published_at)}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </CommandPrimitive.Item>
                  ))}
                </CommandPrimitive.Group>
              )}
            </CommandPrimitive.List>
          </CommandPrimitive>
        </DialogContent>
      </Dialog>
    </>
  )
}
