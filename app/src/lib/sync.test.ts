import { describe, expect, it } from 'vitest'
import { merge, reconcile } from './sync'
import { freshData } from './storage'
import type { Expense, UserData } from '../types'

const item = (id: string, at: number, amount = 100): Expense => ({
  id,
  amount,
  method: 'cash',
  note: '',
  cur: 'RWF',
  at,
})

const withItems = (...items: Expense[]): UserData => ({ ...freshData(), items })
const none = new Set<string>()

describe('opening on the phone’s copy, then hearing from the server', () => {
  it('puts the phone’s copy up when the server has none', () => {
    expect(reconcile(withItems(item('a', 1)), 0, false, none, null)).toEqual({ kind: 'push' })
  })

  it('keeps the phone’s copy when nothing changed anywhere', () => {
    const cloud = { data: withItems(item('a', 1)), updatedAt: 50 }
    expect(reconcile(withItems(item('a', 1)), 50, false, none, cloud)).toEqual({ kind: 'keep' })
  })

  it('sends a change made here when the server did not move', () => {
    const cloud = { data: withItems(item('a', 1)), updatedAt: 50 }
    const local = withItems(item('b', 2), item('a', 1))
    expect(reconcile(local, 50, true, none, cloud)).toEqual({ kind: 'push' })
  })

  it('takes the server’s copy when only another phone changed it', () => {
    const cloudData = withItems(item('c', 3), item('a', 1))
    const r = reconcile(withItems(item('a', 1)), 50, false, none, { data: cloudData, updatedAt: 60 })
    expect(r).toEqual({ kind: 'take', data: cloudData, base: 60 })
  })

  it('merges when both moved, and keeps every expense', () => {
    const local = withItems(item('b', 2), item('a', 1))
    const cloud = { data: withItems(item('c', 3), item('a', 1)), updatedAt: 60 }
    const r = reconcile(local, 50, true, none, cloud)
    expect(r.kind).toBe('merge')
    if (r.kind !== 'merge') return
    expect(r.base).toBe(60)
    expect(r.data.items.map((i) => i.id)).toEqual(['c', 'b', 'a'])
  })
})

describe('a merge', () => {
  it('lets this phone’s version of the same expense win', () => {
    const local = withItems(item('a', 1, 999))
    const cloud = withItems(item('a', 1, 100))
    expect(merge(local, cloud, none).items).toEqual([item('a', 1, 999)])
  })

  it('does not bring back what was deleted on this phone', () => {
    const local = withItems(item('b', 2))
    const cloud = withItems(item('b', 2), item('a', 1))
    expect(merge(local, cloud, new Set(['a'])).items.map((i) => i.id)).toEqual(['b'])
  })

  it('keeps plans, incomes and phases from both sides, and the phone’s settings', () => {
    const local: UserData = {
      ...freshData(),
      plans: [{ id: 'p1', name: 'Rent', amt: 10, cur: 'RWF', prio: 1, date: '' }],
      settings: { ...freshData().settings, round: true },
      cats: ['Food', 'Rent'],
    }
    const cloud: UserData = {
      ...freshData(),
      plans: [{ id: 'p2', name: 'Fees', amt: 20, cur: 'RWF', prio: 2, date: '' }],
      incomes: [{ id: 'i1', name: 'Pay', amt: 5, cur: 'RWF', date: '', counted: false }],
      phases: [{ id: 'ph', name: 'Trip', from: '2026-09-01', to: '' }],
      cats: ['food', 'Books'],
    }
    const m = merge(local, cloud, none)
    expect(m.plans.map((p) => p.id)).toEqual(['p1', 'p2'])
    expect(m.incomes.map((i) => i.id)).toEqual(['i1'])
    expect(m.phases.map((p) => p.id)).toEqual(['ph'])
    expect(m.settings.round).toBe(true)
    expect(m.cats).toEqual(['Food', 'Rent', 'Books'])
  })
})
