"use client"

import { useActionState, useEffect } from "react"
import { signupUser } from "@/app/auth/actions"
import type { SignupFormState } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input" // Keep for other inputs
import { Label } from "@/components/ui/label"
import { PasswordInput } from "@/components/password-input" // Import new PasswordInput
import { useRouter } from "next/navigation"

const initialState: SignupFormState = {
  message: "",
  errors: {},
  success: false,
}

export default function SignupForm() {
  const [state, formAction, isPending] = useActionState(signupUser, initialState)
  const router = useRouter()

  useEffect(() => {
    if (state?.success && state.message?.includes("Signup successful")) {
      // Consider a more prominent success message or redirect
      // For example, redirect after a delay:
      // setTimeout(() => router.push('/login?message=Signup successful! Please log in.'), 2000);
    }
  }, [state, router])

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <Label htmlFor="username">Username</Label>
        <Input id="username" name="username" type="text" required />
        {state?.errors?.username && <p className="mt-1 text-xs text-red-500">{state.errors.username.join(", ")}</p>}
      </div>

      <div>
        <Label htmlFor="full_name">Full Name</Label>
        <Input id="full_name" name="full_name" type="text" required />
        {state?.errors?.full_name && <p className="mt-1 text-xs text-red-500">{state.errors.full_name.join(", ")}</p>}
      </div>

      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required />
        {state?.errors?.email && <p className="mt-1 text-xs text-red-500">{state.errors.email.join(", ")}</p>}
      </div>

      <div>
        <Label htmlFor="mobile_number">Mobile Number</Label>
        <Input id="mobile_number" name="mobile_number" type="tel" required />
        {state?.errors?.mobile_number && (
          <p className="mt-1 text-xs text-red-500">{state.errors.mobile_number.join(", ")}</p>
        )}
      </div>

      <div>
        <Label htmlFor="password">Password</Label>
        <PasswordInput id="password" name="password" required /> {/* Use PasswordInput */}
        {state?.errors?.password && <p className="mt-1 text-xs text-red-500">{state.errors.password.join(", ")}</p>}
      </div>

      <div>
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <PasswordInput id="confirmPassword" name="confirmPassword" required /> {/* Use PasswordInput */}
        {state?.errors?.confirmPassword && (
          <p className="mt-1 text-xs text-red-500">{state.errors.confirmPassword.join(", ")}</p>
        )}
      </div>

      <Button
        type="submit"
        className="w-full bg-green-500 text-white hover:bg-green-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-900 focus-visible:ring-green-500"
        disabled={isPending}
      >
        {isPending ? "Signing Up..." : "Sign Up"}
      </Button>

      {state?.message && (
        <p className={`mt-4 text-sm ${state.success ? "text-green-600" : "text-red-600"}`}>{state.message}</p>
      )}
      {state?.errors?._form && <p className="mt-4 text-sm text-red-600">{state.errors._form.join(", ")}</p>}
    </form>
  )
}
