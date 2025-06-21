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
import { createPost, updatePost } from "./actions"
import type { DbPost } from "@/lib/types"
import { toast } from "@/components/ui/use-toast"
import { ChevronLeft, XCircle } from "lucide-react"
import { TagSelect } from "./tag-select"

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"]

const postSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  slug: z
    .string()
    .min(3, "Slug must be at least 3 characters")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens"),
  description: z.string().optional(),
  content: z.string().min(10, "Content must be at least 10 characters"),
  status: z.enum(["draft", "published", "archived"]),
  tag_ids: z.array(z.number()).optional(),
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
})

type PostFormData = z.infer<typeof postSchema>

interface PostEditorProps {
  initialData?: DbPost | null
  onClose: () => void
  onPostSaved: () => void
}

export default function PostEditor({ initialData, onClose, onPostSaved }: PostEditorProps) {
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
  } = useForm<PostFormData>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      title: initialData?.title || "",
      slug: initialData?.slug || "",
      description: initialData?.description || "",
      content: initialData?.content || "",
      status: initialData?.status || "draft",
      tag_ids: initialData?.tags?.map((tag) => tag.id) || [],
      hero_image_url: initialData?.hero_image_url || "",
      thumbnail_image_url: initialData?.thumbnail_image_url || "",
    },
  })

  useEffect(() => {
    if (initialData) {
      reset({
        title: initialData.title,
        slug: initialData.slug,
        description: initialData.description || "",
        content: initialData.content || "",
        status: initialData.status || "draft",
        tag_ids: initialData.tags?.map((tag) => tag.id) || [],
        hero_image_url: initialData.hero_image_url || "",
        thumbnail_image_url: initialData.thumbnail_image_url || "",
      })
      setHeroPreview(initialData.hero_image_url || null)
      setThumbnailPreview(initialData.thumbnail_image_url || null)
    } else {
      reset({
        title: "",
        slug: "",
        description: "",
        content: "",
        status: "draft",
        tag_ids: [],
        hero_image_url: "",
        thumbnail_image_url: "",
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

  const onSubmit: SubmitHandler<PostFormData> = (data) => {
    startTransition(async () => {
      const formData = new FormData()
      // Append all fields, including files
      Object.entries(data).forEach(([key, value]) => {
        if (key === "tag_ids" && Array.isArray(value)) {
          value.forEach((tagId) => formData.append("tag_ids[]", String(tagId)))
        } else if ((key === "hero_image_file" || key === "thumbnail_image_file") && value?.[0]) {
          formData.append(key, value[0])
        } else if (
          (value !== undefined && value !== null && typeof value !== "object") ||
          (typeof value === "object" && !Array.isArray(value) && value !== null && !(value instanceof FileList))
        ) {
          formData.append(key, String(value))
        }
      })
      // Ensure URL fields are sent even if empty, so backend knows if they were cleared
      if (!data.hero_image_file || data.hero_image_file.length === 0) {
        formData.set("hero_image_url", data.hero_image_url || "")
      }
      if (!data.thumbnail_image_file || data.thumbnail_image_file.length === 0) {
        formData.set("thumbnail_image_url", data.thumbnail_image_url || "")
      }

      const action = initialData ? updatePost(initialData.id, formData) : createPost(formData)
      const result = await action

      if (result.success) {
        toast({
          title: initialData ? "Post Updated" : "Post Created",
          description: result.message || `Post ${initialData ? "updated" : "created"} successfully.`,
        })
        onPostSaved()
      } else {
        toast({
          title: `Error ${initialData ? "Updating" : "Creating"} Post`,
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
        <CardTitle>{initialData ? "Edit Post" : "Create New Post"}</CardTitle>
        <CardDescription>
          {initialData ? "Modify the details of this post." : "Fill in the details to create a new blog post."}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" {...register("title")} placeholder="Enter post title" />
              {errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input id="slug" {...register("slug")} placeholder="post-slug-will-be-here" />
              {errors.slug && <p className="text-sm text-red-500">{errors.slug.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="A brief summary of the post"
              rows={3}
            />
            {errors.description && <p className="text-sm text-red-500">{errors.description.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Content (Markdown)</Label>
            <Textarea
              id="content"
              {...register("content")}
              placeholder="Write your post content here using Markdown..."
              rows={15}
              className="font-mono text-sm"
            />
            {errors.content && <p className="text-sm text-red-500">{errors.content.message}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            <Controller
              name="tag_ids"
              control={control}
              defaultValue={initialData?.tags?.map((tag) => tag.id) || []}
              render={({ field }) => <TagSelect selectedTagIds={field.value || []} onChange={field.onChange} />}
            />
            {errors.tag_ids && <p className="text-sm text-red-500">{errors.tag_ids.message}</p>}
          </div>

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
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? (initialData ? "Saving..." : "Creating...") : initialData ? "Save Changes" : "Create Post"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
