import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { NotificationsPanel } from './NotificationsPanel'

export default async function NotificationsPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const role = (session.user as any).role
  if (role !== 'ADMIN' && role !== 'MANAGER') redirect('/dashboard')

  const disputes = await prisma.dispute.findMany({
    include: {
      review: {
        include: { agent: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return <NotificationsPanel disputes={disputes as any} />
}
