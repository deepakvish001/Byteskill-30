"use client"

import { useCallback } from "react"

import { useEffect, useState, useTransition } from "react"
import { adminGetAllContent } from "./actions"
import type { PostFrontmatter, ProjectFrontmatter } from "@/lib/types"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, ShieldAlert, FileText, FolderKanban, RefreshCw, Eye } from "lucide-react"
import Link from "next/link"

type ContentItem = (PostFrontmatter | ProjectFrontmatter) & { contentType: "Post" | "Project" }

const StatusBadge = ({
  isActive,
  activeText = "Yes",
  inactiveText = "No",
}: { isActive?: boolean; activeText?: string; inactiveText?: string }) => {
  return isActive ? (
    <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-white">
      {activeText}
    </Badge>
  ) : (
    <Badge variant="outline">{inactiveText}</Badge>
  )
}

export default function ContentList() {
  const [content, setContent] = useState<ContentItem[]>([])
  const [isLoading, startLoadingTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchContent = useCallback(async () => {
    setError(null)
    startLoadingTransition(async () => {
      try {
        const result = await adminGetAllContent()
        if (result.success && result.content) {
          setContent(result.content as ContentItem[])
        } else {
          setError(result.message || "Failed to load content.")
          toast({
            title: "Error Loading Content",
            description: result.message || "Could not fetch the content list.",
            variant: "destructive",
          })
        }
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "An unknown error occurred."
        setError(errorMessage)
        toast({
          title: "Network Error",
          description: "Could not connect to the server to fetch content. " + errorMessage,
          variant: "destructive",
        })
      }
    })
  }, [toast])

  useEffect(() => {
    fetchContent()
  }, [fetchContent])

  if (isLoading && content.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border bg-card p-10 shadow-sm min-h-[300px]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Loading Content...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-destructive bg-destructive/5 p-10 shadow-sm min-h-[300px] text-destructive">
        <ShieldAlert className="h-12 w-12 mb-4" />
        <p className="text-lg font-semibold">Failed to Load Content</p>
        <p className="text-sm mb-4 text-center">{error}</p>
        <Button onClick={fetchContent} variant="destructive" disabled={isLoading}>
          {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="rounded-md border bg-card shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px]">Type</TableHead>
            <TableHead>Title</TableHead>
            <TableHead className="hidden md:table-cell">Date</TableHead>
            <TableHead className="hidden sm:table-cell">Published</TableHead>
            <TableHead className="hidden sm:table-cell">Featured</TableHead>
            <TableHead className="text-right pr-4">View</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {content.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-48 text-center">
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mr-2" />
                    <span>Loading...</span>
                  </div>
                ) : (
                  <>
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-lg font-medium text-muted-foreground">No Content Found</p>
                    <p className="text-sm text-muted-foreground">There is currently no content to display.</p>
                  </>
                )}
              </TableCell>
            </TableRow>
          ) : (
            content.map((item) => (
              <TableRow key={`${item.contentType}-${item.slug}`} className="hover:bg-muted/50">
                <TableCell>
                  <Badge variant={item.contentType === "Post" ? "secondary" : "outline"} className="capitalize">
                    {item.contentType === "Post" ? (
                      <FileText className="h-3 w-3 mr-1.5" />
                    ) : (
                      <FolderKanban className="h-3 w-3 mr-1.5" />
                    )}
                    {item.contentType}
                  </Badge>
                </TableCell>
                <TableCell className="font-medium max-w-[300px] truncate" title={item.title}>
                  {item.title}
                </TableCell>
                <TableCell className="hidden md:table-cell">{new Date(item.date).toLocaleDateString()}</TableCell>
                <TableCell className="hidden sm:table-cell">
                  <StatusBadge isActive={item.isPublished} activeText="Published" inactiveText="Draft" />
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <StatusBadge isActive={item.featured} />
                </TableCell>
                <TableCell className="text-right pr-4">
                  <Button variant="ghost" size="sm" asChild>
                    <Link
                      href={item.contentType === "Post" ? `/blog/${item.slug}` : `/projects/${item.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`View ${item.title}`}
                    >
                      <Eye className="h-4 w-4" />
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      {isLoading && content.length > 0 && (
        <div className="flex items-center justify-center py-4 border-t">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mr-2" />
          <span className="text-muted-foreground text-sm">Refreshing content...</span>
        </div>
      )}
    </div>
  )
}
