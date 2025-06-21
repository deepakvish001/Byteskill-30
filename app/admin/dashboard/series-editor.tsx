"use client"

import { useTransition } from "react"
import { useForm, type SubmitHandler } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card"
import { updateSeriesDb } from "./actions"
import type { DbSeries } from "@/lib/types"
import { toast } from "@/components/ui/use-toast"
import { ChevronLeft } from "lucide-react"
import { SeriesPostManager } from "./series-post-manager"

const seriesSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  slug: z
    .string()
    .min(3, "Slug must be at least 3 characters")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens"),
  description: z.string().optional(),
  hero_image_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  status: z.enum(["draft", "published"]),
})

type SeriesFormData = z.infer<typeof seriesSchema>

interface SeriesEditorProps {
  initialData: DbSeries | null // Now required, as this is an editor page
  onClose: () => void // To go back to the list
}

export default function SeriesEditor({ initialData, onClose }: SeriesEditorProps) {
  const [isPending, startTransition] = useTransition()
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<SeriesFormData>({
    resolver: zodResolver(seriesSchema),
    defaultValues: {
      title: initialData?.title || "",
      slug: initialData?.slug || "",
      description: initialData?.description || "",
      hero_image_url: initialData?.hero_image_url || "",
      status: initialData?.status || "draft",
    },
  })

  const onSubmit: SubmitHandler<SeriesFormData> = (data) => {
    if (!initialData) return // Should not happen in this new flow

    startTransition(async () => {
      const result = await updateSeriesDb(initialData.id, data)
      if (result.success) {
        toast({ title: "Success", description: "Series details have been updated." })
        // Note: We don't close the editor on save, allowing further changes.
      } else {
        toast({ title: "Error", description: result.message, variant: "destructive" })
      }
    })
  }

  // This component is now a full editor page, not a dialog.
  // The creation flow is handled by creating a draft first from the list page.
  if (!initialData) {
    return (
      <div className="p-4">
        <Button variant="outline" onClick={onClose}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Series List
        </Button>
        <p className="mt-4 text-center text-muted-foreground">
          To create a new series, please go back to the list and click "Create New Series".
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <Button variant="outline" onClick={onClose}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Series List
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Edit Series Details</CardTitle>
          <CardDescription>Update the metadata for the "{initialData.title}" series.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input id="title" {...register("title")} />
                {errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>}
              </div>
              <div>
                <Label htmlFor="slug">Slug</Label>
                <Input id="slug" {...register("slug")} />
                {errors.slug && <p className="text-sm text-red-500">{errors.slug.message}</p>}
              </div>
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" {...register("description")} />
            </div>
            <div>
              <Label htmlFor="hero_image_url">Hero Image URL</Label>
              <Input id="hero_image_url" {...register("hero_image_url")} />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                defaultValue={initialData.status}
                onValueChange={(value) => setValue("status", value as "draft" | "published")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save Details"}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <SeriesPostManager series={initialData} />
    </div>
  )
}
