import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

export interface BreadcrumbItem {
  label: string
  href: string
  isCurrentPage?: boolean
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[]
  className?: string
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  if (!items || items.length === 0) {
    return null
  }

  return (
    <nav aria-label="Breadcrumb" className={cn("mb-6 text-sm text-neutral-600 dark:text-neutral-400", className)}>
      <ol className="flex flex-wrap items-center space-x-1 sm:space-x-1.5">
        {items.map((item, index) => (
          <li key={item.href || item.label} className="flex items-center">
            {index > 0 && <ChevronRight className="w-4 h-4 mx-1 sm:mx-1.5 text-neutral-400 dark:text-neutral-500" />}
            {item.isCurrentPage ? (
              <span className="font-medium text-neutral-700 dark:text-neutral-200" aria-current="page">
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href}
                className="hover:text-green-600 dark:hover:text-green-400 hover:underline transition-colors"
              >
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
