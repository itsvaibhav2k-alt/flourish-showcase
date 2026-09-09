import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

interface FloraBreadcrumbProps {
  currentPage: string
}

export function FloraBreadcrumb({ currentPage }: FloraBreadcrumbProps) {
  return (
    <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
      <Link
        href="/flora"
        className="hover:text-gray-700 transition-colors"
      >
        Flora
      </Link>
      <ChevronRight className="h-4 w-4" />
      <span className="text-gray-700">{currentPage}</span>
    </nav>
  )
}
