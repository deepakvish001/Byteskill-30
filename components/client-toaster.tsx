"use client"

import { Toaster as SonnerToaster } from "sonner"

// This component ensures that SonnerToaster is only rendered on the client.
// You can customize the props passed to SonnerToaster here if needed,
// for example, position, richColors, theme, etc.
// Refer to Sonner documentation for available props: https://sonner.emilkowal.ski/
export function ClientToaster() {
  return <SonnerToaster richColors closeButton />
}
