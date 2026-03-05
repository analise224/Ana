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
    const agentId = searchParams.get('agentId')
    const channel = searchParams.get('channel')
    const monthKey = searchParams.get('monthKey')
    const category = searchParams.get('category')

    const errorLogs = await prisma.errorLog.findMany({
      where: {
        ...(agentId ? { agentId } : {}),
        ...(channel ? { channel } : {}),
        ...(monthKey ? { monthKey } : {}),
        ...(category ? { category } : {}),
      },
      include: {
        agent: true,
      },
      orderBy: { logDate: 'desc' },
    })

    return NextResponse.json(errorLogs)
  } catch (error) {
    console.error('[GET /api/errors]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
