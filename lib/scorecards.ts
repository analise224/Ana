export interface Subcategory {
  name: string
  maxScore: number
}

export interface Section {
  name: string
  maxScore: number
  subcategories: Subcategory[]
}

export interface ScorecardConfig {
  key: string
  name: string
  totalMax: number
  isTicketGroup?: boolean
  ticketCount?: number
  sections: Section[]
}

export const SCORECARDS: Record<string, ScorecardConfig> = {
  CS_CHAT: {
    key: 'CS_CHAT',
    name: 'CS Chat Scorecard',
    totalMax: 100,
    sections: [
      {
        name: 'Opening',
        maxScore: 10,
        subcategories: [
          { name: 'Greeting & Introduction', maxScore: 5 },
          { name: 'Tone Warm & Professional', maxScore: 5 },
        ],
      },
      {
        name: 'Understanding the Customer',
        maxScore: 15,
        subcategories: [
          { name: 'Listened & Understood Issue', maxScore: 8 },
          { name: 'Clarifying Questions Asked', maxScore: 7 },
        ],
      },
      {
        name: 'Compliance & Procedures',
        maxScore: 25,
        subcategories: [
          { name: 'Followed Correct Process', maxScore: 10 },
          { name: 'Regulatory Disclosure', maxScore: 8 },
          { name: 'Data Handling & Privacy', maxScore: 7 },
        ],
      },
      {
        name: 'Knowledge & Accuracy',
        maxScore: 25,
        subcategories: [
          { name: 'Correct Product Information', maxScore: 10 },
          { name: 'Fee Rate Accuracy', maxScore: 8 },
          { name: 'No Misleading Statements', maxScore: 7 },
        ],
      },
      {
        name: 'Resolution & Outcome',
        maxScore: 20,
        subcategories: [
          { name: 'Issue Fully Resolved', maxScore: 10 },
          { name: 'First Contact Resolution', maxScore: 5 },
          { name: 'Clear Next Steps Given', maxScore: 5 },
        ],
      },
      {
        name: 'Closing',
        maxScore: 5,
        subcategories: [
          { name: 'Polite & Professional Close', maxScore: 5 },
        ],
      },
    ],
  },
  CS_TICKET: {
    key: 'CS_TICKET',
    name: 'CS Ticket Scorecard',
    totalMax: 500,
    isTicketGroup: true,
    ticketCount: 5,
    sections: [
      {
        name: 'Communication Quality',
        maxScore: 30,
        subcategories: [
          { name: 'Written Tone', maxScore: 10 },
          { name: 'Grammar & Spelling', maxScore: 10 },
          { name: 'Clarity of Response', maxScore: 10 },
        ],
      },
      {
        name: 'Procedural Accuracy',
        maxScore: 40,
        subcategories: [
          { name: 'Correct Process Applied', maxScore: 15 },
          { name: 'Policy Compliance', maxScore: 15 },
          { name: 'SLA Met', maxScore: 10 },
        ],
      },
      {
        name: 'Information Accuracy',
        maxScore: 30,
        subcategories: [
          { name: 'Product/Service Info Correct', maxScore: 15 },
          { name: 'Fee & Rate Accuracy', maxScore: 8 },
          { name: 'Resolution Correctness', maxScore: 7 },
        ],
      },
    ],
  },
  PNV_CHAT: {
    key: 'PNV_CHAT',
    name: 'PnV Chat Scorecard',
    totalMax: 100,
    sections: [
      {
        name: 'Transaction Accuracy',
        maxScore: 40,
        subcategories: [
          { name: 'Correct Amount', maxScore: 15 },
          { name: 'Currency Handling', maxScore: 10 },
          { name: 'Reversal Accuracy', maxScore: 15 },
        ],
      },
      {
        name: 'Compliance Checks',
        maxScore: 35,
        subcategories: [
          { name: 'KYC Verification', maxScore: 15 },
          { name: 'AML Flags Raised', maxScore: 10 },
          { name: 'Documentation', maxScore: 10 },
        ],
      },
      {
        name: 'Communication',
        maxScore: 25,
        subcategories: [
          { name: 'Customer Notification', maxScore: 10 },
          { name: 'Advice Accuracy', maxScore: 15 },
        ],
      },
    ],
  },
  COMPLIANCE_CHAT: {
    key: 'COMPLIANCE_CHAT',
    name: 'Compliance Chat Scorecard',
    totalMax: 100,
    sections: [
      {
        name: 'Regulatory Adherence',
        maxScore: 40,
        subcategories: [
          { name: 'Disclosures Made', maxScore: 15 },
          { name: 'Correct Regulation Applied', maxScore: 15 },
          { name: 'GDPR Compliance', maxScore: 10 },
        ],
      },
      {
        name: 'Documentation',
        maxScore: 30,
        subcategories: [
          { name: 'Files Complete', maxScore: 15 },
          { name: 'Correct Version Used', maxScore: 15 },
        ],
      },
      {
        name: 'Communication',
        maxScore: 30,
        subcategories: [
          { name: 'No Misleading Statements', maxScore: 15 },
          { name: 'No Unauthorised Promises', maxScore: 15 },
        ],
      },
    ],
  },
}

export function getScorecardKey(department: string, channel: string): string {
  if (department === 'CS' && channel === 'Chat') return 'CS_CHAT'
  if (department === 'CS' && channel === 'Ticket') return 'CS_TICKET'
  if (department === 'PnV') return 'PNV_CHAT'
  if (department === 'Compliance') return 'COMPLIANCE_CHAT'
  return 'CS_CHAT'
}
