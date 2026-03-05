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
    const statusParam = searchParams.get('status')

    const disputes = await prisma.dispute.findMany({
      where: {
        ...(statusParam === 'OPEN' ? { status: 'OPEN' } : {}),
      },
      include: {
        review: {
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
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(disputes)
  } catch (error) {
    console.error('[GET /api/disputes]', error)
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
    const { reviewId, agentName, reason, notes } = body

    if (!reviewId || !agentName || !reason) {
      return NextResponse.json(
        { error: 'reviewId, agentName, and reason are required' },
        { status: 400 }
      )
    }

    const review = await prisma.review.findUnique({ where: { id: reviewId } })
    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    }

    const existingDispute = await prisma.dispute.findUnique({ where: { reviewId } })
    if (existingDispute) {
      return NextResponse.json(
        { error: 'A dispute already exists for this review' },
        { status: 409 }
      )
    }

    const dispute = await prisma.dispute.create({
      data: {
        reviewId,
        agentName,
        reason,
        notes: notes ?? null,
      },
      include: {
        review: {
          include: {
            agent: true,
          },
        },
      },
    })

    return NextResponse.json(dispute, { status: 201 })
  } catch (error) {
    console.error('[POST /api/disputes]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
