import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

// This function can be marked `async` if using `await` inside
export async function middleware(request: NextRequest) {
  const supabase = createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const { pathname } = request.nextUrl

  // Auth-protected routes
  const protectedRoutes = ["/me", "/admin"]
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route))

  if (isProtectedRoute && !session) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    url.searchParams.set("message", "Please log in to access this page.")
    return NextResponse.redirect(url)
  }

  // If user is logged in and tries to access login/signup, redirect to home
  if (session && (pathname === "/login" || pathname === "/signup")) {
    const url = request.nextUrl.clone()
    url.pathname = "/"
    return NextResponse.redirect(url)
  }

  const response = NextResponse.next()

  // --- CSP Implementation ---
  const supabasePublicUrlString = process.env.NEXT_PUBLIC_SUPABASE_URL
  let supabaseHostname = ""
  if (supabasePublicUrlString) {
    try {
      const url = new URL(supabasePublicUrlString)
      supabaseHostname = url.hostname // e.g., your-project-ref.supabase.co
    } catch (e) {
      console.error("CSP Middleware: Invalid NEXT_PUBLIC_SUPABASE_URL", e)
    }
  }

  const kvUrlString = process.env.KV_URL
  let kvHostname = ""
  if (kvUrlString) {
    try {
      const url = new URL(kvUrlString)
      kvHostname = url.hostname
    } catch (e) {
      console.error("CSP Middleware: Invalid KV_URL", e)
    }
  }

  const policies: Record<string, string[]> = {
    "default-src": ["'self'"],
    "script-src": [
      "'self'",
      "'unsafe-inline'", // Next.js needs this for inline scripts for hydration, page scripts.
      "'unsafe-eval'", // Next.js dev mode, some libraries might need this. Aim to remove/reduce in prod.
      "https://vitals.vercel-insights.com", // Vercel Speed Insights
    ],
    "style-src": [
      "'self'",
      "'unsafe-inline'", // Required for Tailwind, shadcn/ui, and other dynamically injected styles.
    ],
    "img-src": [
      "'self'",
      "data:", // For inline SVGs, base64 images (e.g. blur placeholders)
      "https://*.vercel-storage.com", // For Vercel Blob if used directly
    ],
    "font-src": ["'self'", "data:"], // data: for inline fonts if any
    "connect-src": [
      "'self'",
      "https://vitals.vercel-insights.com", // Vercel Speed Insights
    ],
    "frame-src": ["'self'"], // If any parts of the app are framed, or for OAuth iframes
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"], // Prevent clickjacking
    // 'report-uri': ["/api/csp-reports"], // Uncomment to enable reporting
  }

  if (supabaseHostname) {
    // Supabase JS SDK might be loaded from its domain or bundled. If from domain, add here.
    // policies['script-src'].push(supabaseHostname);
    policies["img-src"].push(supabaseHostname) // For images from Supabase storage
    policies["connect-src"].push(supabaseHostname) // For Supabase API
    policies["connect-src"].push(`wss://${supabaseHostname}`) // For Supabase Realtime
    policies["frame-src"].push(supabaseHostname) // For Supabase Auth UI if it uses iframes
  }

  if (kvHostname) {
    policies["connect-src"].push(kvHostname) // For Vercel KV
  }

  // Add any other specific domains required by your application
  // For example, if you use a CDN for certain assets:
  // policies['script-src'].push('https://some-cdn.com');
  // policies['img-src'].push('https://some-cdn.com');

  const cspHeaderValue = Object.entries(policies)
    .map(([key, valueArray]) => `${key} ${valueArray.join(" ")}`)
    .join("; ")

  // Start with Report-Only to test without breaking the site
  response.headers.set("Content-Security-Policy-Report-Only", cspHeaderValue)
  // Once confirmed, switch to:
  // response.headers.set('Content-Security-Policy', cspHeaderValue);

  return response
}

// Ensure the middleware is only called for relevant paths.
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder assets (images/, logo.png, etc.)
     * This matcher ensures CSP headers are applied to HTML documents,
     * not typically to the static assets themselves.
     */
    "/((?!_next/static|_next/image|favicon.ico|images/|logo.png|projects/|blog/|team/|favicon-16x16.png|apple-touch-icon.png|generic-hero.png|sample-post-1.png|sample-post-2.png|sample-post-3.png|project-thumbnail.png|related-project.png|related-projects.png|abstract-user-avatar-1.png|abstract-user-avatar-2.png|abstract-user-avatar-3.png).*)",
  ],
}
