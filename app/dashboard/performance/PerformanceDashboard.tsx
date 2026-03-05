'use client'
import { useState, useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, Legend,
} from 'recharts'

interface Agent { id: string; name: string; team: string; department: string }
interface ErrorLog { id: string; category: string; subcategory: string; count: number; channel: string }
interface Review {
  id: string
  monthKey: string
  reviewDate: string
  scorePercent: number
  channel: string
  cbFlag: boolean
  sbFlag: boolean
  agent: Agent
  errorLogs: ErrorLog[]
}

const COLORS = ['#7C3AED', '#0EC4A8', '#F5A623', '#F04060', '#10C97E', '#8B5CF6']

export function PerformanceDashboard({ agents, reviews }: { agents: Agent[]; reviews: Review[] }) {
  const [selectedAgent, setSelectedAgent] = useState(agents[0]?.id ?? '')
  const [selectedMonth, setSelectedMonth] = useState('')

  const months = useMemo(() => {
    return Array.from(new Set(reviews.map((r) => r.monthKey))).sort().reverse()
  }, [reviews])

  const agentReviews = useMemo(
    () => reviews.filter((r) => r.agent.id === selectedAgent),
    [reviews, selectedAgent]
  )

  const filteredReviews = useMemo(
    () => (selectedMonth ? agentReviews.filter((r) => r.monthKey === selectedMonth) : agentReviews),
    [agentReviews, selectedMonth]
  )

  // KPIs
  const avgScore = filteredReviews.length > 0 ? filteredReviews.reduce((s, r) => s + r.scorePercent, 0) / filteredReviews.length : 0
  const targetMet = filteredReviews.filter((r) => r.scorePercent >= 90).length
  const totalErrors = filteredReviews.reduce((s, r) => s + r.errorLogs.reduce((es, e) => es + e.count, 0), 0)
  const cbCount = filteredReviews.filter((r) => r.cbFlag).length
  const sbCount = filteredReviews.filter((r) => r.sbFlag).length

  // Trend: last 6 months
  const trendData = useMemo(() => {
    const last6 = months.slice(0, 6).reverse()
    return last6.map((m) => {
      const mrs = agentReviews.filter((r) => r.monthKey === m)
      const avg = mrs.length > 0 ? mrs.reduce((s, r) => s + r.scorePercent, 0) / mrs.length : null
      return { month: m, score: avg ? parseFloat(avg.toFixed(1)) : null }
    })
  }, [agentReviews, months])

  // Error breakdown by channel
  const buildErrorChart = (channel: string) => {
    const channelErrors = filteredReviews
      .filter((r) => r.channel === channel)
      .flatMap((r) => r.errorLogs.filter((e) => e.channel === channel))

    const catMap: Record<string, number> = {}
    channelErrors.forEach((e) => {
      catMap[e.category] = (catMap[e.category] ?? 0) + e.count
    })

    return Object.entries(catMap)
      .map(([cat, count]) => ({ category: cat, count }))
      .sort((a, b) => b.count - a.count)
  }

  const chatErrors = buildErrorChart('Chat')
  const ticketErrors = buildErrorChart('Ticket')

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Agent Performance</h1>
        <p className="text-gray-400 text-sm mt-1">Individual agent quality metrics and trends</p>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <select
          value={selectedAgent}
          onChange={(e) => setSelectedAgent(e.target.value)}
          className="rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          style={{ background: '#0C1220', border: '1px solid #1E2A3A' }}
        >
          {agents.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          style={{ background: '#0C1220', border: '1px solid #1E2A3A' }}
        >
          <option value="">All Months</option>
          {months.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
        <KpiCard label="Avg Score" value={`${avgScore.toFixed(1)}%`} color={avgScore >= 90 ? '#10C97E' : avgScore >= 70 ? '#F5A623' : '#F04060'} />
        <KpiCard label="Reviews" value={filteredReviews.length.toString()} color="#7C3AED" />
        <KpiCard label="Target Met" value={`${targetMet}/${filteredReviews.length}`} color="#0EC4A8" />
        <KpiCard label="Total Errors" value={totalErrors.toString()} color="#F04060" />
        <KpiCard label="CB Count" value={cbCount.toString()} color="#F5A623" />
        <KpiCard label="SB Count" value={sbCount.toString()} color="#F5A623" />
      </div>

      {/* Score Trend */}
      <div className="rounded-xl border p-5 mb-6" style={{ background: '#0C1220', borderColor: '#1E2A3A' }}>
        <h2 className="text-base font-semibold text-white mb-4">Score Trend (Last 6 Months)</h2>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E2A3A" />
            <XAxis dataKey="month" stroke="#6B7280" tick={{ fontSize: 12 }} />
            <YAxis domain={[0, 100]} stroke="#6B7280" tick={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{ background: '#0C1220', border: '1px solid #1E2A3A', borderRadius: 8 }}
              labelStyle={{ color: '#9CA3AF' }}
              itemStyle={{ color: '#7C3AED' }}
              formatter={(v: any) => [`${v}%`, 'Avg Score']}
            />
            <Line type="monotone" dataKey="score" stroke="#7C3AED" strokeWidth={2} dot={{ fill: '#7C3AED', r: 4 }} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Error Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ErrorBarChart title="Chat Error Breakdown" data={chatErrors} />
        <ErrorBarChart title="Ticket Error Breakdown" data={ticketErrors} />
      </div>
    </div>
  )
}

function KpiCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-xl border p-4" style={{ background: '#0C1220', borderColor: '#1E2A3A' }}>
      <div className="text-xs text-gray-400 mb-1">{label}</div>
      <div className="text-2xl font-bold" style={{ color }}>{value}</div>
    </div>
  )
}

function ErrorBarChart({ title, data }: { title: string; data: { category: string; count: number }[] }) {
  return (
    <div className="rounded-xl border p-5" style={{ background: '#0C1220', borderColor: '#1E2A3A' }}>
      <h2 className="text-base font-semibold text-white mb-4">{title}</h2>
      {data.length === 0 ? (
        <div className="flex items-center justify-center h-32 text-gray-600 text-sm">No errors recorded</div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E2A3A" horizontal={false} />
            <XAxis type="number" stroke="#6B7280" tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="category" stroke="#6B7280" tick={{ fontSize: 11 }} width={100} />
            <Tooltip
              contentStyle={{ background: '#0C1220', border: '1px solid #1E2A3A', borderRadius: 8 }}
              itemStyle={{ color: '#F04060' }}
              formatter={(v: any) => [v, 'Errors']}
            />
            <Bar dataKey="count" radius={[0, 4, 4, 0]}>
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
