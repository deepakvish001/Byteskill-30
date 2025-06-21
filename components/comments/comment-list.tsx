import type { User } from "@supabase/supabase-js"
import type { CommentWithAuthor } from "@/lib/types"
import { CommentItem } from "./comment-item"

interface CommentListProps {
  postId: string
  comments: CommentWithAuthor[]
  currentUser: User | null
  onCommentAction: () => void // Generic callback to refresh comments
  level?: number
}

export function CommentList({ postId, comments, currentUser, onCommentAction, level = 0 }: CommentListProps) {
  return (
    <div className={`space-y-1 ${level > 0 ? "mt-2" : ""}`}>
      {comments.map((comment) => (
        <div key={comment.id}>
          <CommentItem
            postId={postId}
            comment={comment}
            currentUser={currentUser}
            onCommentDeleted={onCommentAction}
            onReplySubmitted={onCommentAction}
            level={level}
          />
          {comment.replies && comment.replies.length > 0 && (
            <CommentList
              postId={postId}
              comments={comment.replies}
              currentUser={currentUser}
              onCommentAction={onCommentAction}
              level={level + 1}
            />
          )}
        </div>
      ))}
    </div>
  )
}
