"use server"

import { z } from "zod"

const contactFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email address"),
  organization: z.string().max(200).optional(),
  subject: z.string().min(1, "Subject is required").max(200),
  message: z.string().min(10, "Message must be at least 10 characters").max(5000),
})

export async function submitContactForm(formData: FormData) {
  try {
    const data = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      organization: formData.get("organization") as string || undefined,
      subject: formData.get("subject") as string,
      message: formData.get("message") as string,
    }

    // Validate the form data
    const validated = contactFormSchema.parse(data)

    // In a production environment, you would:
    // 1. Send an email notification using Resend
    // 2. Store the inquiry in a database
    // 3. Send a confirmation email to the user

    // For now, we'll just log the submission
    console.log("Contact form submission:", {
      ...validated,
      timestamp: new Date().toISOString(),
    })

    // Simulate a slight delay
    await new Promise((resolve) => setTimeout(resolve, 500))

    return { success: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0]
      return { success: false, error: firstError.message }
    }

    console.error("Contact form error:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}
