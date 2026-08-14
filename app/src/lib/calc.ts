import type { Expense, Limits, Method } from '../types'
import { convert } from './rates'

export const DAY = 864e5

/**
 * The heart of the app.
 *
 *   spendable = balance − must − 0.75 × safety net
 *
 * The Must limit is money already committed, so all of it is taken off.
 * The safety net is a cushion a person will dip into, so only three
 * quarters of it is taken off.
 */
export function spendable(balance: number, lim: Limits): number {
  return balance - lim.must - 0.75 * lim.net
}

/** Balance is below the strict limit — the red warning. */
export function overMust(balance: number, lim: Limits): boolean {
  return balance < lim.must
}

/** Not over the must, but the cushion is eaten into — the violet warning. */
export function overNet(balance: number, lim: Limits): boolean {
  return !overMust(balance, lim) && spendable(balance, lim) < 0
}

export const EMPTY_LIMITS: Limits = { must: 0, net: 0 }

export function limitsFor(
  limits: Record<string, Limits>,
  code: string,
): Limits {
  return limits[code] ?? EMPTY_LIMITS
}

/* ------------------------------------------------------------------
   Spending draws the balance down.

   An expense lowers the total of the currency it was recorded in, and
   undoing it puts the money back. "Update balance" is the correction:
   it replaces the totals with what the person says they really have.
------------------------------------------------------------------ */

type Balances = Record<string, number>

function move(balances: Balances, code: string, by: number): Balances {
  return { ...balances, [code]: (balances[code] ?? 0) + by }
}

export function applyRecord(balances: Balances, item: Expense): Balances {
  return move(balances, item.cur, -item.amount)
}

export function applyDelete(balances: Balances, item: Expense): Balances {
  return move(balances, item.cur, item.amount)
}

/** Only the difference moves, so editing twice does not double-count. */
export function applyEdit(
  balances: Balances,
  item: Expense,
  nextAmount: number,
): Balances {
  return move(balances, item.cur, item.amount - nextAmount)
}

export function applyDeleteAll(balances: Balances, items: Expense[]): Balances {
  let out = { ...balances }
  for (const i of items) out = move(out, i.cur, i.amount)
  return out
}

/* ------------------------------------------------------------------
   Aggregates. Every expense carries the currency it was recorded in,
   so a total is always converted into the currency being displayed.
------------------------------------------------------------------ */

export function amountIn(
  rates: Record<string, number>,
  item: Expense,
  display: string,
): number {
  return convert(rates, item.amount, item.cur, display)
}

export function sumIn(
  rates: Record<string, number>,
  items: Expense[],
  display: string,
): number {
  return items.reduce((s, i) => s + amountIn(rates, i, display), 0)
}

export function sumByMethod(
  rates: Record<string, number>,
  items: Expense[],
  method: Method,
  display: string,
): number {
  return sumIn(
    rates,
    items.filter((i) => i.method === method),
    display,
  )
}

/** Whole days between the expense and today, in the phone's own timezone. */
export function dayOffset(at: number, now: number = Date.now()): number {
  const a = new Date(at)
  const b = new Date(now)
  a.setHours(0, 0, 0, 0)
  b.setHours(0, 0, 0, 0)
  return Math.round((b.getTime() - a.getTime()) / DAY)
}

const MON = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

export function dayLabel(at: number, now: number = Date.now()): string {
  const off = dayOffset(at, now)
  if (off === 0) return 'Today'
  if (off === 1) return 'Yesterday'
  const d = new Date(at)
  return d.getDate() + ' ' + MON[d.getMonth()]
}

export function monthIndex(at: number): number {
  const d = new Date(at)
  return d.getFullYear() * 12 + d.getMonth()
}

export function monthName(index: number): string {
  return MON[((index % 12) + 12) % 12]
}

/** Group expenses by day, newest first. */
export function byDay(
  items: Expense[],
  now: number = Date.now(),
): { off: number; label: string; items: Expense[] }[] {
  const map = new Map<number, Expense[]>()
  for (const i of items) {
    const off = dayOffset(i.at, now)
    const list = map.get(off)
    if (list) list.push(i)
    else map.set(off, [i])
  }
  return [...map.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([off, list]) => ({
      off,
      label: dayLabel(list[0].at, now),
      items: list.sort((a, b) => b.at - a.at),
    }))
}

/** The top five categories by amount, largest first. */
export function topCategories(
  rates: Record<string, number>,
  items: Expense[],
  display: string,
  labelOf: (i: Expense) => string,
): { name: string; value: number }[] {
  const map: Record<string, number> = {}
  for (const i of items) {
    const k = labelOf(i)
    map[k] = (map[k] || 0) + amountIn(rates, i, display)
  }
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, value]) => ({ name, value }))
}
