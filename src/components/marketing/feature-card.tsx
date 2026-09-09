import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"

interface FeatureCardProps {
  icon: LucideIcon
  title: string
  description: string
  className?: string
  iconClassName?: string
}

export function FeatureCard({
  icon: Icon,
  title,
  description,
  className,
  iconClassName,
}: FeatureCardProps) {
  return (
    <div
      className={cn(
        "group p-6 bg-white rounded-[16px] border border-neutral-200 shadow-card hover-lift hover:shadow-card-hover",
        className
      )}
    >
      <div
        className={cn(
          "w-12 h-12 rounded-[12px] bg-gradient-icon flex items-center justify-center mb-4",
          iconClassName
        )}
      >
        <Icon className="w-6 h-6 text-primary-600" />
      </div>
      <h3 className="text-lg font-semibold text-neutral-900 mb-2">{title}</h3>
      <p className="text-neutral-600 text-sm leading-relaxed">{description}</p>
    </div>
  )
}
