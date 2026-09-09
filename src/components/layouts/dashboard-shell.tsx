'use client'

import * as React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import {
  Users,
  Heart,
  UserPlus,
  MessageSquare,
  Settings,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  LogOut,
  LayoutDashboard,
  BarChart3,
  Sparkles,
  CalendarDays,
  Building2,
  UserPlus2,
  Copy,
  Check,
  DollarSign,
  TrendingUp,
  Kanban,
  Handshake,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { createClient } from '@/lib/supabase/client'
import type { UserRole } from '@/lib/auth/roles'
import type { AddonPageId } from '@/lib/addon-pages/registry'
import { ADDON_PAGE_TEMPLATES } from '@/lib/addon-pages/registry'

// Navigation item type for customization
type NavItemId = 'dashboard' | 'flora' | 'calendar' | 'contacts' | 'donors' | 'prospects' | 'pipeline' | 'sponsorships' | 'donations' | 'volunteers' | 'communications' | 'reports' | 'team-analytics' | 'settings'

// Navigation section type for collapsible groups
type NavSection = 'main' | 'fundraising' | 'engagement' | 'admin'

// Navigation item definitions with keyboard shortcuts and sections
const NAV_DEFINITIONS: Record<NavItemId, {
  name: string
  href: string
  icon: typeof LayoutDashboard
  requiresAdmin?: boolean
  section: NavSection
  shortcut?: string
}> = {
  dashboard: { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, section: 'main', shortcut: '⌘D' },
  flora: { name: 'Flora', href: '/flora', icon: Sparkles, section: 'main', shortcut: '⌘J' },
  calendar: { name: 'Calendar', href: '/calendar', icon: CalendarDays, section: 'main', shortcut: '⌘B' },
  contacts: { name: 'Contacts', href: '/contacts', icon: Users, section: 'engagement' },
  donors: { name: 'Donors', href: '/donors', icon: Heart, section: 'fundraising' },
  prospects: { name: 'Prospects', href: '/prospects', icon: TrendingUp, section: 'fundraising' },
  pipeline: { name: 'Pipeline', href: '/pipeline', icon: Kanban, section: 'fundraising' },
  sponsorships: { name: 'Sponsorships', href: '/sponsorships', icon: Handshake, section: 'fundraising' },
  donations: { name: 'Donations', href: '/donations', icon: DollarSign, section: 'fundraising' },
  volunteers: { name: 'Volunteers', href: '/volunteers', icon: UserPlus, section: 'engagement' },
  communications: { name: 'Communications', href: '/communications', icon: MessageSquare, section: 'engagement' },
  reports: { name: 'Reports', href: '/reports', icon: BarChart3, section: 'admin' },
  'team-analytics': { name: 'Team Analytics', href: '/team-analytics', icon: Users, requiresAdmin: true, section: 'admin' },
  settings: { name: 'Settings', href: '/settings', icon: Settings, requiresAdmin: true, section: 'admin' },
}

// Section labels
const SECTION_LABELS: Record<NavSection, string> = {
  main: '',
  fundraising: 'Fundraising',
  engagement: 'Engagement',
  admin: 'Admin',
}

// Default navigation order (used when no customization is set)
const DEFAULT_NAV_ORDER: NavItemId[] = [
  'dashboard', 'flora', 'calendar', 'contacts', 'donors',
  'prospects', 'pipeline', 'sponsorships', 'donations', 'volunteers',
  'communications', 'reports', 'team-analytics', 'settings',
]

interface UserInfo {
  email: string
  name: string
}

interface DashboardShellProps {
  children: React.ReactNode
  userRole: UserRole | null
  userInfo: UserInfo | null
  organizationName?: string
  organizationId?: string
  visibleNavItems?: NavItemId[]
  enabledAddonIds?: AddonPageId[]
}

export function DashboardShell({ children, userRole, userInfo, organizationName = 'My Organization', organizationId, visibleNavItems, enabledAddonIds = [] }: DashboardShellProps) {
  // Look up addon templates from IDs on client side
  const enabledAddons = React.useMemo(() =>
    enabledAddonIds
      .map(id => ADDON_PAGE_TEMPLATES[id])
      .filter(Boolean),
    [enabledAddonIds]
  )
  const pathname = usePathname()
  const router = useRouter()

  // Build navigation from config or use default, grouped by section
  const navigation = React.useMemo(() => {
    const navOrder = visibleNavItems || DEFAULT_NAV_ORDER
    return navOrder
      .map((id) => ({ id, ...NAV_DEFINITIONS[id] }))
      .filter((item) => item !== undefined)
  }, [visibleNavItems])

  // Group navigation items by section
  const groupedNavigation = React.useMemo(() => {
    const groups: Record<NavSection, typeof navigation> = {
      main: [],
      fundraising: [],
      engagement: [],
      admin: [],
    }
    navigation.forEach((item) => {
      groups[item.section].push(item)
    })
    return groups
  }, [navigation])

  const [sidebarOpen, setSidebarOpen] = React.useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false)
  const [copiedOrgId, setCopiedOrgId] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)
  const [collapsedSections, setCollapsedSections] = React.useState<Record<NavSection, boolean>>({
    main: false,
    fundraising: false,
    engagement: false,
    admin: false,
  })

  // Prevent hydration mismatch from Radix UI useId()
  React.useEffect(() => {
    setMounted(true)
  }, [])

  const toggleSection = (section: NavSection) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  // Keyboard shortcuts handler
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input, textarea, or contenteditable
      const target = e.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return
      }

      // ⌘D - Dashboard (Cmd+D on Mac, Ctrl+D on Windows)
      if ((e.metaKey || e.ctrlKey) && e.key === 'd') {
        e.preventDefault()
        router.push('/dashboard')
        return
      }

      // ⌘J - Flora (Cmd+J on Mac, Ctrl+J on Windows)
      if ((e.metaKey || e.ctrlKey) && e.key === 'j') {
        e.preventDefault()
        router.push('/flora')
        return
      }

      // ⌘B - Calendar (Cmd+B on Mac, Ctrl+B on Windows)
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault()
        router.push('/calendar')
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [router])

  const handleCopyOrgId = async () => {
    if (organizationId) {
      await navigator.clipboard.writeText(organizationId)
      setCopiedOrgId(true)
      setTimeout(() => setCopiedOrgId(false), 2000)
    }
  }

  // Generate initials from a name
  const getInitials = (name: string) => {
    const parts = name.split(' ').filter(Boolean)
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    }
    return name.slice(0, 2).toUpperCase()
  }

  const userInitials = userInfo?.name ? getInitials(userInfo.name) : 'U'
  const orgInitials = getInitials(organizationName)

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  // Helper to render a nav item with Linear-style design
  const renderNavItem = (item: typeof navigation[0]) => {
    const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
    const isAdminOnly = item.requiresAdmin === true
    const isAdmin = userRole === 'admin'

    // Hide admin-only items for non-admins
    if (isAdminOnly && !isAdmin) {
      return null
    }

    return (
      <Link
        key={item.name}
        href={item.href}
        className={cn(
          'group flex items-center gap-3 px-3 py-2 rounded-[8px] text-sm font-medium transition-colors duration-150',
          sidebarCollapsed && 'justify-center px-2',
          isActive
            ? 'bg-neutral-100 text-neutral-900'
            : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
        )}
        onClick={() => setSidebarOpen(false)}
        title={sidebarCollapsed ? item.name : undefined}
      >
        {/* Active indicator - subtle left border */}
        {isActive && !sidebarCollapsed && (
          <span className="nav-active-indicator" />
        )}
        <item.icon className={cn(
          'h-[18px] w-[18px] flex-shrink-0',
          isActive ? 'text-neutral-900' : 'text-neutral-500 group-hover:text-neutral-700'
        )} />
        {!sidebarCollapsed && (
          <>
            <span className="flex-1">{item.name}</span>
            {item.shortcut && (
              <span className="text-[11px] text-neutral-400 font-mono ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                {item.shortcut}
              </span>
            )}
          </>
        )}
      </Link>
    )
  }

  // Helper to render a section with header and collapsible items
  const renderSection = (section: NavSection, items: typeof navigation) => {
    if (items.length === 0) return null

    const isAdmin = userRole === 'admin'
    const visibleItems = items.filter(item => !item.requiresAdmin || isAdmin)
    if (visibleItems.length === 0) return null

    const label = SECTION_LABELS[section]
    const isCollapsed = collapsedSections[section]

    return (
      <div key={section} className="relative">
        {label && !sidebarCollapsed && (
          <button
            onClick={() => toggleSection(section)}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-neutral-400 hover:text-neutral-600 transition-colors"
          >
            <ChevronRight className={cn(
              'h-3 w-3 transition-transform',
              !isCollapsed && 'rotate-90'
            )} />
            {label}
          </button>
        )}
        {(!label || !isCollapsed) && (
          <div className="space-y-0.5">
            {visibleItems.map(renderNavItem)}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-neutral-900/20 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - clean Linear/Notion style */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 bg-white border-r border-neutral-200 transform transition-all duration-200 ease-out lg:translate-x-0',
          sidebarCollapsed ? 'w-16' : 'w-60',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className={cn(
            "flex h-14 items-center border-b border-neutral-100",
            sidebarCollapsed ? "justify-center px-2" : "justify-between px-4"
          )}>
            <Link href="/dashboard" className="flex items-center hover:opacity-80 transition-opacity duration-150">
              {sidebarCollapsed ? (
                <div className="h-7 w-7 rounded-[8px] bg-neutral-900 flex items-center justify-center">
                  <Sparkles className="h-3.5 w-3.5 text-white" />
                </div>
              ) : (
                <Image
                  src="/logo.png"
                  alt="Flourish"
                  width={120}
                  height={30}
                  className="h-7 w-auto"
                  priority
                />
              )}
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-8 w-8"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Organization Selector - cleaner style */}
          <div className={cn(
            "py-3 border-b border-neutral-100",
            sidebarCollapsed ? "px-2" : "px-3"
          )}>
            {mounted ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className={cn(
                    "w-full flex items-center text-sm rounded-[8px] hover:bg-neutral-100 transition-colors duration-150",
                    sidebarCollapsed ? "justify-center p-2" : "justify-between px-2 py-1.5"
                  )}>
                    <div className="flex items-center gap-2.5">
                      <div className="h-7 w-7 rounded-[8px] bg-neutral-900 flex items-center justify-center text-white font-medium text-[11px] flex-shrink-0">
                        {orgInitials}
                      </div>
                      {!sidebarCollapsed && (
                        <span className="font-medium text-neutral-900 truncate max-w-[130px] text-[13px]">{organizationName}</span>
                      )}
                    </div>
                    {!sidebarCollapsed && <ChevronDown className="h-3.5 w-3.5 text-neutral-400 flex-shrink-0" />}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-52">
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="flex items-center cursor-pointer text-sm">
                      <Building2 className="h-4 w-4 mr-2 text-neutral-500" />
                      <span>Organization Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings?tab=team" className="flex items-center cursor-pointer text-sm">
                      <UserPlus2 className="h-4 w-4 mr-2 text-neutral-500" />
                      <span>Invite Team Members</span>
                    </Link>
                  </DropdownMenuItem>
                  {organizationId && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleCopyOrgId} className="cursor-pointer text-sm">
                        {copiedOrgId ? (
                          <Check className="h-4 w-4 mr-2 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4 mr-2 text-neutral-500" />
                        )}
                        <span>{copiedOrgId ? 'Copied!' : 'Copy Organization ID'}</span>
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              // Static placeholder during SSR to prevent hydration mismatch
              <div className={cn(
                "w-full flex items-center text-sm rounded-lg",
                sidebarCollapsed ? "justify-center p-2" : "justify-between px-2 py-1.5"
              )}>
                <div className="flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-md bg-neutral-900 flex items-center justify-center text-white font-medium text-[11px] flex-shrink-0">
                    {orgInitials}
                  </div>
                  {!sidebarCollapsed && (
                    <span className="font-medium text-neutral-900 truncate max-w-[130px] text-[13px]">{organizationName}</span>
                  )}
                </div>
                {!sidebarCollapsed && <ChevronDown className="h-3.5 w-3.5 text-neutral-400 flex-shrink-0" />}
              </div>
            )}
          </div>

          {/* Navigation - grouped by section */}
          <nav className={cn(
            "flex-1 py-3 space-y-4 overflow-y-auto",
            sidebarCollapsed ? "px-2" : "px-2"
          )}>
            {/* Main section (no header) */}
            {renderSection('main', groupedNavigation.main)}

            {/* Fundraising section */}
            {renderSection('fundraising', groupedNavigation.fundraising)}

            {/* Engagement section */}
            {renderSection('engagement', groupedNavigation.engagement)}

            {/* Admin section */}
            {renderSection('admin', groupedNavigation.admin)}

            {/* Add-ons Section */}
            {enabledAddons.length > 0 && (
              <div className="relative">
                {!sidebarCollapsed && (
                  <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-neutral-400">
                    <ChevronRight className="h-3 w-3 rotate-90" />
                    Add-ons
                  </div>
                )}
                <div className="space-y-0.5">
                  {enabledAddons.map((addon) => {
                    const isActive = pathname === `/addon/${addon.id}` || pathname?.startsWith(`/addon/${addon.id}/`)
                    const AddonIcon = addon.icon

                    return (
                      <Link
                        key={addon.id}
                        href={`/addon/${addon.id}`}
                        className={cn(
                          'group flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                          sidebarCollapsed && 'justify-center px-2',
                          isActive
                            ? 'bg-neutral-100 text-neutral-900'
                            : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                        )}
                        onClick={() => setSidebarOpen(false)}
                        title={sidebarCollapsed ? addon.name : undefined}
                      >
                        <AddonIcon className={cn(
                          'h-[18px] w-[18px] flex-shrink-0',
                          isActive ? 'text-neutral-900' : 'text-neutral-500 group-hover:text-neutral-700'
                        )} />
                        {!sidebarCollapsed && <span>{addon.name}</span>}
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}
          </nav>

          {/* User Menu - cleaner style */}
          <div className={cn(
            "border-t border-neutral-100",
            sidebarCollapsed ? "p-2" : "px-3 py-2"
          )}>
            <div className={cn(
              "flex items-center rounded-lg",
              sidebarCollapsed ? "flex-col gap-2" : "gap-2.5 px-2 py-1.5 hover:bg-neutral-100 transition-colors"
            )}>
              {mounted ? (
                <Avatar className="h-7 w-7">
                  <AvatarImage src="" />
                  <AvatarFallback className="bg-neutral-200 text-neutral-700 text-[11px] font-medium">{userInitials}</AvatarFallback>
                </Avatar>
              ) : (
                // Static placeholder during SSR
                <div className="h-7 w-7 rounded-full bg-neutral-200 flex items-center justify-center text-neutral-700 text-[11px] font-medium">
                  {userInitials}
                </div>
              )}
              {!sidebarCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-neutral-900 truncate">
                    {userInfo?.name || 'User'}
                  </p>
                  <p className="text-[11px] text-neutral-500 truncate">
                    {userInfo?.email || ''}
                  </p>
                </div>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-200/50"
                onClick={handleLogout}
                title="Log out"
              >
                <LogOut className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Collapse Toggle Button - subtle */}
          <div className={cn(
            "hidden lg:flex border-t border-neutral-100",
            sidebarCollapsed ? "justify-center p-2" : "justify-end px-3 py-2"
          )}>
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="flex items-center text-neutral-400 hover:text-neutral-600 transition-colors text-xs"
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {sidebarCollapsed ? (
                <PanelLeft className="h-4 w-4" />
              ) : (
                <>
                  <PanelLeftClose className="h-3.5 w-3.5 mr-1.5" />
                  <span className="font-medium">Collapse</span>
                </>
              )}
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className={cn(
        "relative z-10 transition-all duration-200",
        sidebarCollapsed ? "lg:pl-16" : "lg:pl-60"
      )}>
        {/* Mobile header - clean style */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-neutral-200 bg-white px-4 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 -ml-1.5 rounded-lg hover:bg-neutral-100 transition-colors"
          >
            <Menu className="h-5 w-5 text-neutral-600" />
          </button>
          <Link href="/dashboard" className="flex items-center">
            <Image
              src="/logo.png"
              alt="Flourish"
              width={100}
              height={26}
              className="h-6 w-auto"
            />
          </Link>
        </header>

        {/* Page content */}
        <main className="flex-1 relative">{children}</main>
      </div>
    </div>
  )
}
