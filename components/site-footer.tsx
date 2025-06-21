import Link from "next/link"
import { siteConfig } from "@/lib/site-config"
import { BrainCircuit, Github, Twitter } from "lucide-react"

export function SiteFooter() {
  const currentYear = new Date().getFullYear()

  const footerNavLinks = [
    { href: "/about", label: "About Us" },
    { href: "/blog", label: "Blog" },
    { href: "/projects", label: "Projects" },
    { href: "/tags", label: "Tags" },
    { href: "/feedback", label: "Feedback" },
  ]

  const legalLinks = [
    { href: "/privacy-policy", label: "Privacy Policy" },
    { href: "/terms-of-service", label: "Terms of Service" },
  ]

  return (
    <footer className="border-t border-neutral-800 bg-neutral-900 text-neutral-400">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Column 1: Branding & Description */}
          <div className="md:col-span-4 lg:col-span-5">
            <Link href="/" className="inline-flex items-center mb-4">
              <BrainCircuit className="h-7 w-7 text-green-400 mr-2" />
              <span className="text-xl font-semibold text-neutral-100">{siteConfig.name}</span>
            </Link>
            <p className="text-sm text-neutral-500 mb-4 max-w-xs">
              {siteConfig.description.substring(0, 150)}
              {siteConfig.description.length > 150 ? "..." : ""}
            </p>
          </div>

          {/* Spacer for layout on medium screens */}
          <div className="hidden md:block md:col-span-1 lg:col-span-1"></div>

          {/* Column 2: Quick Links */}
          <div className="md:col-span-3 lg:col-span-2">
            <h3 className="text-sm font-semibold text-neutral-200 tracking-wider uppercase mb-4">Explore</h3>
            <ul className="space-y-3">
              {footerNavLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm hover:text-green-400 transition-colors duration-150">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Connect & Legal */}
          <div className="md:col-span-4 lg:col-span-3">
            <h3 className="text-sm font-semibold text-neutral-200 tracking-wider uppercase mb-4">Connect & Legal</h3>
            <div className="flex space-x-5 mb-6">
              {siteConfig.links.twitter && (
                <a
                  href={siteConfig.links.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${siteConfig.name} on Twitter`}
                  className="hover:text-green-400 transition-colors duration-150"
                >
                  <Twitter className="h-5 w-5" />
                </a>
              )}
              {siteConfig.links.github && (
                <a
                  href={siteConfig.links.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${siteConfig.name} on GitHub`}
                  className="hover:text-green-400 transition-colors duration-150"
                >
                  <Github className="h-5 w-5" />
                </a>
              )}
            </div>
            <ul className="space-y-3">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm hover:text-green-400 transition-colors duration-150">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar: Copyright */}
        <div className="mt-12 pt-8 border-t border-neutral-800 text-center text-xs">
          <p>
            &copy; {currentYear} {siteConfig.name}. All Rights Reserved.
          </p>
          <p className="mt-1">Designed to share knowledge and inspire.</p>
        </div>
      </div>
    </footer>
  )
}
