import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Returns e.g. "2026-03" for the current month */
function currentMonthKey(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

/** Returns a human-friendly month name, e.g. "March 2026" */
function friendlyMonth(key: string): string {
  const [year, month] = key.split('-')
  const date = new Date(Number(year), Number(month) - 1, 1)
  return date.toLocaleString('en-GB', { month: 'long', year: 'numeric' })
}

// ── KPI data fetcher ──────────────────────────────────────────────────────────

async function getKpis(monthKey: string) {
  const [
    totalReviews,
    scoreAgg,
    aboveTarget,
    openDisputes,
  ] = await Promise.all([
    // Total reviews this month
    prisma.review.count({
      where: { monthKey },
    }),

    // Average score % this month
    prisma.review.aggregate({
      where: { monthKey },
      _avg: { scorePercent: true },
    }),

    // Reviews scoring >= 80% (above target)
    prisma.review.count({
      where: { monthKey, scorePercent: { gte: 80 } },
    }),

    // Open disputes (all time, not just this month)
    prisma.dispute.count({
      where: { status: 'OPEN' },
    }),
  ])

  return {
    totalReviews,
    avgScore: scoreAgg._avg.scorePercent ?? 0,
    aboveTarget,
    openDisputes,
  }
}

// ── KPI card component ────────────────────────────────────────────────────────

interface KpiCardProps {
  title: string
  value: string | number
  subtitle?: string
  accent: string        // colour used for the top border glow and value text
  icon: React.ReactNode
}

function KpiCard({ title, value, subtitle, accent, icon }: KpiCardProps) {
  return (
    <div
      className="relative rounded-2xl p-6 flex flex-col gap-4 overflow-hidden"
      style={{
        backgroundColor: '#0C1220',
        border: '1px solid #1E2A3A',
        boxShadow: '0 4px 24px rgba(0,0,0,0.35)',
      }}
    >
      {/* Subtle top-edge accent glow */}
      <div
        className="absolute top-0 left-6 right-6 h-px rounded-full"
        style={{ backgroundColor: accent, opacity: 0.45 }}
      />

      {/* Header row */}
      <div className="flex items-start justify-between">
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#6B7280' }}>
          {title}
        </p>
        <span
          className="flex items-center justify-center w-9 h-9 rounded-xl"
          style={{ backgroundColor: `${accent}1A`, color: accent }}
        >
          {icon}
        </span>
      </div>

      {/* Value */}
      <div>
        <p className="text-3xl font-bold leading-none" style={{ color: accent }}>
          {value}
        </p>
        {subtitle && (
          <p className="mt-1.5 text-xs" style={{ color: '#6B7280' }}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  )
}

// ── SVG icons ─────────────────────────────────────────────────────────────────

function IconClipboardCheck() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
      <rect x="9" y="3" width="6" height="4" rx="1" />
      <path d="m9 14 2 2 4-4" />
    </svg>
  )
}

function IconTrendUp() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  )
}

function IconStar() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}

function IconAlertCircle() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  const monthKey = currentMonthKey()
  const { totalReviews, avgScore, aboveTarget, openDisputes } = await getKpis(monthKey)

  const userName = session.user?.name ?? 'there'
  const month = friendlyMonth(monthKey)

  // Above-target percentage (of total reviews this month)
  const aboveTargetPct = totalReviews > 0
    ? Math.round((aboveTarget / totalReviews) * 100)
    : 0

  return (
    <div className="max-w-6xl mx-auto space-y-8">

      {/* ── Page header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white leading-tight">
            Welcome back, <span style={{ color: '#7C3AED' }}>{userName}</span>
          </h1>
          <p className="mt-1 text-sm" style={{ color: '#6B7280' }}>
            Here&apos;s your QA overview for <span className="font-medium" style={{ color: '#9CA3AF' }}>{month}</span>
          </p>
        </div>

        {/* Month badge */}
        <div
          className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold"
          style={{
            backgroundColor: 'rgba(124, 58, 237, 0.12)',
            border: '1px solid rgba(124, 58, 237, 0.25)',
            color: '#A78BFA',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          {month}
        </div>
      </div>

      {/* ── Divider ── */}
      <div style={{ height: '1px', backgroundColor: '#1E2A3A' }} />

      {/* ── KPI grid ── */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#6B7280' }}>
          Key Metrics
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <KpiCard
            title="Total Reviews"
            value={totalReviews}
            subtitle={`Completed evaluations in ${month}`}
            accent="#7C3AED"
            icon={<IconClipboardCheck />}
          />

          <KpiCard
            title="Avg Score"
            value={`${avgScore.toFixed(1)}%`}
            subtitle="Mean quality score this month"
            accent="#0EC4A8"
            icon={<IconTrendUp />}
          />

          <KpiCard
            title="Above Target"
            value={aboveTarget}
            subtitle={`${aboveTargetPct}% of reviews scored ≥ 80%`}
            accent="#10C97E"
            icon={<IconStar />}
          />

          <KpiCard
            title="Open Disputes"
            value={openDisputes}
            subtitle="Pending resolution across all months"
            accent={openDisputes > 0 ? '#F04060' : '#10C97E'}
            icon={<IconAlertCircle />}
          />
        </div>
      </div>

      {/* ── Quick links ── */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#6B7280' }}>
          Quick Actions
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              label: 'New Evaluation',
              desc: 'Start a QA review for an agent',
              href: '/dashboard/reviews/new',
              accent: '#7C3AED',
            },
            {
              label: 'Review Log',
              desc: 'Browse all completed evaluations',
              href: '/dashboard/reviews',
              accent: '#0EC4A8',
            },
            {
              label: 'Performance',
              desc: 'Agent and team performance analytics',
              href: '/dashboard/performance',
              accent: '#F5A623',
            },
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="group flex items-center gap-4 rounded-xl px-5 py-4 transition-all duration-150"
              style={{
                backgroundColor: '#0C1220',
                border: '1px solid #1E2A3A',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = item.accent
                e.currentTarget.style.backgroundColor = `${item.accent}0D`
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#1E2A3A'
                e.currentTarget.style.backgroundColor = '#0C1220'
              }}
            >
              <div
                className="w-2 h-8 rounded-full shrink-0"
                style={{ backgroundColor: item.accent }}
              />
              <div>
                <p className="text-sm font-semibold text-white leading-tight group-hover:text-white">
                  {item.label}
                </p>
                <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>
                  {item.desc}
                </p>
              </div>
              <svg
                className="ml-auto shrink-0 opacity-40 group-hover:opacity-100 transition-opacity"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke={item.accent}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 18l6-6-6-6" />
              </svg>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
