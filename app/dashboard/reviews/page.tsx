import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { ReviewLog } from './ReviewLog'

export default async function ReviewsPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const reviews = await prisma.review.findMany({
    include: {
      agent: true,
      reviewer: { select: { id: true, name: true } },
      dispute: true,
    },
    orderBy: { reviewDate: 'desc' },
  })

  const agents = await prisma.agent.findMany({ where: { active: true }, orderBy: { name: 'asc' } })

  const role = (session.user as any).role

  return <ReviewLog reviews={reviews as any} agents={agents} userRole={role} />
}
