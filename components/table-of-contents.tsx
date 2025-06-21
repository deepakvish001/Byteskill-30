"use client"

import type React from "react"

import { useEffect, useState, useRef } from "react"
import { cn } from "@/lib/utils"
import type { TocEntry } from "@/lib/types" // Assuming TocEntry type exists
import type { JSX } from "react/jsx-runtime" // Import JSX to fix the undeclared variable error

interface TableOfContentsProps {
  toc: TocEntry[]
  className?: string
  containerSelector?: string // Optional selector for the scrollable container, defaults to window
  title?: string
  iconComponents?: Record<string, React.ComponentType>
  scrollOffset?: number
}

export function TableOfContents({
  toc,
  className,
  containerSelector,
  title = "On this page",
  iconComponents = {},
  scrollOffset = 0,
}: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const tocItemRefs = useRef<Map<string, HTMLElement | null>>(new Map())

  useEffect(() => {
    setIsMounted(true)
    return () => {
      // Disconnect observer on unmount
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [])

  useEffect(() => {
    if (!isMounted || !toc || toc.length === 0 || typeof window === "undefined") {
      return
    }

    // Clear previous refs and disconnect old observer
    tocItemRefs.current.clear()
    if (observerRef.current) {
      observerRef.current.disconnect()
    }

    const headingElements: Element[] = []
    const populateRefsAndElements = (items: TocEntry[]) => {
      items.forEach((item) => {
        const element = document.getElementById(item.slug)
        if (element) {
          tocItemRefs.current.set(item.slug, element as HTMLElement)
          headingElements.push(element)
        }
        if (item.children) {
          populateRefsAndElements(item.children)
        }
      })
    }
    populateRefsAndElements(toc)

    const callback: IntersectionObserverCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
          // Prioritize elements that are more visible or higher up
          setActiveId(entry.target.id)
        }
      })

      // Fallback if no element is actively intersecting enough, find the topmost visible
      let topmostVisibleId: string | null = null
      let minTop = Number.POSITIVE_INFINITY

      for (const entry of entries) {
        const rect = entry.boundingClientRect
        // Check if element is in viewport or just above it
        if (rect.bottom > 0 && rect.top < window.innerHeight) {
          if (rect.top < minTop) {
            minTop = rect.top
            topmostVisibleId = entry.target.id
          }
        }
      }
      if (topmostVisibleId && activeId !== topmostVisibleId) {
        // Check if current activeId is still reasonably visible, prefer it if so
        const currentActiveElement = activeId ? document.getElementById(activeId) : null
        if (currentActiveElement) {
          const currentRect = currentActiveElement.getBoundingClientRect()
          if (currentRect.bottom < 0 || currentRect.top > window.innerHeight * 0.5) {
            // If current active is scrolled far off
            setActiveId(topmostVisibleId)
          }
        } else {
          setActiveId(topmostVisibleId)
        }
      } else if (!activeId && entries.length > 0 && headingElements.length > 0) {
        // If nothing is active, set the first heading as active by default
        // This helps when the page loads and no specific section is scrolled to.
        const firstHeadingId = headingElements[0]?.id
        if (firstHeadingId) setActiveId(firstHeadingId)
      }
    }

    observerRef.current = new IntersectionObserver(callback, {
      rootMargin: "0px 0px -60% 0px", // Adjust rootMargin to detect elements higher in the viewport
      threshold: [0.5, 1.0], // Trigger when 50% or 100% of the element is visible
    })

    headingElements.forEach((el) => observerRef.current?.observe(el))

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [isMounted, toc, activeId])

  if (!isMounted || !toc || toc.length === 0) {
    return null
  }

  const renderTocItems = (items: TocEntry[], level = 0): JSX.Element[] => {
    return items.map((item) => (
      <li key={item.slug} className={cn("mt-1", level > 0 && "ml-4")}>
        <a
          href={`#${item.slug}`}
          className={cn(
            "block text-sm transition-colors duration-150 ease-in-out",
            activeId === item.slug ? "text-primary font-semibold" : "text-muted-foreground hover:text-foreground",
          )}
          onClick={(e) => {
            e.preventDefault()
            const element = document.getElementById(item.slug)
            if (element) {
              element.scrollIntoView({ behavior: "smooth", block: "start" })
              // Update URL hash without page jump for better UX
              if (typeof window !== "undefined") {
                window.history.pushState(null, "", `#${item.slug}`)
              }
              setActiveId(item.slug) // Immediately set active for responsiveness
            }
          }}
        >
          {item.title}
        </a>
        {item.children && item.children.length > 0 && (
          <ul className="mt-1">{renderTocItems(item.children, level + 1)}</ul>
        )}
      </li>
    ))
  }

  return (
    <nav
      aria-label="Table of contents"
      className={cn("sticky top-24 max-h-[calc(100vh-6rem)] overflow-y-auto pr-4 text-sm", className)}
    >
      <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">{title}</h3>
      <ul>{renderTocItems(toc)}</ul>
    </nav>
  )
}
