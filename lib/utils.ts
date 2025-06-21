import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { siteConfig } from "./site-config" // Import siteConfig

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

// New utility function
export function absoluteUrl(path: string) {
  // Ensure path starts with a slash if it's relative
  const normalizedPath = path.startsWith("/") ? path : `/${path}`
  // Remove trailing slash from siteConfig.url if present, and ensure no double slashes
  const baseUrl = siteConfig.url.replace(/\/$/, "")
  return `${baseUrl}${normalizedPath}`
}

export function slugify(str: string) {
  return str
    .toLowerCase()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w-]+/g, "") // Remove all non-word chars
    .replace(/--+/g, "-") // Replace multiple - with single -
    .replace(/^-+/, "") // Trim - from start of text
    .replace(/-+$/, "") // Trim - from end of text
}

export function unslugify(slug: string) {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

export const GENERIC_BLUR_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mN8XA8AAksBZG7L2GIAAAAASUVORK5CYII="

export const FALLBACK_HEADER_HEIGHT = 72 // Assumed default header height in pixels
