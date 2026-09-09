export function FloraShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-neutral-50/50">
      <main className="max-w-7xl mx-auto px-6 py-6">
        {children}
      </main>
    </div>
  )
}
