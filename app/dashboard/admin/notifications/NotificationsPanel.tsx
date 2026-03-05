'use client'
import { useState } from 'react'
import { ScoreBadge } from '@/components/ScoreBadge'
import { Modal } from '@/components/Modal'

interface Dispute {
  id: string
  agentName: string
  reason: string
  notes: string
  status: 'OPEN' | 'UPHELD' | 'REJECTED'
  adminResponse: string | null
  resolvedAt: string | null
  createdAt: string
  review: {
    id: string
    caseRef: string
    scorePercent: number
    channel: string
    department: string
    agent: { name: string }
  }
}

export function NotificationsPanel({ disputes }: { disputes: Dispute[] }) {
  const [localDisputes, setLocalDisputes] = useState(disputes)
  const [respondTo, setRespondTo] = useState<Dispute | null>(null)
  const [response, setResponse] = useState('')
  const [resolution, setResolution] = useState<'UPHELD' | 'REJECTED'>('REJECTED')
  const [saving, setSaving] = useState(false)

  const openCount = localDisputes.filter((d) => d.status === 'OPEN').length

  const handleRespond = async () => {
    if (!respondTo || !response) return
    setSaving(true)
    const res = await fetch(`/api/disputes/${respondTo.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminResponse: response, status: resolution, resolvedAt: new Date().toISOString() }),
    })
    if (res.ok) {
      setLocalDisputes((prev) =>
        prev.map((d) =>
          d.id === respondTo.id
            ? { ...d, status: resolution, adminResponse: response, resolvedAt: new Date().toISOString() }
            : d
        )
      )
      setRespondTo(null)
      setResponse('')
    }
    setSaving(false)
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Disputes Inbox</h1>
        <p className="text-gray-400 text-sm mt-1">
          {localDisputes.length} dispute{localDisputes.length !== 1 ? 's' : ''} ·
          <span style={{ color: openCount > 0 ? '#F5A623' : '#10C97E' }}> {openCount} open</span>
        </p>
      </div>

      {localDisputes.length === 0 ? (
        <div className="rounded-xl border p-12 text-center" style={{ background: '#0C1220', borderColor: '#1E2A3A' }}>
          <div className="text-gray-500 text-lg mb-2">No disputes</div>
          <div className="text-gray-600 text-sm">All clear — no disputes have been raised</div>
        </div>
      ) : (
        <div className="space-y-4">
          {localDisputes.map((d) => (
            <div key={d.id} className="rounded-xl border p-5" style={{ background: '#0C1220', borderColor: d.status === 'OPEN' ? 'rgba(245,166,35,0.3)' : '#1E2A3A' }}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{
                      background: d.status === 'OPEN' ? 'rgba(245,166,35,0.15)' : d.status === 'UPHELD' ? 'rgba(16,201,126,0.15)' : 'rgba(240,64,96,0.15)',
                      color: d.status === 'OPEN' ? '#F5A623' : d.status === 'UPHELD' ? '#10C97E' : '#F04060',
                    }}>
                      {d.status}
                    </span>
                    <span className="text-sm font-medium text-white">{d.review.agent.name}</span>
                    <span className="text-xs text-gray-500 font-mono">{d.review.caseRef}</span>
                    <ScoreBadge score={d.review.scorePercent} size="sm" />
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <div className="text-xs text-gray-500 mb-0.5">Reason</div>
                      <div className="text-sm text-gray-300">{d.reason}</div>
                    </div>
                    {d.notes && (
                      <div>
                        <div className="text-xs text-gray-500 mb-0.5">Notes</div>
                        <div className="text-sm text-gray-300">{d.notes}</div>
                      </div>
                    )}
                  </div>

                  {d.adminResponse && (
                    <div className="p-3 rounded-lg mt-2" style={{ background: '#111827', border: '1px solid #1E2A3A' }}>
                      <div className="text-xs text-gray-500 mb-1">Admin Response</div>
                      <div className="text-sm text-gray-300">{d.adminResponse}</div>
                      {d.resolvedAt && <div className="text-xs text-gray-600 mt-1">Resolved {new Date(d.resolvedAt).toLocaleDateString()}</div>}
                    </div>
                  )}

                  <div className="text-xs text-gray-600 mt-2">
                    {d.review.department} · {d.review.channel} · Submitted {new Date(d.createdAt).toLocaleDateString()}
                  </div>
                </div>

                {d.status === 'OPEN' && (
                  <button
                    onClick={() => setRespondTo(d)}
                    className="ml-4 px-4 py-2 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90"
                    style={{ background: '#7C3AED' }}
                  >
                    Respond
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Respond Modal */}
      <Modal open={!!respondTo} onClose={() => setRespondTo(null)} title="Respond to Dispute">
        {respondTo && (
          <div className="space-y-4">
            <div className="p-3 rounded-lg text-sm" style={{ background: '#111827' }}>
              <div className="text-gray-500 text-xs mb-1">Dispute Reason</div>
              <div className="text-white">{respondTo.reason}</div>
              {respondTo.notes && <div className="text-gray-400 mt-1">{respondTo.notes}</div>}
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Your Response *</label>
              <textarea
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                rows={4}
                placeholder="Explain your decision..."
                className="w-full rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                style={{ background: '#111827', border: '1px solid #1E2A3A' }}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Resolution</label>
              <div className="grid grid-cols-2 gap-3">
                {(['UPHELD', 'REJECTED'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setResolution(r)}
                    className="py-2.5 rounded-lg text-sm font-medium transition-all"
                    style={{
                      background: resolution === r ? (r === 'UPHELD' ? 'rgba(16,201,126,0.2)' : 'rgba(240,64,96,0.2)') : '#111827',
                      color: resolution === r ? (r === 'UPHELD' ? '#10C97E' : '#F04060') : '#9CA3AF',
                      border: `1px solid ${resolution === r ? (r === 'UPHELD' ? 'rgba(16,201,126,0.4)' : 'rgba(240,64,96,0.4)') : '#1E2A3A'}`,
                    }}
                  >
                    {r === 'UPHELD' ? '✓ Uphold' : '✗ Reject'}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setRespondTo(null)} className="flex-1 py-2.5 rounded-lg text-sm font-medium text-gray-300 hover:bg-white/5" style={{ border: '1px solid #1E2A3A' }}>Cancel</button>
              <button
                onClick={handleRespond}
                disabled={!response || saving}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background: '#7C3AED' }}
              >
                {saving ? 'Saving...' : 'Submit Response'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
