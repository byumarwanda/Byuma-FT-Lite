import { describe, expect, it } from 'vitest'
import {
  amountIn,
  byDay,
  dayLabel,
  dayOffset,
  overMust,
  overNet,
  spendable,
  sumIn,
  topCategories,
  totalBalance,
  totalLimits,
} from './calc'
import { BASE_RATES, convert, estRate, withRate } from './rates'
import type { Expense } from '../types'

const DAY = 864e5

const expense = (over: Partial<Expense> = {}): Expense => ({
  id: Math.random().toString(36),
  amount: 1000,
  method: 'cash',
  note: '',
  cur: 'RWF',
  at: Date.now(),
  ...over,
})

describe('spendable', () => {
  it('takes all of the must and three quarters of the safety net', () => {
    // The design's own numbers: 840,000 − 460,000 − 0.75 × 140,000 = 275,000
    expect(spendable(840_000, { must: 460_000, net: 140_000 })).toBe(275_000)
  })

  it('is just the balance when no limits are set', () => {
    expect(spendable(5000, { must: 0, net: 0 })).toBe(5000)
  })
})

describe('the two warnings', () => {
  it('goes red when the balance is under the must limit', () => {
    const lim = { must: 500, net: 100 }
    expect(overMust(400, lim)).toBe(true)
    expect(overNet(400, lim)).toBe(false)
  })

  it('goes violet when only the safety net is breached', () => {
    const lim = { must: 300, net: 200 }
    // 400 − 300 − 150 = −50, but the balance still covers the must
    expect(overMust(400, lim)).toBe(false)
    expect(overNet(400, lim)).toBe(true)
  })

  it('shows neither when there is money left', () => {
    const lim = { must: 100, net: 100 }
    expect(overMust(1000, lim)).toBe(false)
    expect(overNet(1000, lim)).toBe(false)
  })

  it('never shows both colours at once', () => {
    for (const [bal, must, net] of [
      [0, 100, 100],
      [400, 300, 200],
      [1000, 100, 100],
      [100, 100, 100],
    ]) {
      const lim = { must, net }
      expect(overMust(bal, lim) && overNet(bal, lim)).toBe(false)
    }
  })
})

describe('the rate table', () => {
  it('shows a pair as from over main, to two decimals', () => {
    expect(estRate(BASE_RATES, 'USD', 'RWF')).toBe(1420)
    expect(estRate(BASE_RATES, 'RWF', 'USD')).toBe(0)
    expect(estRate(BASE_RATES, 'TL', 'USD')).toBe(0.02)
  })

  it('writes an edited rate back through the main currency', () => {
    const next = withRate(BASE_RATES, 'USD', 1500, 'RWF')
    expect(next.USD).toBe(1500)
    expect(estRate(next, 'USD', 'RWF')).toBe(1500)
  })

  it('an edit made against one main currency holds for every pair', () => {
    // With USD as main, saying 1 EUR = 1.1 USD must survive a switch to RWF.
    const next = withRate(BASE_RATES, 'EUR', 1.1, 'USD')
    expect(next.EUR).toBeCloseTo(1562, 0)
    expect(estRate(next, 'EUR', 'USD')).toBe(1.1)
  })

  it('ignores a zero or blank edit rather than rejecting it', () => {
    expect(withRate(BASE_RATES, 'USD', 0, 'RWF')).toBe(BASE_RATES)
  })

  it('converts between currencies', () => {
    expect(convert(BASE_RATES, 100, 'USD', 'RWF')).toBe(142_000)
    expect(convert(BASE_RATES, 142_000, 'RWF', 'USD')).toBe(100)
    expect(convert(BASE_RATES, 50, 'RWF', 'RWF')).toBe(50)
  })
})

describe('totals', () => {
  it('converts every expense into the currency being shown', () => {
    const items = [
      expense({ amount: 1000, cur: 'RWF' }),
      expense({ amount: 1, cur: 'USD' }),
    ]
    expect(sumIn(BASE_RATES, items, 'RWF')).toBe(2420)
  })

  it('reads a single expense in another currency', () => {
    expect(amountIn(BASE_RATES, expense({ amount: 2, cur: 'USD' }), 'RWF')).toBe(2840)
  })
})

describe('day grouping', () => {
  it('labels today and yesterday by name', () => {
    expect(dayLabel(Date.now())).toBe('Today')
    expect(dayLabel(Date.now() - DAY)).toBe('Yesterday')
  })

  it('labels anything older by date', () => {
    expect(dayLabel(Date.now() - 5 * DAY)).toMatch(/^\d{1,2} [A-Z][a-z]{2}$/)
  })

  it('counts whole days, not 24-hour blocks', () => {
    const now = new Date(2026, 7, 13, 1, 0, 0).getTime()
    const lateYesterday = new Date(2026, 7, 12, 23, 30, 0).getTime()
    expect(dayOffset(lateYesterday, now)).toBe(1)
  })

  it('groups newest day first and newest row first inside a day', () => {
    const now = Date.now()
    const groups = byDay(
      [
        expense({ at: now - 2 * DAY, amount: 1 }),
        expense({ at: now - 60_000, amount: 2 }),
        expense({ at: now - 30_000, amount: 3 }),
      ],
      now,
    )
    expect(groups[0].label).toBe('Today')
    expect(groups[0].items.map((i) => i.amount)).toEqual([3, 2])
    expect(groups[1].off).toBe(2)
  })
})

describe('top categories', () => {
  it('returns at most five, largest first', () => {
    const items = [
      expense({ amount: 100, note: 'Food' }),
      expense({ amount: 500, note: 'Rent' }),
      expense({ amount: 50, note: 'Food' }),
      expense({ amount: 10, note: 'Bus' }),
      expense({ amount: 9, note: 'A' }),
      expense({ amount: 8, note: 'B' }),
      expense({ amount: 7, note: 'C' }),
    ]
    const top = topCategories(BASE_RATES, items, 'RWF', (i) => i.note)
    expect(top).toHaveLength(5)
    expect(top[0]).toEqual({ name: 'Rent', value: 500 })
    expect(top[1]).toEqual({ name: 'Food', value: 150 })
  })

  it('falls back to the method name when there is no note', () => {
    const top = topCategories(
      BASE_RATES,
      [expense({ amount: 20, note: '', method: 'momo' })],
      'RWF',
      (i) => i.note || i.method,
    )
    expect(top[0].name).toBe('momo')
  })
})

describe('the ultimate total', () => {
  // 1 USD = 1420 RWF, 1 TL = 34 RWF
  const balances = { RWF: 840_000, TL: 9_600, USD: 1_240 }
  const codes = ['RWF', 'TL', 'USD']

  it('adds every currency into one figure', () => {
    // 840,000 + 9,600x34 + 1,240x1420 = 840,000 + 326,400 + 1,760,800
    expect(totalBalance(BASE_RATES, balances, codes, 'RWF')).toBe(2_927_200)
  })

  it('gives the same money whichever currency it is shown in', () => {
    const inRwf = totalBalance(BASE_RATES, balances, codes, 'RWF')
    const inUsd = totalBalance(BASE_RATES, balances, codes, 'USD')
    expect(inUsd).toBeCloseTo(inRwf / 1420, 6)
  })

  it('counts only the currencies that are picked', () => {
    expect(totalBalance(BASE_RATES, balances, ['RWF'], 'RWF')).toBe(840_000)
    expect(totalBalance(BASE_RATES, balances, ['RWF', 'TL'], 'RWF')).toBe(1_166_400)
  })

  it('treats a currency with no balance as zero', () => {
    expect(totalBalance(BASE_RATES, { RWF: 500 }, ['RWF', 'USD'], 'RWF')).toBe(500)
  })

  it('sums the limits across currencies too', () => {
    const limits = {
      RWF: { must: 460_000, net: 140_000 },
      USD: { must: 100, net: 200 },
    }
    const whole = totalLimits(BASE_RATES, limits, ['RWF', 'USD'], 'RWF')
    expect(whole.must).toBe(460_000 + 142_000)
    expect(whole.net).toBe(140_000 + 284_000)
  })

  it('drives spendable off the whole pot, not one currency', () => {
    const limits = {
      RWF: { must: 460_000, net: 140_000 },
      TL: { must: 0, net: 0 },
      USD: { must: 0, net: 0 },
    }
    const bal = totalBalance(BASE_RATES, balances, codes, 'RWF')
    const lim = totalLimits(BASE_RATES, limits, codes, 'RWF')
    // 2,927,200 − 460,000 − 105,000
    expect(spendable(bal, lim)).toBe(2_362_200)
  })

  it('follows an edited rate', () => {
    const cheaper = withRate(BASE_RATES, 'USD', 1000, 'RWF')
    expect(totalBalance(cheaper, { USD: 2 }, ['USD'], 'RWF')).toBe(2000)
  })
})
