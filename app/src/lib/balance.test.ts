import { describe, expect, it } from 'vitest'
import {
  applyDelete,
  applyDeleteAll,
  applyEdit,
  applyRecord,
  spendable,
} from './calc'
import type { Expense } from '../types'

const expense = (over: Partial<Expense> = {}): Expense => ({
  id: Math.random().toString(36),
  amount: 2400,
  method: 'momo',
  note: 'Groceries',
  cur: 'RWF',
  at: Date.now(),
  ...over,
})

describe('spending draws the balance down', () => {
  it('lowers the total of the currency it was recorded in', () => {
    const after = applyRecord({ RWF: 840_000 }, expense())
    expect(after.RWF).toBe(837_600)
  })

  it('leaves the other currencies alone', () => {
    const after = applyRecord({ RWF: 840_000, USD: 1240 }, expense({ cur: 'USD', amount: 40 }))
    expect(after.USD).toBe(1200)
    expect(after.RWF).toBe(840_000)
  })

  it('can take the balance negative rather than clamping at zero', () => {
    const after = applyRecord({ RWF: 1000 }, expense({ amount: 2500 }))
    expect(after.RWF).toBe(-1500)
  })

  it('starts a currency it has never seen at zero', () => {
    const after = applyRecord({}, expense({ cur: 'KES', amount: 300 }))
    expect(after.KES).toBe(-300)
  })
})

describe('undoing a spend puts the money back', () => {
  it('deleting restores the exact amount', () => {
    const item = expense()
    const spent = applyRecord({ RWF: 840_000 }, item)
    expect(applyDelete(spent, item).RWF).toBe(840_000)
  })

  it('deleting them all restores every currency', () => {
    const items = [
      expense({ amount: 2400, cur: 'RWF' }),
      expense({ amount: 850, cur: 'RWF' }),
      expense({ amount: 40, cur: 'USD' }),
    ]
    let bal: Record<string, number> = { RWF: 840_000, USD: 1240 }
    for (const i of items) bal = applyRecord(bal, i)
    expect(bal).toEqual({ RWF: 836_750, USD: 1200 })

    expect(applyDeleteAll(bal, items)).toEqual({ RWF: 840_000, USD: 1240 })
  })
})

describe('editing moves only the difference', () => {
  it('raising the amount takes the extra off', () => {
    const item = expense({ amount: 2400 })
    const spent = applyRecord({ RWF: 840_000 }, item)
    expect(applyEdit(spent, item, 3000).RWF).toBe(837_000)
  })

  it('lowering the amount gives the difference back', () => {
    const item = expense({ amount: 2400 })
    const spent = applyRecord({ RWF: 840_000 }, item)
    expect(applyEdit(spent, item, 400).RWF).toBe(839_600)
  })

  it('saving the same amount changes nothing', () => {
    const item = expense({ amount: 2400 })
    const spent = applyRecord({ RWF: 840_000 }, item)
    expect(applyEdit(spent, item, 2400).RWF).toBe(spent.RWF)
  })
})

describe('the whole picture', () => {
  it('spending eats into the spendable amount', () => {
    const limits = { must: 460_000, net: 140_000 }
    let bal: Record<string, number> = { RWF: 840_000 }
    expect(spendable(bal.RWF, limits)).toBe(275_000)

    bal = applyRecord(bal, expense({ amount: 75_000 }))
    expect(spendable(bal.RWF, limits)).toBe(200_000)
  })

  it('spending enough turns the balance red against the must limit', () => {
    const limits = { must: 460_000, net: 140_000 }
    let bal: Record<string, number> = { RWF: 500_000 }
    bal = applyRecord(bal, expense({ amount: 60_000 }))
    expect(bal.RWF).toBe(440_000)
    expect(bal.RWF < limits.must).toBe(true)
  })
})
