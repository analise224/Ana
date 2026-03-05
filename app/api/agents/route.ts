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

    const agents = await prisma.agent.findMany({
      where: includeInactive ? undefined : { active: true },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            active: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(agents)
  } catch (error) {
    console.error('[GET /api/agents]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, team, department, userId } = body

    if (!name || !team || !department) {
      return NextResponse.json(
        { error: 'name, team, and department are required' },
        { status: 400 }
      )
    }

    const agent = await prisma.agent.create({
      data: {
        name,
        team,
        department,
        ...(userId ? { userId } : {}),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            active: true,
          },
        },
      },
    })

    return NextResponse.json(agent, { status: 201 })
  } catch (error) {
    console.error('[POST /api/agents]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
