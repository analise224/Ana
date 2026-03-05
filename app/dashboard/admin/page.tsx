import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { AdminPanel } from './AdminPanel'

export default async function AdminPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const role = (session.user as any).role
  if (role !== 'ADMIN' && role !== 'MANAGER') redirect('/dashboard')

  const [users, agents, scorecards, taxonomy] = await Promise.all([
    prisma.user.findMany({ select: { id: true, name: true, email: true, role: true, active: true }, orderBy: { name: 'asc' } }),
    prisma.agent.findMany({ include: { user: { select: { name: true, email: true } } }, orderBy: { name: 'asc' } }),
    prisma.scorecardDefinition.findMany({ orderBy: { name: 'asc' } }),
    prisma.errorTaxonomy.findMany({ orderBy: [{ channel: 'asc' }, { sortOrder: 'asc' }] }),
  ])

  return <AdminPanel users={users as any} agents={agents as any} scorecards={scorecards as any} taxonomy={taxonomy} userRole={role} />
}
