import { cn } from "@/lib/utils"

interface StatItem {
  value: string
  numericValue: number
  suffix: string
  label: string
  description?: string
  color?: "purple" | "teal" | "amber"
}

interface AnimatedStatsProps {
  stats: StatItem[]
  className?: string
}

function StatCard({
  stat,
}: {
  stat: StatItem
}) {
  const colorConfig = {
    purple: {
      bg: "accent-purple-bg",
      text: "text-primary-600",
      border: "accent-purple-border",
    },
    teal: {
      bg: "accent-teal-bg",
      text: "text-teal-600",
      border: "accent-teal-border",
    },
    amber: {
      bg: "accent-amber-bg",
      text: "text-amber-600",
      border: "accent-amber-border",
    },
  }

  const color = stat.color || "purple"
  const colors = colorConfig[color]

  return (
    <div className="relative group h-full">
      <div className={cn(
        "relative p-8 rounded-[16px] h-full border shadow-card",
        colors.bg,
        colors.border,
        "hover:shadow-card-hover transition-shadow duration-150"
      )}>
        <div className="flex justify-center mb-6">
          <span className={cn("text-3xl md:text-4xl font-poppins font-semibold", colors.text)}>
            {stat.value}
          </span>
        </div>

        <h3 className="text-lg md:text-xl font-semibold text-neutral-900 text-center mb-2">
          {stat.label}
        </h3>
        {stat.description && (
          <p className="text-sm text-neutral-600 text-center">{stat.description}</p>
        )}
      </div>
    </div>
  )
}

export function AnimatedStats({ stats, className }: AnimatedStatsProps) {
  return (
    <section className={cn("py-20 md:py-28 relative overflow-hidden", className)}>
      {/* Background */}
      <div className="absolute inset-0 bg-neutral-50" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase bg-primary-100 text-primary-700 mb-4">
            Proven Results
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-instrument-serif font-normal text-neutral-900 mb-4">
            Numbers that <span className="italic text-gradient-primary">speak</span>
          </h2>
          <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
            Join organizations already transforming their operations with Flourish
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto items-stretch">
          {stats.map((stat, index) => (
            <StatCard key={index} stat={stat} />
          ))}
        </div>
      </div>
    </section>
  )
}
