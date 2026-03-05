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
    const channel = searchParams.get('channel')
    const activeParam = searchParams.get('active')

    const taxonomy = await prisma.errorTaxonomy.findMany({
      where: {
        ...(channel ? { channel } : {}),
        ...(activeParam === 'true' ? { active: true } : {}),
      },
      orderBy: [{ channel: 'asc' }, { sortOrder: 'asc' }, { category: 'asc' }],
    })

    return NextResponse.json(taxonomy)
  } catch (error) {
    console.error('[GET /api/taxonomy]', error)
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
    const { channel, category, subcategory } = body

    if (!channel || !category || !subcategory) {
      return NextResponse.json(
        { error: 'channel, category, and subcategory are required' },
        { status: 400 }
      )
    }

    const entry = await prisma.errorTaxonomy.create({
      data: {
        channel,
        category,
        subcategory,
      },
    })

    return NextResponse.json(entry, { status: 201 })
  } catch (error) {
    console.error('[POST /api/taxonomy]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
