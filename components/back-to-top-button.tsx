"use client"

import { ArrowUp } from "lucide-react"
import { Button } from "@/components/ui/button"

export function BackToTopButton() {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="text-neutral-400 hover:text-green-400"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
    >
      <ArrowUp className="w-4 h-4 mr-2" />
      Back to top
    </Button>
  )
}
