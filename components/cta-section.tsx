import Link from "next/link"
import { Button } from "@/components/ui/button"
import { siteConfig } from "@/lib/site-config"

export function CTASection() {
  return (
    // Removed my-12, py-12 can stay if it's for specific background styling within the flow
    // Container div removed
    <section className="py-12 bg-neutral-800/50 rounded-lg">
      <div className="text-center">
        {" "}
        {/* Simple div for text centering, not a full container */}
        <h2 className="text-3xl font-bold tracking-tight text-neutral-100 sm:text-4xl mb-4">Ready to Dive Deeper?</h2>
        <p className="mx-auto max-w-2xl text-lg leading-8 text-neutral-300 mb-8">
          Explore our extensive library of articles, projects, and series. Or, get in touch if you have something
          specific in mind.
        </p>
        <div className="flex items-center justify-center gap-x-6">
          <Button asChild size="lg" className="bg-green-500 hover:bg-green-600 text-neutral-900">
            <Link href="/blog">Explore Content</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="text-neutral-100 border-neutral-100 hover:bg-neutral-700 hover:text-neutral-100"
          >
            <Link href={siteConfig.links.contact || "/feedback"}>Contact Us</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}

export default CTASection
