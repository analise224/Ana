'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { getScorecardKey, SCORECARDS } from '@/lib/scorecards'

interface Agent {
  id: string
  name: string
  team: string
  department: string
}

interface TaxonomyEntry {
  id: string
  channel: string
  category: string
  subcategory: string
}

interface ErrorRow {
  category: string
  subcategory: string
  count: number
}

interface SubScoreEntry {
  sectionName: string
  subcategoryName: string
  score: number
  maxScore: number
  ticketIndex?: number
}

export function NewReviewWizard({ agents, taxonomy }: { agents: Agent[]; taxonomy: TaxonomyEntry[] }) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Step 1 fields
  const [agentId, setAgentId] = useState('')
  const [department, setDepartment] = useState('CS')
  const [channel, setChannel] = useState('Chat')
  const [caseRef, setCaseRef] = useState('')
  const [reviewDate, setReviewDate] = useState(new Date().toISOString().split('T')[0])
  const [cbFlag, setCbFlag] = useState(false)
  const [sbFlag, setSbFlag] = useState(false)

  // Step 2: scores keyed by "sectionName|subcategoryName" or "t{i}|sectionName|subcategoryName"
  const [scores, setScores] = useState<Record<string, number>>({})

  // Step 3: error tags
  const [errorRows, setErrorRows] = useState<ErrorRow[]>([{ category: '', subcategory: '', count: 1 }])

  // Step 4: notes
  const [summaryNotes, setSummaryNotes] = useState('')

  const scorecardKey = getScorecardKey(department, channel)
  const scorecard = SCORECARDS[scorecardKey]

  const channelTaxonomy = taxonomy.filter((t) => t.channel === channel)
  const categories = Array.from(new Set(channelTaxonomy.map((t) => t.category)))

  const getSubcategories = (cat: string) =>
    channelTaxonomy.filter((t) => t.category === cat).map((t) => t.subcategory)

  const computeTicketScore = (ticketIndex: number) => {
    if (!scorecard.isTicketGroup) return { total: 0, max: 0 }
    let total = 0
    let max = 0
    scorecard.sections.forEach((sec) => {
      sec.subcategories.forEach((sub) => {
        const key = `t${ticketIndex}|${sec.name}|${sub.name}`
        total += scores[key] ?? 0
        max += sub.maxScore
      })
    })
    return { total, max }
  }

  const computeTotalScore = () => {
    if (scorecard.isTicketGroup) {
      const ticketCount = scorecard.ticketCount ?? 5
      let total = 0
      let max = 0
      for (let i = 0; i < ticketCount; i++) {
        const t = computeTicketScore(i)
        total += t.total
        max += t.max
      }
      return { total, max, pct: max > 0 ? (total / max) * 100 : 0 }
    }
    let total = 0
    let max = 0
    scorecard.sections.forEach((sec) => {
      sec.subcategories.forEach((sub) => {
        const key = `${sec.name}|${sub.name}`
        total += scores[key] ?? 0
        max += sub.maxScore
      })
    })
    return { total, max, pct: max > 0 ? (total / max) * 100 : 0 }
  }

  const { total, max, pct } = computeTotalScore()

  const scoreColor = pct >= 90 ? '#10C97E' : pct >= 70 ? '#F5A623' : '#F04060'

  const selectedAgent = agents.find((a) => a.id === agentId)

  const buildSubScores = (): SubScoreEntry[] => {
    const subScores: SubScoreEntry[] = []
    if (scorecard.isTicketGroup) {
      const ticketCount = scorecard.ticketCount ?? 5
      for (let i = 0; i < ticketCount; i++) {
        scorecard.sections.forEach((sec) => {
          sec.subcategories.forEach((sub) => {
            const key = `t${i}|${sec.name}|${sub.name}`
            subScores.push({
              sectionName: `Ticket ${i + 1} - ${sec.name}`,
              subcategoryName: sub.name,
              score: scores[key] ?? 0,
              maxScore: sub.maxScore,
              ticketIndex: i,
            })
          })
        })
      }
    } else {
      scorecard.sections.forEach((sec) => {
        sec.subcategories.forEach((sub) => {
          const key = `${sec.name}|${sub.name}`
          subScores.push({
            sectionName: sec.name,
            subcategoryName: sub.name,
            score: scores[key] ?? 0,
            maxScore: sub.maxScore,
          })
        })
      })
    }
    return subScores
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    setError('')
    try {
      const subScores = buildSubScores()
      const validErrors = errorRows.filter((r) => r.category && r.subcategory && r.count > 0)
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId,
          department,
          channel,
          caseRef,
          reviewDate,
          scorecardType: scorecardKey,
          cbFlag,
          sbFlag,
          summaryNotes,
          subScores,
          errorLogs: validErrors,
        }),
      })
      if (!res.ok) throw new Error('Failed to submit review')
      router.push('/dashboard/reviews')
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  const canProceedStep1 = agentId && caseRef && reviewDate

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">New Evaluation</h1>
        <p className="text-gray-400 mt-1">Complete all steps to submit a quality review</p>
      </div>

      {/* Step indicators */}
      <div className="flex items-center mb-8">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                step === s
                  ? 'text-white'
                  : step > s
                  ? 'text-white'
                  : 'text-gray-500'
              }`}
              style={{
                background: step === s ? '#7C3AED' : step > s ? '#10C97E' : '#1E2A3A',
              }}
            >
              {step > s ? '✓' : s}
            </div>
            <span className={`ml-2 text-sm ${step === s ? 'text-white font-medium' : 'text-gray-500'}`}>
              {['Select Agent', 'Scorecard', 'Error Tags', 'Summary'][s - 1]}
            </span>
            {s < 4 && <div className="w-12 h-px mx-3" style={{ background: step > s ? '#7C3AED' : '#1E2A3A' }} />}
          </div>
        ))}
      </div>

      <div className="rounded-xl border p-6" style={{ background: '#0C1220', borderColor: '#1E2A3A' }}>
        {/* STEP 1 */}
        {step === 1 && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold text-white mb-4">Step 1: Review Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Agent *</label>
                <select
                  value={agentId}
                  onChange={(e) => setAgentId(e.target.value)}
                  className="w-full rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  style={{ background: '#111827', border: '1px solid #1E2A3A' }}
                >
                  <option value="">Select agent...</option>
                  {agents.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} — {a.team}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Case Reference *</label>
                <input
                  type="text"
                  value={caseRef}
                  onChange={(e) => setCaseRef(e.target.value)}
                  placeholder="e.g. CASE-12345"
                  className="w-full rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  style={{ background: '#111827', border: '1px solid #1E2A3A' }}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Department *</label>
                <select
                  value={department}
                  onChange={(e) => {
                    setDepartment(e.target.value)
                    setScores({})
                  }}
                  className="w-full rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  style={{ background: '#111827', border: '1px solid #1E2A3A' }}
                >
                  <option value="CS">CS</option>
                  <option value="PnV">PnV</option>
                  <option value="Compliance">Compliance</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Channel *</label>
                <select
                  value={channel}
                  onChange={(e) => {
                    setChannel(e.target.value)
                    setScores({})
                  }}
                  className="w-full rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  style={{ background: '#111827', border: '1px solid #1E2A3A' }}
                  disabled={department !== 'CS'}
                >
                  <option value="Chat">Chat</option>
                  {department === 'CS' && <option value="Ticket">Ticket</option>}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Review Date *</label>
                <input
                  type="date"
                  value={reviewDate}
                  onChange={(e) => setReviewDate(e.target.value)}
                  className="w-full rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  style={{ background: '#111827', border: '1px solid #1E2A3A' }}
                />
              </div>
              <div className="flex items-end gap-6 pb-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={cbFlag}
                    onChange={(e) => setCbFlag(e.target.checked)}
                    className="w-4 h-4 rounded accent-purple-500"
                  />
                  <span className="text-sm text-gray-300">CB Flag</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sbFlag}
                    onChange={(e) => setSbFlag(e.target.checked)}
                    className="w-4 h-4 rounded accent-purple-500"
                  />
                  <span className="text-sm text-gray-300">SB Flag</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-white">Step 2: Scorecard — {scorecard.name}</h2>
              <div className="text-right">
                <div className="text-sm text-gray-400">Total Score</div>
                <div className="text-2xl font-bold" style={{ color: scoreColor }}>
                  {pct.toFixed(1)}%
                </div>
                <div className="text-xs text-gray-500">{total.toFixed(0)} / {max}</div>
              </div>
            </div>

            {scorecard.isTicketGroup ? (
              <div className="space-y-6">
                {Array.from({ length: scorecard.ticketCount ?? 5 }).map((_, ti) => {
                  const ts = computeTicketScore(ti)
                  const tPct = ts.max > 0 ? (ts.total / ts.max) * 100 : 0
                  const tColor = tPct >= 90 ? '#10C97E' : tPct >= 70 ? '#F5A623' : '#F04060'
                  return (
                    <div key={ti} className="rounded-lg border p-4" style={{ borderColor: '#1E2A3A', background: '#111827' }}>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium text-white">Ticket {ti + 1}</h3>
                        <span className="text-sm font-semibold" style={{ color: tColor }}>
                          {ts.total}/{ts.max} ({tPct.toFixed(1)}%)
                        </span>
                      </div>
                      {scorecard.sections.map((sec) => (
                        <div key={sec.name} className="mb-3">
                          <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">{sec.name}</div>
                          {sec.subcategories.map((sub) => {
                            const key = `t${ti}|${sec.name}|${sub.name}`
                            return (
                              <div key={sub.name} className="flex items-center gap-3 mb-2">
                                <span className="flex-1 text-sm text-gray-300">{sub.name}</span>
                                <span className="text-xs text-gray-500 w-12 text-right">/{sub.maxScore}</span>
                                <input
                                  type="number"
                                  min={0}
                                  max={sub.maxScore}
                                  value={scores[key] ?? ''}
                                  onChange={(e) => {
                                    const v = Math.min(sub.maxScore, Math.max(0, Number(e.target.value)))
                                    setScores((prev) => ({ ...prev, [key]: v }))
                                  }}
                                  className="w-20 rounded px-2 py-1 text-sm text-white text-center focus:outline-none focus:ring-1 focus:ring-purple-500"
                                  style={{ background: '#07090F', border: '1px solid #1E2A3A' }}
                                />
                              </div>
                            )
                          })}
                        </div>
                      ))}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="space-y-4">
                {scorecard.sections.map((sec) => {
                  const secTotal = sec.subcategories.reduce((sum, sub) => sum + (scores[`${sec.name}|${sub.name}`] ?? 0), 0)
                  return (
                    <div key={sec.name} className="rounded-lg border p-4" style={{ borderColor: '#1E2A3A', background: '#111827' }}>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium text-white">{sec.name}</h3>
                        <span className="text-sm text-gray-400">{secTotal} / {sec.maxScore}</span>
                      </div>
                      {sec.subcategories.map((sub) => {
                        const key = `${sec.name}|${sub.name}`
                        return (
                          <div key={sub.name} className="flex items-center gap-3 mb-2">
                            <span className="flex-1 text-sm text-gray-300">{sub.name}</span>
                            <span className="text-xs text-gray-500 w-12 text-right">/{sub.maxScore}</span>
                            <input
                              type="number"
                              min={0}
                              max={sub.maxScore}
                              value={scores[key] ?? ''}
                              onChange={(e) => {
                                const v = Math.min(sub.maxScore, Math.max(0, Number(e.target.value)))
                                setScores((prev) => ({ ...prev, [key]: v }))
                              }}
                              className="w-20 rounded px-2 py-1 text-sm text-white text-center focus:outline-none focus:ring-1 focus:ring-purple-500"
                              style={{ background: '#07090F', border: '1px solid #1E2A3A' }}
                            />
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <div>
            <h2 className="text-lg font-semibold text-white mb-5">Step 3: Error Tags</h2>
            <div className="space-y-3">
              {errorRows.map((row, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <select
                    value={row.category}
                    onChange={(e) => {
                      const updated = [...errorRows]
                      updated[idx] = { ...updated[idx], category: e.target.value, subcategory: '' }
                      setErrorRows(updated)
                    }}
                    className="flex-1 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    style={{ background: '#111827', border: '1px solid #1E2A3A' }}
                  >
                    <option value="">Select category...</option>
                    {categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <select
                    value={row.subcategory}
                    onChange={(e) => {
                      const updated = [...errorRows]
                      updated[idx] = { ...updated[idx], subcategory: e.target.value }
                      setErrorRows(updated)
                    }}
                    className="flex-1 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    style={{ background: '#111827', border: '1px solid #1E2A3A' }}
                    disabled={!row.category}
                  >
                    <option value="">Select subcategory...</option>
                    {getSubcategories(row.category).map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min={1}
                    value={row.count}
                    onChange={(e) => {
                      const updated = [...errorRows]
                      updated[idx] = { ...updated[idx], count: Math.max(1, Number(e.target.value)) }
                      setErrorRows(updated)
                    }}
                    className="w-20 rounded-lg px-3 py-2.5 text-white text-sm text-center focus:outline-none focus:ring-2 focus:ring-purple-500"
                    style={{ background: '#111827', border: '1px solid #1E2A3A' }}
                  />
                  <button
                    onClick={() => setErrorRows(errorRows.filter((_, i) => i !== idx))}
                    className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
                    disabled={errorRows.length === 1}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={() => setErrorRows([...errorRows, { category: '', subcategory: '', count: 1 }])}
              className="mt-4 flex items-center gap-2 text-sm font-medium transition-colors"
              style={{ color: '#7C3AED' }}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Error Tag
            </button>
          </div>
        )}

        {/* STEP 4 */}
        {step === 4 && (
          <div>
            <h2 className="text-lg font-semibold text-white mb-5">Step 4: Summary & Submit</h2>
            <div className="grid grid-cols-2 gap-4 mb-5">
              <InfoRow label="Agent" value={selectedAgent?.name ?? '—'} />
              <InfoRow label="Team" value={selectedAgent?.team ?? '—'} />
              <InfoRow label="Department" value={department} />
              <InfoRow label="Channel" value={channel} />
              <InfoRow label="Case Reference" value={caseRef} />
              <InfoRow label="Review Date" value={reviewDate} />
              <InfoRow label="CB Flag" value={cbFlag ? 'Yes' : 'No'} />
              <InfoRow label="SB Flag" value={sbFlag ? 'Yes' : 'No'} />
            </div>
            <div className="rounded-lg border p-4 mb-5" style={{ borderColor: '#1E2A3A', background: '#111827' }}>
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">Final Score</span>
                <div className="text-right">
                  <span className="text-2xl font-bold" style={{ color: scoreColor }}>{pct.toFixed(1)}%</span>
                  <span className="text-gray-500 text-sm ml-2">({total.toFixed(0)} / {max})</span>
                </div>
              </div>
            </div>
            {errorRows.filter((r) => r.category).length > 0 && (
              <div className="mb-5">
                <div className="text-sm font-medium text-gray-400 mb-2">Error Tags</div>
                <div className="space-y-1">
                  {errorRows.filter((r) => r.category && r.subcategory).map((r, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <span className="px-2 py-0.5 rounded text-xs" style={{ background: 'rgba(124,58,237,0.15)', color: '#8B5CF6' }}>{r.category}</span>
                      <span className="text-gray-300">{r.subcategory}</span>
                      <span className="text-gray-500">× {r.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Coaching Notes (optional)</label>
              <textarea
                value={summaryNotes}
                onChange={(e) => setSummaryNotes(e.target.value)}
                rows={4}
                placeholder="Add coaching notes for the agent..."
                className="w-full rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                style={{ background: '#111827', border: '1px solid #1E2A3A' }}
              />
            </div>
            {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6 pt-5 border-t" style={{ borderColor: '#1E2A3A' }}>
          <button
            onClick={() => setStep(Math.max(1, step - 1))}
            disabled={step === 1}
            className="px-5 py-2.5 rounded-lg text-sm font-medium text-gray-300 disabled:opacity-40 transition-colors hover:bg-white/5"
            style={{ border: '1px solid #1E2A3A' }}
          >
            Back
          </button>
          {step < 4 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={step === 1 && !canProceedStep1}
              className="px-6 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-40 transition-all hover:opacity-90"
              style={{ background: '#7C3AED' }}
            >
              Next →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-6 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-40 transition-all hover:opacity-90"
              style={{ background: '#7C3AED' }}
            >
              {submitting ? 'Submitting...' : 'Submit Evaluation'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-gray-500 mb-0.5">{label}</div>
      <div className="text-sm text-white font-medium">{value}</div>
    </div>
  )
}
