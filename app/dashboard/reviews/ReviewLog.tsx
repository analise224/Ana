'use client'
import { useState } from 'react'
import { ScoreBadge } from '@/components/ScoreBadge'

interface Agent { id: string; name: string }

interface Review {
  id: string
  caseRef: string
  department: string
  channel: string
  reviewDate: string
  monthKey: string
  scorePercent: number
  cbFlag: boolean
  sbFlag: boolean
  agentAcked: boolean
  agent: Agent
  reviewer: { name: string }
  dispute: { status: string } | null
}

export function ReviewLog({ reviews, agents, userRole }: { reviews: Review[]; agents: Agent[]; userRole: string }) {
  const [filterAgent, setFilterAgent] = useState('')
  const [filterDept, setFilterDept] = useState('')
  const [filterChannel, setFilterChannel] = useState('')
  const [filterMonth, setFilterMonth] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)

  const months = Array.from(new Set(reviews.map((r) => r.monthKey))).sort().reverse()

  const filtered = reviews.filter((r) => {
    if (filterAgent && r.agent.id !== filterAgent) return false
    if (filterDept && r.department !== filterDept) return false
    if (filterChannel && r.channel !== filterChannel) return false
    if (filterMonth && r.monthKey !== filterMonth) return false
    return true
  })

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this review? This cannot be undone.')) return
    setDeleting(id)
    await fetch(`/api/reviews/${id}`, { method: 'DELETE' })
    window.location.reload()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Review Log</h1>
          <p className="text-gray-400 text-sm mt-1">{filtered.length} evaluation{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        <a
          href="/dashboard/reviews/new"
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90"
          style={{ background: '#7C3AED' }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Evaluation
        </a>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        {[
          {
            value: filterAgent,
            onChange: setFilterAgent,
            options: [{ value: '', label: 'All Agents' }, ...agents.map((a) => ({ value: a.id, label: a.name }))],
          },
          {
            value: filterDept,
            onChange: setFilterDept,
            options: [{ value: '', label: 'All Departments' }, ...['CS', 'PnV', 'Compliance'].map((d) => ({ value: d, label: d }))],
          },
          {
            value: filterChannel,
            onChange: setFilterChannel,
            options: [{ value: '', label: 'All Channels' }, ...['Chat', 'Ticket'].map((c) => ({ value: c, label: c }))],
          },
          {
            value: filterMonth,
            onChange: setFilterMonth,
            options: [{ value: '', label: 'All Months' }, ...months.map((m) => ({ value: m, label: m }))],
          },
        ].map((f, i) => (
          <select
            key={i}
            value={f.value}
            onChange={(e) => f.onChange(e.target.value)}
            className="rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            style={{ background: '#0C1220', border: '1px solid #1E2A3A' }}
          >
            {f.options.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: '#1E2A3A' }}>
        <table className="w-full">
          <thead>
            <tr style={{ background: '#0C1220', borderBottom: '1px solid #1E2A3A' }}>
              {['Case Ref', 'Agent', 'Dept', 'Channel', 'Date', 'Score', 'Ack', 'Dispute', 'Flags', userRole === 'ADMIN' ? 'Actions' : ''].filter(Boolean).map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-12 text-center text-gray-500">No reviews found</td>
              </tr>
            ) : (
              filtered.map((r, idx) => (
                <tr
                  key={r.id}
                  style={{ background: idx % 2 === 0 ? '#07090F' : '#0C1220', borderBottom: '1px solid #1E2A3A' }}
                  className="hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-4 py-3 text-sm font-mono text-gray-300">{r.caseRef}</td>
                  <td className="px-4 py-3 text-sm text-white font-medium">{r.agent.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-400">{r.department}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: r.channel === 'Chat' ? 'rgba(14,196,168,0.15)' : 'rgba(124,58,237,0.15)', color: r.channel === 'Chat' ? '#0EC4A8' : '#8B5CF6' }}>
                      {r.channel}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400">{new Date(r.reviewDate).toLocaleDateString()}</td>
                  <td className="px-4 py-3"><ScoreBadge score={r.scorePercent} size="sm" /></td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${r.agentAcked ? 'text-green-400' : 'text-gray-500'}`} style={{ background: r.agentAcked ? 'rgba(16,201,126,0.1)' : '#1E2A3A' }}>
                      {r.agentAcked ? 'Acked' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {r.dispute ? (
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{
                        background: r.dispute.status === 'OPEN' ? 'rgba(245,166,35,0.15)' : r.dispute.status === 'UPHELD' ? 'rgba(16,201,126,0.15)' : 'rgba(240,64,96,0.15)',
                        color: r.dispute.status === 'OPEN' ? '#F5A623' : r.dispute.status === 'UPHELD' ? '#10C97E' : '#F04060',
                      }}>
                        {r.dispute.status}
                      </span>
                    ) : <span className="text-gray-600 text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {r.cbFlag && <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(240,64,96,0.15)', color: '#F04060' }}>CB</span>}
                      {r.sbFlag && <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(245,166,35,0.15)', color: '#F5A623' }}>SB</span>}
                      {!r.cbFlag && !r.sbFlag && <span className="text-gray-600 text-xs">—</span>}
                    </div>
                  </td>
                  {userRole === 'ADMIN' && (
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDelete(r.id)}
                        disabled={deleting === r.id}
                        className="text-xs px-2 py-1 rounded text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                      >
                        {deleting === r.id ? '...' : 'Delete'}
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
