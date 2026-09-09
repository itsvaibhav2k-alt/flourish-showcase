"use client"

import * as React from "react"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface FAQItem {
  question: string
  answer: string
}

interface FAQAccordionProps {
  items: FAQItem[]
  className?: string
}

export function FAQAccordion({ items, className }: FAQAccordionProps) {
  const [openIndex, setOpenIndex] = React.useState<number | null>(0)

  return (
    <div className={cn("space-y-4", className)}>
      {items.map((item, index) => (
        <Collapsible
          key={index}
          open={openIndex === index}
          onOpenChange={(open) => setOpenIndex(open ? index : null)}
        >
          <div className="bg-white rounded-xl border border-neutral-200/60 overflow-hidden">
            <CollapsibleTrigger className="flex items-center justify-between w-full p-5 text-left hover:bg-neutral-50 transition-smooth">
              <span className="font-medium text-neutral-900">{item.question}</span>
              <ChevronDown
                className={cn(
                  "h-5 w-5 text-neutral-400 transition-transform duration-200",
                  openIndex === index && "rotate-180"
                )}
              />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="px-5 pb-5 text-neutral-600 leading-relaxed">
                {item.answer}
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>
      ))}
    </div>
  )
}
