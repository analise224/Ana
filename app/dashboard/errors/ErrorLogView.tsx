'use client'
import { useState } from 'react'

interface Agent { id: string; name: string }
interface ErrorEntry {
  id: string
  category: string
  subcategory: string
  count: number
  channel: string
  monthKey: string
  logDate: string
  agent: Agent
}

export function ErrorLogView({ errors, agents }: { errors: ErrorEntry[]; agents: Agent[] }) {
  const [filterAgent, setFilterAgent] = useState('')
  const [filterChannel, setFilterChannel] = useState('')
  const [filterMonth, setFilterMonth] = useState('')
  const [filterCategory, setFilterCategory] = useState('')

  const months = Array.from(new Set(errors.map((e) => e.monthKey))).sort().reverse()
  const categories = Array.from(new Set(errors.map((e) => e.category))).sort()

  const filtered = errors.filter((e) => {
    if (filterAgent && e.agent.id !== filterAgent) return false
    if (filterChannel && e.channel !== filterChannel) return false
    if (filterMonth && e.monthKey !== filterMonth) return false
    if (filterCategory && e.category !== filterCategory) return false
    return true
  })

  const totalCount = filtered.reduce((sum, e) => sum + e.count, 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Error Log</h1>
          <p className="text-gray-400 text-sm mt-1">{filtered.length} entries · {totalCount} total errors</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        {[
          {
            value: filterAgent, onChange: setFilterAgent,
            options: [{ value: '', label: 'All Agents' }, ...agents.map((a) => ({ value: a.id, label: a.name }))],
          },
          {
            value: filterChannel, onChange: setFilterChannel,
            options: [{ value: '', label: 'All Channels' }, ...['Chat', 'Ticket'].map((c) => ({ value: c, label: c }))],
          },
          {
            value: filterMonth, onChange: setFilterMonth,
            options: [{ value: '', label: 'All Months' }, ...months.map((m) => ({ value: m, label: m }))],
          },
          {
            value: filterCategory, onChange: setFilterCategory,
            options: [{ value: '', label: 'All Categories' }, ...categories.map((c) => ({ value: c, label: c }))],
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

      <div className="rounded-xl border overflow-hidden" style={{ borderColor: '#1E2A3A' }}>
        <table className="w-full">
          <thead>
            <tr style={{ background: '#0C1220', borderBottom: '1px solid #1E2A3A' }}>
              {['Agent', 'Channel', 'Month', 'Category', 'Subcategory', 'Count', 'Date'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-gray-500">No error entries found</td>
              </tr>
            ) : (
              filtered.map((e, idx) => (
                <tr
                  key={e.id}
                  style={{ background: idx % 2 === 0 ? '#07090F' : '#0C1220', borderBottom: '1px solid #1E2A3A' }}
                  className="hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-4 py-3 text-sm text-white font-medium">{e.agent.name}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: e.channel === 'Chat' ? 'rgba(14,196,168,0.15)' : 'rgba(124,58,237,0.15)', color: e.channel === 'Chat' ? '#0EC4A8' : '#8B5CF6' }}>
                      {e.channel}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400">{e.monthKey}</td>
                  <td className="px-4 py-3 text-sm text-gray-300">{e.category}</td>
                  <td className="px-4 py-3 text-sm text-gray-400">{e.subcategory}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold" style={{ background: 'rgba(240,64,96,0.15)', color: '#F04060' }}>
                      {e.count}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{new Date(e.logDate).toLocaleDateString()}</td>
                </tr>
              ))
            )}
          </tbody>
          {filtered.length > 0 && (
            <tfoot>
              <tr style={{ background: '#0C1220', borderTop: '1px solid #1E2A3A' }}>
                <td colSpan={5} className="px-4 py-3 text-sm font-medium text-gray-400">Total</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold" style={{ background: 'rgba(240,64,96,0.2)', color: '#F04060' }}>
                    {totalCount}
                  </span>
                </td>
                <td />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  )
}
