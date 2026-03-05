import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { PerformanceDashboard } from './PerformanceDashboard'

export default async function PerformancePage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const agents = await prisma.agent.findMany({ where: { active: true }, orderBy: { name: 'asc' } })

  const reviews = await prisma.review.findMany({
    include: { agent: true, errorLogs: true },
    orderBy: { reviewDate: 'desc' },
  })

  return <PerformanceDashboard agents={agents} reviews={reviews as any} />
}
