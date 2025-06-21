"use client"

import * as React from "react"
import { adminGetAllComments, adminApproveComment, adminUnapproveComment, adminToggleCommentDeletion } from "./actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Loader2, Check, X, Trash2, RotateCcw } from "lucide-react"
import type { CommentWithAuthor } from "@/lib/types"

export default function CommentManagement() {
  const [comments, setComments] = React.useState<CommentWithAuthor[] | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [actionInProgress, setActionInProgress] = React.useState<string | null>(null)

  React.useEffect(() => {
    async function load() {
      const res = await adminGetAllComments({})
      if (res.success) setComments(res.comments ?? [])
      else console.error(res.message)
      setLoading(false)
    }
    load()
  }, [])

  async function handleApprove(id: string, approve: boolean) {
    setActionInProgress(id)
    if (approve) {
      await adminApproveComment(id)
    } else {
      await adminUnapproveComment(id)
    }
    refresh()
  }

  async function handleDelete(id: string, softDelete: boolean) {
    setActionInProgress(id)
    await adminToggleCommentDeletion(id, softDelete)
    refresh()
  }

  async function refresh() {
    const res = await adminGetAllComments({})
    if (res.success) setComments(res.comments ?? [])
    else console.error(res.message)
    setActionInProgress(null)
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-8">
        <Loader2 className="size-4 animate-spin" />
        <span className="text-sm text-muted-foreground">Loading comments…</span>
      </div>
    )
  }

  if (!comments?.length) {
    return <p className="py-8 text-sm text-muted-foreground">No comments found.</p>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Comments</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Author</TableHead>
              <TableHead className="min-w-[200px]">Excerpt</TableHead>
              <TableHead className="whitespace-nowrap">Post</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {comments.map((c) => (
              <TableRow key={c.id}>
                <TableCell>{c.author?.username ?? "Anon"}</TableCell>
                <TableCell>{c.content.length > 80 ? c.content.slice(0, 77) + "…" : c.content}</TableCell>
                <TableCell>
                  <a
                    href={`/blog/${c.post_slug}#comment-${c.id}`}
                    className="underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {c.post_title}
                  </a>
                </TableCell>
                <TableCell>
                  {c.is_deleted ? (
                    <Badge variant="destructive">Deleted</Badge>
                  ) : c.is_approved ? (
                    <Badge variant="default">Approved</Badge>
                  ) : (
                    <Badge variant="secondary">Unapproved</Badge>
                  )}
                </TableCell>
                <TableCell className="flex justify-end gap-2">
                  {/* Approve / unapprove */}
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => handleApprove(c.id, !c.is_approved)}
                    disabled={actionInProgress === c.id}
                    title={c.is_approved ? "Unapprove" : "Approve"}
                  >
                    {c.is_approved ? <X className="size-4" /> : <Check className="size-4" />}
                  </Button>

                  {/* Soft delete / restore */}
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => handleDelete(c.id, !c.is_deleted)}
                    disabled={actionInProgress === c.id}
                    title={c.is_deleted ? "Restore" : "Delete"}
                  >
                    {c.is_deleted ? <RotateCcw className="size-4" /> : <Trash2 className="size-4" />}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
