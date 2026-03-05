'use client'

interface ScoreBadgeProps {
  score: number
  size?: 'sm' | 'md' | 'lg'
}

export function ScoreBadge({ score, size = 'md' }: ScoreBadgeProps) {
  const color =
    score >= 90
      ? { bg: 'rgba(16,201,126,0.15)', text: '#10C97E', border: 'rgba(16,201,126,0.3)' }
      : score >= 70
      ? { bg: 'rgba(245,166,35,0.15)', text: '#F5A623', border: 'rgba(245,166,35,0.3)' }
      : { bg: 'rgba(240,64,96,0.15)', text: '#F04060', border: 'rgba(240,64,96,0.3)' }

  const padding = size === 'sm' ? 'px-2 py-0.5 text-xs' : size === 'lg' ? 'px-4 py-1.5 text-base' : 'px-3 py-1 text-sm'

  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold ${padding}`}
      style={{ background: color.bg, color: color.text, border: `1px solid ${color.border}` }}
    >
      {score.toFixed(1)}%
    </span>
  )
}

export function getScoreColor(score: number): string {
  if (score >= 90) return '#10C97E'
  if (score >= 70) return '#F5A623'
  return '#F04060'
}

export function getScoreLabel(score: number): string {
  if (score >= 90) return 'Pass'
  if (score >= 70) return 'Review'
  return 'Fail'
}
