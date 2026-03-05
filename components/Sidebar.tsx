'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'

// ── Inline SVG icons ─────────────────────────────────────────────────────────

function IconGrid() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  )
}

function IconPlus() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

function IconClipboard() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
      <rect x="9" y="3" width="6" height="4" rx="1" />
      <path d="M9 12h6M9 16h4" />
    </svg>
  )
}

function IconWarning() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <path d="M12 9v4M12 17h.01" />
    </svg>
  )
}

function IconChart() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  )
}

function IconUsers() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function IconPerson() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="7" r="4" />
      <path d="M4 21v-2a8 8 0 0 1 16 0v2" />
    </svg>
  )
}

function IconShield() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  )
}

function IconBell() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  )
}

function IconSignOut() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  )
}

// ── Nav item type ─────────────────────────────────────────────────────────────

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  /** If set, only roles in this array can see this item */
  roles?: string[]
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard',      href: '/dashboard',                     icon: <IconGrid /> },
  { label: 'New Evaluation', href: '/dashboard/reviews/new',         icon: <IconPlus /> },
  { label: 'Review Log',     href: '/dashboard/reviews',             icon: <IconClipboard /> },
  { label: 'Error Log',      href: '/dashboard/errors',              icon: <IconWarning /> },
  { label: 'Performance',    href: '/dashboard/performance',         icon: <IconChart /> },
  { label: 'Team Dashboard', href: '/dashboard/team',                icon: <IconUsers /> },
  { label: 'My Evaluations', href: '/dashboard/my-evaluations',      icon: <IconPerson />,  roles: ['AGENT'] },
  { label: 'Admin',          href: '/dashboard/admin',               icon: <IconShield />,  roles: ['ADMIN', 'MANAGER'] },
  { label: 'Notifications',  href: '/dashboard/admin/notifications', icon: <IconBell />,    roles: ['ADMIN', 'MANAGER'] },
]

// ── Role badge colour map ─────────────────────────────────────────────────────

const ROLE_COLOURS: Record<string, { bg: string; text: string; label: string }> = {
  ADMIN:   { bg: 'rgba(240, 64, 96, 0.15)',   text: '#F04060', label: 'Admin' },
  MANAGER: { bg: 'rgba(245, 166, 35, 0.15)',  text: '#F5A623', label: 'Manager' },
  ANALYST: { bg: 'rgba(14, 196, 168, 0.15)',  text: '#0EC4A8', label: 'Analyst' },
  AGENT:   { bg: 'rgba(124, 58, 237, 0.15)',  text: '#7C3AED', label: 'Agent' },
}

// ── Sidebar component ─────────────────────────────────────────────────────────

export default function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()

  const role = (session?.user as any)?.role as string | undefined
  const name = session?.user?.name ?? 'User'

  const roleStyle = role ? (ROLE_COLOURS[role] ?? ROLE_COLOURS['AGENT']) : ROLE_COLOURS['AGENT']

  function isActive(href: string): boolean {
    if (href === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname.startsWith(href)
  }

  const visibleItems = NAV_ITEMS.filter((item) => {
    if (!item.roles) return true
    return role ? item.roles.includes(role) : false
  })

  return (
    <aside
      className="fixed top-0 left-0 h-screen flex flex-col z-30"
      style={{
        width: '240px',
        backgroundColor: '#0C1220',
        borderRight: '1px solid #1E2A3A',
      }}
    >
      {/* ── Logo area ── */}
      <div
        className="flex flex-col px-5 pt-6 pb-5"
        style={{ borderBottom: '1px solid #1E2A3A' }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #0EC4A8 100%)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2L22 7.5V16.5L12 22L2 16.5V7.5L12 2Z"
                stroke="white"
                strokeWidth="2"
                strokeLinejoin="round"
              />
              <path
                d="M8.5 12L11 14.5L15.5 10"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold leading-none" style={{ color: '#7C3AED' }}>
              BizQuality
            </p>
            <p className="text-[10px] font-medium mt-0.5" style={{ color: '#6B7280' }}>
              Bizcuits QA
            </p>
          </div>
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {visibleItems.map((item) => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group"
              style={{
                backgroundColor: active ? 'rgba(124, 58, 237, 0.18)' : 'transparent',
                color: active ? '#A78BFA' : '#9CA3AF',
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.backgroundColor = 'rgba(124, 58, 237, 0.08)'
                  e.currentTarget.style.color = '#D1D5DB'
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.color = '#9CA3AF'
                }
              }}
            >
              {/* Icon */}
              <span
                className="shrink-0 transition-colors duration-150"
                style={{ color: active ? '#7C3AED' : '#6B7280' }}
              >
                {item.icon}
              </span>

              {/* Label */}
              <span className="truncate">{item.label}</span>

              {/* Active indicator dot */}
              {active && (
                <span
                  className="ml-auto w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: '#7C3AED' }}
                />
              )}
            </Link>
          )
        })}
      </nav>

      {/* ── User section ── */}
      <div
        className="px-3 py-4"
        style={{ borderTop: '1px solid #1E2A3A' }}
      >
        {/* User info */}
        <div className="flex items-center gap-3 px-3 py-2.5 mb-2">
          {/* Avatar */}
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold text-white"
            style={{ backgroundColor: '#7C3AED' }}
          >
            {name.charAt(0).toUpperCase()}
          </div>

          {/* Name + role */}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate leading-tight">
              {name}
            </p>
            {role && (
              <span
                className="inline-block mt-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-md leading-none"
                style={{
                  backgroundColor: roleStyle.bg,
                  color: roleStyle.text,
                }}
              >
                {roleStyle.label}
              </span>
            )}
          </div>
        </div>

        {/* Sign out button */}
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150"
          style={{ color: '#6B7280' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(240, 64, 96, 0.10)'
            e.currentTarget.style.color = '#F04060'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
            e.currentTarget.style.color = '#6B7280'
          }}
        >
          <IconSignOut />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  )
}
