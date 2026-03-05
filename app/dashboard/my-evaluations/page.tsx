import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { MyEvaluations } from './MyEvaluations'

export default async function MyEvaluationsPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const agentId = (session.user as any).agentId
  if (!agentId) redirect('/dashboard')

  const reviews = await prisma.review.findMany({
    where: { agentId },
    include: {
      reviewer: { select: { name: true } },
      subScores: true,
      errorLogs: true,
      dispute: true,
    },
    orderBy: { reviewDate: 'desc' },
  })

  return <MyEvaluations reviews={reviews as any} />
}
