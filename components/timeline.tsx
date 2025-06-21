"use client"

import { type ReactElement, useState, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"

export interface Milestone {
  year: string
  title: string
  description: string
  icon: ReactElement
}

interface MilestoneItemProps {
  milestone: Milestone
  index: number
}

function MilestoneItem({ milestone, index }: MilestoneItemProps) {
  const [isVisible, setIsVisible] = useState(false)
  const itemRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.unobserve(entry.target) // Observe only once
        }
      },
      {
        root: null,
        rootMargin: "0px",
        threshold: 0.15, // Trigger when 15% of the item is visible
      },
    )

    if (itemRef.current) {
      observer.observe(itemRef.current)
    }

    return () => {
      if (itemRef.current) {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        observer.unobserve(itemRef.current)
      }
    }
  }, [])

  const isEven = index % 2 === 0
  const delay = `${index * 150}ms` // Staggered delay for this item

  // Animation classes for the content card
  const contentAnimationClasses = isVisible
    ? "opacity-100 md:translate-x-0" // Visible state: fully opaque, no translation
    : cn(
        "opacity-0", // Initial state: transparent
        // On desktop, slide from left/right. On mobile, just fade (no translate-x).
        isEven ? "md:-translate-x-8" : "md:translate-x-8",
      )

  // Animation classes for the icon
  const iconAnimationClasses = isVisible
    ? "opacity-100 scale-100" // Visible state
    : "opacity-0 scale-75" // Initial state

  return (
    <div
      ref={itemRef}
      className={cn(
        "relative mb-8 flex w-full items-center justify-between md:mb-12",
        isEven ? "md:flex-row-reverse" : "md:flex-row",
      )}
    >
      {/* Icon Gutter & Dot */}
      <div
        className={cn(
          "absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 transform md:relative md:left-auto md:top-auto md:translate-x-0 md:translate-y-0",
          "transition-all duration-500 ease-out", // Icon's own transition properties
          iconAnimationClasses,
        )}
        style={{ transitionDelay: isVisible ? delay : "0ms" }}
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/20 text-green-400 ring-8 ring-neutral-900 md:h-12 md:w-12">
          {milestone.icon}
        </div>
      </div>

      {/* Milestone Content */}
      <div
        className={cn(
          "w-full rounded-lg border border-neutral-700/70 bg-neutral-800/50 p-6 shadow-md md:w-[calc(50%-2.5rem)]",
          "transition-all duration-500 ease-out", // Content card's own transition properties
          contentAnimationClasses,
          isEven ? "md:text-right" : "md:text-left",
        )}
        style={{ transitionDelay: isVisible ? delay : "0ms" }}
      >
        <p className="mb-1 text-sm font-semibold tracking-wider text-green-400 uppercase">{milestone.year}</p>
        <h3 className="mb-2 text-xl font-semibold text-neutral-100">{milestone.title}</h3>
        <p className="text-sm leading-relaxed text-neutral-400">{milestone.description}</p>
      </div>
    </div>
  )
}

interface TimelineProps {
  milestones: Milestone[]
}

export function Timeline({ milestones }: TimelineProps) {
  if (!milestones || milestones.length === 0) {
    return null
  }

  return (
    <div className="relative py-4">
      {" "}
      {/* Added py-4 for a bit of breathing room for animations */}
      {/* The main vertical timeline bar */}
      <div
        className="absolute left-1/2 top-0 h-full w-0.5 -translate-x-1/2 bg-neutral-700 hidden md:block"
        aria-hidden="true"
      ></div>
      {milestones.map((milestone, index) => (
        <MilestoneItem key={index} milestone={milestone} index={index} />
      ))}
    </div>
  )
}
