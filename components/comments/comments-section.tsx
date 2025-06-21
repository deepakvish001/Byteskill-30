"use client" // This component will manage state and client-side fetching/interactions

import { useEffect, useState, useTransition, useCallback } from "react"
import type { User } from "@supabase/supabase-js"
import type { CommentWithAuthor } from "@/lib/types"
import { getCommentsByPostIdAction } from "@/app/blog/comments/actions"
import { CommentForm } from "./comment-form"
import { CommentList } from "./comment-list"
import { Skeleton } from "@/components/ui/skeleton" // Assuming you have a Skeleton component

interface CommentsSectionProps {
  postId: string // The actual ID of the post, not the slug
  currentUser: User | null
}

// Helper to build comment tree
function buildCommentTree(comments: CommentWithAuthor[]): CommentWithAuthor[] {
  const commentMap: { [key: string]: CommentWithAuthor & { replies?: CommentWithAuthor[] } } = {}
  const rootComments: CommentWithAuthor[] = []

  comments.forEach((comment) => {
    commentMap[comment.id] = { ...comment, replies: [] }
  })

  comments.forEach((comment) => {
    if (comment.parent_comment_id && commentMap[comment.parent_comment_id]) {
      commentMap[comment.parent_comment_id].replies?.push(commentMap[comment.id])
    } else {
      rootComments.push(commentMap[comment.id])
    }
  })
  return rootComments
}

export function CommentsSection({ postId, currentUser }: CommentsSectionProps) {
  const [comments, setComments] = useState<CommentWithAuthor[]>([])
  const [isLoading, startLoadingTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const fetchComments = useCallback(() => {
    startLoadingTransition(async () => {
      setError(null)
      const result = await getCommentsByPostIdAction(postId)
      if (result.success && result.comments) {
        setComments(buildCommentTree(result.comments))
      } else {
        setError(result.message || "Failed to load comments.")
        setComments([])
      }
    })
  }, [postId])

  useEffect(() => {
    fetchComments()
  }, [fetchComments])

  const handleCommentAction = () => {
    fetchComments() // Re-fetch comments after a new one is posted or deleted
  }

  return (
    <section aria-labelledby="comments-heading" className="mt-10 pt-8 border-t border-border">
      <h2 id="comments-heading" className="text-2xl font-semibold mb-6">
        Comments ({comments.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0)}) {/* Basic count */}
      </h2>

      <CommentForm postId={postId} currentUser={currentUser} onCommentSubmitted={handleCommentAction} />

      {isLoading && (
        <div className="mt-6 space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex space-x-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          ))}
        </div>
      )}

      {error && <p className="mt-6 text-red-500">{error}</p>}

      {!isLoading && !error && comments.length === 0 && (
        <p className="mt-6 text-muted-foreground">No comments yet. Be the first to share your thoughts!</p>
      )}

      {!isLoading && !error && comments.length > 0 && (
        <div className="mt-8">
          <CommentList
            postId={postId}
            comments={comments}
            currentUser={currentUser}
            onCommentAction={handleCommentAction}
          />
        </div>
      )}
    </section>
  )
}
