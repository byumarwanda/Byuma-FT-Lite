import type { Account, UserData } from '../types'
import { BASE_CURS, BASE_RATES } from './rates'

/**
 * Everything is kept in this phone's own storage. Accounts live under one
 * key; each account's money data lives under its own key so signing out
 * and back in brings the same data back.
 */

const K_ACCOUNTS = 'byuma.accounts.v1'
const K_SESSION = 'byuma.session.v1'
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
    limits: {
      RWF: { must: 0, net: 0 },
      TL: { must: 0, net: 0 },
      USD: { must: 0, net: 0 },
    },
    settings: { round: false, reminder: true, hide: false },
    items: [],
    cleared: false,
  }
}

/** Fill in anything a stored blob is missing, so an old save never crashes. */
export function normalise(raw: Partial<UserData> | null): UserData {
  const base = freshData()
  if (!raw) return base
  const selCurs =
    Array.isArray(raw.selCurs) && raw.selCurs.length ? raw.selCurs : base.selCurs
  const mainCur =
    typeof raw.mainCur === 'string' && selCurs.includes(raw.mainCur)
      ? raw.mainCur
      : selCurs[0]
  return {
    cats: Array.isArray(raw.cats) ? raw.cats : base.cats,
    allCurs: Array.isArray(raw.allCurs) && raw.allCurs.length ? raw.allCurs : base.allCurs,
    selCurs,
    mainCur,
    rates: { ...base.rates, ...(raw.rates ?? {}) },
    manualRates: Array.isArray(raw.manualRates) ? raw.manualRates : [],
    ratesFetchedAt: typeof raw.ratesFetchedAt === 'number' ? raw.ratesFetchedAt : null,
    balances: { ...(raw.balances ?? {}) },
    limits: { ...(raw.limits ?? {}) },
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
