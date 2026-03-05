import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const includeInactive = searchParams.get('includeInactive') === 'true'

    const scorecards = await prisma.scorecardDefinition.findMany({
      where: includeInactive ? {} : { active: true },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(scorecards)
  } catch (error) {
    console.error('[GET /api/scorecards]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
