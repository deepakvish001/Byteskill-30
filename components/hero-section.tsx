import Link from "next/link"
import { Button } from "@/components/ui/button"
import { BrainCircuit } from "lucide-react"
import { siteConfig } from "@/lib/site-config"

export function HeroSection() {
  return (
    <section className="py-16 sm:py-24 text-center bg-neutral-900 text-neutral-300">
      {" "}
      {/* Ensure background matches page */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <BrainCircuit className="w-16 h-16 text-green-400 mx-auto mb-6" />
        <h1 className="text-4xl sm:text-5xl font-bold text-neutral-100 mb-6">
          Welcome to <span className="text-green-400">{siteConfig.name}</span>
        </h1>
        <p className="text-lg sm:text-xl text-neutral-400 max-w-2xl mx-auto mb-8">{siteConfig.description}</p>
        <div className="space-x-4">
          <Button asChild size="lg" className="bg-green-500 hover:bg-green-600 text-neutral-900 font-semibold">
            <Link href="/blog">Explore Articles</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="border-green-500 text-green-400 hover:bg-green-500/10 hover:text-green-300"
          >
            <Link href="/projects">View Projects</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
