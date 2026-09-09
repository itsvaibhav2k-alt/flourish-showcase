import { MarketingHeader } from "@/components/marketing/marketing-header"
import { MarketingFooter } from "@/components/marketing/marketing-footer"

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-white overflow-hidden flex flex-col">
      <MarketingHeader />
      <main className="relative z-10 flex-grow">{children}</main>
      <MarketingFooter />
    </div>
  )
}
