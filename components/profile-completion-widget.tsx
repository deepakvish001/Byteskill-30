"use client"

import type React from "react"

import type { UserProfile } from "@/lib/types"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  CheckCircle,
  AlertCircle,
  ArrowRight,
  User,
  Briefcase,
  LinkIcon,
  Sparkles,
  Lightbulb,
  MapPin,
} from "lucide-react"

interface ProfileCompletionWidgetProps {
  profile: UserProfile
  className?: string
}

interface CompletionCriterion {
  id: string
  label: string
  isComplete: (profile: UserProfile) => boolean
  suggestion: string
  icon: React.ElementType
  anchor: string // ID of the form section to scroll to
}

const MIN_BIO_LENGTH = 50

const completionCriteria: CompletionCriterion[] = [
  {
    id: "avatar",
    label: "Profile Picture",
    isComplete: (profile) => !!profile.avatar_url,
    suggestion: "Upload a profile picture to make your profile more personal.",
    icon: User,
    anchor: "avatar-section", // Ensure this ID exists in ProfileForm
  },
  {
    id: "fullName",
    label: "Full Name",
    isComplete: (profile) => !!profile.full_name?.trim(),
    suggestion: "Add your full name so people know who you are.",
    icon: User,
    anchor: "personal-info-section",
  },
  {
    id: "bio",
    label: "Bio",
    isComplete: (profile) => !!profile.bio && profile.bio.length >= MIN_BIO_LENGTH,
    suggestion: `Write a bio of at least ${MIN_BIO_LENGTH} characters to tell us more about yourself.`,
    icon: Briefcase,
    anchor: "about-you-section",
  },
  {
    id: "location",
    label: "Location",
    isComplete: (profile) => !!profile.location?.trim(),
    suggestion: "Add your location to connect with others in your area.",
    icon: MapPin,
    anchor: "professional-location-section",
  },
  {
    id: "professionalInfo",
    label: "Job Title or Company",
    isComplete: (profile) => !!profile.job_title?.trim() || !!profile.company?.trim(),
    suggestion: "Add your current job title or company.",
    icon: Briefcase,
    anchor: "professional-location-section",
  },
  {
    id: "socialLinks",
    label: "Professional Link",
    isComplete: (profile) =>
      !!profile.github_username?.trim() || !!profile.linkedin_url?.trim() || !!profile.website?.trim(),
    suggestion: "Add a link to your GitHub, LinkedIn, or personal website.",
    icon: LinkIcon,
    anchor: "online-presence-section",
  },
  {
    id: "skills",
    label: "Skills",
    isComplete: (profile) => !!profile.skills && profile.skills.length > 0,
    suggestion: "Showcase your expertise by adding at least one skill.",
    icon: Sparkles,
    anchor: "skills-interests-section",
  },
  {
    id: "interests",
    label: "Interests",
    isComplete: (profile) => !!profile.interests && profile.interests.length > 0,
    suggestion: "Share your interests to connect with like-minded individuals.",
    icon: Lightbulb,
    anchor: "skills-interests-section",
  },
]

export function ProfileCompletionWidget({ profile, className }: ProfileCompletionWidgetProps) {
  const completedCount = completionCriteria.filter((criterion) => criterion.isComplete(profile)).length
  const totalCriteria = completionCriteria.length
  const completionPercentage = Math.round((completedCount / totalCriteria) * 100)

  const incompleteItems = completionCriteria.filter((criterion) => !criterion.isComplete(profile))

  const scrollToSection = (anchorId: string) => {
    const section = document.getElementById(anchorId)
    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" })
      // Optionally highlight the section briefly
      section.classList.add("ring-2", "ring-green-500", "transition-all", "duration-300", "ease-in-out", "rounded-md")
      setTimeout(() => {
        section.classList.remove("ring-2", "ring-green-500", "rounded-md")
      }, 2000)
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center">
          {completionPercentage === 100 ? (
            <CheckCircle className="h-6 w-6 mr-2 text-green-500" />
          ) : (
            <AlertCircle className="h-6 w-6 mr-2 text-yellow-500" />
          )}
          Profile Completion
        </CardTitle>
        <CardDescription>
          {completionPercentage === 100
            ? "Your profile is looking great! Well done."
            : "Complete your profile to get the most out of our platform."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center mb-4">
          <Progress value={completionPercentage} className="flex-grow h-3" />
          <span className="ml-4 text-lg font-semibold text-neutral-200">{completionPercentage}%</span>
        </div>

        {completionPercentage < 100 && incompleteItems.length > 0 && (
          <div className="mt-6 space-y-3">
            <h4 className="font-medium text-neutral-300">Here's how to improve your profile:</h4>
            <ul className="space-y-2">
              {incompleteItems.slice(0, 3).map(
                (
                  item, // Show first 3 actionable items
                ) => (
                  <li key={item.id} className="flex items-start text-sm">
                    <item.icon className="h-4 w-4 mr-2 mt-0.5 text-yellow-400 flex-shrink-0" />
                    <div className="flex-grow">
                      <span className="text-neutral-300">{item.label}:</span>
                      <span className="text-neutral-400 ml-1">{item.suggestion}</span>
                      <Button
                        variant="link"
                        size="sm"
                        className="p-0 h-auto ml-1 text-green-400 hover:text-green-300"
                        onClick={() => scrollToSection(item.anchor)}
                        aria-label={`Go to ${item.label} section`}
                      >
                        Update <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                  </li>
                ),
              )}
            </ul>
            {incompleteItems.length > 3 && (
              <p className="text-xs text-neutral-500">And {incompleteItems.length - 3} more items...</p>
            )}
          </div>
        )}
        {completionPercentage > 70 && completionPercentage < 100 && (
          <p className="mt-4 text-sm text-green-400">You're almost there! Just a few more details.</p>
        )}
      </CardContent>
    </Card>
  )
}
