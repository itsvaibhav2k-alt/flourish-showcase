'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { updateDonorInfo, type UpdateDonorInfoInput } from '@/modules/donors/actions/update-donor-info'
import type { Contact } from '@/modules/contacts/schemas/contact.schema'

interface DonorInfoFormProps {
  contact: Contact
  token: string
  onUpdateSuccess?: () => void
}

export function DonorInfoForm({ contact, token, onUpdateSuccess }: DonorInfoFormProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState<UpdateDonorInfoInput>({
    email: contact.email || '',
    phone: contact.phone || '',
    address: {
      street: contact.address?.street || '',
      city: contact.address?.city || '',
      state: contact.address?.state || '',
      zip: contact.address?.zip || '',
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const result = await updateDonorInfo(token, formData)

      if (result.success) {
        setSuccess(true)
        setIsEditing(false)
        onUpdateSuccess?.()

        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(false), 3000)
      } else {
        setError(result.error || 'Failed to update information')
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setError(null)
    setSuccess(false)
    // Reset form to original values
    setFormData({
      email: contact.email || '',
      phone: contact.phone || '',
      address: {
        street: contact.address?.street || '',
        city: contact.address?.city || '',
        state: contact.address?.state || '',
        zip: contact.address?.zip || '',
      },
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Contact Information</CardTitle>
        <CardDescription>
          Keep your information up to date so we can stay in touch
        </CardDescription>
      </CardHeader>
      <CardContent>
        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md text-green-800 text-sm">
            Your information has been updated successfully!
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-800 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name (read-only) */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-700">Name</label>
            <Input
              type="text"
              value={`${contact.first_name} ${contact.last_name}`}
              disabled
              className="bg-neutral-50"
            />
            <p className="text-xs text-neutral-500">
              Contact us to update your name
            </p>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-neutral-700">
              Email
            </label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              disabled={!isEditing}
              className={!isEditing ? 'bg-neutral-50' : ''}
            />
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <label htmlFor="phone" className="text-sm font-medium text-neutral-700">
              Phone
            </label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              disabled={!isEditing}
              className={!isEditing ? 'bg-neutral-50' : ''}
            />
          </div>

          {/* Address */}
          <div className="space-y-2">
            <label htmlFor="street" className="text-sm font-medium text-neutral-700">
              Street Address
            </label>
            <Input
              id="street"
              type="text"
              value={formData.address?.street}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  address: { ...formData.address, street: e.target.value },
                })
              }
              disabled={!isEditing}
              className={!isEditing ? 'bg-neutral-50' : ''}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label htmlFor="city" className="text-sm font-medium text-neutral-700">
                City
              </label>
              <Input
                id="city"
                type="text"
                value={formData.address?.city}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    address: { ...formData.address, city: e.target.value },
                  })
                }
                disabled={!isEditing}
                className={!isEditing ? 'bg-neutral-50' : ''}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="state" className="text-sm font-medium text-neutral-700">
                State
              </label>
              <Input
                id="state"
                type="text"
                value={formData.address?.state}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    address: { ...formData.address, state: e.target.value },
                  })
                }
                disabled={!isEditing}
                className={!isEditing ? 'bg-neutral-50' : ''}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="zip" className="text-sm font-medium text-neutral-700">
                ZIP Code
              </label>
              <Input
                id="zip"
                type="text"
                value={formData.address?.zip}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    address: { ...formData.address, zip: e.target.value },
                  })
                }
                disabled={!isEditing}
                className={!isEditing ? 'bg-neutral-50' : ''}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            {!isEditing ? (
              <Button type="button" onClick={() => setIsEditing(true)}>
                Edit Information
              </Button>
            ) : (
              <>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
              </>
            )}
          </div>
        </form>

        {/* Last Updated */}
        <div className="mt-6 pt-4 border-t border-neutral-200">
          <p className="text-xs text-neutral-500">
            Last updated: {new Date(contact.updated_at).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
            })}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
