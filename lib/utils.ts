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

// Human-friendly relative-time helper (e.g. "5 min ago", "yesterday")
export function timeAgo(input: string | number | Date) {
  const date = typeof input === "string" || typeof input === "number" ? new Date(input) : input
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)

  const intervals: [number, Intl.RelativeTimeFormatUnit][] = [
    [60, "second"],
    [60, "minute"],
    [24, "hour"],
    [7, "day"],
    [4.34524, "week"], // avg. weeks per month
    [12, "month"],
    [Number.POSITIVE_INFINITY, "year"],
  ]

  let value = seconds
  let unit: Intl.RelativeTimeFormatUnit = "second"

  for (const [divisor, nextUnit] of intervals) {
    if (Math.abs(value) < divisor) {
      unit = nextUnit
      break
    }
    value /= divisor
  }

  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" })
  return rtf.format(-Math.round(value), unit)
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
