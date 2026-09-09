import { cn } from "@/lib/utils"

interface SectionHeaderProps {
  eyebrow?: string
  title: string
  description?: string
  centered?: boolean
  className?: string
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  centered = true,
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn(centered && "text-center", className)}>
      {eyebrow && (
        <p className="font-instrument-sans uppercase tracking-[0.25em] text-sm text-primary-600 mb-4">
          {eyebrow}
        </p>
      )}
      <h2 className="text-3xl md:text-4xl lg:text-5xl font-instrument-serif font-normal text-neutral-900 mb-4">
        {title}
      </h2>
      {description && (
        <p className="text-lg font-instrument-sans text-neutral-600 max-w-2xl mx-auto leading-relaxed">
          {description}
        </p>
      )}
    </div>
  )
}
