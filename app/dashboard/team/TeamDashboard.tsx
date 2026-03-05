'use client'
import { useState, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { ScoreBadge } from '@/components/ScoreBadge'

interface Agent { id: string; name: string; department: string; team: string }
interface Review {
  id: string
  monthKey: string
  scorePercent: number
  department: string
  agent: Agent
  errorLogs: { count: number }[]
}

export function TeamDashboard({ reviews }: { reviews: Review[] }) {
  const [filterDept, setFilterDept] = useState('')
  const [filterMonth, setFilterMonth] = useState('')

  const months = useMemo(() => {
    return Array.from(new Set(reviews.map((r) => r.monthKey))).sort().reverse()
  }, [reviews])

  const filtered = useMemo(() => {
    return reviews.filter((r) => {
      if (filterDept && r.department !== filterDept) return false
      if (filterMonth && r.monthKey !== filterMonth) return false
      return true
    })
  }, [reviews, filterDept, filterMonth])

  // Agent stats
  const agentStats = useMemo(() => {
    const map: Record<string, { name: string; total: number; count: number; above90: number; errors: number }> = {}
    filtered.forEach((r) => {
      if (!map[r.agent.id]) map[r.agent.id] = { name: r.agent.name, total: 0, count: 0, above90: 0, errors: 0 }
      map[r.agent.id].total += r.scorePercent
      map[r.agent.id].count++
      if (r.scorePercent >= 90) map[r.agent.id].above90++
      map[r.agent.id].errors += r.errorLogs.reduce((s, e) => s + e.count, 0)
    })
    return Object.values(map).map((a) => ({
      ...a,
      avg: a.count > 0 ? a.total / a.count : 0,
    })).sort((a, b) => b.avg - a.avg)
  }, [filtered])

  const avgScore = filtered.length > 0 ? filtered.reduce((s, r) => s + r.scorePercent, 0) / filtered.length : 0
  const above90Count = filtered.filter((r) => r.scorePercent >= 90).length
  const totalErrors = filtered.reduce((s, r) => s + r.errorLogs.reduce((es, e) => es + e.count, 0), 0)

  const chartData = agentStats.map((a) => ({ name: a.name.split(' ')[0], avg: parseFloat(a.avg.toFixed(1)) }))

  const top5 = agentStats.slice(0, 5)
  const bottom5 = agentStats.slice(-5).reverse()

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Team Dashboard</h1>
        <p className="text-gray-400 text-sm mt-1">Team-wide performance overview</p>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <select
          value={filterDept}
          onChange={(e) => setFilterDept(e.target.value)}
          className="rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          style={{ background: '#0C1220', border: '1px solid #1E2A3A' }}
        >
          <option value="">All Departments</option>
          {['CS', 'PnV', 'Compliance'].map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <select
          value={filterMonth}
          onChange={(e) => setFilterMonth(e.target.value)}
          className="rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          style={{ background: '#0C1220', border: '1px solid #1E2A3A' }}
        >
          <option value="">All Months</option>
          {months.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard label="Total Reviews" value={filtered.length.toString()} color="#7C3AED" />
        <KpiCard label="Avg Score" value={`${avgScore.toFixed(1)}%`} color={avgScore >= 90 ? '#10C97E' : avgScore >= 70 ? '#F5A623' : '#F04060'} />
        <KpiCard label="Above 90%" value={above90Count.toString()} color="#10C97E" />
        <KpiCard label="Total Errors" value={totalErrors.toString()} color="#F04060" />
      </div>

      {/* Score by Agent Chart */}
      <div className="rounded-xl border p-5 mb-6" style={{ background: '#0C1220', borderColor: '#1E2A3A' }}>
        <h2 className="text-base font-semibold text-white mb-4">Average Score by Agent</h2>
        {chartData.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-gray-600 text-sm">No data available</div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E2A3A" />
              <XAxis dataKey="name" stroke="#6B7280" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} stroke="#6B7280" tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: '#0C1220', border: '1px solid #1E2A3A', borderRadius: 8 }}
                formatter={(v: any) => [`${v}%`, 'Avg Score']}
              />
              <Bar dataKey="avg" radius={[4, 4, 0, 0]}>
                {chartData.map((d, i) => (
                  <Cell key={i} fill={d.avg >= 90 ? '#10C97E' : d.avg >= 70 ? '#F5A623' : '#F04060'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Top/Bottom performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PerformerList title="Top 5 Performers" agents={top5} isTop />
        <PerformerList title="Bottom 5 Performers" agents={bottom5} isTop={false} />
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

function PerformerList({ title, agents, isTop }: { title: string; agents: any[]; isTop: boolean }) {
  return (
    <div className="rounded-xl border p-5" style={{ background: '#0C1220', borderColor: '#1E2A3A' }}>
      <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
        <span>{isTop ? '🏆' : '📉'}</span> {title}
      </h2>
      {agents.length === 0 ? (
        <div className="text-gray-600 text-sm">No data</div>
      ) : (
        <div className="space-y-3">
          {agents.map((a, i) => (
            <div key={a.name} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: '#1E2A3A', color: '#9CA3AF' }}>
                  {i + 1}
                </span>
                <div>
                  <div className="text-sm font-medium text-white">{a.name}</div>
                  <div className="text-xs text-gray-500">{a.count} review{a.count !== 1 ? 's' : ''}</div>
                </div>
              </div>
              <ScoreBadge score={a.avg} size="sm" />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
