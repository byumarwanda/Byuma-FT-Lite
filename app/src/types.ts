export type Method = 'cash' | 'momo' | 'bank'

export interface Expense {
  id: string
  amount: number
  method: Method
  note: string
  /** The currency the expense was recorded in — the main currency at the time. */
  cur: string
  /** Real timestamp. The day grouping on the timeline is derived from this. */
  at: number
}

export interface Limits {
  must: number
  net: number
}

export interface Settings {
  round: boolean
  reminder: boolean
  hide: boolean
}

/** Everything one signed-in person owns. Saved on the phone under their id. */
export interface UserData {
  cats: string[]
  allCurs: string[]
  selCurs: string[]
  mainCur: string
  /** Value of one unit of each currency, expressed in RWF. */
  rates: Record<string, number>
  /** Codes whose rate the person typed themselves — a refresh must not overwrite these. */
  manualRates: string[]
  ratesFetchedAt: number | null
  balances: Record<string, number>
  limits: Record<string, Limits>
  settings: Settings
  items: Expense[]
  /** True after "Delete all expenses", so the wiped empty state differs from the fresh one. */
  cleared: boolean
}

export interface Account {
  id: string
  name: string
  email: string
  salt: string
  hash: string
  iterations: number
  createdAt: number
  /** Set once this phone has been asked to remember the account. */
  passkeyId?: string
}

export type Screen =
  | 'signup'
  | 'signin'
  | 'home'
  | 'stats'
  | 'balance'
  | 'limits'
  | 'curs'
  | 'profile'
  | 'name'
  | 'email'
  | 'password'
  | 'cats'
  | 'forgot'
  | 'error'

export interface ToastState {
  text: string
  kind: 'ok' | 'warn'
}

export interface ConfirmState {
  title: string
  body: string
  cta: string
  danger?: boolean
  yes: () => void
}
