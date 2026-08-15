import { describe, expect, it } from 'vitest'
import { freshData, normalise } from './storage'

describe('reading an old save', () => {
  it('turns each Must into a P1 plan and pools the nets into one safety pot', () => {
    const d = normalise({
      selCurs: ['RWF', 'USD'],
      mainCur: 'RWF',
      limits: {
        RWF: { must: 460_000, net: 140_000 },
        USD: { must: 100, net: 200 },
      },
    })
    expect(d.plans).toHaveLength(2)
    expect(d.plans.every((p) => p.prio === 1 && p.name === 'Musts')).toBe(true)
    expect(d.plans.map((p) => [p.cur, p.amt])).toEqual([
      ['RWF', 460_000],
      ['USD', 100],
    ])
    // 140,000 + 200 × 1420 = 424,000, all in the main currency
    expect(d.safety).toEqual({ amt: 424_000, cur: 'RWF' })
  })

  it('skips a currency whose Must was zero', () => {
    const d = normalise({
      selCurs: ['RWF'],
      mainCur: 'RWF',
      limits: { RWF: { must: 0, net: 5000 } },
    })
    expect(d.plans).toEqual([])
    expect(d.safety.amt).toBe(5000)
  })

  it('keeps a new save exactly as it is', () => {
    const d = freshData()
    d.plans = [{ id: 'x', name: 'Rent', amt: 60_000, cur: 'RWF', prio: 2, date: '2026-09-12' }]
    d.incomes = [
      { id: 'y', name: 'Salary', amt: 300_000, cur: 'RWF', date: '', counted: true },
    ]
    d.safety = { amt: 50_000, cur: 'USD' }
    const round = normalise(JSON.parse(JSON.stringify(d)))
    expect(round.plans).toEqual(d.plans)
    expect(round.incomes).toEqual(d.incomes)
    expect(round.safety).toEqual(d.safety)
  })

  it('starts a truly empty save fresh', () => {
    const d = normalise(null)
    expect(d.plans).toEqual([])
    expect(d.incomes).toEqual([])
    expect(d.safety).toEqual({ amt: 0, cur: 'RWF' })
  })

  it('spreads the old single hide switch across the three eyes', () => {
    const d = normalise({ settings: { round: false, reminder: true, hide: true } } as never)
    expect(d.settings.hideBal).toBe(true)
    expect(d.settings.hideMonth).toBe(true)
    expect(d.settings.hideSpent).toBe(true)

    const off = normalise({ settings: { round: false, reminder: true, hide: false } } as never)
    expect(off.settings.hideBal).toBe(false)
  })

  it('drops a stored plan that lost its amount', () => {
    const d = normalise({
      plans: [
        { id: 'a', name: 'Ok', amt: 10, cur: 'RWF', prio: 1, date: '' },
        { id: 'b', name: 'Broken', amt: 0, cur: 'RWF', prio: 1, date: '' },
      ],
      safety: { amt: 0, cur: 'RWF' },
    })
    expect(d.plans.map((p) => p.id)).toEqual(['a'])
  })
})
