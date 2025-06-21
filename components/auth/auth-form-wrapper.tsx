"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Github, Loader2 } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface AuthFormWrapperProps {
  title: string
  description: string
  children: React.ReactNode
  footerText: string
  footerLinkHref: string
  footerLinkText: string
  showGithubLogin?: boolean
  onGithubSignIn?: () => Promise<void> | void
}

export function AuthFormWrapper({
  title,
  description,
  children,
  footerText,
  footerLinkHref,
  footerLinkText,
  showGithubLogin = false,
  onGithubSignIn,
}: AuthFormWrapperProps) {
  const [isGithubLoading, setIsGithubLoading] = useState(false)

  const handleGithubSignInClick = async () => {
    if (onGithubSignIn) {
      setIsGithubLoading(true)
      try {
        await onGithubSignIn()
      } catch (error) {
        console.error("GitHub sign-in error:", error)
        setIsGithubLoading(false)
      }
    }
  }

  const outlineButtonClasses =
    "bg-neutral-800 border-neutral-700 text-neutral-300 hover:bg-neutral-750 hover:text-green-300 hover:border-neutral-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-900 focus-visible:ring-green-500" // Changed hover:text-green-400 to hover:text-green-300

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-neutral-900 via-neutral-850 to-neutral-900 p-4">
      <Card className="w-full max-w-md bg-neutral-900 border-neutral-700/50 shadow-2xl shadow-green-500/10">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-neutral-100">{title}</CardTitle>
          <CardDescription className="text-neutral-400">{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {children}
          {showGithubLogin && onGithubSignIn && (
            <>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-neutral-700" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-neutral-900 px-2 text-neutral-500">Or continue with</span>
                </div>
              </div>
              <Button
                variant="outline"
                className={cn("w-full", outlineButtonClasses)}
                onClick={handleGithubSignInClick}
                disabled={isGithubLoading}
              >
                {isGithubLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Github className="mr-2 h-4 w-4" />
                )}
                {isGithubLoading ? "Redirecting..." : "GitHub"}
              </Button>
            </>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-neutral-400">
            {footerText}{" "}
            <Link href={footerLinkHref} className="font-medium text-green-400 hover:text-green-300 hover:underline">
              {footerLinkText}
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}

export default AuthFormWrapper
