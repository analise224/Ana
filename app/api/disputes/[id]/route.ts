import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

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
    const { adminResponse, status, resolvedAt } = body

    const existing = await prisma.dispute.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Dispute not found' }, { status: 404 })
    }

    if (status && !['UPHELD', 'REJECTED'].includes(status)) {
      return NextResponse.json(
        { error: "status must be 'UPHELD' or 'REJECTED'" },
        { status: 400 }
      )
    }

    const dispute = await prisma.dispute.update({
      where: { id },
      data: {
        ...(adminResponse !== undefined ? { adminResponse } : {}),
        ...(status !== undefined ? { status } : {}),
        ...(resolvedAt !== undefined
          ? { resolvedAt: resolvedAt ? new Date(resolvedAt) : new Date() }
          : {}),
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
    })

    return NextResponse.json(dispute)
  } catch (error) {
    console.error('[PATCH /api/disputes/[id]]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
