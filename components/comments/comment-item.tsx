"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Edit3, Trash2, Flag, CornerDownLeft, Loader2 } from "lucide-react"
import { useUser } from "@/app/contexts/UserContext"
import type { CommentWithProfile } from "@/lib/types"
import { formatDate, timeAgo } from "@/lib/utils"
import { deleteCommentAction, updateCommentAction } from "@/app/blog/comments/actions"
import { useToast } from "@/hooks/use-toast"
import { ReportCommentDialog } from "./report-comment-dialog" // Import the new dialog

interface CommentItemProps {
  comment: CommentWithProfile
  onReply: (comment: CommentWithProfile) => void
  onCommentUpdated: (updatedComment: CommentWithProfile) => void
  onCommentDeleted: (commentId: string, parentId?: string | null) => void
  currentUserId?: string | null
  level?: number
}

export function CommentItem({
  comment,
  onReply,
  onCommentUpdated,
  onCommentDeleted,
  currentUserId,
  level = 0,
}: CommentItemProps) {
  const { user: contextUser } = useUser()
  const actualCurrentUserId = currentUserId || contextUser?.id
  const [isEditing, setIsEditing] = useState(false)
  const [editedContent, setEditedContent] = useState(comment.content)
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()

  const canEdit = actualCurrentUserId === comment.user_id
  const canDelete = actualCurrentUserId === comment.user_id // Or admin/moderator
  const canReport = actualCurrentUserId && actualCurrentUserId !== comment.user_id

  const handleUpdateComment = async () => {
    if (editedContent.trim() === comment.content.trim() || editedContent.trim().length < 1) {
      setIsEditing(false)
      setEditedContent(comment.content) // Reset if no change or empty
      return
    }
    startTransition(async () => {
      const result = await updateCommentAction(comment.id, editedContent)
      if (result.success && result.comment) {
        onCommentUpdated(result.comment as CommentWithProfile)
        setIsEditing(false)
        toast({ title: "Comment updated." })
      } else {
        toast({ title: "Error", description: result.error || "Failed to update comment.", variant: "destructive" })
      }
    })
  }

  const handleDeleteComment = async () => {
    if (!window.confirm("Are you sure you want to delete this comment? This action cannot be undone.")) {
      return
    }
    startTransition(async () => {
      const result = await deleteCommentAction(comment.id)
      if (result.success) {
        onCommentDeleted(comment.id, comment.parent_id)
        toast({ title: "Comment deleted." })
      } else {
        toast({ title: "Error", description: result.error || "Failed to delete comment.", variant: "destructive" })
      }
    })
  }

  return (
    <div
      className={`flex space-x-3 py-3 ${level > 0 ? `ml-${level * 4} pl-3 border-l border-neutral-700/50` : ""}`}
      id={`comment-${comment.id}`}
    >
      <Link href={`/u/${comment.profiles.username}`} className="flex-shrink-0">
        <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
          <AvatarImage
            src={comment.profiles.avatar_url || undefined}
            alt={comment.profiles.full_name || comment.profiles.username}
          />
          <AvatarFallback className="text-xs sm:text-sm bg-neutral-700">
            {comment.profiles.full_name
              ? comment.profiles.full_name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
              : comment.profiles.username[0].toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </Link>
      <div className="flex-1 space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href={`/u/${comment.profiles.username}`} className="hover:underline">
              <h4 className="text-sm font-semibold text-neutral-100">
                {comment.profiles.full_name || comment.profiles.username}
              </h4>
            </Link>
            <span className="text-xs text-neutral-500" title={formatDate(comment.created_at)}>
              {timeAgo(comment.created_at)}
            </span>
            {comment.updated_at &&
              new Date(comment.updated_at).getTime() !== new Date(comment.created_at).getTime() && (
                <span className="text-xs text-neutral-500 italic" title={`Edited: ${formatDate(comment.updated_at)}`}>
                  (edited)
                </span>
              )}
          </div>
          {(canEdit || canDelete || canReport) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-neutral-400 hover:text-neutral-100">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Comment options</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-neutral-800 border-neutral-700 text-neutral-200">
                {canEdit && (
                  <DropdownMenuItem
                    onClick={() => {
                      setIsEditing(true)
                      setEditedContent(comment.content)
                    }}
                    className="hover:bg-neutral-700 focus:bg-neutral-700"
                  >
                    <Edit3 className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                )}
                {canDelete && (
                  <DropdownMenuItem
                    onClick={handleDeleteComment}
                    disabled={isPending}
                    className="text-red-500 hover:bg-red-500/10 focus:bg-red-500/10 hover:text-red-400 focus:text-red-400"
                  >
                    {isPending && comment.id === comment.id /* check if this specific delete is pending */ ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="mr-2 h-4 w-4" />
                    )}
                    Delete
                  </DropdownMenuItem>
                )}
                {canReport && (
                  <ReportCommentDialog comment={comment}>
                    <DropdownMenuItem
                      onSelect={(e) => e.preventDefault()} // Prevent DropdownMenu from closing
                      className="hover:bg-neutral-700 focus:bg-neutral-700"
                    >
                      <Flag className="mr-2 h-4 w-4" />
                      Report
                    </DropdownMenuItem>
                  </ReportCommentDialog>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-2">
            <Textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              rows={3}
              className="w-full bg-neutral-700 border-neutral-600 text-neutral-100 focus:border-sky-500"
              disabled={isPending}
            />
            <div className="flex items-center justify-end space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsEditing(false)
                  setEditedContent(comment.content)
                }}
                disabled={isPending}
                className="text-neutral-400 hover:text-neutral-100"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateComment}
                size="sm"
                disabled={isPending}
                className="bg-sky-600 hover:bg-sky-700"
              >
                {isPending ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : null}
                Save
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-neutral-300 whitespace-pre-wrap">{comment.content}</p>
        )}

        {!isEditing && actualCurrentUserId && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onReply(comment)}
            className="text-xs text-neutral-400 hover:text-sky-400 hover:bg-transparent px-1 py-0.5"
          >
            <CornerDownLeft className="mr-1 h-3 w-3" />
            Reply
          </Button>
        )}
      </div>
    </div>
  )
}
