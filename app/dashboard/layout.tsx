import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import Sidebar from '@/components/Sidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  return (
    <div
      className="flex min-h-screen"
      style={{ backgroundColor: '#07090F' }}
    >
      {/* Sidebar — fixed, full height, 240px wide */}
      <Sidebar />

      {/* Main content area — offset by sidebar width */}
      <div
        className="flex flex-col flex-1 min-w-0"
        style={{ marginLeft: '240px' }}
      >
        <main className="flex-1 p-6 lg:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
