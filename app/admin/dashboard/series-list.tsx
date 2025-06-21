"use client"

import React from "react"

import { useEffect, useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { MoreVertical, Plus } from "lucide-react"
import { adminGetAllSeriesDb, createSeriesDb, deleteSeriesDb } from "./actions"
import { toast } from "@/components/ui/use-toast"
import type { DbSeries } from "@/lib/types"

interface SeriesListProps {
  onEditSeries: (series: DbSeries) => void
  // onCreateNewSeries is now handled internally
}

export default function SeriesList({ onEditSeries }: SeriesListProps) {
  const [series, setSeries] = useState<DbSeries[]>([])
  const [loading, setLoading] = useState(true)
  const [toDelete, setToDelete] = useState<DbSeries | null>(null)
  const [isPending, startTransition] = useTransition()

  const fetchSeries = React.useCallback(() => {
    setLoading(true)
    adminGetAllSeriesDb()
      .then((res) => {
        if (res.success && res.seriesList) {
          setSeries(res.seriesList)
        } else {
          toast({ title: "Failed to load series", variant: "destructive" })
        }
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetchSeries()
  }, [fetchSeries])

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const result = await deleteSeriesDb(id)
      if (result.success) {
        toast({ title: "Series deleted." })
        fetchSeries() // Refetch the list
      } else {
        toast({ title: "Error deleting series", description: result.message, variant: "destructive" })
      }
      setToDelete(null)
    })
  }

  const handleCreateNew = () => {
    startTransition(async () => {
      const newSlug = `new-series-${Date.now()}`
      const result = await createSeriesDb({
        title: "Untitled Series",
        slug: newSlug,
        status: "draft",
      })
      if (result.success && result.seriesSingle) {
        toast({ title: "Draft series created." })
        onEditSeries(result.seriesSingle) // Open the editor for the new draft
      } else {
        toast({ title: "Error creating draft", description: result.message, variant: "destructive" })
      }
    })
  }

  if (loading) {
    return <p className="py-8 text-center text-muted-foreground">Loading series…</p>
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button onClick={handleCreateNew} disabled={isPending}>
          <Plus className="mr-2 h-4 w-4" />
          New Series
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Updated</TableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {series.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">{item.title}</TableCell>
              <TableCell>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                    item.status === "published" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {item.status}
                </span>
              </TableCell>
              <TableCell>{new Date(item.updated_at ?? item.created_at).toLocaleDateString()}</TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEditSeries(item)}>Edit</DropdownMenuItem>
                    <DropdownMenuItem className="text-red-500" onClick={() => setToDelete(item)}>
                      Delete
                    </DropdownMenuItem>
                    {item.status === "published" && (
                      <DropdownMenuItem asChild>
                        <a href={`/series/${item.slug}`} target="_blank" rel="noopener noreferrer">
                          View live
                        </a>
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <AlertDialog open={!!toDelete} onOpenChange={() => setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{toDelete?.title}”?</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => toDelete && handleDelete(toDelete.id)} disabled={isPending}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
