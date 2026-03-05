import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    const existing = await prisma.errorTaxonomy.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Taxonomy entry not found' }, { status: 404 })
    }

    await prisma.errorTaxonomy.delete({ where: { id } })

    return NextResponse.json({ message: 'Taxonomy entry deleted successfully' })
  } catch (error) {
    console.error('[DELETE /api/taxonomy/[id]]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
