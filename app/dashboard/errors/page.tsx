import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { ErrorLogView } from './ErrorLogView'

export default async function ErrorsPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const errors = await prisma.errorLog.findMany({
    include: { agent: true },
    orderBy: { logDate: 'desc' },
  })

  const agents = await prisma.agent.findMany({ where: { active: true }, orderBy: { name: 'asc' } })

  return <ErrorLogView errors={errors as any} agents={agents} />
}
