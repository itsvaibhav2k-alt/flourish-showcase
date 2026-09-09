import { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import '../globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Volunteer Calendar - Flourish',
  description: 'Volunteer shift calendar widget',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

/**
 * Minimal layout for embeddable widgets.
 * - No header/footer
 * - No X-Frame-Options restrictions (allows iframe embedding)
 * - Minimal styling for flexibility
 */
export default function EmbedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="font-sans antialiased bg-transparent m-0 p-0">
        {children}
      </body>
    </html>
  )
}
