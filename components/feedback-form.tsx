"use client"

import { useActionState, useEffect, useRef } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { submitFeedback, feedbackSchema, type FeedbackFormData, type FeedbackFormState } from "@/app/feedback/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Terminal } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const initialActionState: FeedbackFormState = {
  message: "",
  type: null,
}

export function FeedbackForm() {
  const [actionState, formAction, isPending] = useActionState(submitFeedback, initialActionState)
  const formRef = useRef<HTMLFormElement>(null) // Still useful for form.reset() via actionState
  const { toast } = useToast()

  const {
    control,
    register,
    handleSubmit,
    reset: resetFormFields, // Renamed to avoid conflict with formRef.current.reset()
    formState: { errors: formErrors }, // Client-side validation errors
  } = useForm<FeedbackFormData>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      // Optional: set default values
      feedbackType: "",
      pageUrl: "",
      description: "",
      email: "",
    },
  })

  useEffect(() => {
    if (actionState.type === "success") {
      resetFormFields() // Reset react-hook-form fields
      toast({
        title: "Feedback Submitted!",
        description: actionState.message,
        variant: "default",
      })
    } else if (actionState.type === "error") {
      toast({
        title: "Submission Error",
        description: actionState.message, // General error message from action
        variant: "destructive",
      })
      // Server-side field errors (e.g. if client-side validation was bypassed or for other specific server errors)
      // Note: react-hook-form's `errors` (formErrors) will primarily show client-side Zod errors.
      // actionState.errors might contain errors if server-side validation (unexpectedly) fails or for other action-specific errors.
    }
  }, [actionState, toast, resetFormFields])

  // This form submission handler will be wrapped by react-hook-form's handleSubmit
  const onFormSubmit = (data: FeedbackFormData) => {
    // data is validated by react-hook-form using Zod
    // We still need to create FormData for the server action
    const formData = new FormData()
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, String(value))
      }
    })
    formAction(formData)
  }

  return (
    // handleSubmit from react-hook-form will validate before calling onFormSubmit
    <form onSubmit={handleSubmit(onFormSubmit)} ref={formRef} className="space-y-6">
      {/* Display general server action errors (not field-specific validation errors from server) */}
      {actionState.type === "error" && actionState.errors?._action && (
        <Alert variant={"destructive"}>
          <Terminal className="h-4 w-4" />
          <AlertTitle>Submission Failed</AlertTitle>
          <AlertDescription>{actionState.errors._action[0]}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="feedbackType">Feedback Type</Label>
        <Controller
          name="feedbackType"
          control={control}
          render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value} required>
              <SelectTrigger
                id="feedbackType"
                aria-invalid={!!formErrors.feedbackType}
                aria-describedby={formErrors.feedbackType ? "feedbackType-client-error" : undefined}
              >
                <SelectValue placeholder="Select a type..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bug">Bug Report</SelectItem>
                <SelectItem value="suggestion">Suggestion</SelectItem>
                <SelectItem value="general">General Comment</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
        {formErrors.feedbackType && (
          <p id="feedbackType-client-error" className="text-sm text-red-500 pt-1">
            {formErrors.feedbackType.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="pageUrl">Page URL (Optional)</Label>
        <Input
          id="pageUrl"
          type="url"
          placeholder="e.g., https://www.example.com/problem-page"
          {...register("pageUrl")}
          aria-invalid={!!formErrors.pageUrl}
          aria-describedby={formErrors.pageUrl ? "pageUrl-client-error" : undefined}
        />
        {formErrors.pageUrl && (
          <p id="pageUrl-client-error" className="text-sm text-red-500 pt-1">
            {formErrors.pageUrl.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Please describe your feedback in detail..."
          rows={5}
          {...register("description")}
          aria-invalid={!!formErrors.description}
          aria-describedby={formErrors.description ? "description-client-error" : undefined}
          required
        />
        {formErrors.description && (
          <p id="description-client-error" className="text-sm text-red-500 pt-1">
            {formErrors.description.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Your Email (Optional, for follow-up)</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          {...register("email")}
          aria-invalid={!!formErrors.email}
          aria-describedby={formErrors.email ? "email-client-error" : undefined}
        />
        {formErrors.email && (
          <p id="email-client-error" className="text-sm text-red-500 pt-1">
            {formErrors.email.message}
          </p>
        )}
      </div>

      <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
        {isPending ? "Submitting..." : "Submit Feedback"}
      </Button>
    </form>
  )
}
