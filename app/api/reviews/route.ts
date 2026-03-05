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
    const department = searchParams.get('department')
    const channel = searchParams.get('channel')
    const monthKey = searchParams.get('monthKey')

    const reviews = await prisma.review.findMany({
      where: {
        ...(agentId ? { agentId } : {}),
        ...(department ? { department } : {}),
        ...(channel ? { channel } : {}),
        ...(monthKey ? { monthKey } : {}),
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
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(reviews)
  } catch (error) {
    console.error('[GET /api/reviews]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sessionUser = session.user as any
    const reviewerId: string = sessionUser?.id

    if (!reviewerId) {
      return NextResponse.json({ error: 'Unable to determine reviewer identity' }, { status: 401 })
    }

    const body = await request.json()
    const {
      department,
      channel,
      caseRef,
      agentId,
      reviewDate,
      scorecardType,
      cbFlag,
      sbFlag,
      summaryNotes,
      subScores,
      errorLogs,
    } = body

    if (!department || !channel || !caseRef || !agentId || !reviewDate || !scorecardType) {
      return NextResponse.json(
        { error: 'department, channel, caseRef, agentId, reviewDate, and scorecardType are required' },
        { status: 400 }
      )
    }

    if (!Array.isArray(subScores) || subScores.length === 0) {
      return NextResponse.json(
        { error: 'subScores array is required and must not be empty' },
        { status: 400 }
      )
    }

    const totalScore: number = subScores.reduce(
      (sum: number, s: { score: number }) => sum + s.score,
      0
    )
    const maxScore: number = subScores.reduce(
      (sum: number, s: { maxScore: number }) => sum + s.maxScore,
      0
    )
    const scorePercent: number = maxScore > 0 ? (totalScore / maxScore) * 100 : 0

    const parsedReviewDate = new Date(reviewDate)
    const year = parsedReviewDate.getUTCFullYear()
    const month = String(parsedReviewDate.getUTCMonth() + 1).padStart(2, '0')
    const monthKey = `${year}-${month}`

    const agentRecord = await prisma.agent.findUnique({ where: { id: agentId } })
    if (!agentRecord) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    const review = await prisma.$transaction(async (tx: any) => {
      const created = await tx.review.create({
        data: {
          department,
          channel,
          caseRef,
          agentId,
          reviewerId,
          reviewDate: parsedReviewDate,
          monthKey,
          scorecardType,
          totalScore,
          maxScore,
          scorePercent,
          cbFlag: cbFlag ?? false,
          sbFlag: sbFlag ?? false,
          summaryNotes: summaryNotes ?? null,
          subScores: {
            create: subScores.map((s: {
              sectionName: string
              subcategoryName: string
              score: number
              maxScore: number
            }) => ({
              sectionName: s.sectionName,
              subcategoryName: s.subcategoryName,
              score: s.score,
              maxScore: s.maxScore,
            })),
          },
        },
        include: {
          subScores: true,
        },
      })

      if (Array.isArray(errorLogs) && errorLogs.length > 0) {
        await tx.errorLog.createMany({
          data: errorLogs.map((e: {
            category: string
            subcategory: string
            count?: number
          }) => ({
            reviewId: created.id,
            agentId,
            department,
            channel,
            monthKey,
            category: e.category,
            subcategory: e.subcategory,
            count: e.count ?? 1,
          })),
        })
      }

      return tx.review.findUnique({
        where: { id: created.id },
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
        },
      })
    })

    return NextResponse.json(review, { status: 201 })
  } catch (error) {
    console.error('[POST /api/reviews]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
