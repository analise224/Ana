'use client'
import { useState } from 'react'
import { ScoreBadge } from '@/components/ScoreBadge'
import { Modal } from '@/components/Modal'

interface SubScore { sectionName: string; subcategoryName: string; score: number; maxScore: number }
interface ErrorLog { id: string; category: string; subcategory: string; count: number; channel: string }
interface Dispute { id: string; status: string; reason: string; notes: string; adminResponse: string | null; resolvedAt: string | null }

interface Review {
  id: string
  caseRef: string
  department: string
  channel: string
  reviewDate: string
  monthKey: string
  scorePercent: number
  totalScore: number
  maxScore: number
  cbFlag: boolean
  sbFlag: boolean
  summaryNotes: string | null
  agentAcked: boolean
  agentAckedAt: string | null
  reviewer: { name: string }
  subScores: SubScore[]
  errorLogs: ErrorLog[]
  dispute: Dispute | null
}

const DISPUTE_REASONS = [
  'Score inaccurate',
  'Incorrect process applied',
  'Missing context',
  'Technical issue during interaction',
  'Policy misinterpreted',
  'Other',
]

export function MyEvaluations({ reviews }: { reviews: Review[] }) {
  const [viewReview, setViewReview] = useState<Review | null>(null)
  const [disputeReview, setDisputeReview] = useState<Review | null>(null)
  const [disputeReason, setDisputeReason] = useState('')
  const [disputeNotes, setDisputeNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [localReviews, setLocalReviews] = useState(reviews)

  const getDaysLeft = (reviewDate: string) => {
    const diff = new Date(reviewDate).getTime() + 5 * 86400000 - Date.now()
    return Math.max(0, Math.ceil(diff / 86400000))
  }

  const handleAcknowledge = async (reviewId: string) => {
    setSubmitting(true)
    await fetch(`/api/reviews/${reviewId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentAcked: true, agentAckedAt: new Date().toISOString() }),
    })
    setLocalReviews((prev) =>
      prev.map((r) => r.id === reviewId ? { ...r, agentAcked: true, agentAckedAt: new Date().toISOString() } : r)
    )
    setSubmitting(false)
  }

  const handleDispute = async () => {
    if (!disputeReview || !disputeReason) return
    setSubmitting(true)
    await fetch('/api/disputes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reviewId: disputeReview.id,
        agentName: 'Agent',
        reason: disputeReason,
        notes: disputeNotes,
      }),
    })
    setLocalReviews((prev) =>
      prev.map((r) => r.id === disputeReview.id ? { ...r, dispute: { id: '', status: 'OPEN', reason: disputeReason, notes: disputeNotes, adminResponse: null, resolvedAt: null } } : r)
    )
    setDisputeReview(null)
    setDisputeReason('')
    setDisputeNotes('')
    setSubmitting(false)
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">My Evaluations</h1>
        <p className="text-gray-400 text-sm mt-1">{localReviews.length} evaluation{localReviews.length !== 1 ? 's' : ''}</p>
      </div>

      {localReviews.length === 0 ? (
        <div className="rounded-xl border p-12 text-center" style={{ background: '#0C1220', borderColor: '#1E2A3A' }}>
          <div className="text-gray-500 text-lg mb-2">No evaluations yet</div>
          <div className="text-gray-600 text-sm">Your quality reviews will appear here</div>
        </div>
      ) : (
        <div className="grid gap-4">
          {localReviews.map((r) => {
            const daysLeft = getDaysLeft(r.reviewDate)
            const canAct = !r.agentAcked && !r.dispute && daysLeft > 0

            return (
              <div key={r.id} className="rounded-xl border p-5" style={{ background: '#0C1220', borderColor: '#1E2A3A' }}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <ScoreBadge score={r.scorePercent} />
                      <span className="text-sm font-mono text-gray-400">{r.caseRef}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: r.channel === 'Chat' ? 'rgba(14,196,168,0.15)' : 'rgba(124,58,237,0.15)', color: r.channel === 'Chat' ? '#0EC4A8' : '#8B5CF6' }}>
                        {r.channel}
                      </span>
                      <span className="text-xs text-gray-500">{r.department}</span>
                      {r.cbFlag && <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(240,64,96,0.15)', color: '#F04060' }}>CB</span>}
                      {r.sbFlag && <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(245,166,35,0.15)', color: '#F5A623' }}>SB</span>}
                    </div>

                    <div className="text-xs text-gray-500 mb-3">
                      Reviewed by {r.reviewer.name} · {new Date(r.reviewDate).toLocaleDateString()}
                    </div>

                    {r.summaryNotes && (
                      <div className="text-sm text-gray-300 mb-3 p-3 rounded-lg" style={{ background: '#111827' }}>
                        <span className="text-gray-500 text-xs font-medium uppercase tracking-wide block mb-1">Coaching Notes</span>
                        {r.summaryNotes}
                      </div>
                    )}

                    {r.errorLogs.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {r.errorLogs.map((e, i) => (
                          <span key={i} className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(240,64,96,0.1)', color: '#F04060', border: '1px solid rgba(240,64,96,0.2)' }}>
                            {e.category}: {e.subcategory} ×{e.count}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Status indicators */}
                    <div className="flex items-center gap-3 mt-2">
                      {r.agentAcked && (
                        <span className="text-xs flex items-center gap-1" style={{ color: '#10C97E' }}>
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          Acknowledged {r.agentAckedAt ? `on ${new Date(r.agentAckedAt).toLocaleDateString()}` : ''}
                        </span>
                      )}
                      {r.dispute && (
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{
                          background: r.dispute.status === 'OPEN' ? 'rgba(245,166,35,0.15)' : r.dispute.status === 'UPHELD' ? 'rgba(16,201,126,0.15)' : 'rgba(240,64,96,0.15)',
                          color: r.dispute.status === 'OPEN' ? '#F5A623' : r.dispute.status === 'UPHELD' ? '#10C97E' : '#F04060',
                        }}>
                          Dispute: {r.dispute.status}
                        </span>
                      )}
                      {r.dispute?.adminResponse && (
                        <span className="text-xs text-gray-400">Admin: {r.dispute.adminResponse}</span>
                      )}
                      {canAct && (
                        <span className="text-xs" style={{ color: daysLeft <= 2 ? '#F04060' : '#F5A623' }}>
                          {daysLeft} day{daysLeft !== 1 ? 's' : ''} to respond
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    <button
                      onClick={() => setViewReview(r)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-300 transition-colors hover:bg-white/10"
                      style={{ border: '1px solid #1E2A3A' }}
                    >
                      View Details
                    </button>
                    {canAct && (
                      <>
                        <button
                          onClick={() => handleAcknowledge(r.id)}
                          disabled={submitting}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-all hover:opacity-90 disabled:opacity-50"
                          style={{ background: '#10C97E' }}
                        >
                          Acknowledge
                        </button>
                        <button
                          onClick={() => setDisputeReview(r)}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-90"
                          style={{ background: 'rgba(240,64,96,0.15)', color: '#F04060', border: '1px solid rgba(240,64,96,0.3)' }}
                        >
                          Raise Dispute
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* View Detail Modal */}
      <Modal open={!!viewReview} onClose={() => setViewReview(null)} title="Full Evaluation" size="lg">
        {viewReview && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-gray-500">Case Ref:</span> <span className="text-white">{viewReview.caseRef}</span></div>
              <div><span className="text-gray-500">Score:</span> <ScoreBadge score={viewReview.scorePercent} size="sm" /></div>
              <div><span className="text-gray-500">Dept:</span> <span className="text-white">{viewReview.department}</span></div>
              <div><span className="text-gray-500">Channel:</span> <span className="text-white">{viewReview.channel}</span></div>
              <div><span className="text-gray-500">Date:</span> <span className="text-white">{new Date(viewReview.reviewDate).toLocaleDateString()}</span></div>
              <div><span className="text-gray-500">Reviewer:</span> <span className="text-white">{viewReview.reviewer.name}</span></div>
            </div>
            <div>
              <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Subscores</div>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {viewReview.subScores.map((s, i) => (
                  <div key={i} className="flex items-center justify-between text-sm p-2 rounded" style={{ background: '#111827' }}>
                    <span className="text-gray-300">{s.subcategoryName}</span>
                    <span className="text-gray-400">{s.score}/{s.maxScore}</span>
                  </div>
                ))}
              </div>
            </div>
            {viewReview.summaryNotes && (
              <div>
                <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Coaching Notes</div>
                <p className="text-sm text-gray-300 p-3 rounded" style={{ background: '#111827' }}>{viewReview.summaryNotes}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Dispute Modal */}
      <Modal open={!!disputeReview} onClose={() => setDisputeReview(null)} title="Raise Dispute">
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Reason *</label>
            <select
              value={disputeReason}
              onChange={(e) => setDisputeReason(e.target.value)}
              className="w-full rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              style={{ background: '#111827', border: '1px solid #1E2A3A' }}
            >
              <option value="">Select reason...</option>
              {DISPUTE_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Additional Notes</label>
            <textarea
              value={disputeNotes}
              onChange={(e) => setDisputeNotes(e.target.value)}
              rows={4}
              placeholder="Explain your dispute..."
              className="w-full rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              style={{ background: '#111827', border: '1px solid #1E2A3A' }}
            />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setDisputeReview(null)} className="flex-1 py-2.5 rounded-lg text-sm font-medium text-gray-300 transition-colors hover:bg-white/5" style={{ border: '1px solid #1E2A3A' }}>
              Cancel
            </button>
            <button
              onClick={handleDispute}
              disabled={!disputeReason || submitting}
              className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: '#F04060' }}
            >
              {submitting ? 'Submitting...' : 'Submit Dispute'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
