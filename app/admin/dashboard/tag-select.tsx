"use client"

import React from "react"
import { Label } from "@/components/ui/label"
import { Check, ChevronsUpDown, PlusCircle, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import type { DbTag } from "@/lib/types"
import { adminGetAllTagsDb, createTagDb } from "./actions" // Assuming these actions exist
import { toast } from "@/components/ui/use-toast"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface TagSelectProps {
  selectedTagIds: number[]
  onChange: (selectedTagIds: number[]) => void
}

export function TagSelect({ selectedTagIds, onChange }: TagSelectProps) {
  const [allTags, setAllTags] = React.useState<DbTag[]>([])
  const [openPopover, setOpenPopover] = React.useState(false)
  const [openCreateDialog, setOpenCreateDialog] = React.useState(false)
  const [newTagName, setNewTagName] = React.useState("")
  const [newTagSlug, setNewTagSlug] = React.useState("")

  React.useEffect(() => {
    fetchTags()
  }, [])

  const fetchTags = async () => {
    const result = await adminGetAllTagsDb()
    if (result.success && result.tags) {
      setAllTags(result.tags)
    } else {
      toast({ title: "Error fetching tags", description: result.message, variant: "destructive" })
    }
  }

  const handleSelectTag = (tagId: number) => {
    const newSelectedIds = selectedTagIds.includes(tagId)
      ? selectedTagIds.filter((id) => id !== tagId)
      : [...selectedTagIds, tagId]
    onChange(newSelectedIds)
  }

  const handleCreateNewTag = async () => {
    if (!newTagName.trim() || !newTagSlug.trim()) {
      toast({ title: "Error", description: "Tag name and slug cannot be empty.", variant: "destructive" })
      return
    }
    const result = await createTagDb({ name: newTagName, slug: newTagSlug })
    if (result.success && result.tag) {
      toast({ title: "Tag created", description: `Tag "${result.tag.name}" created successfully.` })
      setAllTags((prev) => [...prev, result.tag!])
      onChange([...selectedTagIds, result.tag!.id]) // Auto-select the new tag
      setOpenCreateDialog(false)
      setNewTagName("")
      setNewTagSlug("")
    } else {
      toast({ title: "Error creating tag", description: result.message, variant: "destructive" })
    }
  }

  const selectedTagsObjects = allTags.filter((tag) => selectedTagIds.includes(tag.id))

  return (
    <div className="space-y-2">
      <Label>Tags</Label>
      <Popover open={openPopover} onOpenChange={setOpenPopover}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={openPopover}
            className="w-full justify-between h-auto min-h-[2.5rem]" // Allow button to grow
          >
            <div className="flex flex-wrap gap-1">
              {selectedTagsObjects.length > 0
                ? selectedTagsObjects.map((tag) => (
                    <Badge
                      key={tag.id}
                      variant="secondary"
                      className="mr-1"
                      onClick={(e) => {
                        e.stopPropagation() // Prevent popover from closing
                        handleSelectTag(tag.id)
                      }}
                    >
                      {tag.name}
                      <X className="ml-1 h-3 w-3 cursor-pointer" />
                    </Badge>
                  ))
                : "Select tags..."}
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
          <Command>
            <CommandInput placeholder="Search or create tag..." />
            <CommandList>
              <CommandEmpty>
                No tags found.
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start mt-1"
                  onClick={() => {
                    setOpenPopover(false)
                    setOpenCreateDialog(true)
                  }}
                >
                  <PlusCircle className="mr-2 h-4 w-4" /> Create new tag
                </Button>
              </CommandEmpty>
              <CommandGroup>
                {allTags.map((tag) => (
                  <CommandItem
                    key={tag.id}
                    value={tag.name}
                    onSelect={() => {
                      handleSelectTag(tag.id)
                    }}
                  >
                    <Check
                      className={`mr-2 h-4 w-4 ${selectedTagIds.includes(tag.id) ? "opacity-100" : "opacity-0"}`}
                    />
                    {tag.name}
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup>
                <CommandItem
                  onSelect={() => {
                    setOpenPopover(false)
                    setOpenCreateDialog(true)
                  }}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create new tag
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <Dialog open={openCreateDialog} onOpenChange={setOpenCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Tag</DialogTitle>
            <DialogDescription>Enter the name and slug for the new tag.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="new-tag-name">Tag Name</Label>
              <Input
                id="new-tag-name"
                value={newTagName}
                onChange={(e) => {
                  setNewTagName(e.target.value)
                  // Auto-generate slug
                  setNewTagSlug(
                    e.target.value
                      .toLowerCase()
                      .trim()
                      .replace(/\s+/g, "-")
                      .replace(/[^\w-]+/g, ""),
                  )
                }}
                placeholder="e.g., Web Development"
              />
            </div>
            <div>
              <Label htmlFor="new-tag-slug">Tag Slug</Label>
              <Input
                id="new-tag-slug"
                value={newTagSlug}
                onChange={(e) => setNewTagSlug(e.target.value)}
                placeholder="e.g., web-development"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateNewTag}>Create Tag</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
