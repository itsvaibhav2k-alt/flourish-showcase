import { FloraShell } from '@/modules/flora/components/flora-shell'

export default function FloraLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <FloraShell>{children}</FloraShell>
}
