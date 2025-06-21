"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const sortOptions = [
  { value: "date-desc", label: "Newest First" },
  { value: "date-asc", label: "Oldest First" },
  { value: "title-asc", label: "Title (A-Z)" },
  { value: "title-desc", label: "Title (Z-A)" },
]

export function SortOrderSelector() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentSort = searchParams.get("sort") || "date-desc"

  const handleSortChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("sort", value)
    // When sort order changes, it's best to reset to the first page
    params.set("page", "1")
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex items-center space-x-2">
      <label htmlFor="sort-order" className="text-sm font-medium text-neutral-400">
        Sort by
      </label>
      <Select onValueChange={handleSortChange} defaultValue={currentSort}>
        <SelectTrigger id="sort-order" className="w-[180px] bg-neutral-800 border-neutral-700">
          <SelectValue placeholder="Select order" />
        </SelectTrigger>
        <SelectContent className="bg-neutral-800 border-neutral-700 text-neutral-200">
          {sortOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
