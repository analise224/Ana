import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    const review = await prisma.review.findUnique({
      where: { id },
      include: {
        agent: true,
        reviewer: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        subScores: true,
        errorLogs: true,
        dispute: true,
      },
    })

    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    }

    return NextResponse.json(review)
  } catch (error) {
    console.error('[GET /api/reviews/[id]]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sessionUser = session.user as any
    if (sessionUser?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: ADMIN role required' }, { status: 403 })
    }

    const { id } = params

    const existing = await prisma.review.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    }

    await prisma.review.delete({ where: { id } })

    return NextResponse.json({ message: 'Review deleted successfully' })
  } catch (error) {
    console.error('[DELETE /api/reviews/[id]]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    const body = await request.json()
    const { agentAcked, agentAckedAt } = body

    const existing = await prisma.review.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    }

    const review = await prisma.review.update({
      where: { id },
      data: {
        ...(agentAcked !== undefined ? { agentAcked } : {}),
        ...(agentAckedAt !== undefined ? { agentAckedAt: new Date(agentAckedAt) } : {}),
      },
      include: {
        agent: true,
        reviewer: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        subScores: true,
        errorLogs: true,
        dispute: true,
      },
    })

    return NextResponse.json(review)
  } catch (error) {
    console.error('[PATCH /api/reviews/[id]]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
