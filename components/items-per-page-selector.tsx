"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const limitOptions = ["6", "12", "18", "24"]
const LOCAL_STORAGE_KEY = "byteskill-items-per-page"
const DEFAULT_LIMIT_STRING = "6"

/**
 * A dropdown component that allows users to select the number of items displayed per page.
 * The selected limit is persisted in localStorage and reflected in URL query parameters.
 *
 * @returns {JSX.Element} A select dropdown for choosing items per page.
 */
export function ItemsPerPageSelector() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [selectedLimit, setSelectedLimit] = useState(() => {
    const urlLimit = searchParams.get("limit")
    if (urlLimit && limitOptions.includes(urlLimit)) {
      return urlLimit
    }
    if (typeof window !== "undefined") {
      const storedLimit = localStorage.getItem(LOCAL_STORAGE_KEY)
      if (storedLimit && limitOptions.includes(storedLimit)) {
        return storedLimit
      }
    }
    return DEFAULT_LIMIT_STRING
  })

  useEffect(() => {
    const urlLimit = searchParams.get("limit")
    if (selectedLimit !== urlLimit) {
      const params = new URLSearchParams(searchParams.toString())
      params.set("limit", selectedLimit)
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    }
  }, [selectedLimit, pathname, router, searchParams])

  const handleValueChange = (newLimit: string) => {
    setSelectedLimit(newLimit)
    if (typeof window !== "undefined") {
      localStorage.setItem(LOCAL_STORAGE_KEY, newLimit)
    }
    const params = new URLSearchParams(searchParams.toString())
    params.set("limit", newLimit)
    params.delete("page") // Reset to page 1 when limit changes
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex items-center space-x-2 text-sm">
      <label htmlFor="items-per-page" className="text-neutral-400 shrink-0">
        Show:
      </label>
      <Select value={selectedLimit} onValueChange={handleValueChange}>
        <SelectTrigger id="items-per-page" className="w-[75px] bg-neutral-800 border-neutral-700 h-8">
          <SelectValue placeholder={selectedLimit} />
        </SelectTrigger>
        <SelectContent className="bg-neutral-800 border-neutral-700 text-neutral-300">
          {limitOptions.map((option) => (
            <SelectItem
              key={option}
              value={option}
              className="hover:!bg-neutral-700 hover:!text-green-400 focus:!bg-neutral-700 focus:!text-green-400"
            >
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
