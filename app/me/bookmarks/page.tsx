import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getSavedBookmarks } from "@/app/bookmarks/actions"
import BookmarksClient from "./bookmarks-client"
import { PageHeader } from "@/components/page-header"

export const metadata = {
  title: "My Bookmarks",
  description: "A collection of your saved posts and projects.",
}

export default async function BookmarksPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login?message=Please log in to view your bookmarks.")
  }

  const { bookmarkedItems, error } = await getSavedBookmarks()

  if (error) {
    // You might want a more user-friendly error display here
    return (
      <div className="container mx-auto px-4 py-8">
        <PageHeader title="My Bookmarks" description="Your saved articles and projects for quick access." />
        <p className="text-destructive text-center mt-8">{error}</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader title="My Bookmarks" description="Your saved articles and projects for quick access." />
      <BookmarksClient initialBookmarkedItems={bookmarkedItems} />
    </div>
  )
}
