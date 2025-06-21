import { FeedbackForm } from "@/components/feedback-form"
import type { Metadata } from "next"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageSquareText } from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { getAllPosts } from "@/lib/posts"

export const metadata: Metadata = {
  title: "Submit Feedback",
  description: "Provide feedback to help us improve our website.",
}

export default function FeedbackPage() {
  const allPosts = getAllPosts()

  return (
    <>
      <SiteHeader allPosts={allPosts} />
      <div className="container mx-auto max-w-2xl py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold tracking-tight sm:text-4xl flex items-center justify-center gap-2">
              <MessageSquareText className="h-8 w-8 text-neutral-700 dark:text-neutral-300" />
              <span>Submit Feedback</span>
            </CardTitle>
            <CardDescription className="mt-2 text-lg">
              We value your input! Please use the form below to report issues, suggest improvements, or share any
              general comments.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FeedbackForm />
          </CardContent>
        </Card>
      </div>
    </>
  )
}
