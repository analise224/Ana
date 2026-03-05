import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { NewReviewWizard } from './NewReviewWizard'

export default async function NewReviewPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const role = (session.user as any).role
  if (role === 'AGENT') redirect('/dashboard')

  const agents = await prisma.agent.findMany({
    where: { active: true },
    orderBy: { name: 'asc' },
  })

  const taxonomy = await prisma.errorTaxonomy.findMany({
    where: { active: true },
    orderBy: { sortOrder: 'asc' },
  })

  return <NewReviewWizard agents={agents} taxonomy={taxonomy} />
}
