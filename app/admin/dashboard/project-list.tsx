"use client"

import { useEffect, useState, useTransition } from "react"
import { adminGetAllProjectsFromDb, deleteProjectDb } from "./actions" // Ensure these are DB versions
import type { DbProject, UserProfile } from "@/lib/types"
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

interface ProjectListProps {
  onEditProject: (project: DbProject) => void
  onCreateNewProject: () => void
  currentUser: UserProfile | null
}

export default function ProjectList({ onEditProject, onCreateNewProject, currentUser }: ProjectListProps) {
  const [projects, setProjects] = useState<DbProject[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isPending, startTransition] = useTransition()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [projectToDelete, setProjectToDelete] = useState<DbProject | null>(null)

  const fetchProjects = async () => {
    setIsLoading(true)
    const result = await adminGetAllProjectsFromDb()
    if (result.success && result.projects) {
      setProjects(result.projects)
    } else {
      toast({
        title: "Error fetching projects",
        description: result.message || "Could not retrieve project list.",
        variant: "destructive",
      })
    }
    setIsLoading(false)
  }

  useEffect(() => {
    fetchProjects()
  }, [])

  const handleDeleteClick = (project: DbProject) => {
    setProjectToDelete(project)
    setShowDeleteConfirm(true)
  }

  const confirmDelete = () => {
    if (!projectToDelete) return

    startTransition(async () => {
      const result = await deleteProjectDb(projectToDelete.id)
      if (result.success) {
        toast({
          title: "Project Deleted",
          description: result.message || "The project has been successfully deleted.",
        })
        setProjects(projects.filter((p) => p.id !== projectToDelete.id))
      } else {
        toast({
          title: "Error Deleting Project",
          description: result.message || "Could not delete the project.",
          variant: "destructive",
        })
      }
      setShowDeleteConfirm(false)
      setProjectToDelete(null)
    })
  }

  if (isLoading) {
    return <p>Loading projects...</p>
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={onCreateNewProject}>
          <PlusCircle className="mr-2 h-4 w-4" /> Create New Project
        </Button>
      </div>
      {projects.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No projects found. Get started by creating one!</p>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Published At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell className="font-medium">{project.title}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        project.status === "published"
                          ? "default"
                          : project.status === "draft"
                            ? "secondary"
                            : "outline"
                      }
                      className={project.status === "published" ? "bg-green-600 hover:bg-green-700 text-white" : ""}
                    >
                      {project.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{project.category || "-"}</TableCell>
                  <TableCell>{(project.author as any)?.username || "N/A"}</TableCell>
                  <TableCell>
                    {project.published_at ? format(new Date(project.published_at), "MMM d, yyyy") : "Not published"}
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
                        <DropdownMenuItem onClick={() => onEditProject(project)}>
                          <Pencil className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        {project.status === "published" && (
                          <DropdownMenuItem asChild>
                            <Link href={`/projects/${project.slug}`} target="_blank">
                              <Eye className="mr-2 h-4 w-4" /> View Live
                            </Link>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => handleDeleteClick(project)}
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
              This action cannot be undone. This will permanently delete the project &quot;{projectToDelete?.title}
              &quot;.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setProjectToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={isPending} className="bg-red-600 hover:bg-red-700">
              {isPending ? "Deleting..." : "Yes, delete project"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
