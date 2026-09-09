'use client'

import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface SequenceTemplate {
  id: string
  name: string
  description: string
  trigger: string
  steps: number
  duration: string
  icon: string
  color: string
}

interface SequenceTemplatesProps {
  templates: SequenceTemplate[]
  onSelect: (templateId: string) => void
}

export function SequenceTemplates({ templates, onSelect }: SequenceTemplatesProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {templates.map((template) => (
        <motion.div
          key={template.id}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Card
            className="cursor-pointer hover:shadow-md transition-all border-gray-100 overflow-hidden"
            onClick={() => onSelect(template.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className={`text-2xl p-2 rounded-lg ${template.color} bg-opacity-10`}>
                  {template.icon}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{template.name}</h4>
                  <p className="text-sm text-gray-500 mt-1">
                    {template.description}
                  </p>
                  <div className="flex items-center gap-3 mt-3">
                    <Badge variant="secondary" className="text-xs">
                      {template.trigger}
                    </Badge>
                    <span className="text-xs text-gray-400">
                      {template.steps} emails • {template.duration}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}
