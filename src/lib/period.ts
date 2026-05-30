export type Period = '7d' | '28d' | '90d' | '12m'

export const PERIODS: Period[] = ['7d', '28d', '90d', '12m']

export function parsePeriod(value: string | undefined | null): Period {
  if (value && PERIODS.includes(value as Period)) return value as Period
  return '28d'
}

export function periodToDays(period: Period): number {
  switch (period) {
    case '7d':
      return 7
    case '28d':
      return 28
    case '90d':
      return 90
    case '12m':
      return 365
  }
}

export function periodLabel(period: Period): string {
  switch (period) {
    case '7d':
      return '7 days'
    case '28d':
      return '28 days'
    case '90d':
      return '90 days'
    case '12m':
      return '12 months'
  }
}

/** GSC data has ~2-day reporting lag; GA4 partial-day data creates a cliff. */
const DATA_LAG_DAYS = 2

export function getDateRange(period: Period): { start: Date; end: Date } {
  const end = new Date()
  end.setDate(end.getDate() - DATA_LAG_DAYS)
  end.setHours(23, 59, 59, 999)
  const start = new Date(end)
  start.setDate(start.getDate() - periodToDays(period))
  start.setHours(0, 0, 0, 0)
  return { start, end }
}

export function getComparisonRange(period: Period): { start: Date; end: Date } {
  const days = periodToDays(period)
  const end = new Date()
  end.setDate(end.getDate() - DATA_LAG_DAYS - days)
  end.setHours(23, 59, 59, 999)
  const start = new Date(end)
  start.setDate(start.getDate() - days)
  start.setHours(0, 0, 0, 0)
  return { start, end }
}
