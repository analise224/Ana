'use client'

import { useState, FormEvent } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const result = await signIn('credentials', {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Invalid email or password. Please try again.')
      } else if (result?.ok) {
        router.push('/dashboard')
        router.refresh()
      } else {
        setError('Something went wrong. Please try again.')
      }
    } catch {
      setError('Unable to connect. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {/* Error banner */}
      {error && (
        <div
          className="flex items-start gap-3 rounded-xl px-4 py-3 text-sm"
          style={{
            backgroundColor: 'rgba(240, 64, 96, 0.10)',
            border: '1px solid rgba(240, 64, 96, 0.28)',
            color: '#F04060',
          }}
          role="alert"
          aria-live="assertive"
        >
          <svg
            className="mt-0.5 shrink-0"
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
          >
            <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
            <path
              d="M8 5v3.5M8 11h.01"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Email field */}
      <div className="space-y-2">
        <label
          htmlFor="email"
          className="block text-xs font-semibold uppercase tracking-wide"
          style={{ color: '#9CA3AF' }}
        >
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@bizcuits.com"
          disabled={loading}
          className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder:text-[#374151] outline-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            backgroundColor: '#07090F',
            border: '1px solid #1E2A3A',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = '#7C3AED'
            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(124, 58, 237, 0.18)'
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = '#1E2A3A'
            e.currentTarget.style.boxShadow = 'none'
          }}
        />
      </div>

      {/* Password field */}
      <div className="space-y-2">
        <label
          htmlFor="password"
          className="block text-xs font-semibold uppercase tracking-wide"
          style={{ color: '#9CA3AF' }}
        >
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          disabled={loading}
          className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder:text-[#374151] outline-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            backgroundColor: '#07090F',
            border: '1px solid #1E2A3A',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = '#7C3AED'
            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(124, 58, 237, 0.18)'
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = '#1E2A3A'
            e.currentTarget.style.boxShadow = 'none'
          }}
        />
      </div>

      {/* Submit button */}
      <div className="pt-1">
        <button
          type="submit"
          disabled={loading || !email || !password}
          className="w-full rounded-xl px-4 py-3 text-sm font-semibold text-white transition-all duration-200 focus:outline-none disabled:cursor-not-allowed disabled:opacity-55"
          style={{
            background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
            boxShadow: '0 4px 14px rgba(124, 58, 237, 0.35)',
          }}
          onMouseEnter={(e) => {
            if (!loading && (email || password)) {
              e.currentTarget.style.background = 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)'
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(124, 58, 237, 0.45)'
              e.currentTarget.style.transform = 'translateY(-1px)'
            }
          }}
          onMouseLeave={(e) => {
            if (!loading) {
              e.currentTarget.style.background = 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)'
              e.currentTarget.style.boxShadow = '0 4px 14px rgba(124, 58, 237, 0.35)'
              e.currentTarget.style.transform = 'translateY(0)'
            }
          }}
        >
          {loading ? (
            <span className="inline-flex items-center justify-center gap-2">
              <svg
                className="animate-spin"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                aria-hidden="true"
              >
                <circle
                  cx="8"
                  cy="8"
                  r="6"
                  stroke="rgba(255,255,255,0.25)"
                  strokeWidth="2"
                />
                <path
                  d="M14 8a6 6 0 0 0-6-6"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              Signing in…
            </span>
          ) : (
            'Sign in'
          )}
        </button>
      </div>
    </form>
  )
}
