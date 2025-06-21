"use client"

import { useTransition, useEffect, useState } from "react"
import { useForm, type SubmitHandler, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card"
import { createProjectDb, updateProjectDb } from "./actions"
import type { DbProject } from "@/lib/types"
import { toast } from "@/components/ui/use-toast"
import { ChevronLeft, XCircle } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { TagSelect } from "./tag-select"

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"]

const projectSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  slug: z
    .string()
    .min(3, "Slug must be at least 3 characters")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens"),
  description: z.string().optional(),
  long_description: z.string().optional(),
  content: z.string().optional(),
  hero_image_url: z.string().url("Must be a valid URL if provided").optional().or(z.literal("")),
  thumbnail_image_url: z.string().url("Must be a valid URL if provided").optional().or(z.literal("")),
  hero_image_file: z
    .custom<FileList>()
    .optional()
    .refine((files) => !files || files.length === 0 || files?.[0]?.size <= MAX_FILE_SIZE, `Max image size is 5MB.`)
    .refine(
      (files) => !files || files.length === 0 || ACCEPTED_IMAGE_TYPES.includes(files?.[0]?.type),
      "Only .jpg, .jpeg, .png, .webp and .gif formats are supported.",
    ),
  thumbnail_image_file: z
    .custom<FileList>()
    .optional()
    .refine((files) => !files || files.length === 0 || files?.[0]?.size <= MAX_FILE_SIZE, `Max image size is 5MB.`)
    .refine(
      (files) => !files || files.length === 0 || ACCEPTED_IMAGE_TYPES.includes(files?.[0]?.type),
      "Only .jpg, .jpeg, .png, .webp and .gif formats are supported.",
    ),
  live_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  repo_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  demo_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  technologies: z
    .string() // Will be transformed from comma-separated string to array
    .optional()
    .transform((val) =>
      val
        ? val
            .split(",")
            .map((t) => t.trim())
            .filter((t) => t)
        : [],
    ),
  status: z.enum(["draft", "published", "archived"]),
  featured: z.boolean().optional(),
  category: z.string().optional(),
  tag_ids: z.array(z.number()).optional(),
})

type ProjectFormData = z.infer<typeof projectSchema>

interface ProjectEditorProps {
  initialData?: DbProject | null
  onClose: () => void
  onProjectSaved: () => void
}

export default function ProjectEditor({ initialData, onClose, onProjectSaved }: ProjectEditorProps) {
  const [isPending, startTransition] = useTransition()
  const [heroPreview, setHeroPreview] = useState<string | null>(initialData?.hero_image_url || null)
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(initialData?.thumbnail_image_url || null)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    control,
    resetField,
    formState: { errors },
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      title: initialData?.title || "",
      slug: initialData?.slug || "",
      description: initialData?.description || "",
      long_description: initialData?.long_description || "",
      content: initialData?.content || "",
      hero_image_url: initialData?.hero_image_url || "",
      thumbnail_image_url: initialData?.thumbnail_image_url || "",
      live_url: initialData?.live_url || "",
      repo_url: initialData?.repo_url || "",
      demo_url: initialData?.demo_url || "",
      technologies: initialData?.technologies || [],
      status: initialData?.status || "draft",
      featured: initialData?.featured || false,
      category: initialData?.category || "",
      tag_ids: initialData?.tags?.map((tag) => tag.id) || [],
    },
  })

  useEffect(() => {
    if (initialData) {
      reset({
        ...initialData,
        description: initialData.description || "",
        long_description: initialData.long_description || "",
        content: initialData.content || "",
        hero_image_url: initialData.hero_image_url || "",
        thumbnail_image_url: initialData.thumbnail_image_url || "",
        live_url: initialData.live_url || "",
        repo_url: initialData.repo_url || "",
        demo_url: initialData.demo_url || "",
        technologies: initialData.technologies || [], // Keep as array
        status: initialData.status || "draft",
        featured: initialData.featured || false,
        category: initialData.category || "",
        tag_ids: initialData.tags?.map((tag) => tag.id) || [],
      })
      setHeroPreview(initialData.hero_image_url || null)
      setThumbnailPreview(initialData.thumbnail_image_url || null)
    } else {
      reset({
        title: "",
        slug: "",
        description: "",
        long_description: "",
        content: "",
        hero_image_url: "",
        thumbnail_image_url: "",
        live_url: "",
        repo_url: "",
        demo_url: "",
        technologies: [],
        status: "draft",
        featured: false,
        category: "",
        tag_ids: [],
      })
      setHeroPreview(null)
      setThumbnailPreview(null)
    }
  }, [initialData, reset])

  const watchedTitle = watch("title")
  useEffect(() => {
    if (!initialData || !initialData.slug) {
      const slugifiedTitle = watchedTitle
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^\w-]+/g, "")
        .replace(/--+/g, "-")
      setValue("slug", slugifiedTitle)
    }
  }, [watchedTitle, setValue, initialData])

  const watchedHeroFile = watch("hero_image_file")
  const watchedThumbnailFile = watch("thumbnail_image_file")

  useEffect(() => {
    if (watchedHeroFile && watchedHeroFile[0]) {
      const file = watchedHeroFile[0]
      setHeroPreview(URL.createObjectURL(file))
    } else if (initialData?.hero_image_url) {
      setHeroPreview(initialData.hero_image_url)
    } else {
      setHeroPreview(null)
    }
  }, [watchedHeroFile, initialData?.hero_image_url])

  useEffect(() => {
    if (watchedThumbnailFile && watchedThumbnailFile[0]) {
      const file = watchedThumbnailFile[0]
      setThumbnailPreview(URL.createObjectURL(file))
    } else if (initialData?.thumbnail_image_url) {
      setThumbnailPreview(initialData.thumbnail_image_url)
    } else {
      setThumbnailPreview(null)
    }
  }, [watchedThumbnailFile, initialData?.thumbnail_image_url])

  const handleRemoveImage = (type: "hero" | "thumbnail") => {
    if (type === "hero") {
      setValue("hero_image_url", "")
      resetField("hero_image_file")
      setHeroPreview(null)
    } else {
      setValue("thumbnail_image_url", "")
      resetField("thumbnail_image_file")
      setThumbnailPreview(null)
    }
  }

  const onSubmit: SubmitHandler<ProjectFormData> = (data) => {
    startTransition(async () => {
      const formData = new FormData()
      Object.entries(data).forEach(([key, value]) => {
        if (key === "tag_ids" && Array.isArray(value)) {
          value.forEach((tagId) => formData.append("tag_ids[]", String(tagId)))
        } else if (key === "technologies" && Array.isArray(value)) {
          formData.append(key, value.join(",")) // Send as comma-separated string
        } else if ((key === "hero_image_file" || key === "thumbnail_image_file") && value?.[0]) {
          formData.append(key, value[0])
        } else if (
          (value !== undefined && value !== null && typeof value !== "object") ||
          (typeof value === "object" && !Array.isArray(value) && value !== null && !(value instanceof FileList))
        ) {
          formData.append(key, typeof value === "boolean" ? value.toString() : String(value))
        }
      })
      // Ensure URL fields are sent even if empty
      if (!data.hero_image_file || data.hero_image_file.length === 0) {
        formData.set("hero_image_url", data.hero_image_url || "")
      }
      if (!data.thumbnail_image_file || data.thumbnail_image_file.length === 0) {
        formData.set("thumbnail_image_url", data.thumbnail_image_url || "")
      }

      const action = initialData ? updateProjectDb(initialData.id, formData) : createProjectDb(formData)
      const result = await action

      if (result.success) {
        toast({
          title: initialData ? "Project Updated" : "Project Created",
          description: result.message || `Project ${initialData ? "updated" : "created"} successfully.`,
        })
        onProjectSaved()
      } else {
        toast({
          title: `Error ${initialData ? "Updating" : "Creating"} Project`,
          description: result.message || "An error occurred.",
          variant: "destructive",
        })
      }
    })
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={onClose} className="mb-2 -ml-2">
            <ChevronLeft className="mr-2 h-4 w-4" /> Back to List
          </Button>
        </div>
        <CardTitle>{initialData ? "Edit Project" : "Create New Project"}</CardTitle>
        <CardDescription>
          {initialData ? "Modify the details of this project." : "Fill in the details for a new project."}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" {...register("title")} placeholder="Project Title" />
              {errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input id="slug" {...register("slug")} placeholder="project-slug" />
              {errors.slug && <p className="text-sm text-red-500">{errors.slug.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="category">Category (Optional)</Label>
              <Input id="category" {...register("category")} placeholder="e.g., Web App, Mobile, AI" />
              {errors.category && <p className="text-sm text-red-500">{errors.category.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Controller
                name="status"
                control={control}
                defaultValue={initialData?.status || "draft"}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.status && <p className="text-sm text-red-500">{errors.status.message}</p>}
            </div>
            <div className="space-y-2 pt-8 flex items-center">
              <Controller
                name="featured"
                control={control}
                defaultValue={initialData?.featured || false}
                render={({ field }) => (
                  <Checkbox id="featured" checked={field.value} onCheckedChange={field.onChange} />
                )}
              />
              <Label htmlFor="featured" className="ml-2 font-normal">
                Featured Project
              </Label>
              {errors.featured && <p className="text-sm text-red-500">{errors.featured.message}</p>}
            </div>
          </div>

          <Controller
            name="tag_ids"
            control={control}
            defaultValue={initialData?.tags?.map((tag) => tag.id) || []}
            render={({ field }) => <TagSelect selectedTagIds={field.value || []} onChange={field.onChange} />}
          />
          {errors.tag_ids && <p className="text-sm text-red-500">{errors.tag_ids.message}</p>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="hero_image_file">Hero Image</Label>
              {heroPreview && (
                <div className="relative group aspect-video w-full overflow-hidden rounded-md border">
                  <Image src={heroPreview || "/placeholder.svg"} alt="Hero preview" layout="fill" objectFit="cover" />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleRemoveImage("hero")}
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
              )}
              <Input
                id="hero_image_file"
                type="file"
                {...register("hero_image_file")}
                accept={ACCEPTED_IMAGE_TYPES.join(",")}
                className="mt-2"
              />
              {errors.hero_image_file && <p className="text-sm text-red-500">{errors.hero_image_file.message}</p>}
              <Label htmlFor="hero_image_url" className="mt-2 text-xs text-gray-500">
                Or paste Hero Image URL (upload will override)
              </Label>
              <Input id="hero_image_url" {...register("hero_image_url")} placeholder="https://example.com/hero.jpg" />
              {errors.hero_image_url && <p className="text-sm text-red-500">{errors.hero_image_url.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="thumbnail_image_file">Thumbnail Image</Label>
              {thumbnailPreview && (
                <div className="relative group aspect-video w-full overflow-hidden rounded-md border">
                  <Image
                    src={thumbnailPreview || "/placeholder.svg"}
                    alt="Thumbnail preview"
                    layout="fill"
                    objectFit="cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleRemoveImage("thumbnail")}
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
              )}
              <Input
                id="thumbnail_image_file"
                type="file"
                {...register("thumbnail_image_file")}
                accept={ACCEPTED_IMAGE_TYPES.join(",")}
                className="mt-2"
              />
              {errors.thumbnail_image_file && (
                <p className="text-sm text-red-500">{errors.thumbnail_image_file.message}</p>
              )}
              <Label htmlFor="thumbnail_image_url" className="mt-2 text-xs text-gray-500">
                Or paste Thumbnail URL (upload will override)
              </Label>
              <Input
                id="thumbnail_image_url"
                {...register("thumbnail_image_url")}
                placeholder="https://example.com/thumb.jpg"
              />
              {errors.thumbnail_image_url && (
                <p className="text-sm text-red-500">{errors.thumbnail_image_url.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Short Description (Optional)</Label>
            <Textarea id="description" {...register("description")} placeholder="Brief project summary" rows={2} />
            {errors.description && <p className="text-sm text-red-500">{errors.description.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="long_description">Long Description (Optional)</Label>
            <Textarea
              id="long_description"
              {...register("long_description")}
              placeholder="More detailed overview"
              rows={4}
            />
            {errors.long_description && <p className="text-sm text-red-500">{errors.long_description.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="content">Main Content (Markdown, Optional)</Label>
            <Textarea
              id="content"
              {...register("content")}
              placeholder="Full project details, case study, etc."
              rows={10}
              className="font-mono text-sm"
            />
            {errors.content && <p className="text-sm text-red-500">{errors.content.message}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="live_url">Live URL (Optional)</Label>
              <Input id="live_url" {...register("live_url")} placeholder="https://project-live-url.com" />
              {errors.live_url && <p className="text-sm text-red-500">{errors.live_url.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="repo_url">Repository URL (Optional)</Label>
              <Input id="repo_url" {...register("repo_url")} placeholder="https://github.com/user/repo" />
              {errors.repo_url && <p className="text-sm text-red-500">{errors.repo_url.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="demo_url">Demo URL (Optional)</Label>
              <Input id="demo_url" {...register("demo_url")} placeholder="https://project-demo-url.com" />
              {errors.demo_url && <p className="text-sm text-red-500">{errors.demo_url.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="technologies">Technologies (comma-separated, Optional)</Label>
            <Input
              id="technologies"
              {...register("technologies", {
                setValueAs: (v) => (Array.isArray(v) ? v.join(", ") : v), // Store as string for input
              })}
              placeholder="React, Next.js, Supabase"
            />
            {errors.technologies && <p className="text-sm text-red-500">{errors.technologies.message}</p>}
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? (initialData ? "Saving..." : "Creating...") : initialData ? "Save Changes" : "Create Project"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
