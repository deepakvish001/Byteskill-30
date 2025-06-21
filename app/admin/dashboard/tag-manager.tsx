"use client"

/**
 * TagManager
 * ----------
 * Lists all tags and lets an admin create, edit, or delete them.
 * This first iteration is intentionally lean so that the build succeeds.
 * You can enhance the UX later (search, inline editing, pagination, etc.).
 */

import * as React from "react"
import { Plus, MoreHorizontal } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

import { adminGetAllTagsDb, createTagDb, updateTagDb, deleteTagDb } from "./actions"
import type { DbTag } from "@/lib/types"

export default function TagManager() {
  const [tags, setTags] = React.useState<DbTag[]>([])
  const [editingTag, setEditingTag] = React.useState<DbTag | null>(null)
  const [open, setOpen] = React.useState(false)
  const { toast } = useToast()

  // Fetch tags on mount
  React.useEffect(() => {
    ;(async () => {
      const { data, error } = await adminGetAllTagsDb()
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" })
      } else {
        setTags(data ?? [])
      }
    })()
  }, [toast])

  async function handleSubmit(formData: FormData) {
    const name = formData.get("name") as string
    const slug = formData.get("slug") as string

    if (!name || !slug) {
      toast({ title: "Both name and slug are required.", variant: "destructive" })
      return
    }

    if (editingTag) {
      const { data, error } = await updateTagDb({ id: editingTag.id, name, slug })
      if (error) {
        toast({ title: "Update failed", description: error.message, variant: "destructive" })
      } else {
        setTags((prev) => prev.map((t) => (t.id === editingTag.id ? (data as DbTag) : t)))
        toast({ title: "Tag updated" })
      }
    } else {
      const { data, error } = await createTagDb({ name, slug })
      if (error) {
        toast({ title: "Create failed", description: error.message, variant: "destructive" })
      } else {
        setTags((prev) => [...prev, data as DbTag])
        toast({ title: "Tag created" })
      }
    }

    setOpen(false)
    setEditingTag(null)
  }

  async function handleDelete(id: string) {
    const { error } = await deleteTagDb(id)
    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" })
    } else {
      setTags((prev) => prev.filter((t) => t.id !== id))
      toast({ title: "Tag deleted" })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Tags</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              New Tag
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingTag ? "Edit Tag" : "Create Tag"}</DialogTitle>
            </DialogHeader>

            {/* Form */}
            <form action={handleSubmit} className="flex flex-col gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" defaultValue={editingTag?.name ?? ""} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="slug">Slug</Label>
                <Input id="slug" name="slug" defaultValue={editingTag?.slug ?? ""} required />
              </div>
              <Button type="submit">{editingTag ? "Save changes" : "Create tag"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tag table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40%]">Name</TableHead>
            <TableHead>Slug</TableHead>
            <TableHead className="w-[140px] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tags.map((tag) => (
            <TableRow key={tag.id}>
              <TableCell className="font-medium">{tag.name}</TableCell>
              <TableCell>{tag.slug}</TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="icon" variant="ghost" className="h-8 w-8" aria-label="Open menu">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onSelect={(e) => {
                        e.preventDefault()
                        setEditingTag(tag)
                        setOpen(true)
                      }}
                    >
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-red-600 focus:text-red-600"
                      onSelect={(e) => {
                        e.preventDefault()
                        handleDelete(tag.id)
                      }}
                    >
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
