import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import LoginForm from './LoginForm'

export default async function LoginPage() {
  const session = await getServerSession(authOptions)

  if (session) {
    redirect('/dashboard')
  }

  return (
    <main
      className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden"
      style={{ backgroundColor: '#07090F' }}
    >
      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(#7C3AED 1px, transparent 1px), linear-gradient(90deg, #7C3AED 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* Purple glow — top centre */}
      <div
        className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full blur-3xl opacity-[0.12] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, #7C3AED, transparent 70%)' }}
      />

      {/* Teal glow — bottom right */}
      <div
        className="absolute -bottom-48 -right-32 w-[500px] h-[500px] rounded-full blur-3xl opacity-[0.08] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, #0EC4A8, transparent 70%)' }}
      />

      <div className="relative z-10 w-full max-w-[420px]">
        {/* ── Brand / Logo ── */}
        <div className="text-center mb-10">
          {/* Logo mark */}
          <div className="inline-flex items-center justify-center w-[56px] h-[56px] rounded-2xl mb-5 shadow-xl"
            style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #0EC4A8 100%)' }}
          >
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M14 3L25 9V19L14 25L3 19V9L14 3Z"
                stroke="white"
                strokeWidth="2"
                strokeLinejoin="round"
              />
              <path
                d="M9.5 14L12.5 17L18.5 11"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <h1 className="text-[28px] font-bold tracking-tight text-white leading-tight">
            Biz<span style={{ color: '#7C3AED' }}>Quality</span>
          </h1>
          <p className="mt-1.5 text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: '#6B7280' }}>
            Quality Assurance Platform
          </p>
        </div>

        {/* ── Login card ── */}
        <div
          className="rounded-2xl p-8"
          style={{
            backgroundColor: '#0C1220',
            border: '1px solid #1E2A3A',
            boxShadow: '0 32px 64px -16px rgba(0,0,0,0.7), 0 0 0 1px rgba(124,58,237,0.06)',
          }}
        >
          <div className="mb-7">
            <h2 className="text-lg font-semibold text-white">Sign in</h2>
            <p className="mt-1 text-sm" style={{ color: '#6B7280' }}>
              Enter your credentials to access your workspace
            </p>
          </div>

          <LoginForm />
        </div>

        {/* ── Footer ── */}
        <p className="text-center mt-6 text-xs" style={{ color: '#6B7280' }}>
          &copy; {new Date().getFullYear()} Bizcuits &mdash; Authorised personnel only
        </p>
      </div>
    </main>
  )
}
