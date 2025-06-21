"use client"

import { Twitter, Linkedin, Facebook, Mail, LinkIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast" // Assuming you have this from shadcn/ui

interface SocialShareButtonsProps {
  url: string
  title: string
  className?: string
}

export function SocialShareButtons({ url, title, className }: SocialShareButtonsProps) {
  const { toast } = useToast()

  const encodedUrl = encodeURIComponent(url)
  const encodedTitle = encodeURIComponent(title)

  const shareOptions = [
    {
      name: "Twitter",
      icon: <Twitter className="w-4 h-4" />,
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
      className: "hover:bg-sky-500/20 hover:text-sky-400 border-sky-500/50 text-sky-500",
    },
    {
      name: "LinkedIn",
      icon: <Linkedin className="w-4 h-4" />,
      href: `https://www.linkedin.com/shareArticle?mini=true&url=${encodedUrl}&title=${encodedTitle}`,
      className: "hover:bg-blue-600/20 hover:text-blue-500 border-blue-600/50 text-blue-600",
    },
    {
      name: "Facebook",
      icon: <Facebook className="w-4 h-4" />,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      className: "hover:bg-indigo-600/20 hover:text-indigo-500 border-indigo-600/50 text-indigo-600",
    },
    {
      name: "Email",
      icon: <Mail className="w-4 h-4" />,
      href: `mailto:?subject=${encodedTitle}&body=Check%20out%20this%20article:%20${encodedUrl}`,
      className: "hover:bg-neutral-600/30 hover:text-neutral-300 border-neutral-600/50 text-neutral-400",
    },
  ]

  const copyLink = () => {
    navigator.clipboard
      .writeText(url)
      .then(() => {
        toast({
          title: "Link Copied!",
          description: "The link has been copied to your clipboard.",
          variant: "default",
        })
      })
      .catch((err) => {
        console.error("Failed to copy: ", err)
        toast({
          title: "Copy Failed",
          description: "Could not copy the link. Please try again.",
          variant: "destructive",
        })
      })
  }

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <p className="text-sm font-medium text-neutral-400 mr-2 hidden sm:block">Share:</p>
      {shareOptions.map((option) => (
        <Button
          key={option.name}
          variant="outline"
          size="icon"
          asChild
          className={`rounded-full border ${option.className}`}
          aria-label={`Share on ${option.name}`}
        >
          <a href={option.href} target="_blank" rel="noopener noreferrer">
            {option.icon}
          </a>
        </Button>
      ))}
      <Button
        variant="outline"
        size="icon"
        onClick={copyLink}
        className="rounded-full border border-neutral-600/50 text-neutral-400 hover:bg-neutral-600/30 hover:text-neutral-300"
        aria-label="Copy link"
      >
        <LinkIcon className="w-4 h-4" />
      </Button>
    </div>
  )
}
