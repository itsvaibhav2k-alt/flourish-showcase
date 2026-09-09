'use client'

import * as React from 'react'
import { Heart, Flower2, Mail } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

export type TributeData = {
  isEnabled: boolean
  type: 'honor' | 'memory'
  name: string
  notifyEnabled: boolean
  notifyName: string
  notifyEmail: string
  message: string
}

interface TributeSectionProps {
  value: TributeData
  onChange: (data: TributeData) => void
  errors?: Record<string, string>
}

export function TributeSection({ value, onChange, errors = {} }: TributeSectionProps) {
  const updateField = <K extends keyof TributeData>(field: K, fieldValue: TributeData[K]) => {
    onChange({ ...value, [field]: fieldValue })
  }

  return (
    <div className="space-y-4">
      {/* Toggle tribute */}
      <label className="flex items-center gap-3 cursor-pointer group">
        <Checkbox
          checked={value.isEnabled}
          onCheckedChange={(checked) => updateField('isEnabled', checked === true)}
        />
        <div className="flex items-center gap-2">
          <Heart className="h-4 w-4 text-rose-500" />
          <span className="text-sm font-medium text-neutral-700 group-hover:text-neutral-900">
            Make this gift a tribute
          </span>
        </div>
      </label>

      {value.isEnabled && (
        <div className="pl-7 space-y-5 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Tribute type */}
          <RadioGroup
            value={value.type}
            onValueChange={(v) => updateField('type', v as 'honor' | 'memory')}
            className="flex gap-4"
          >
            <label
              className={`flex items-center gap-3 flex-1 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                value.type === 'honor'
                  ? 'border-primary-300 bg-primary-50'
                  : 'border-neutral-200 hover:border-neutral-300'
              }`}
            >
              <RadioGroupItem value="honor" />
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-rose-500" />
                <div>
                  <p className="font-medium text-neutral-900">In Honor Of</p>
                  <p className="text-xs text-neutral-500">Celebrate someone special</p>
                </div>
              </div>
            </label>

            <label
              className={`flex items-center gap-3 flex-1 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                value.type === 'memory'
                  ? 'border-primary-300 bg-primary-50'
                  : 'border-neutral-200 hover:border-neutral-300'
              }`}
            >
              <RadioGroupItem value="memory" />
              <div className="flex items-center gap-2">
                <Flower2 className="h-5 w-5 text-violet-500" />
                <div>
                  <p className="font-medium text-neutral-900">In Memory Of</p>
                  <p className="text-xs text-neutral-500">Honor someone's memory</p>
                </div>
              </div>
            </label>
          </RadioGroup>

          {/* Honoree name */}
          <div className="space-y-2">
            <Label htmlFor="tributeName">
              {value.type === 'honor' ? 'Honoree Name' : 'Name of Person'}{' '}
              <span className="text-rose-600">*</span>
            </Label>
            <Input
              id="tributeName"
              value={value.name}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder={
                value.type === 'honor'
                  ? 'Enter the name of the person you are honoring'
                  : 'Enter the name of the person you are remembering'
              }
              className={errors.tributeName ? 'border-rose-500' : ''}
            />
            {errors.tributeName && (
              <p className="text-sm text-rose-600">{errors.tributeName}</p>
            )}
          </div>

          {/* Notification option */}
          <div className="space-y-4 p-4 bg-neutral-50 rounded-lg border border-neutral-200">
            <label className="flex items-center gap-3 cursor-pointer">
              <Checkbox
                checked={value.notifyEnabled}
                onCheckedChange={(checked) => updateField('notifyEnabled', checked === true)}
              />
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium text-neutral-700">
                  Send a notification to someone about this tribute
                </span>
              </div>
            </label>

            {value.notifyEnabled && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="notifyName">
                      Recipient Name <span className="text-rose-600">*</span>
                    </Label>
                    <Input
                      id="notifyName"
                      value={value.notifyName}
                      onChange={(e) => updateField('notifyName', e.target.value)}
                      placeholder="Enter recipient's name"
                      className={errors.notifyName ? 'border-rose-500' : ''}
                    />
                    {errors.notifyName && (
                      <p className="text-sm text-rose-600">{errors.notifyName}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notifyEmail">
                      Recipient Email <span className="text-rose-600">*</span>
                    </Label>
                    <Input
                      id="notifyEmail"
                      type="email"
                      value={value.notifyEmail}
                      onChange={(e) => updateField('notifyEmail', e.target.value)}
                      placeholder="Enter recipient's email"
                      className={errors.notifyEmail ? 'border-rose-500' : ''}
                    />
                    {errors.notifyEmail && (
                      <p className="text-sm text-rose-600">{errors.notifyEmail}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tributeMessage">Personal Message (Optional)</Label>
                  <Textarea
                    id="tributeMessage"
                    value={value.message}
                    onChange={(e) => updateField('message', e.target.value)}
                    placeholder="Add a personal message to include in the notification..."
                    rows={3}
                    className="resize-none"
                  />
                  <p className="text-xs text-neutral-500">
                    This message will be included in the email notification.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
