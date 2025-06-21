"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import { getPostsForSeries, getAvailablePostsForSeries, updateSeriesPosts } from "./actions"
import type { DbPost, DbSeries } from "@/lib/types"
import { Plus, Trash2, ArrowUp, ArrowDown, GripVertical, Search } from "lucide-react"
import { useDebounce } from "@/hooks/use-debounce"

interface SeriesPostManagerProps {
  series: DbSeries
  onSeriesUpdated: () => void // Callback to refresh series list or data
}

export default function SeriesPostManager({ series, onSeriesUpdated }: SeriesPostManagerProps) {
  const [isPending, startTransition] = React.useTransition()
  const [managedPosts, setManagedPosts] = React.useState<DbPost[]>([])
  const [availablePosts, setAvailablePosts] = React.useState<DbPost[]>([])
  const [searchTerm, setSearchTerm] = React.useState("")
  const debouncedSearchTerm = useDebounce(searchTerm, 300)
  const [isAddPostDialogOpen, setIsAddPostDialogOpen] = React.useState(false)
  const { toast } = useToast()

  React.useEffect(() => {
    async function fetchInitialPosts() {
      startTransition(async () => {
        const { data, error } = await getPostsForSeries(series.id)
        if (error) {
          toast({ title: "Error fetching series posts", description: error.message, variant: "destructive" })
        } else {
          setManagedPosts(data || [])
        }
      })
    }
    fetchInitialPosts()
  }, [series.id, toast])

  React.useEffect(() => {
    async function fetchAvailable() {
      if (!debouncedSearchTerm && !isAddPostDialogOpen) return // Only search if dialog is open or term exists
      startTransition(async () => {
        const { data, error } = await getAvailablePostsForSeries(series.id, debouncedSearchTerm)
        if (error) {
          toast({ title: "Error fetching available posts", description: error.message, variant: "destructive" })
        } else {
          // Filter out posts already in the series
          const currentManagedIds = new Set(managedPosts.map((p) => p.id))
          setAvailablePosts((data || []).filter((p) => !currentManagedIds.has(p.id)))
        }
      })
    }
    if (isAddPostDialogOpen) {
      // Fetch when dialog opens or search term changes
      fetchAvailable()
    }
  }, [series.id, debouncedSearchTerm, toast, isAddPostDialogOpen, managedPosts])

  const handleAddPost = (post: DbPost) => {
    setManagedPosts((prev) => [...prev, { ...post, series_part_number: prev.length + 1 }])
    setAvailablePosts((prev) => prev.filter((p) => p.id !== post.id))
  }

  const handleRemovePost = (postId: string) => {
    setManagedPosts((prev) =>
      prev.filter((p) => p.id !== postId).map((p, index) => ({ ...p, series_part_number: index + 1 })),
    )
    // Optionally, add back to available posts if needed, though search handles this
  }

  const handleMovePost = (index: number, direction: "up" | "down") => {
    const newPosts = [...managedPosts]
    const postToMove = newPosts[index]
    if (direction === "up" && index > 0) {
      newPosts.splice(index, 1)
      newPosts.splice(index - 1, 0, postToMove)
    } else if (direction === "down" && index < newPosts.length - 1) {
      newPosts.splice(index, 1)
      newPosts.splice(index + 1, 0, postToMove)
    }
    setManagedPosts(newPosts.map((p, idx) => ({ ...p, series_part_number: idx + 1 })))
  }

  const handleSaveChanges = async () => {
    startTransition(async () => {
      const postIdsInOrder = managedPosts.map((p) => p.id)
      const { success, message } = await updateSeriesPosts(series.id, postIdsInOrder)
      if (success) {
        toast({ title: "Series posts updated", description: message })
        onSeriesUpdated() // Notify parent component
      } else {
        toast({ title: "Update failed", description: message, variant: "destructive" })
      }
    })
  }

  return (
    <div className="space-y-4">
      <h3 className="text-md font-semibold">Manage Posts in "{series.title}"</h3>
      {managedPosts.length === 0 && <p className="text-sm text-muted-foreground">No posts currently in this series.</p>}

      <div className="space-y-2">
        {managedPosts.map((post, index) => (
          <div key={post.id} className="flex items-center justify-between gap-2 p-2 border rounded-md bg-muted/50">
            <div className="flex items-center gap-2">
              <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" /> {/* Placeholder for D&D */}
              <span className="font-medium">
                {post.series_part_number}. {post.title}
              </span>
              <span className="text-xs text-muted-foreground">({post.slug})</span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleMovePost(index, "up")}
                disabled={index === 0 || isPending}
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleMovePost(index, "down")}
                disabled={index === managedPosts.length - 1 || isPending}
              >
                <ArrowDown className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => handleRemovePost(post.id)} disabled={isPending}>
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center mt-4">
        <Dialog open={isAddPostDialogOpen} onOpenChange={setIsAddPostDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <Plus className="mr-2 h-4 w-4" /> Add Post to Series
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add Post to "{series.title}"</DialogTitle>
            </DialogHeader>
            <div className="relative mt-4">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search available posts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-full"
              />
            </div>
            <ScrollArea className="h-[300px] mt-4">
              {availablePosts.length > 0 ? (
                availablePosts.map((post) => (
                  <div key={post.id} className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-md">
                    <div>
                      <p className="font-medium">{post.title}</p>
                      <p className="text-xs text-muted-foreground">{post.slug}</p>
                    </div>
                    <Button size="sm" onClick={() => handleAddPost(post)} disabled={isPending}>
                      Add
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {debouncedSearchTerm ? "No matching posts found." : "Type to search for posts."}
                </p>
              )}
            </ScrollArea>
          </DialogContent>
        </Dialog>
        <Button onClick={handleSaveChanges} disabled={isPending || managedPosts.length === 0}>
          {isPending ? "Saving..." : "Save Changes to Series Order"}
        </Button>
      </div>
    </div>
  )
}

// Provide a named export so both `import SeriesPostManager` and `import { SeriesPostManager }` work
export { SeriesPostManager }
