"use client"

import { useTransition } from "react"
import { useForm, type SubmitHandler } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import type { User } from "@supabase/supabase-js"
import { createCommentAction } from "@/app/blog/comments/actions"

const commentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty.").max(5000, "Comment too long."),
})
type CommentFormData = z.infer<typeof commentSchema>

interface CommentFormProps {
  postId: string
  parentCommentId?: string | null
  currentUser: User | null
  onCommentSubmitted: () => void // To trigger re-fetch or optimistic update
  onCancelReply?: () => void
  compact?: boolean
}

export function CommentForm({
  postId,
  parentCommentId = null,
  currentUser,
  onCommentSubmitted,
  onCancelReply,
  compact = false,
}: CommentFormProps) {
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CommentFormData>({
    resolver: zodResolver(commentSchema),
  })

  if (!currentUser) {
    return (
      <p className="text-sm text-muted-foreground">
        Please{" "}
        <a href="/login" className="underline hover:text-primary">
          log in
        </a>{" "}
        to comment.
      </p>
    )
  }

  const onSubmit: SubmitHandler<CommentFormData> = async (data) => {
    startTransition(async () => {
      const result = await createCommentAction(postId, data.content, parentCommentId)
      if (result.success) {
        toast({ title: parentCommentId ? "Reply posted" : "Comment posted" })
        reset()
        onCommentSubmitted()
        if (onCancelReply) onCancelReply()
      } else {
        toast({ title: "Error", description: result.message, variant: "destructive" })
      }
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={`space-y-3 ${compact ? "mt-2" : "mt-6"}`}>
      {!compact && (
        <Label htmlFor={`comment-content-${parentCommentId || "new"}`} className="text-base font-semibold">
          {parentCommentId ? "Write a reply" : "Leave a comment"}
        </Label>
      )}
      <Textarea
        id={`comment-content-${parentCommentId || "new"}`}
        {...register("content")}
        placeholder={parentCommentId ? "Your reply..." : "Share your thoughts..."}
        rows={compact ? 2 : 4}
        className="text-sm"
      />
      {errors.content && <p className="text-xs text-red-500">{errors.content.message}</p>}
      <div className="flex items-center gap-2">
        <Button type="submit" disabled={isPending} size={compact ? "sm" : "default"}>
          {isPending ? "Posting..." : parentCommentId ? "Post Reply" : "Post Comment"}
        </Button>
        {onCancelReply && (
          <Button
            type="button"
            variant="ghost"
            onClick={onCancelReply}
            disabled={isPending}
            size={compact ? "sm" : "default"}
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  )
}
