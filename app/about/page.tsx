import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, BrainCircuit, Code, Cpu, Database, Lightbulb, Layers, Users, BookOpen } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { BackToTopButton } from "@/components/back-to-top-button"
import { siteConfig } from "@/lib/site-config"
import { Timeline, type Milestone } from "@/components/timeline" // Import Timeline and Milestone type
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "About",
  description: `Learn about Byteskill's mission to make complex topics in programming, AI, and data science accessible to everyone.`,
  openGraph: {
    title: `About | ${siteConfig.name}`,
    description: `Learn about Byteskill's mission to make complex topics in programming, AI, and data science accessible to everyone.`,
    url: `${siteConfig.url}/about`,
  },
  twitter: {
    title: `About | ${siteConfig.name}`,
    description: `Learn about Byteskill's mission to make complex topics in programming, AI, and data science accessible to everyone.`,
  },
}

export default function AboutPage() {
  const coreTopics = [
    {
      icon: <Code className="w-6 h-6 mr-3 text-green-400" />,
      name: "Software & Web Development",
      description: "From frontend frameworks to backend architecture and best practices.",
    },
    {
      icon: <Cpu className="w-6 h-6 mr-3 text-green-400" />,
      name: "AI & Machine Learning",
      description: "Demystifying neural networks, NLP, computer vision, and deep learning.",
    },
    {
      icon: <Database className="w-6 h-6 mr-3 text-green-400" />,
      name: "Data Science & Analytics",
      description: "Covering data manipulation, visualization, and statistical modeling.",
    },
    {
      icon: <BrainCircuit className="w-6 h-6 mr-3 text-green-400" />,
      name: "CS Fundamentals",
      description: "Mastering algorithms, data structures, and core computer science principles.",
    },
  ]

  const byteskillJourneyMilestones: Milestone[] = [
    {
      year: "2022",
      title: "Conception & Foundation",
      description:
        "The idea for Byteskill was born: a platform dedicated to clear, practical tech education. Foundational research and planning began.",
      icon: <Lightbulb className="w-5 h-5" />,
    },
    {
      year: "2023",
      title: "Platform Build & Initial Content",
      description:
        "Development of the Byteskill website kicked off, focusing on a clean, accessible user experience. The first batch of articles and tutorials were published.",
      icon: <Layers className="w-5 h-5" />,
    },
    {
      year: "2024",
      title: "Community Growth & Feature Expansion",
      description:
        "Focused on growing our community of learners and contributors. Key features like interactive search, series progression, and enhanced navigation were rolled out.",
      icon: <Users className="w-5 h-5" />,
    },
    {
      year: "2025 & Beyond",
      title: "New Learning Formats & Partnerships",
      description:
        "Planning to introduce new learning formats like video content and interactive courses. Exploring partnerships to broaden our reach and impact.",
      icon: <BookOpen className="w-5 h-5" />,
    },
  ]

  return (
    <div className="bg-neutral-900 text-neutral-300 min-h-screen flex flex-col">
      <main
        id="main-content"
        tabIndex={-1}
        className="container mx-auto px-4 sm:px-6 lg:px-8 flex-grow py-12 outline-none"
      >
        <div className="mb-12">
          <Link href="/" className="inline-flex items-center text-sm text-green-400 hover:underline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to home
          </Link>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <section className="text-center mb-16">
            <h1 className="text-4xl sm:text-5xl font-bold text-neutral-100 mb-4">
              Our Mission: <span className="text-green-400">Clarity in Complexity</span>
            </h1>
            <p className="text-lg text-neutral-400">
              Byteskill was founded on a simple principle: technology education should be accessible, practical, and
              clear. We're here to break down complex topics in software engineering, artificial intelligence, and data
              science into understandable, actionable knowledge.
            </p>
          </section>

          {/* Our Journey Section */}
          <section className="mb-16">
            <h2 className="text-3xl font-semibold text-center text-neutral-100 mb-12">Our Journey</h2>
            <Timeline milestones={byteskillJourneyMilestones} />
          </section>

          {/* What We Cover Section */}
          <section className="mb-16">
            <h2 className="text-3xl font-semibold text-center text-neutral-100 mb-8">What We Cover</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {coreTopics.map((topic) => (
                <div
                  key={topic.name}
                  className="bg-neutral-800/50 p-6 rounded-lg border border-neutral-700/70 flex items-start"
                >
                  <div className="flex-shrink-0 mt-1">{topic.icon}</div>
                  <div>
                    <h3 className="text-lg font-semibold text-neutral-200">{topic.name}</h3>
                    <p className="text-sm text-neutral-400">{topic.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Our Philosophy Section */}
          <section className="mb-16">
            <h2 className="text-3xl font-semibold text-center text-neutral-100 mb-8">Our Philosophy</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
              <div>
                <h3 className="text-xl font-bold text-green-400 mb-2">Fundamentals First</h3>
                <p className="text-neutral-400 text-sm">
                  We believe a strong foundation in core principles is the key to lifelong learning and innovation.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-bold text-green-400 mb-2">Practical Knowledge</h3>
                <p className="text-neutral-400 text-sm">
                  Our content is focused on real-world applications and problem-solving, not just theory.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-bold text-green-400 mb-2">Open & Accessible</h3>
                <p className="text-neutral-400 text-sm">
                  Knowledge should be shared. Our code is open source and our content is free for everyone.
                </p>
              </div>
            </div>
          </section>

          {/* From the Founder Section */}
          <section className="mb-16">
            <h2 className="text-3xl font-semibold text-center text-neutral-100 mb-8">From the Founder</h2>
            <div className="flex flex-col items-center text-center bg-neutral-800/30 p-8 rounded-lg border border-neutral-700/50">
              <Image
                src="/team/deepak-vishwakarma.png"
                alt="Photo of Deepak Vishwakarma"
                width={120}
                height={120}
                className="rounded-full mx-auto mb-4 border-2 border-neutral-600"
              />
              <h4 className="text-xl font-semibold text-neutral-200">Deepak Vishwakarma</h4>
              <p className="text-md text-green-400 mb-4">Founder & Lead Editor</p>
              <p className="text-neutral-400 max-w-md">
                "I started Byteskill to create the resource I wished I had when I was learning to code. My goal is to
                build a community around a shared passion for technology and a commitment to clear, high-quality
                education."
              </p>
            </div>
          </section>

          {/* Join Us Section */}
          <section className="text-center bg-neutral-800/50 p-8 rounded-lg border border-neutral-700/70">
            <h2 className="text-2xl font-semibold text-neutral-100 mb-3">Join Our Community</h2>
            <p className="text-neutral-400 mb-6 max-w-xl mx-auto">
              Stay up to date with the latest articles, projects, and discussions. Follow us on our social channels.
            </p>
            <div className="flex justify-center space-x-4">
              <Link
                href={siteConfig.links.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="text-neutral-400 hover:text-green-400"
                aria-label="Follow on X"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </Link>
              <Link
                href={siteConfig.links.github}
                target="_blank"
                rel="noopener noreferrer"
                className="text-neutral-400 hover:text-green-400"
                aria-label="View on GitHub"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fillRule="evenodd"
                    d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.168 6.839 9.49.5.092.682-.217.682-.482 0-.237-.009-.868-.014-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.031-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.378.203 2.398.1 2.651.64.7 1.03 1.595 1.03 2.688 0 3.848-2.338 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.001 10.001 0 0022 12c0-5.523-4.477-10-10-10z"
                    clipRule="evenodd"
                  />
                </svg>
              </Link>
            </div>
          </section>
        </div>
      </main>

      <footer className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-12 border-t border-neutral-800">
        <div className="flex flex-col sm:flex-row justify-between items-center text-sm">
          <p className="mb-4 sm:mb-0">
            © {new Date().getFullYear()} - {siteConfig.name}
          </p>
          <div className="flex items-center space-x-4">
            <BackToTopButton />
            <ThemeToggle />
          </div>
        </div>
      </footer>
    </div>
  )
}
