import type { Account, Income, Plan, Prio, Safety, UserData } from '../types'
import { BASE_CURS, BASE_RATES, convert } from './rates'

/**
 * Everything is kept in this phone's own storage. Accounts live under one
 * key; each account's money data lives under its own key so signing out
 * and back in brings the same data back.
 */

const K_ACCOUNTS = 'byuma.accounts.v1'
const K_SESSION = 'byuma.session.v1'
// Who signed in last on this phone, so the sign-in screen can offer to
// unlock with the phone instead of asking for the password.
const K_LAST = 'byuma.last.v1'
const K_DATA = 'byuma.data.v1.'

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage full or blocked (private mode). The app keeps running on the
    // state it already has in memory rather than crashing.
  }
}

export const BASE_CATS = ['Transport', 'Food', 'Groceries', 'Coffee', 'Bills', 'Rent']

/** The Categories screen's own limit, applied wherever one is created. */
export const MAX_CAT = 18

/**
 * A note typed straight into the recorder becomes a category, so the next
 * time it is one tap away. The chips are ordered by how often each has been
 * used, so a new one that catches on rises to the front by itself.
 *
 * Same rules as adding one by hand: not empty, under 18 characters, and no
 * duplicate regardless of case. Anything else is left as a one-off note.
 */
export function rememberCategory(cats: string[], note: string): string[] {
  const name = note.trim()
  if (!name || name.length > MAX_CAT) return cats
  if (cats.some((c) => c.toLowerCase() === name.toLowerCase())) return cats
  return [...cats, name]
}

/** A brand new account: no expenses, and a zero balance in every currency. */
export function freshData(): UserData {
  return {
    cats: BASE_CATS.slice(),
    allCurs: BASE_CURS.slice(),
    selCurs: ['RWF', 'TL', 'USD'],
    mainCur: 'RWF',
    rates: { ...BASE_RATES },
    manualRates: [],
    ratesFetchedAt: null,
    // "a zero balance in every currency", exactly as the design starts.
    balances: { RWF: 0, TL: 0, USD: 0 },
    plans: [],
    incomes: [],
    safety: { amt: 0, cur: 'RWF' },
    settings: { round: false, reminder: true, hide: false },
    items: [],
    cleared: false,
  }
}

/** The shape saves had before Limits became Plans. */
interface LegacyLimits {
  limits?: Record<string, { must?: number; net?: number }>
}

const PRIOS: Prio[] = [1, 2, 3]

function asPlans(v: unknown): Plan[] {
  if (!Array.isArray(v)) return []
  return v
    .filter((p): p is Plan => !!p && typeof p === 'object')
    .map((p) => ({
      id: typeof p.id === 'string' ? p.id : newId(),
      name: typeof p.name === 'string' ? p.name : '',
      amt: typeof p.amt === 'number' && p.amt > 0 ? p.amt : 0,
      cur: typeof p.cur === 'string' ? p.cur : 'RWF',
      prio: PRIOS.includes(p.prio) ? p.prio : 1,
      date: typeof p.date === 'string' ? p.date : '',
    }))
    .filter((p) => p.amt > 0)
}

function asIncomes(v: unknown): Income[] {
  if (!Array.isArray(v)) return []
  return v
    .filter((i): i is Income => !!i && typeof i === 'object')
    .map((i) => ({
      id: typeof i.id === 'string' ? i.id : newId(),
      name: typeof i.name === 'string' ? i.name : '',
      amt: typeof i.amt === 'number' && i.amt > 0 ? i.amt : 0,
      cur: typeof i.cur === 'string' ? i.cur : 'RWF',
      date: typeof i.date === 'string' ? i.date : '',
      counted: !!i.counted,
    }))
    .filter((i) => i.amt > 0)
}

/** Fill in anything a stored blob is missing, so an old save never crashes. */
export function normalise(raw: (Partial<UserData> & LegacyLimits) | null): UserData {
  const base = freshData()
  if (!raw) return base
  const selCurs =
    Array.isArray(raw.selCurs) && raw.selCurs.length ? raw.selCurs : base.selCurs
  const mainCur =
    typeof raw.mainCur === 'string' && selCurs.includes(raw.mainCur)
      ? raw.mainCur
      : selCurs[0]
  const rates = { ...base.rates, ...(raw.rates ?? {}) }

  // A save from the Limits days: each currency's Must was taken in full,
  // which is exactly what a P1 plan means, so each becomes one. The safety
  // nets were one cushion spread over currencies — they are added up into
  // a single pot in the main currency, at the save's own rates.
  let plans = asPlans(raw.plans)
  let safety: Safety =
    raw.safety && typeof raw.safety.amt === 'number'
      ? { amt: raw.safety.amt, cur: raw.safety.cur || mainCur }
      : { amt: 0, cur: mainCur }
  if (!raw.plans && !raw.safety && raw.limits) {
    for (const [cur, lim] of Object.entries(raw.limits)) {
      if (lim?.must && lim.must > 0) {
        plans.push({ id: newId(), name: 'Musts', amt: lim.must, cur, prio: 1, date: '' })
      }
    }
    const net = Object.entries(raw.limits).reduce(
      (s, [cur, lim]) => s + convert(rates, lim?.net ?? 0, cur, mainCur),
      0,
    )
    safety = { amt: net, cur: mainCur }
  }

  return {
    cats: Array.isArray(raw.cats) ? raw.cats : base.cats,
    allCurs: Array.isArray(raw.allCurs) && raw.allCurs.length ? raw.allCurs : base.allCurs,
    selCurs,
    mainCur,
    rates,
    manualRates: Array.isArray(raw.manualRates) ? raw.manualRates : [],
    ratesFetchedAt: typeof raw.ratesFetchedAt === 'number' ? raw.ratesFetchedAt : null,
    balances: { ...(raw.balances ?? {}) },
    plans,
    incomes: asIncomes(raw.incomes),
    safety,
    settings: { ...base.settings, ...(raw.settings ?? {}) },
    items: Array.isArray(raw.items) ? raw.items : [],
    cleared: !!raw.cleared,
  }
}

export function loadAccounts(): Account[] {
  return read<Account[]>(K_ACCOUNTS, [])
}

export function saveAccounts(list: Account[]): void {
  write(K_ACCOUNTS, list)
}

export function findAccount(email: string): Account | undefined {
  const target = email.trim().toLowerCase()
  return loadAccounts().find((a) => a.email.toLowerCase() === target)
}

export function loadSession(): string | null {
  return read<string | null>(K_SESSION, null)
}

export function saveSession(id: string | null): void {
  if (id === null) {
    try {
      localStorage.removeItem(K_SESSION)
    } catch {
      /* ignore */
    }
    return
  }
  write(K_SESSION, id)
}

export function loadLastAccountId(): string | null {
  return read<string | null>(K_LAST, null)
}

export function saveLastAccountId(id: string): void {
  write(K_LAST, id)
}

export function removeAccount(accountId: string): void {
  saveAccounts(loadAccounts().filter((a) => a.id !== accountId))
  try {
    localStorage.removeItem(K_DATA + accountId)
    if (loadLastAccountId() === accountId) localStorage.removeItem(K_LAST)
  } catch {
    /* ignore */
  }
}

export function loadData(accountId: string): UserData {
  return normalise(read<Partial<UserData> | null>(K_DATA + accountId, null))
}

export function saveData(accountId: string, data: UserData): void {
  write(K_DATA + accountId, data)
}

export function newId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}
