import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import bcrypt from 'bcryptjs'
import { SCORECARDS } from '../lib/scorecards'
import { ERROR_TAXONOMY } from '../lib/taxonomy'

const pool = new Pool({ connectionString: process.env.DATABASE_URL! })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter } as any)

async function main() {
  console.log('🌱 Seeding BizQuality database...')

  // ── SCORECARD DEFINITIONS ──────────────────────────────────────────────────
  for (const [key, sc] of Object.entries(SCORECARDS)) {
    await prisma.scorecardDefinition.upsert({
      where: { type: key },
      update: {},
      create: {
        name: sc.name,
        type: key,
        version: 1,
        active: true,
        jsonSchema: sc as any,
      },
    })
  }
  console.log('✅ Scorecards seeded')

  // ── ERROR TAXONOMY ─────────────────────────────────────────────────────────
  let sortOrder = 0
  for (const [channel, cats] of Object.entries(ERROR_TAXONOMY)) {
    for (const [category, subcats] of Object.entries(cats)) {
      for (const subcategory of subcats) {
        const existing = await prisma.errorTaxonomy.findFirst({
          where: { channel, category, subcategory },
        })
        if (!existing) {
          await prisma.errorTaxonomy.create({
            data: { channel, category, subcategory, active: true, sortOrder: sortOrder++ },
          })
        }
      }
    }
  }
  console.log('✅ Error taxonomy seeded')

  // ── ADMIN USERS ────────────────────────────────────────────────────────────
  const adminPassword = await bcrypt.hash('BizQuality2024!', 10)
  const admins = [
    { name: 'Annalise Farrugia', email: 'annalise.farrugia@bizquality.io' },
    { name: 'Sam Vella', email: 'sam.vella@bizquality.io' },
    { name: 'Rodianne Dalli', email: 'rodianne.dalli@bizquality.io' },
  ]
  const adminUsers: any[] = []
  for (const a of admins) {
    const user = await prisma.user.upsert({
      where: { email: a.email },
      update: {},
      create: { name: a.name, email: a.email, password: adminPassword, role: 'ADMIN', active: true },
    })
    adminUsers.push(user)
  }
  console.log('✅ Admin users seeded')

  // ── AGENT USERS ────────────────────────────────────────────────────────────
  const agentPassword = await bcrypt.hash('Agent2024!', 10)
  const agentData = [
    { name: 'Luke Fenech', email: 'luke.fenech@bizquality.io', team: 'CS Live Chat Team', department: 'CS' },
    { name: 'Nicole Persiano', email: 'nicole.persiano@bizquality.io', team: 'CS Live Chat Team', department: 'CS' },
    { name: 'Kurt Schembri', email: 'kurt.schembri@bizquality.io', team: 'CS Email Team', department: 'CS' },
    { name: 'Gabriella Galea', email: 'gabriella.galea@bizquality.io', team: 'CS Email Team', department: 'CS' },
    { name: 'Ricardo Camacaro', email: 'ricardo.camacaro@bizquality.io', team: 'PnV Payments Team', department: 'PnV' },
    { name: 'Yerald Marte', email: 'yerald.marte@bizquality.io', team: 'PnV Payments Team', department: 'PnV' },
    { name: 'Isadora De Sousa', email: 'isadora.desousa@bizquality.io', team: 'Compliance Team', department: 'Compliance' },
    { name: 'Hamza Choudhry', email: 'hamza.choudhry@bizquality.io', team: 'CS Live Chat Team', department: 'CS' },
    { name: 'Bassey Uduak', email: 'bassey.uduak@bizquality.io', team: 'CS Email Team', department: 'CS' },
    { name: 'Kingsley Brown', email: 'kingsley.brown@bizquality.io', team: 'CS Live Chat Team', department: 'CS' },
  ]

  const agentRecords: any[] = []
  for (const ad of agentData) {
    const user = await prisma.user.upsert({
      where: { email: ad.email },
      update: {},
      create: { name: ad.name, email: ad.email, password: agentPassword, role: 'AGENT', active: true },
    })
    let agent = await prisma.agent.findFirst({ where: { userId: user.id } })
    if (!agent) {
      agent = await prisma.agent.create({
        data: { name: ad.name, team: ad.team, department: ad.department, active: true, userId: user.id },
      })
    }
    agentRecords.push(agent)
  }
  console.log('✅ Agent users seeded')

  // ── SAMPLE REVIEWS ─────────────────────────────────────────────────────────
  const reviewer = adminUsers[0]

  const now = new Date()
  const months = [
    new Date(now.getFullYear(), now.getMonth() - 2, 1),
    new Date(now.getFullYear(), now.getMonth() - 1, 1),
    new Date(now.getFullYear(), now.getMonth(), 1),
  ]

  const toMonthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`

  const randomDate = (base: Date) => {
    const d = new Date(base)
    d.setDate(Math.floor(Math.random() * 25) + 1)
    return d
  }

  const randomScore = (max: number, minPct: number, maxPct: number) => {
    return Math.round(max * (minPct + Math.random() * (maxPct - minPct)))
  }

  type ScorecardKey = keyof typeof SCORECARDS

  const buildSubScores = (scKey: ScorecardKey, qualityLevel: 'high' | 'mid' | 'low') => {
    const sc = SCORECARDS[scKey]
    const [minP, maxP] = qualityLevel === 'high' ? [0.88, 1.0] : qualityLevel === 'mid' ? [0.70, 0.88] : [0.40, 0.70]
    const subScores: { sectionName: string; subcategoryName: string; score: number; maxScore: number }[] = []

    if (sc.isTicketGroup) {
      for (let ti = 0; ti < (sc.ticketCount ?? 5); ti++) {
        sc.sections.forEach((sec) => {
          sec.subcategories.forEach((sub) => {
            subScores.push({
              sectionName: `Ticket ${ti + 1} - ${sec.name}`,
              subcategoryName: sub.name,
              score: randomScore(sub.maxScore, minP, maxP),
              maxScore: sub.maxScore,
            })
          })
        })
      }
    } else {
      sc.sections.forEach((sec) => {
        sec.subcategories.forEach((sub) => {
          subScores.push({
            sectionName: sec.name,
            subcategoryName: sub.name,
            score: randomScore(sub.maxScore, minP, maxP),
            maxScore: sub.maxScore,
          })
        })
      })
    }
    return subScores
  }

  const buildErrors = (channel: string, count: number) => {
    const taxEntries = channel === 'Chat'
      ? [
          { category: 'Communication', subcategory: 'Tone & empathy' },
          { category: 'Procedural', subcategory: 'Wrong process followed' },
          { category: 'Information', subcategory: 'Wrong product info' },
          { category: 'Response Time', subcategory: 'Slow initial response' },
          { category: 'Tags', subcategory: 'Tag missing' },
        ]
      : [
          { category: 'Communication', subcategory: 'Poor written tone' },
          { category: 'Procedural', subcategory: 'Wrong process' },
          { category: 'Information', subcategory: 'Wrong product info' },
        ]
    const errors = []
    for (let i = 0; i < count; i++) {
      const e = taxEntries[Math.floor(Math.random() * taxEntries.length)]
      errors.push({ ...e, count: Math.ceil(Math.random() * 2) })
    }
    return errors
  }

  interface ReviewSpec {
    agentIdx: number
    scKey: ScorecardKey
    channel: string
    department: string
    quality: 'high' | 'mid' | 'low'
    monthIdx: number
    cbFlag?: boolean
    sbFlag?: boolean
    errorCount?: number
  }

  const reviewSpecs: ReviewSpec[] = [
    // Month -2 (8 reviews)
    { agentIdx: 0, scKey: 'CS_CHAT', channel: 'Chat', department: 'CS', quality: 'high', monthIdx: 0 },
    { agentIdx: 1, scKey: 'CS_CHAT', channel: 'Chat', department: 'CS', quality: 'mid', monthIdx: 0, errorCount: 2 },
    { agentIdx: 2, scKey: 'CS_TICKET', channel: 'Ticket', department: 'CS', quality: 'high', monthIdx: 0 },
    { agentIdx: 3, scKey: 'CS_TICKET', channel: 'Ticket', department: 'CS', quality: 'low', monthIdx: 0, errorCount: 3, cbFlag: true },
    { agentIdx: 4, scKey: 'PNV_CHAT', channel: 'Chat', department: 'PnV', quality: 'high', monthIdx: 0 },
    { agentIdx: 5, scKey: 'PNV_CHAT', channel: 'Chat', department: 'PnV', quality: 'mid', monthIdx: 0, errorCount: 1 },
    { agentIdx: 6, scKey: 'COMPLIANCE_CHAT', channel: 'Chat', department: 'Compliance', quality: 'high', monthIdx: 0 },
    { agentIdx: 7, scKey: 'CS_CHAT', channel: 'Chat', department: 'CS', quality: 'mid', monthIdx: 0, errorCount: 2 },
    // Month -1 (8 reviews)
    { agentIdx: 0, scKey: 'CS_CHAT', channel: 'Chat', department: 'CS', quality: 'high', monthIdx: 1 },
    { agentIdx: 1, scKey: 'CS_CHAT', channel: 'Chat', department: 'CS', quality: 'high', monthIdx: 1 },
    { agentIdx: 2, scKey: 'CS_TICKET', channel: 'Ticket', department: 'CS', quality: 'mid', monthIdx: 1, errorCount: 1 },
    { agentIdx: 3, scKey: 'CS_TICKET', channel: 'Ticket', department: 'CS', quality: 'mid', monthIdx: 1, errorCount: 2 },
    { agentIdx: 4, scKey: 'PNV_CHAT', channel: 'Chat', department: 'PnV', quality: 'high', monthIdx: 1 },
    { agentIdx: 5, scKey: 'PNV_CHAT', channel: 'Chat', department: 'PnV', quality: 'low', monthIdx: 1, errorCount: 3, sbFlag: true },
    { agentIdx: 8, scKey: 'CS_TICKET', channel: 'Ticket', department: 'CS', quality: 'high', monthIdx: 1 },
    { agentIdx: 9, scKey: 'CS_CHAT', channel: 'Chat', department: 'CS', quality: 'low', monthIdx: 1, errorCount: 3, cbFlag: true },
    // Current month (8 reviews)
    { agentIdx: 0, scKey: 'CS_CHAT', channel: 'Chat', department: 'CS', quality: 'high', monthIdx: 2 },
    { agentIdx: 1, scKey: 'CS_CHAT', channel: 'Chat', department: 'CS', quality: 'mid', monthIdx: 2, errorCount: 1 },
    { agentIdx: 2, scKey: 'CS_TICKET', channel: 'Ticket', department: 'CS', quality: 'high', monthIdx: 2 },
    { agentIdx: 6, scKey: 'COMPLIANCE_CHAT', channel: 'Chat', department: 'Compliance', quality: 'high', monthIdx: 2 },
    { agentIdx: 7, scKey: 'CS_CHAT', channel: 'Chat', department: 'CS', quality: 'high', monthIdx: 2 },
    { agentIdx: 8, scKey: 'CS_TICKET', channel: 'Ticket', department: 'CS', quality: 'mid', monthIdx: 2, errorCount: 2 },
    { agentIdx: 9, scKey: 'CS_CHAT', channel: 'Chat', department: 'CS', quality: 'mid', monthIdx: 2, errorCount: 1 },
    { agentIdx: 4, scKey: 'PNV_CHAT', channel: 'Chat', department: 'PnV', quality: 'high', monthIdx: 2 },
  ]

  let caseNum = 1000
  for (const spec of reviewSpecs) {
    const agent = agentRecords[spec.agentIdx]
    const monthBase = months[spec.monthIdx]
    const reviewDate = randomDate(monthBase)
    const monthKey = toMonthKey(monthBase)
    const subScores = buildSubScores(spec.scKey, spec.quality)
    const totalScore = subScores.reduce((s, ss) => s + ss.score, 0)
    const maxScore = subScores.reduce((s, ss) => s + ss.maxScore, 0)
    const scorePercent = (totalScore / maxScore) * 100
    const errorLogs = spec.errorCount ? buildErrors(spec.channel, spec.errorCount) : []

    const review = await prisma.review.create({
      data: {
        agentId: agent.id,
        reviewerId: reviewer.id,
        department: spec.department,
        channel: spec.channel,
        caseRef: `CASE-${++caseNum}`,
        reviewDate,
        monthKey,
        scorecardType: spec.scKey,
        totalScore,
        maxScore,
        scorePercent,
        cbFlag: spec.cbFlag ?? false,
        sbFlag: spec.sbFlag ?? false,
        summaryNotes: spec.quality === 'low' ? 'Please review the process guidelines and attend the upcoming coaching session.' : spec.quality === 'mid' ? 'Good effort — focus on compliance checks and response clarity.' : null,
        subScores: {
          create: subScores,
        },
      },
    })

    for (const el of errorLogs) {
      await prisma.errorLog.create({
        data: {
          reviewId: review.id,
          agentId: agent.id,
          department: spec.department,
          channel: spec.channel,
          monthKey,
          category: el.category,
          subcategory: el.subcategory,
          count: el.count,
          logDate: reviewDate,
        },
      })
    }
  }

  console.log('✅ Sample reviews seeded (24 reviews)')
  console.log('\n🎉 Database seeded successfully!')
  console.log('\nAdmin login: annalise.farrugia@bizquality.io / BizQuality2024!')
  console.log('Agent login: luke.fenech@bizquality.io / Agent2024!')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
