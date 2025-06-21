"use client"

import type React from "react"

import { useFormState, useFormStatus } from "react-dom"
import { useForm, Controller, type SubmitHandler } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch" // For toggles
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Camera, Loader2, Save, Trash2 } from "lucide-react"
import { useEffect, useState, useRef } from "react"
import { useToast } from "@/hooks/use-toast"
import type { UserProfile } from "@/lib/types"
import { updateUserProfileAction, deleteUserAvatarAction } from "./actions"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge" // For skills/interests
import { X } from "lucide-react" // For removing tags

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"]

const profileFormSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters.")
    .max(30, "Username must be at most 30 characters.")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores."),
  full_name: z.string().max(100, "Full name must be at most 100 characters.").optional().or(z.literal("")),
  email: z.string().email("Invalid email address."), // Readonly, but good to have for display
  bio: z.string().max(500, "Bio must be at most 500 characters.").optional().or(z.literal("")),
  website: z.string().url("Invalid URL format.").max(100, "Website URL too long.").optional().or(z.literal("")),
  location: z.string().max(100, "Location too long.").optional().or(z.literal("")),
  company: z.string().max(100, "Company name too long.").optional().or(z.literal("")),
  job_title: z.string().max(100, "Job title too long.").optional().or(z.literal("")),
  github_username: z
    .string()
    .max(50, "GitHub username too long.")
    .regex(/^[a-zA-Z0-9-]+$/, { message: "Invalid GitHub username format." })
    .optional()
    .or(z.literal("")),
  twitter_username: z
    .string()
    .max(50, "Twitter username too long.")
    .regex(/^[a-zA-Z0-9_]+$/, { message: "Invalid Twitter username format (no @)." })
    .optional()
    .or(z.literal("")),
  linkedin_url: z.string().url("Invalid LinkedIn URL.").max(200, "LinkedIn URL too long.").optional().or(z.literal("")),
  skills: z.array(z.string().min(1).max(50)).max(20, "Maximum 20 skills allowed.").optional(),
  interests: z.array(z.string().min(1).max(50)).max(20, "Maximum 20 interests allowed.").optional(),
  avatarFile: z
    .any()
    .refine((file) => !file || file.size <= MAX_FILE_SIZE, `Max image size is 5MB.`)
    .refine(
      (file) => !file || ACCEPTED_IMAGE_TYPES.includes(file.type),
      "Only .jpg, .jpeg, .png, .webp and .gif formats are supported.",
    )
    .optional(),
  notification_preferences: z.object({
    new_comment_on_my_post: z.boolean().default(true),
    new_reply_to_my_comment: z.boolean().default(true),
    newsletter: z.boolean().default(true),
    // Add other preferences as needed
  }),
})

type ProfileFormData = z.infer<typeof profileFormSchema>

interface ProfileFormProps {
  userProfile: UserProfile
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending} className="w-full sm:w-auto">
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
        </>
      ) : (
        <>
          <Save className="mr-2 h-4 w-4" /> Save Changes
        </>
      )}
    </Button>
  )
}

export function ProfileForm({ userProfile }: ProfileFormProps) {
  const { toast } = useToast()
  const [updateState, updateFormAction] = useFormState(updateUserProfileAction, {
    success: false,
    message: "",
    errors: {},
  })
  const [deleteAvatarState, deleteAvatarFormAction] = useFormState(deleteUserAvatarAction, {
    success: false,
    message: "",
  })

  const [avatarPreview, setAvatarPreview] = useState<string | null>(userProfile.avatar_url || null)
  const avatarFileRef = useRef<HTMLInputElement>(null)

  const defaultNotificationPrefs = {
    new_comment_on_my_post: true,
    new_reply_to_my_comment: true,
    newsletter: true,
    ...(userProfile.notification_preferences as Record<string, boolean> | undefined), // Spread existing prefs
  }

  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isDirty },
    setValue,
    watch,
    reset,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      username: userProfile.username || "",
      full_name: userProfile.full_name || "",
      email: userProfile.email || "", // Should be readonly
      bio: userProfile.bio || "",
      website: userProfile.website || "",
      location: userProfile.location || "",
      company: userProfile.company || "",
      job_title: userProfile.job_title || "",
      github_username: userProfile.github_username || "",
      twitter_username: userProfile.twitter_username || "",
      linkedin_url: userProfile.linkedin_url || "",
      skills: userProfile.skills || [],
      interests: userProfile.interests || [],
      notification_preferences: defaultNotificationPrefs,
    },
  })

  const watchedSkills = watch("skills", userProfile.skills || [])
  const watchedInterests = watch("interests", userProfile.interests || [])

  useEffect(() => {
    if (updateState?.success) {
      toast({ title: "Profile Updated", description: updateState.message })
      if (updateState.updatedProfile?.avatar_url !== undefined) {
        setAvatarPreview(updateState.updatedProfile.avatar_url)
      }
      // Reset form with new defaults to clear dirty state if needed
      reset({
        ...userProfile, // existing profile data
        ...(updateState.updatedProfile as Partial<ProfileFormData>), // updated fields
        email: userProfile.email, // ensure email is not overwritten if not part of updatedProfile
        notification_preferences: {
          ...defaultNotificationPrefs,
          ...(updateState.updatedProfile?.notification_preferences as Record<string, boolean> | undefined),
        },
      })
    } else if (updateState?.message && !updateState.success) {
      toast({ title: "Update Failed", description: updateState.message, variant: "destructive" })
    }
  }, [updateState, toast, reset, userProfile])

  useEffect(() => {
    if (deleteAvatarState?.success) {
      toast({ title: "Avatar Removed", description: deleteAvatarState.message })
      setAvatarPreview(null)
      setValue("avatarFile", null, { shouldDirty: true }) // Clear file input
    } else if (deleteAvatarState?.message && !deleteAvatarState.success) {
      toast({ title: "Removal Failed", description: deleteAvatarState.message, variant: "destructive" })
    }
  }, [deleteAvatarState, toast, setValue])

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setValue("avatarFile", file, { shouldValidate: true, shouldDirty: true })
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleTagInput = (
    e: React.KeyboardEvent<HTMLInputElement>,
    field: "skills" | "interests",
    currentTags: string[],
  ) => {
    if (e.key === "Enter" && e.currentTarget.value.trim() !== "") {
      e.preventDefault()
      const newTag = e.currentTarget.value.trim()
      if (currentTags.length < 20 && !currentTags.includes(newTag) && newTag.length <= 50) {
        setValue(field, [...currentTags, newTag], { shouldDirty: true })
      }
      e.currentTarget.value = "" // Clear input
    }
  }

  const removeTag = (field: "skills" | "interests", tagToRemove: string, currentTags: string[]) => {
    setValue(
      field,
      currentTags.filter((tag) => tag !== tagToRemove),
      { shouldDirty: true },
    )
  }

  const onSubmit: SubmitHandler<ProfileFormData> = (data) => {
    const formData = new FormData()
    Object.entries(data).forEach(([key, value]) => {
      if (key === "avatarFile" && value instanceof File) {
        formData.append(key, value)
      } else if (key === "skills" || key === "interests") {
        if (Array.isArray(value)) {
          // Send as comma-separated string, or handle as array on server
          formData.append(key, value.join(","))
        }
      } else if (key === "notification_preferences" && typeof value === "object" && value !== null) {
        formData.append(key, JSON.stringify(value)) // Send JSON string
      } else if (value !== undefined && value !== null) {
        formData.append(key, String(value))
      }
    })
    updateFormAction(formData)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {updateState?.message && !updateState.success && !updateState.errors && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{updateState.message}</AlertDescription>
        </Alert>
      )}

      {/* Avatar Section */}
      <div className="flex flex-col items-center sm:flex-row sm:items-end gap-6 p-6 border rounded-lg bg-neutral-800/30">
        <div className="relative">
          <Avatar className="h-32 w-32 ring-2 ring-sky-500 ring-offset-2 ring-offset-neutral-900">
            <AvatarImage src={avatarPreview || undefined} alt={userProfile.username || "User"} />
            <AvatarFallback className="text-3xl bg-neutral-700">
              {userProfile.full_name
                ? userProfile.full_name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                : userProfile.username?.[0]?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="absolute bottom-0 right-0 rounded-full bg-neutral-700 hover:bg-neutral-600 border-neutral-600"
            onClick={() => avatarFileRef.current?.click()}
            title="Change avatar"
          >
            <Camera className="h-5 w-5" />
            <span className="sr-only">Change avatar</span>
          </Button>
          <input
            type="file"
            id="avatarFile"
            {...register("avatarFile")}
            ref={avatarFileRef}
            className="hidden"
            accept={ACCEPTED_IMAGE_TYPES.join(",")}
            onChange={handleAvatarChange}
          />
        </div>
        <div className="flex-grow text-center sm:text-left">
          <h2 className="text-xl font-semibold">{userProfile.full_name || userProfile.username}</h2>
          <p className="text-sm text-neutral-400">@{userProfile.username}</p>
          {avatarPreview &&
            userProfile.avatar_url && ( // Only show remove if there's a current server-side avatar
              <form action={deleteAvatarFormAction} className="mt-2">
                <Button type="submit" variant="ghost" size="sm" className="text-red-500 hover:text-red-400 px-0">
                  <Trash2 className="mr-1.5 h-4 w-4" /> Remove Avatar
                </Button>
              </form>
            )}
          {errors.avatarFile && <p className="text-xs text-red-500 mt-1">{errors.avatarFile.message as string}</p>}
        </div>
      </div>

      {/* Personal Information */}
      <FormSection title="Personal Information">
        <FormField name="username" label="Username" error={errors.username?.message || updateState?.errors?.username}>
          <Input {...register("username")} placeholder="your_username" />
        </FormField>
        <FormField
          name="full_name"
          label="Full Name"
          error={errors.full_name?.message || updateState?.errors?.full_name}
        >
          <Input {...register("full_name")} placeholder="Your Full Name" />
        </FormField>
        <FormField name="email" label="Email Address" error={errors.email?.message}>
          <Input type="email" value={userProfile.email || ""} readOnly disabled className="bg-neutral-800/50" />
          <p className="text-xs text-neutral-500 mt-1">Email cannot be changed here.</p>
        </FormField>
        <FormField name="bio" label="Bio" error={errors.bio?.message}>
          <Textarea {...register("bio")} placeholder="Tell us a little about yourself..." rows={4} />
        </FormField>
      </FormSection>

      {/* Professional & Social Links */}
      <FormSection title="Professional & Social">
        <FormField name="job_title" label="Job Title" error={errors.job_title?.message}>
          <Input {...register("job_title")} placeholder="e.g., Software Engineer" />
        </FormField>
        <FormField name="company" label="Company" error={errors.company?.message}>
          <Input {...register("company")} placeholder="e.g., Acme Corp" />
        </FormField>
        <FormField name="location" label="Location" error={errors.location?.message}>
          <Input {...register("location")} placeholder="e.g., San Francisco, CA" />
        </FormField>
        <FormField name="website" label="Website URL" error={errors.website?.message}>
          <Input {...register("website")} type="url" placeholder="https://yourwebsite.com" />
        </FormField>
        <FormField name="github_username" label="GitHub Username" error={errors.github_username?.message}>
          <Input {...register("github_username")} placeholder="your_github_username" />
        </FormField>
        <FormField name="twitter_username" label="Twitter Username (no @)" error={errors.twitter_username?.message}>
          <Input {...register("twitter_username")} placeholder="your_twitter_handle" />
        </FormField>
        <FormField name="linkedin_url" label="LinkedIn Profile URL" error={errors.linkedin_url?.message}>
          <Input {...register("linkedin_url")} type="url" placeholder="https://linkedin.com/in/yourprofile" />
        </FormField>
      </FormSection>

      {/* Skills & Interests */}
      <FormSection title="Skills & Interests">
        <FormField name="skills" label="Skills" error={errors.skills?.message}>
          <Input
            id="skills-input"
            placeholder="Enter a skill and press Enter"
            onKeyDown={(e) => handleTagInput(e, "skills", watchedSkills)}
            className="mb-2"
          />
          <div className="flex flex-wrap gap-2">
            {watchedSkills.map((skill) => (
              <Badge key={skill} variant="secondary" className="flex items-center gap-1">
                {skill}
                <button type="button" onClick={() => removeTag("skills", skill, watchedSkills)} title="Remove skill">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </FormField>
        <FormField name="interests" label="Interests" error={errors.interests?.message}>
          <Input
            id="interests-input"
            placeholder="Enter an interest and press Enter"
            onKeyDown={(e) => handleTagInput(e, "interests", watchedInterests)}
            className="mb-2"
          />
          <div className="flex flex-wrap gap-2">
            {watchedInterests.map((interest) => (
              <Badge key={interest} variant="secondary" className="flex items-center gap-1">
                {interest}
                <button
                  type="button"
                  onClick={() => removeTag("interests", interest, watchedInterests)}
                  title="Remove interest"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </FormField>
      </FormSection>

      {/* Notification Preferences */}
      <FormSection title="Notification Preferences">
        <Controller
          name="notification_preferences.new_comment_on_my_post"
          control={control}
          render={({ field }) => (
            <ToggleField
              id="new_comment_on_my_post"
              label="New comments on my posts"
              description="Receive an email when someone comments on a blog post you authored."
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          )}
        />
        <Controller
          name="notification_preferences.new_reply_to_my_comment"
          control={control}
          render={({ field }) => (
            <ToggleField
              id="new_reply_to_my_comment"
              label="Replies to my comments"
              description="Receive an email when someone replies to a comment you made."
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          )}
        />
        <Controller
          name="notification_preferences.newsletter"
          control={control}
          render={({ field }) => (
            <ToggleField
              id="newsletter"
              label="Site Newsletter & Announcements"
              description="Receive occasional updates, news, and announcements from us."
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          )}
        />
        {errors.notification_preferences && (
          <p className="text-xs text-red-500">
            {errors.notification_preferences.message || "Error with notification settings."}
          </p>
        )}
      </FormSection>

      <div className="flex justify-end pt-6 border-t border-neutral-700">
        <SubmitButton />
      </div>
    </form>
  )
}

// Helper components for form structure
function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section
      className="space-y-6 p-6 border rounded-lg bg-neutral-800/30"
      id={title.toLowerCase().replace(/\s+/g, "-")}
    >
      <h3 className="text-xl font-semibold text-neutral-100">{title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">{children}</div>
    </section>
  )
}

function FormField({
  name,
  label,
  error,
  children,
  className,
}: {
  name: string
  label: string
  error?: string | string[] | undefined
  children: React.ReactNode
  className?: string
}) {
  const errorText = Array.isArray(error) ? error.join(", ") : error
  return (
    <div className={`space-y-2 ${className || ""}`}>
      <Label htmlFor={name} className={errorText ? "text-red-400" : ""}>
        {label}
      </Label>
      {children}
      {errorText && <p className="text-xs text-red-400">{errorText}</p>}
    </div>
  )
}

function ToggleField({
  id,
  label,
  description,
  checked,
  onCheckedChange,
}: {
  id: string
  label: string
  description: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <div className="flex items-start space-x-3 rounded-md border p-4 bg-neutral-900/50 md:col-span-2">
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
      <div className="space-y-1 leading-none">
        <Label htmlFor={id} className="font-medium">
          {label}
        </Label>
        <p className="text-xs text-neutral-400">{description}</p>
      </div>
    </div>
  )
}
