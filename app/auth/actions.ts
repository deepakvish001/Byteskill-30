"use server"

import { createClient } from "@/lib/supabase/server"
import { z } from "zod"
import type { SignupFormState } from "@/lib/types" // Ensure Database is imported

// Zod schema for validation
const SignupFormSchema = z
  .object({
    username: z
      .string()
      .min(3, { message: "Username must be at least 3 characters." })
      .max(20, { message: "Username must be at most 20 characters." })
      .regex(/^[a-zA-Z0-9_]+$/, {
        message: "Username can only contain letters, numbers, and underscores.",
      }),
    email: z.string().email({ message: "Please enter a valid email." }),
    mobile_number: z
      .string()
      .min(10, { message: "Mobile number must be at least 10 digits." })
      .regex(/^\+?[0-9\s-()]+$/, { message: "Please enter a valid mobile number." }), // Basic regex, can be improved
    full_name: z.string().min(2, { message: "Full name must be at least 2 characters." }),
    password: z.string().min(8, { message: "Password must be at least 8 characters." }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"], // Error applies to confirmPassword field
  })

export async function signupUser(prevState: SignupFormState | undefined, formData: FormData): Promise<SignupFormState> {
  const supabase = createClient() // createServerComponentClient<Database>({ cookies })

  const validatedFields = SignupFormSchema.safeParse({
    username: formData.get("username"),
    email: formData.get("email"),
    mobile_number: formData.get("mobile_number"),
    full_name: formData.get("full_name"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Validation failed. Please check the fields.",
      success: false,
    }
  }

  const { email, password, username, full_name, mobile_number } = validatedFields.data

  // 1. Sign up the user with Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // You can pass additional data here if your handle_new_user trigger uses it,
      // but we'll update the profile separately for more control.
      // data: {
      //   username: username, // Supabase Auth itself doesn't store username directly this way
      //   full_name: full_name,
      // }
    },
  })

  if (authError) {
    console.error("Supabase Auth Error:", authError)
    return {
      errors: { _form: [authError.message] },
      message: `Signup failed: ${authError.message}`,
      success: false,
    }
  }

  if (!authData.user) {
    return {
      errors: { _form: ["User not created after signup."] },
      message: "Signup failed: User data not returned.",
      success: false,
    }
  }

  // 2. Update the user's profile in the 'profiles' table
  // The handle_new_user trigger will have created a basic profile. We update it.
  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      username,
      full_name,
      mobile_number,
      updated_at: new Date().toISOString(),
    })
    .eq("id", authData.user.id)

  if (profileError) {
    console.error("Supabase Profile Update Error:", profileError)
    // If profile update fails, the user is created in auth but profile is incomplete.
    // This is a partial success. You might want to handle this differently,
    // e.g., by trying to delete the auth user or flagging the profile for completion.
    // For now, we'll inform the user.
    return {
      // message: "Account created, but profile update failed. Please complete your profile later.",
      // success: true, // Or false, depending on how critical profile update is
      errors: { _form: [`Profile update failed: ${profileError.message}`] },
      message: `Account created, but profile update failed: ${profileError.message}. Please try updating your profile manually.`,
      success: false, // Treat as overall failure for now if profile doesn't update
    }
  }
  return {
    message: "Signup successful! Please check your email to confirm your account.",
    success: true,
  }
}
