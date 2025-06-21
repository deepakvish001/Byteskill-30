"use client"

import type React from "react"
import { useEffect, useState, useRef, useCallback } from "react"
import { cn } from "@/lib/utils"
import { ChevronDown, ChevronRight } from "lucide-react"

export interface HeadingData {
  id: string
  title: string
  level: number
  node: HTMLHeadingElement | null
  icon?: string
}

interface TableOfContentsProps {
  headings: HeadingData[]
  iconComponents?: { [key: string]: React.ElementType }
  scrollOffset?: number
  title?: string
  initiallyOpen?: boolean
}

export function TableOfContents({
  headings,
  iconComponents = {},
  scrollOffset = 90,
  title = "Table of Contents",
  initiallyOpen = true,
}: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(initiallyOpen)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const tocListRef = useRef<HTMLUListElement>(null)
  const isMountedRef = useRef(false)
  const initialHashScrollAttemptedRef = useRef(false)

  const linkFocusClasses =
    "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-green-400 focus-visible:ring-offset-1 focus-visible:ring-offset-background rounded-sm"

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  useEffect(() => {
    setIsOpen(initiallyOpen)
  }, [initiallyOpen])

  useEffect(() => {
    const domHeadings = headings.filter((h) => {
      if (h.node) return true
      if (typeof document !== "undefined") {
        return !!document.getElementById(h.id)
      }
      return false
    })

    if (domHeadings.length === 0) {
      if (observerRef.current) observerRef.current.disconnect()
      setActiveId(null)
      return
    }

    if (observerRef.current) observerRef.current.disconnect()

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (!isMountedRef.current) return

        let newActiveId: string | null = null
        const visibleEntries = entries.filter((entry) => entry.isIntersecting)

        if (visibleEntries.length > 0) {
          const idealEntry = visibleEntries.find(
            (entry) =>
              entry.boundingClientRect.top >= scrollOffset - 10 && entry.boundingClientRect.top <= scrollOffset + 50,
          )
          newActiveId = idealEntry
            ? idealEntry.target.id
            : visibleEntries.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0].target.id
        } else {
          const entriesAboveViewport = entries
            .filter((entry) => entry.boundingClientRect.top < scrollOffset)
            .sort((a, b) => b.boundingClientRect.top - a.boundingClientRect.top)

          if (entriesAboveViewport.length > 0) {
            newActiveId = entriesAboveViewport[0].target.id
          } else {
            if (window.scrollY < (document.getElementById(domHeadings[0].id)?.offsetTop || 0) - scrollOffset) {
              newActiveId = domHeadings[0].id
            } else if (
              window.scrollY + window.innerHeight >= document.body.scrollHeight - 50 &&
              domHeadings.length > 0
            ) {
              newActiveId = domHeadings[domHeadings.length - 1].id
            }
          }
        }
        if (newActiveId) setActiveId(newActiveId)
      },
      {
        rootMargin: `-${scrollOffset}px 0px -${Math.max(0, window.innerHeight - scrollOffset - 200)}px 0px`,
        threshold: [0, 0.1, 0.25, 0.5, 0.75, 0.9, 1.0],
      },
    )

    const currentObserver = observerRef.current
    domHeadings.forEach((heading) => {
      const element = heading.node || document.getElementById(heading.id)
      if (element) currentObserver.observe(element)
    })

    if (!initialHashScrollAttemptedRef.current && domHeadings.length > 0) {
      const initialScrollY = window.scrollY
      let initialActiveIdFound = false
      for (const heading of domHeadings) {
        const element = heading.node || document.getElementById(heading.id)
        if (element && element.offsetTop - scrollOffset >= initialScrollY) {
          setActiveId(heading.id)
          initialActiveIdFound = true
          break
        }
      }
      if (!initialActiveIdFound) {
        setActiveId(domHeadings[domHeadings.length - 1].id)
      }
    }

    return () => {
      if (currentObserver) currentObserver.disconnect()
    }
  }, [headings, scrollOffset])

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      initialHashScrollAttemptedRef.current ||
      scrollOffset === 0 ||
      headings.length === 0
    ) {
      return
    }

    const hash = window.location.hash.substring(1)
    if (hash && headings.find((h) => h.id === hash)) {
      const element = document.getElementById(hash)
      if (element) {
        const attemptScroll = () => {
          const elementPosition = element.getBoundingClientRect().top + window.pageYOffset
          const targetScrollPosition = elementPosition - scrollOffset
          window.scrollTo({ top: targetScrollPosition, behavior: "auto" })
          setActiveId(hash)
          initialHashScrollAttemptedRef.current = true
        }
        const timeoutId = setTimeout(attemptScroll, 150)
        return () => clearTimeout(timeoutId)
      } else {
        initialHashScrollAttemptedRef.current = true
      }
    } else {
      initialHashScrollAttemptedRef.current = true
    }
  }, [headings, scrollOffset, typeof window !== "undefined" ? window.location.hash : ""])

  useEffect(() => {
    if (activeId && headings.length > 0 && isMountedRef.current && initialHashScrollAttemptedRef.current) {
      const newUrl = `${window.location.pathname}#${activeId}`
      if (window.location.hash !== `#${activeId}`) {
        window.history.replaceState(null, "", newUrl)
      }
    }
  }, [activeId, headings])

  useEffect(() => {
    if (activeId && tocListRef.current && isOpen && headings.length > 0) {
      const activeLink = tocListRef.current.querySelector(`a[href="#${activeId}"]`) as HTMLElement
      if (activeLink) {
        activeLink.scrollIntoView({ behavior: "smooth", block: "nearest" })
      }
    }
  }, [activeId, isOpen, headings])

  const handleScrollToHeading = useCallback(
    (id: string, e: React.MouseEvent) => {
      e.preventDefault()
      const element = document.getElementById(id)
      if (element) {
        const elementPosition = element.getBoundingClientRect().top + window.pageYOffset
        const offsetPosition = elementPosition - scrollOffset
        window.scrollTo({ top: offsetPosition, behavior: "smooth" })
        const newUrl = `${window.location.pathname}#${id}`
        if (window.location.hash !== `#${id}`) {
          window.history.pushState(null, "", newUrl)
        }
        setActiveId(id)
      }
    },
    [scrollOffset],
  )

  return (
    <div className="text-neutral-300">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center w-full text-left py-2 mb-2 group",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-md",
        )}
        aria-expanded={isOpen}
        aria-controls="toc-content-area"
      >
        {isOpen ? (
          <ChevronDown className="w-5 h-5 mr-2 text-neutral-400 group-hover:text-neutral-200" />
        ) : (
          <ChevronRight className="w-5 h-5 mr-2 text-neutral-400 group-hover:text-neutral-200" />
        )}
        <span className="font-semibold text-neutral-200 group-hover:text-neutral-100">{title}</span>
      </button>
      {isOpen && (
        <div id="toc-content-area">
          {headings.length === 0 ? (
            <p className="text-neutral-500 text-sm px-2.5 py-4">No table of contents for this page.</p>
          ) : (
            <ul id="toc-list" ref={tocListRef} className="space-y-1.5 list-none p-0">
              {headings.map((heading) => {
                const IconComponent = heading.icon ? iconComponents[heading.icon] : null
                return (
                  <li key={heading.id} className={cn("relative", heading.level === 3 && "pl-6")}>
                    <span
                      className={cn(
                        "absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full",
                        activeId === heading.id ? "bg-green-400" : "bg-neutral-500",
                        heading.level === 3 && "left-[18px]",
                      )}
                      aria-hidden="true"
                    />
                    <a
                      href={`#${heading.id}`}
                      onClick={(e) => handleScrollToHeading(heading.id, e)}
                      className={cn(
                        "block py-1 transition-colors duration-150 ease-in-out group ml-4",
                        activeId === heading.id
                          ? "text-green-400 font-medium"
                          : "text-neutral-400 hover:text-neutral-100",
                        linkFocusClasses, // Apply focus classes to TOC links
                      )}
                    >
                      <span className="underline decoration-transparent group-hover:decoration-inherit transition-colors">
                        {heading.title}
                      </span>
                      {IconComponent && (
                        <IconComponent
                          className={cn(
                            "w-3.5 h-3.5 ml-1.5 inline-block relative -top-px",
                            activeId === heading.id
                              ? "text-green-400"
                              : "text-neutral-500 group-hover:text-neutral-300",
                          )}
                        />
                      )}
                    </a>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
