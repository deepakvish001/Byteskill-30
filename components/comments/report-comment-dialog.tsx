"use client"

import type React from "react"

import { useState } from "react"
import { useFormState, useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { reportContentAction } from "@/app/reports/actions" // Assuming path
import { useToast } from "@/hooks/use-toast"
import { Loader2, Flag } from "lucide-react"
import type { CommentWithProfile } from "@/lib/types" // Or your specific comment type

interface ReportCommentDialogProps {
  comment: CommentWithProfile // Or the specific type of your comment object
  children: React.ReactNode // Trigger element
  onReportSubmitted?: () => void
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending} className="w-full sm:w-auto">
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...
        </>
      ) : (
        <>
          <Flag className="mr-2 h-4 w-4" /> Submit Report
        </>
      )}
    </Button>
  )
}

export function ReportCommentDialog({ comment, children, onReportSubmitted }: ReportCommentDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { toast } = useToast()

  const initialState = { success: false, message: "", errors: {} }
  const [state, formAction] = useFormState(reportContentAction, initialState)

  const handleSubmit = async (formData: FormData) => {
    formData.append("contentId", comment.id)
    formData.append("contentType", "comment")

    // Directly call formAction which is bound to reportContentAction
    await formAction(formData)

    if (state.success) {
      // Check state *after* action has updated it
      toast({ title: "Report Submitted", description: state.message })
      setIsOpen(false)
      if (onReportSubmitted) onReportSubmitted()
    } else if (state.message && !state.success) {
      toast({ title: "Report Failed", description: state.message, variant: "destructive" })
      // Dialog remains open for user to correct errors if any are field-specific
    }
  }

  // Effect to handle state changes from formAction
  // This is important because formAction updates `state` asynchronously.
  // We need to react to the updated `state` to show toasts or close dialog.
  useState(() => {
    if (!state.success && state.message && !isOpen) return // Initial state or dialog closed

    if (state.success) {
      toast({ title: "Report Submitted", description: state.message })
      setIsOpen(false) // Close dialog on success
      if (onReportSubmitted) onReportSubmitted()
    } else if (state.message && !state.success && state.errors?.form) {
      // General form error
      toast({ title: "Report Failed", description: state.message, variant: "destructive" })
    }
    // Field-specific errors will be displayed below the textarea
  }, [state, toast, setIsOpen, onReportSubmitted, isOpen])

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-neutral-850 border-neutral-700">
        <DialogHeader>
          <DialogTitle className="text-neutral-100">Report Comment</DialogTitle>
          <DialogDescription className="text-neutral-400">
            Please provide a reason for reporting this comment. Your report will be reviewed by our moderation team.
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <input type="hidden" name="contentId" value={comment.id} />
          <input type="hidden" name="contentType" value="comment" />
          <div className="grid gap-2">
            <Label htmlFor="reason" className="text-neutral-300">
              Reason for reporting
            </Label>
            <Textarea
              id="reason"
              name="reason"
              placeholder="Describe why you are reporting this comment (min. 10 characters)..."
              className="min-h-[100px] bg-neutral-800 border-neutral-600 text-neutral-200 focus:border-sky-500"
              required
              minLength={10}
              maxLength={1000}
            />
            {state.errors?.reason && <p className="text-xs text-red-400">{state.errors.reason}</p>}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" className="border-neutral-600 text-neutral-300 hover:bg-neutral-700">
                Cancel
              </Button>
            </DialogClose>
            <SubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
