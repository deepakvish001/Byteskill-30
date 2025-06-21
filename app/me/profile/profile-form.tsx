"use client"

import type React from "react"
import Image from "next/image"
import { useState, useTransition, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import type { User } from "@supabase/supabase-js"
import type { UserProfile, UpdateUserProfilePayload } from "@/lib/types"
import { updateUserProfile } from "../profile/actions" // Corrected path
import { toast } from "@/components/ui/use-toast"
import { Camera, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

import ReactCrop, { type Crop } from "react-image-crop"
import "react-image-crop/dist/ReactCrop.css"
import { getCroppedImg, centerAspectCrop } from "@/lib/image-utils"

interface ProfileFormProps {
  user: User
  profile: UserProfile // This is the profile data from the server
}

const MAX_BIO_LENGTH = 500

export default function ProfileForm({ user, profile: profileProp }: ProfileFormProps) {
  const [isPending, startTransition] = useTransition()

  // This state represents the last known "saved" state of the profile.
  // It's updated by the profileProp and after a successful save.
  const [currentBaseProfile, setCurrentBaseProfile] = useState<UserProfile>(profileProp)

  // Form field states, initialized from currentBaseProfile
  const [username, setUsername] = useState(currentBaseProfile.username ?? "")
  const [fullName, setFullName] = useState(currentBaseProfile.full_name ?? "")
  const [website, setWebsite] = useState(currentBaseProfile.website ?? "")
  const [bio, setBio] = useState(currentBaseProfile.bio ?? "")
  const [mobileNumber, setMobileNumber] = useState(currentBaseProfile.mobile_number ?? "")

  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(currentBaseProfile.avatar_url ?? null)
  const [isCropperOpen, setIsCropperOpen] = useState(false)
  const [imgSrc, setImgSrc] = useState("")
  const [crop, setCrop] = useState<Crop>()
  const [completedCrop, setCompletedCrop] = useState<Crop>()
  const imgRef = useRef<HTMLImageElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isCropping, setIsCropping] = useState(false)

  const [hasChanges, setHasChanges] = useState(false)

  const outlineButtonClasses =
    "bg-neutral-800 border-neutral-700 text-neutral-300 hover:bg-neutral-750 hover:text-green-400 hover:border-neutral-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:ring-green-500"

  // Effect to synchronize form state when the profileProp changes (e.g., after revalidation)
  useEffect(() => {
    setCurrentBaseProfile(profileProp)
    setUsername(profileProp.username ?? "")
    setFullName(profileProp.full_name ?? "")
    setWebsite(profileProp.website ?? "")
    setBio(profileProp.bio ?? "")
    setMobileNumber(profileProp.mobile_number ?? "")
    setAvatarPreview(profileProp.avatar_url ?? null)
    setAvatarFile(null) // Reset pending file change as we got fresh data
    if (fileInputRef.current) fileInputRef.current.value = ""
  }, [profileProp])

  // Effect to determine if there are any changes compared to the currentBaseProfile
  useEffect(() => {
    const textualChanges =
      username !== (currentBaseProfile.username ?? "") ||
      fullName !== (currentBaseProfile.full_name ?? "") ||
      website !== (currentBaseProfile.website ?? "") ||
      bio !== (currentBaseProfile.bio ?? "") ||
      mobileNumber !== (currentBaseProfile.mobile_number ?? "")

    setHasChanges(textualChanges || avatarFile !== null)
  }, [username, fullName, website, bio, mobileNumber, avatarFile, currentBaseProfile])

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"]
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid File Type",
          description: "Please select an image (JPEG, PNG, GIF, WEBP).",
          variant: "destructive",
        })
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        toast({ title: "File Too Large", description: "Maximum file size is 5MB.", variant: "destructive" })
        return
      }

      setCrop(undefined)
      const reader = new FileReader()
      reader.addEventListener("load", () => setImgSrc(reader.result?.toString() || ""))
      reader.readAsDataURL(file)
      setIsCropperOpen(true)
    }
  }

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget
    setCrop(centerAspectCrop(width, height, 1))
  }

  const handleCropImage = async () => {
    if (!completedCrop || !imgRef.current) {
      toast({ title: "Cropping error", description: "Could not crop image.", variant: "destructive" })
      return
    }
    const originalFile = fileInputRef.current?.files?.[0]
    if (!originalFile) return

    setIsCropping(true)
    try {
      const croppedFile = await getCroppedImg(imgRef.current, completedCrop, originalFile.name)
      if (croppedFile) {
        setAvatarFile(croppedFile)
        setAvatarPreview(URL.createObjectURL(croppedFile))
      }
    } catch (e) {
      console.error("Error cropping image:", e)
      toast({
        title: "Cropping error",
        description: "An unexpected error occurred while cropping.",
        variant: "destructive",
      })
    } finally {
      setIsCropping(false)
      setIsCropperOpen(false)
    }
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!hasChanges) {
      toast({ title: "No changes to save." })
      return
    }

    startTransition(async () => {
      const payload: UpdateUserProfilePayload = {
        username: username !== (currentBaseProfile.username ?? "") ? username : undefined,
        full_name: fullName !== (currentBaseProfile.full_name ?? "") ? fullName : undefined,
        website: website !== (currentBaseProfile.website ?? "") ? website : undefined,
        bio: bio !== (currentBaseProfile.bio ?? "") ? bio : undefined,
        mobile_number: mobileNumber !== (currentBaseProfile.mobile_number ?? "") ? mobileNumber : undefined,
        avatarFile: avatarFile || undefined,
      }

      const filteredPayload = Object.fromEntries(
        Object.entries(payload).filter(([, value]) => value !== undefined),
      ) as UpdateUserProfilePayload

      if (Object.keys(filteredPayload).length === 0 && !avatarFile) {
        // Ensure avatarFile alone can trigger save
        toast({ title: "No changes to save." })
        return
      }

      const result = await updateUserProfile(filteredPayload)

      if (result.success && result.data) {
        toast({ title: "Profile updated successfully!" })
        // Update the base profile to the newly saved data
        setCurrentBaseProfile(result.data)

        // Also update individual form states to reflect the saved data
        // This ensures the form is in sync and hasChanges becomes false
        setUsername(result.data.username ?? "")
        setFullName(result.data.full_name ?? "")
        setWebsite(result.data.website ?? "")
        setBio(result.data.bio ?? "")
        setMobileNumber(result.data.mobile_number ?? "")
        if (result.data.avatar_url) {
          setAvatarPreview(result.data.avatar_url)
        }
        setAvatarFile(null) // Clear pending file
        if (fileInputRef.current) fileInputRef.current.value = ""

        setHasChanges(false) // Explicitly set no changes
      } else {
        toast({
          title: "Error updating profile",
          description: result.error || result.errors?.[0]?.message || "An unknown error occurred.",
          variant: "destructive",
        })
      }
    })
  }

  const requiredAsterisk = <span className="text-red-500 ml-1">*</span>

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative group">
            <Image
              src={avatarPreview || "/placeholder.svg?width=128&height=128&query=avatar"}
              alt="Current avatar"
              width={128}
              height={128}
              className="h-32 w-32 rounded-full object-cover border-2 border-gray-300 dark:border-neutral-700"
            />
            <Label
              htmlFor="avatar"
              className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Camera className="h-8 w-8 text-white" />
              <span className="sr-only">Change avatar</span>
            </Label>
          </div>
          <Input
            id="avatar"
            name="avatar"
            type="file"
            ref={fileInputRef}
            onChange={onSelectFile}
            className="hidden"
            accept="image/png, image/jpeg, image/gif, image/webp"
          />
          <Button
            type="button"
            variant="outline"
            className={cn("text-sm", outlineButtonClasses)}
            onClick={() => fileInputRef.current?.click()}
          >
            Change Avatar
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={user.email ?? ""}
              disabled
              className="mt-1 bg-gray-100 dark:bg-gray-800 dark:border-gray-700"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Email cannot be changed.</p>
          </div>

          <div>
            <Label htmlFor="username">
              Username
              {requiredAsterisk}
            </Label>
            <Input
              id="username"
              name="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1"
              required
            />
          </div>

          <div>
            <Label htmlFor="full_name">
              Full Name
              {requiredAsterisk}
            </Label>
            <Input
              id="full_name"
              name="full_name"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="mobile_number">
              Mobile Number
              {requiredAsterisk}
            </Label>
            <Input
              id="mobile_number"
              name="mobile_number"
              type="tel"
              value={mobileNumber}
              onChange={(e) => setMobileNumber(e.target.value)}
              className="mt-1"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="website">Website</Label>
          <Input
            id="website"
            name="website"
            type="url"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            className="mt-1"
            placeholder="https://example.com"
          />
        </div>

        <div>
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            name="bio"
            rows={4}
            value={bio}
            onChange={(e) => {
              if (e.target.value.length <= MAX_BIO_LENGTH) {
                setBio(e.target.value)
              }
            }}
            className="mt-1"
            placeholder="Tell us a little about yourself."
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 text-right">
            {bio.length}/{MAX_BIO_LENGTH}
          </p>
        </div>

        <Button
          type="submit"
          className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white"
          disabled={isPending || !hasChanges}
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Profile"
          )}
        </Button>
      </form>

      <Dialog open={isCropperOpen} onOpenChange={setIsCropperOpen}>
        <DialogContent className="max-w-md bg-neutral-800 border-neutral-700">
          <DialogHeader>
            <DialogTitle>Crop your new avatar</DialogTitle>
          </DialogHeader>
          {imgSrc && (
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={1}
              minWidth={100}
            >
              <img
                ref={imgRef}
                alt="Crop me"
                src={imgSrc || "/placeholder.svg"}
                onLoad={onImageLoad}
                style={{ maxHeight: "70vh" }}
              />
            </ReactCrop>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCropperOpen(false)} className={outlineButtonClasses}>
              Cancel
            </Button>
            <Button
              onClick={handleCropImage}
              disabled={isCropping || !completedCrop}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isCropping ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cropping...
                </>
              ) : (
                "Crop & Save"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
