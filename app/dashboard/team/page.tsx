import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { TeamDashboard } from './TeamDashboard'

export default async function TeamPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const reviews = await prisma.review.findMany({
    include: { agent: true, errorLogs: true },
    orderBy: { reviewDate: 'desc' },
  })

  return <TeamDashboard reviews={reviews as any} />
}
