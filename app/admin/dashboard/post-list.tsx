"use client"

import { useEffect, useState, useTransition } from "react"
import { adminGetAllPosts, deletePost } from "./actions"
import type { DbPost, UserProfile } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal, Pencil, Trash2, Eye, PlusCircle } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { toast } from "@/components/ui/use-toast"
import { format } from "date-fns"
import Link from "next/link"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface PostListProps {
  onEditPost: (post: DbPost) => void
  onCreateNewPost: () => void
  currentUser: UserProfile | null // To check ownership for certain actions if needed
}

export default function PostList({ onEditPost, onCreateNewPost, currentUser }: PostListProps) {
  const [posts, setPosts] = useState<DbPost[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isPending, startTransition] = useTransition()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [postToDelete, setPostToDelete] = useState<DbPost | null>(null)

  const fetchPosts = async () => {
    setIsLoading(true)
    const result = await adminGetAllPosts()
    if (result.success && result.posts) {
      setPosts(result.posts)
    } else {
      toast({
        title: "Error fetching posts",
        description: result.message || "Could not retrieve post list.",
        variant: "destructive",
      })
    }
    setIsLoading(false)
  }

  useEffect(() => {
    fetchPosts()
  }, [])

  const handleDeleteClick = (post: DbPost) => {
    setPostToDelete(post)
    setShowDeleteConfirm(true)
  }

  const confirmDelete = () => {
    if (!postToDelete) return

    startTransition(async () => {
      const result = await deletePost(postToDelete.id)
      if (result.success) {
        toast({
          title: "Post Deleted",
          description: result.message || "The post has been successfully deleted.",
        })
        setPosts(posts.filter((p) => p.id !== postToDelete.id))
      } else {
        toast({
          title: "Error Deleting Post",
          description: result.message || "Could not delete the post.",
          variant: "destructive",
        })
      }
      setShowDeleteConfirm(false)
      setPostToDelete(null)
    })
  }

  if (isLoading) {
    return <p>Loading posts...</p>
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={onCreateNewPost}>
          <PlusCircle className="mr-2 h-4 w-4" /> Create New Post
        </Button>
      </div>
      {posts.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No posts found. Get started by creating one!</p>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Published At</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {posts.map((post) => (
                <TableRow key={post.id}>
                  <TableCell className="font-medium">{post.title}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        post.status === "published" ? "default" : post.status === "draft" ? "secondary" : "outline"
                      }
                      className={post.status === "published" ? "bg-green-600 hover:bg-green-700 text-white" : ""}
                    >
                      {post.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{post.author_id ? "Author Name" : "N/A"}</TableCell> {/* TODO: Fetch author username */}
                  <TableCell>
                    {post.published_at ? format(new Date(post.published_at), "MMM d, yyyy") : "Not published"}
                  </TableCell>
                  <TableCell>
                    {post.updated_at ? format(new Date(post.updated_at), "MMM d, yyyy HH:mm") : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEditPost(post)}>
                          <Pencil className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        {post.status === "published" && (
                          <DropdownMenuItem asChild>
                            <Link href={`/blog/${post.slug}`} target="_blank">
                              <Eye className="mr-2 h-4 w-4" /> View Live
                            </Link>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => handleDeleteClick(post)}
                          className="text-red-600 focus:text-red-600 focus:bg-red-50"
                          disabled={isPending}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the post &quot;{postToDelete?.title}&quot;.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPostToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={isPending} className="bg-red-600 hover:bg-red-700">
              {isPending ? "Deleting..." : "Yes, delete post"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
