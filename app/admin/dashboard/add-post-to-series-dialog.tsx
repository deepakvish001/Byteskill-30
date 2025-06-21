"use client"

import * as React from "react"
import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { getAvailablePostsForSeries } from "./actions"
import { useDebounce } from "@/hooks/use-debounce"
import type { DbPost } from "@/lib/types"
import { cn } from "@/lib/utils"

interface AddPostToSeriesDialogProps {
  isOpen: boolean
  onClose: () => void
  onAddPosts: (posts: DbPost[]) => void
  seriesId: string
}

export function AddPostToSeriesDialog({ isOpen, onClose, onAddPosts, seriesId }: AddPostToSeriesDialogProps) {
  const [searchTerm, setSearchTerm] = React.useState("")
  const debouncedSearchTerm = useDebounce(searchTerm, 300)
  const [availablePosts, setAvailablePosts] = React.useState<DbPost[]>([])
  const [selectedPosts, setSelectedPosts] = React.useState<DbPost[]>([])

  React.useEffect(() => {
    if (isOpen) {
      getAvailablePostsForSeries(seriesId, debouncedSearchTerm).then((result) => {
        if (result.success && result.posts) {
          setAvailablePosts(result.posts)
        }
      })
    }
  }, [isOpen, seriesId, debouncedSearchTerm])

  const handleSelectPost = (post: DbPost) => {
    setSelectedPosts((current) => {
      const isSelected = current.some((p) => p.id === post.id)
      if (isSelected) {
        return current.filter((p) => p.id !== post.id)
      } else {
        return [...current, post]
      }
    })
  }

  const handleConfirm = () => {
    onAddPosts(selectedPosts)
    onClose()
    setSelectedPosts([])
    setSearchTerm("")
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Add Posts to Series</DialogTitle>
        </DialogHeader>
        <Command>
          <CommandInput placeholder="Search for posts..." value={searchTerm} onValueChange={setSearchTerm} />
          <CommandList>
            <CommandEmpty>No posts found.</CommandEmpty>
            <CommandGroup>
              {availablePosts.map((post) => {
                const isSelected = selectedPosts.some((p) => p.id === post.id)
                return (
                  <CommandItem key={post.id} onSelect={() => handleSelectPost(post)}>
                    <Check className={cn("mr-2 h-4 w-4", isSelected ? "opacity-100" : "opacity-0")} />
                    {post.title}
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>Add Selected Posts</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
