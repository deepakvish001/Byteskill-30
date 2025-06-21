import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createServerClient, type CookieOptions } from "@supabase/ssr" // Use @supabase/ssr

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({
    request: {
      headers: new Headers(req.headers), // Clone headers
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          // If the cookie is set, update both the request and response cookies
          req.cookies.set({ name, value, ...options })
          res = NextResponse.next({
            // Re-create response to apply cookie changes
            request: {
              headers: new Headers(req.headers),
            },
          })
          res.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          // If the cookie is removed, update both the request and response cookies
          req.cookies.set({ name, value: "", ...options })
          res = NextResponse.next({
            // Re-create response to apply cookie changes
            request: {
              headers: new Headers(req.headers),
            },
          })
          res.cookies.set({ name, value: "", ...options })
        },
      },
    },
  )

  // Refresh session if expired - important for Server Components
  // getUser() is preferred as it refreshes and returns the user
  // getSession() also works but getUser() is more direct if you need the user object
  await supabase.auth.getUser()

  return res
}

// Ensure the middleware is only called for relevant paths.
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - /auth (auth routes like callback, login, signup)
     * - /api (API routes)
     */
    "/((?!_next/static|_next/image|favicon.ico|auth/.*|api/.*).*)",
  ],
}
