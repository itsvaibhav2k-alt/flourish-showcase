"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { submitContactForm } from "./actions"
import { CheckCircle, Loader2, Send, ArrowRight } from "lucide-react"

export function ContactForm() {
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [isSubmitted, setIsSubmitted] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const formData = new FormData(event.currentTarget)

    try {
      const result = await submitContactForm(formData)
      if (result.success) {
        setIsSubmitted(true)
      } else {
        setError(result.error || "Something went wrong. Please try again.")
      }
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="text-center py-12 px-6 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-xl font-semibold text-neutral-900 mb-2">
          Message sent!
        </h3>
        <p className="text-neutral-600 mb-6 max-w-sm mx-auto">
          Thank you for reaching out. We&apos;ll get back to you within 24-48 hours.
        </p>
        <Button
          variant="outline"
          onClick={() => setIsSubmitted(false)}
          className="group"
        >
          Send another message
          <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Name and Email row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-neutral-700 text-sm font-medium">
            Name <span className="text-primary-500">*</span>
          </Label>
          <Input
            id="name"
            name="name"
            type="text"
            placeholder="Your name"
            required
            disabled={isSubmitting}
            className="h-11 bg-white/80 border-neutral-200 focus:border-primary-300 focus:ring-primary-100 placeholder:text-neutral-400"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email" className="text-neutral-700 text-sm font-medium">
            Email <span className="text-primary-500">*</span>
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="you@example.com"
            required
            disabled={isSubmitting}
            className="h-11 bg-white/80 border-neutral-200 focus:border-primary-300 focus:ring-primary-100 placeholder:text-neutral-400"
          />
        </div>
      </div>

      {/* Organization */}
      <div className="space-y-2">
        <Label htmlFor="organization" className="text-neutral-700 text-sm font-medium">
          Organization
        </Label>
        <Input
          id="organization"
          name="organization"
          type="text"
          placeholder="Your organization name (optional)"
          disabled={isSubmitting}
          className="h-11 bg-white/80 border-neutral-200 focus:border-primary-300 focus:ring-primary-100 placeholder:text-neutral-400"
        />
      </div>

      {/* Subject */}
      <div className="space-y-2">
        <Label htmlFor="subject" className="text-neutral-700 text-sm font-medium">
          Subject <span className="text-primary-500">*</span>
        </Label>
        <Input
          id="subject"
          name="subject"
          type="text"
          placeholder="What's this about?"
          required
          disabled={isSubmitting}
          className="h-11 bg-white/80 border-neutral-200 focus:border-primary-300 focus:ring-primary-100 placeholder:text-neutral-400"
        />
      </div>

      {/* Message */}
      <div className="space-y-2">
        <Label htmlFor="message" className="text-neutral-700 text-sm font-medium">
          Message <span className="text-primary-500">*</span>
        </Label>
        <Textarea
          id="message"
          name="message"
          placeholder="Tell us how we can help..."
          rows={5}
          required
          disabled={isSubmitting}
          className="bg-white/80 border-neutral-200 focus:border-primary-300 focus:ring-primary-100 placeholder:text-neutral-400 resize-none"
        />
      </div>

      {/* Error message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Submit button */}
      <div className="pt-2">
        <Button
          type="submit"
          className="w-full sm:w-auto bg-gradient-primary hover:opacity-90 text-white border-0 shadow-lg shadow-primary-500/20 h-11 px-8"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Send message
            </>
          )}
        </Button>
      </div>

      {/* Privacy notice */}
      <p className="text-xs text-neutral-500 pt-2">
        By submitting this form, you agree to our{" "}
        <a href="/privacy" className="text-primary-600 hover:underline">
          Privacy Policy
        </a>
        .
      </p>
    </form>
  )
}
