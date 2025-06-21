"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"
import { sendEmail } from "@/lib/email"
import NewCommentNotificationEmail from "@/components/emails/new-comment-notification-email"
import ReplyNotificationEmail from "@/components/emails/reply-notification-email"
import type { Database, CommentWithAuthor } from "@/lib/types"
import { createInAppNotification } from "@/app/notifications/actions"
import { awardReputation } from "@/lib/reputation" // Import the reputation service

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(5, "60 s"),
  analytics: true,
})

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || "Your Site Name"

interface CommentActionResult {
  success: boolean
  message?: string
  comment?: CommentWithAuthor
  comments?: CommentWithAuthor[]
  error?: string
  toast?: { title: string; description: string; variant?: "default" | "destructive" }
}

export async function createCommentAction(
  postId: string,
  content: string,
  parentId?: string | null,
): Promise<CommentActionResult> {
  const supabase = createClient()
  const {
    data: { user: currentUser },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !currentUser) {
    return {
      success: false,
      error: "You must be logged in to comment.",
      toast: { title: "Authentication Error", description: "Please log in to comment.", variant: "destructive" },
    }
  }

  const identifier = currentUser.id
  const { success: rateLimitSuccess } = await ratelimit.limit(identifier)

  if (!rateLimitSuccess) {
    return {
      success: false,
      error: "You are posting comments too frequently. Please try again later.",
      toast: {
        title: "Rate Limit Exceeded",
        description: "Please wait a moment before commenting again.",
        variant: "destructive",
      },
    }
  }

  if (!content.trim()) {
    return {
      success: false,
      error: "Comment content cannot be empty.",
      toast: { title: "Validation Error", description: "Comment cannot be empty.", variant: "destructive" },
    }
  }

  const { data: newCommentData, error: commentError } = await supabase
    .from("comments")
    .insert({
      post_id: postId,
      user_id: currentUser.id,
      content: content.trim(),
      parent_id: parentId,
    })
    .select("*, author:profiles(id, username, full_name, avatar_url, email)")
    .single()

  if (commentError || !newCommentData) {
    console.error("Error creating comment:", commentError)
    return {
      success: false,
      error: commentError?.message || "Could not post your comment.",
      toast: {
        title: "Comment Error",
        description: "Could not post your comment. Please try again.",
        variant: "destructive",
      },
    }
  }

  const newComment = newCommentData as CommentWithAuthor

  // --- Award Reputation ---
  // We do this right after successful insertion.
  // It's a "fire and forget" operation from the user's perspective.
  // If it fails, we log the error but don't block the user's action.
  awardReputation(supabase, currentUser.id, "create_comment", newComment.id).catch((err) =>
    console.error("Failed to award reputation for new comment:", err),
  )
  // --- End Award Reputation ---

  const { data: postForReval } = await supabase.from("posts").select("slug, series_id").eq("id", postId).single()
  if (postForReval?.slug) {
    revalidatePath(`/blog/${postForReval.slug}`)
    if (postForReval.series_id) {
      const { data: seriesForReval } = await supabase
        .from("series")
        .select("slug")
        .eq("id", postForReval.series_id)
        .single()
      if (seriesForReval?.slug) {
        revalidatePath(`/series/${seriesForReval.slug}/${postForReval.slug}`)
      }
    }
  }
  revalidatePath("/admin/dashboard", "layout")

  // --- Send Notifications (Email & In-App) ---
  try {
    const { data: post, error: postError } = await supabase
      .from("posts")
      .select("id, title, slug, author_id, series:series(slug)")
      .eq("id", postId)
      .single()

    if (postError || !post) {
      console.error("Error fetching post for notification:", postError?.message || "Post not found")
    } else {
      const postPath = post.series?.slug ? `/series/${post.series.slug}/${post.slug}` : `/blog/${post.slug}`
      const postUrl = `${SITE_URL}${postPath}`
      const commentLink = `${postUrl}#comment-${newComment.id}`
      const commenterName = newComment.author?.full_name || newComment.author?.username || "A user"
      const contentPreview = newComment.content.substring(0, 100) + (newComment.content.length > 100 ? "..." : "")

      // 1. Notify Post Author
      if (post.author_id && post.author_id !== currentUser.id) {
        const { data: postAuthorProfile, error: authorProfileError } = await supabase
          .from("profiles")
          .select("id, full_name, username, email, notification_preferences")
          .eq("id", post.author_id)
          .single()

        if (authorProfileError || !postAuthorProfile) {
          console.error("Error fetching post author's profile for notification:", authorProfileError?.message)
        } else {
          const prefs =
            postAuthorProfile.notification_preferences as Database["public"]["Tables"]["profiles"]["Row"]["notification_preferences"]

          // Email Notification
          if (prefs?.new_comment_on_my_post && postAuthorProfile.email) {
            await sendEmail({
              to: postAuthorProfile.email,
              subject: `New Comment on Your Post: "${post.title}"`,
              react: NewCommentNotificationEmail({
                postAuthorName: postAuthorProfile.full_name || postAuthorProfile.username || "Author",
                commenterName: commenterName,
                commentContent: newComment.content,
                postTitle: post.title,
                postUrl: commentLink,
                siteName: SITE_NAME,
                siteUrl: SITE_URL,
              }),
            })
          }
          // In-App Notification
          if (prefs?.new_comment_on_my_post) {
            // Assuming same pref for in-app
            await createInAppNotification({
              userId: postAuthorProfile.id,
              type: "new_comment_on_post",
              actorId: currentUser.id,
              entityId: newComment.id, // The comment itself
              entityType: "comment",
              secondaryEntityId: post.id, // The post the comment is on
              secondaryEntityType: "post",
              contentPreview: `New comment by ${commenterName}: "${contentPreview}"`,
              link: commentLink,
            })
          }
        }
      }

      // 2. Notify Parent Comment Author (if it's a reply)
      if (parentId) {
        const { data: parentComment, error: parentCommentError } = await supabase
          .from("comments")
          .select("id, content, user_id, author:profiles(id, full_name, username, email, notification_preferences)")
          .eq("id", parentId)
          .single()

        if (parentCommentError || !parentComment || !parentComment.author) {
          console.error(
            "Error fetching parent comment or its author for reply notification:",
            parentCommentError?.message,
          )
        } else if (parentComment.author.id !== currentUser.id) {
          const parentAuthorPrefs = parentComment.author
            .notification_preferences as Database["public"]["Tables"]["profiles"]["Row"]["notification_preferences"]

          // Email Notification
          if (parentAuthorPrefs?.new_reply_to_my_comment && parentComment.author.email) {
            await sendEmail({
              to: parentComment.author.email,
              subject: `New Reply to Your Comment on "${post.title}"`,
              react: ReplyNotificationEmail({
                parentCommentAuthorName: parentComment.author.full_name || parentComment.author.username || "Commenter",
                replierName: commenterName,
                replyContent: newComment.content,
                originalCommentContent: parentComment.content,
                postTitle: post.title,
                postUrl: commentLink,
                siteName: SITE_NAME,
                siteUrl: SITE_URL,
              }),
            })
          }
          // In-App Notification
          if (parentAuthorPrefs?.new_reply_to_my_comment) {
            // Assuming same pref
            await createInAppNotification({
              userId: parentComment.author.id,
              type: "new_reply_to_comment",
              actorId: currentUser.id,
              entityId: newComment.id, // The reply comment
              entityType: "comment",
              secondaryEntityId: parentComment.id, // The parent comment
              secondaryEntityType: "comment",
              contentPreview: `New reply from ${commenterName}: "${contentPreview}"`,
              link: commentLink,
            })
          }
        }
      }
    }
  } catch (notificationError) {
    console.error("Failed to send notification(s):", notificationError)
  }
  // --- End Send Notifications ---

  return {
    success: true,
    comment: newComment,
    toast: { title: "Comment Posted!", description: "Your comment has been successfully posted." },
  }
}

// getCommentsByPostIdAction and deleteUserCommentAction remain unchanged
export async function getCommentsByPostIdAction(postId: string): Promise<CommentActionResult> {
  const supabase = createClient()
  try {
    const { data, error } = await supabase
      .from("comments")
      .select(
        `
        *,
        author:profiles!user_id (id, username, full_name, avatar_url, email)
      `,
      )
      .eq("post_id", postId)
      .eq("is_approved", true)
      .eq("is_deleted", false)
      .order("created_at", { ascending: true })

    if (error) {
      console.error("Error fetching comments:", error)
      return { success: false, message: `Failed to fetch comments: ${error.message}` }
    }
    return { success: true, comments: (data as CommentWithAuthor[]) || [] }
  } catch (e: any) {
    console.error("Unexpected error fetching comments:", e)
    return { success: false, message: "An unexpected error occurred." }
  }
}

export async function deleteUserCommentAction(commentId: string): Promise<CommentActionResult> {
  const supabase = createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, message: "Authentication required." }
  }

  try {
    const { data: comment, error: fetchError } = await supabase
      .from("comments")
      .select("id, user_id, post_id")
      .eq("id", commentId)
      .single()

    if (fetchError || !comment) {
      return { success: false, message: "Comment not found." }
    }

    // Allow admins to delete any comment via admin panel, this is for user self-deletion
    // For user self-deletion, check ownership.
    if (comment.user_id !== user.id) {
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
      if (profile?.role !== "admin" && profile?.role !== "owner") {
        return { success: false, message: "You are not authorized to delete this comment." }
      }
    }

    const { error: updateError } = await supabase
      .from("comments")
      .update({ is_deleted: true, content: "[This comment has been deleted]", updated_at: new Date().toISOString() })
      .eq("id", commentId)

    if (updateError) {
      console.error("Error soft deleting comment:", updateError)
      return { success: false, message: `Failed to delete comment: ${updateError.message}` }
    }

    const { data: post } = await supabase.from("posts").select("slug").eq("id", comment.post_id).single()
    if (post?.slug) {
      revalidatePath(`/blog/${post.slug}`)
    }
    revalidatePath("/admin/dashboard", "layout")

    return { success: true, message: "Comment deleted." }
  } catch (e: any) {
    console.error("Unexpected error deleting comment:", e)
    return { success: false, message: "An unexpected error occurred." }
  }
}
