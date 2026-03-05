'use client'
import { useState } from 'react'
import { Modal } from '@/components/Modal'

interface User { id: string; name: string; email: string; role: string; active: boolean }
interface Agent { id: string; name: string; team: string; department: string; active: boolean; user?: { name: string; email: string } }
interface Scorecard { id: string; name: string; type: string; version: number; active: boolean; jsonSchema: any }
interface TaxEntry { id: string; channel: string; category: string; subcategory: string; active: boolean }

export function AdminPanel({ users, agents, scorecards, taxonomy, userRole }: {
  users: User[]
  agents: Agent[]
  scorecards: Scorecard[]
  taxonomy: TaxEntry[]
  userRole: string
}) {
  const [tab, setTab] = useState<'users' | 'agents' | 'scorecards' | 'taxonomy'>('users')

  const [localUsers, setLocalUsers] = useState(users)
  const [localAgents, setLocalAgents] = useState(agents)
  const [localTaxonomy, setLocalTaxonomy] = useState(taxonomy)

  // Add user modal
  const [addUserOpen, setAddUserOpen] = useState(false)
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'AGENT' })

  // Add agent modal
  const [addAgentOpen, setAddAgentOpen] = useState(false)
  const [newAgent, setNewAgent] = useState({ name: '', team: '', department: 'CS' })

  // Add taxonomy modal
  const [addTaxOpen, setAddTaxOpen] = useState(false)
  const [newTax, setNewTax] = useState({ channel: 'Chat', category: '', subcategory: '' })

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const tabs = [
    { key: 'users', label: 'Users' },
    { key: 'agents', label: 'Agents' },
    { key: 'scorecards', label: 'Scorecards' },
    { key: 'taxonomy', label: 'Error Taxonomy' },
  ] as const

  const handleAddUser = async () => {
    setSaving(true); setError('')
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newUser),
    })
    if (res.ok) {
      const u = await res.json()
      setLocalUsers((prev) => [...prev, u])
      setAddUserOpen(false)
      setNewUser({ name: '', email: '', password: '', role: 'AGENT' })
    } else {
      setError('Failed to create user')
    }
    setSaving(false)
  }

  const handleToggleUser = async (id: string, active: boolean) => {
    await fetch(`/api/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !active }),
    })
    setLocalUsers((prev) => prev.map((u) => u.id === id ? { ...u, active: !active } : u))
  }

  const handleAddAgent = async () => {
    setSaving(true); setError('')
    const res = await fetch('/api/agents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newAgent),
    })
    if (res.ok) {
      const a = await res.json()
      setLocalAgents((prev) => [...prev, a])
      setAddAgentOpen(false)
      setNewAgent({ name: '', team: '', department: 'CS' })
    } else {
      setError('Failed to create agent')
    }
    setSaving(false)
  }

  const handleToggleAgent = async (id: string, active: boolean) => {
    await fetch(`/api/agents/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !active }),
    })
    setLocalAgents((prev) => prev.map((a) => a.id === id ? { ...a, active: !active } : a))
  }

  const handleAddTax = async () => {
    setSaving(true); setError('')
    const res = await fetch('/api/taxonomy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTax),
    })
    if (res.ok) {
      const t = await res.json()
      setLocalTaxonomy((prev) => [...prev, t])
      setAddTaxOpen(false)
      setNewTax({ channel: 'Chat', category: '', subcategory: '' })
    } else {
      setError('Failed to create entry')
    }
    setSaving(false)
  }

  const handleDeleteTax = async (id: string) => {
    if (!confirm('Delete this taxonomy entry?')) return
    await fetch(`/api/taxonomy/${id}`, { method: 'DELETE' })
    setLocalTaxonomy((prev) => prev.filter((t) => t.id !== id))
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
        <p className="text-gray-400 text-sm mt-1">Manage users, agents, scorecards, and error taxonomy</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 rounded-xl" style={{ background: '#0C1220', border: '1px solid #1E2A3A', width: 'fit-content' }}>
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              background: tab === t.key ? '#7C3AED' : 'transparent',
              color: tab === t.key ? 'white' : '#9CA3AF',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Users Tab */}
      {tab === 'users' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-white">Users ({localUsers.length})</h2>
            <button onClick={() => setAddUserOpen(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ background: '#7C3AED' }}>
              + Add User
            </button>
          </div>
          <div className="rounded-xl border overflow-hidden" style={{ borderColor: '#1E2A3A' }}>
            <table className="w-full">
              <thead>
                <tr style={{ background: '#0C1220', borderBottom: '1px solid #1E2A3A' }}>
                  {['Name', 'Email', 'Role', 'Status', 'Action'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {localUsers.map((u, i) => (
                  <tr key={u.id} style={{ background: i % 2 === 0 ? '#07090F' : '#0C1220', borderBottom: '1px solid #1E2A3A' }}>
                    <td className="px-4 py-3 text-sm text-white font-medium">{u.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-400">{u.email}</td>
                    <td className="px-4 py-3">
                      <RoleBadge role={u.role} />
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: u.active ? 'rgba(16,201,126,0.15)' : 'rgba(240,64,96,0.15)', color: u.active ? '#10C97E' : '#F04060' }}>
                        {u.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {userRole === 'ADMIN' && (
                        <button onClick={() => handleToggleUser(u.id, u.active)} className="text-xs px-2 py-1 rounded transition-colors hover:bg-white/5" style={{ color: u.active ? '#F5A623' : '#10C97E', border: '1px solid #1E2A3A' }}>
                          {u.active ? 'Deactivate' : 'Activate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Agents Tab */}
      {tab === 'agents' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-white">Agents ({localAgents.length})</h2>
            <button onClick={() => setAddAgentOpen(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ background: '#7C3AED' }}>
              + Add Agent
            </button>
          </div>
          <div className="rounded-xl border overflow-hidden" style={{ borderColor: '#1E2A3A' }}>
            <table className="w-full">
              <thead>
                <tr style={{ background: '#0C1220', borderBottom: '1px solid #1E2A3A' }}>
                  {['Name', 'Team', 'Department', 'Status', 'Action'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {localAgents.map((a, i) => (
                  <tr key={a.id} style={{ background: i % 2 === 0 ? '#07090F' : '#0C1220', borderBottom: '1px solid #1E2A3A' }}>
                    <td className="px-4 py-3 text-sm text-white font-medium">{a.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-400">{a.team}</td>
                    <td className="px-4 py-3 text-sm text-gray-400">{a.department}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: a.active ? 'rgba(16,201,126,0.15)' : 'rgba(240,64,96,0.15)', color: a.active ? '#10C97E' : '#F04060' }}>
                        {a.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleToggleAgent(a.id, a.active)} className="text-xs px-2 py-1 rounded transition-colors hover:bg-white/5" style={{ color: a.active ? '#F5A623' : '#10C97E', border: '1px solid #1E2A3A' }}>
                        {a.active ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Scorecards Tab */}
      {tab === 'scorecards' && (
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">Scorecard Definitions</h2>
          <div className="grid gap-4">
            {scorecards.map((sc) => (
              <div key={sc.id} className="rounded-xl border p-5" style={{ background: '#0C1220', borderColor: '#1E2A3A' }}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-white">{sc.name}</h3>
                    <span className="text-xs text-gray-500">Type: {sc.type} · v{sc.version}</span>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: sc.active ? 'rgba(16,201,126,0.15)' : '#1E2A3A', color: sc.active ? '#10C97E' : '#6B7280' }}>
                    {sc.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="space-y-2">
                  {sc.jsonSchema?.sections?.map((sec: any) => (
                    <div key={sec.name} className="p-3 rounded-lg" style={{ background: '#111827' }}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-white">{sec.name}</span>
                        <span className="text-gray-500">{sec.maxScore}pts</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {sec.subcategories?.map((sub: any) => (
                          <span key={sub.name} className="text-xs px-2 py-0.5 rounded" style={{ background: '#1E2A3A', color: '#9CA3AF' }}>
                            {sub.name} ({sub.maxScore})
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Taxonomy Tab */}
      {tab === 'taxonomy' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-white">Error Taxonomy ({localTaxonomy.length})</h2>
            <button onClick={() => setAddTaxOpen(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ background: '#7C3AED' }}>
              + Add Entry
            </button>
          </div>
          {['Chat', 'Ticket'].map((ch) => {
            const entries = localTaxonomy.filter((t) => t.channel === ch)
            const cats = Array.from(new Set(entries.map((e) => e.category)))
            return (
              <div key={ch} className="mb-6">
                <h3 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: ch === 'Chat' ? '#0EC4A8' : '#8B5CF6' }}>{ch} Channel</h3>
                <div className="space-y-3">
                  {cats.map((cat) => (
                    <div key={cat} className="rounded-xl border p-4" style={{ background: '#0C1220', borderColor: '#1E2A3A' }}>
                      <div className="text-sm font-medium text-white mb-2">{cat}</div>
                      <div className="flex flex-wrap gap-2">
                        {entries.filter((e) => e.category === cat).map((e) => (
                          <div key={e.id} className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg" style={{ background: '#111827', border: '1px solid #1E2A3A' }}>
                            <span className="text-gray-300">{e.subcategory}</span>
                            <button onClick={() => handleDeleteTax(e.id)} className="text-red-500 hover:text-red-400 transition-colors ml-1">×</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add User Modal */}
      <Modal open={addUserOpen} onClose={() => setAddUserOpen(false)} title="Add User">
        <div className="space-y-4">
          {error && <p className="text-sm text-red-400">{error}</p>}
          <FormField label="Name" value={newUser.name} onChange={(v) => setNewUser({ ...newUser, name: v })} />
          <FormField label="Email" type="email" value={newUser.email} onChange={(v) => setNewUser({ ...newUser, email: v })} />
          <FormField label="Password" type="password" value={newUser.password} onChange={(v) => setNewUser({ ...newUser, password: v })} />
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Role</label>
            <select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })} className="w-full rounded-lg px-3 py-2.5 text-white text-sm" style={{ background: '#111827', border: '1px solid #1E2A3A' }}>
              {['ADMIN', 'MANAGER', 'ANALYST', 'AGENT'].map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <ModalButtons onCancel={() => setAddUserOpen(false)} onConfirm={handleAddUser} saving={saving} label="Create User" />
        </div>
      </Modal>

      {/* Add Agent Modal */}
      <Modal open={addAgentOpen} onClose={() => setAddAgentOpen(false)} title="Add Agent">
        <div className="space-y-4">
          {error && <p className="text-sm text-red-400">{error}</p>}
          <FormField label="Name" value={newAgent.name} onChange={(v) => setNewAgent({ ...newAgent, name: v })} />
          <FormField label="Team" value={newAgent.team} onChange={(v) => setNewAgent({ ...newAgent, team: v })} />
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Department</label>
            <select value={newAgent.department} onChange={(e) => setNewAgent({ ...newAgent, department: e.target.value })} className="w-full rounded-lg px-3 py-2.5 text-white text-sm" style={{ background: '#111827', border: '1px solid #1E2A3A' }}>
              {['CS', 'PnV', 'Compliance'].map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <ModalButtons onCancel={() => setAddAgentOpen(false)} onConfirm={handleAddAgent} saving={saving} label="Create Agent" />
        </div>
      </Modal>

      {/* Add Taxonomy Modal */}
      <Modal open={addTaxOpen} onClose={() => setAddTaxOpen(false)} title="Add Taxonomy Entry">
        <div className="space-y-4">
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Channel</label>
            <select value={newTax.channel} onChange={(e) => setNewTax({ ...newTax, channel: e.target.value })} className="w-full rounded-lg px-3 py-2.5 text-white text-sm" style={{ background: '#111827', border: '1px solid #1E2A3A' }}>
              <option value="Chat">Chat</option>
              <option value="Ticket">Ticket</option>
            </select>
          </div>
          <FormField label="Category" value={newTax.category} onChange={(v) => setNewTax({ ...newTax, category: v })} />
          <FormField label="Subcategory" value={newTax.subcategory} onChange={(v) => setNewTax({ ...newTax, subcategory: v })} />
          <ModalButtons onCancel={() => setAddTaxOpen(false)} onConfirm={handleAddTax} saving={saving} label="Add Entry" />
        </div>
      </Modal>
    </div>
  )
}

function RoleBadge({ role }: { role: string }) {
  const colors: Record<string, { bg: string; color: string }> = {
    ADMIN: { bg: 'rgba(124,58,237,0.15)', color: '#8B5CF6' },
    MANAGER: { bg: 'rgba(14,196,168,0.15)', color: '#0EC4A8' },
    ANALYST: { bg: 'rgba(245,166,35,0.15)', color: '#F5A623' },
    AGENT: { bg: 'rgba(107,114,128,0.15)', color: '#9CA3AF' },
  }
  const c = colors[role] ?? colors.AGENT
  return <span className="text-xs px-2 py-0.5 rounded-full" style={c}>{role}</span>
}

function FormField({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="block text-sm text-gray-400 mb-1.5">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" style={{ background: '#111827', border: '1px solid #1E2A3A' }} />
    </div>
  )
}

function ModalButtons({ onCancel, onConfirm, saving, label }: { onCancel: () => void; onConfirm: () => void; saving: boolean; label: string }) {
  return (
    <div className="flex gap-3 pt-2">
      <button onClick={onCancel} className="flex-1 py-2.5 rounded-lg text-sm font-medium text-gray-300 hover:bg-white/5 transition-colors" style={{ border: '1px solid #1E2A3A' }}>Cancel</button>
      <button onClick={onConfirm} disabled={saving} className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50" style={{ background: '#7C3AED' }}>{saving ? 'Saving...' : label}</button>
    </div>
  )
}
