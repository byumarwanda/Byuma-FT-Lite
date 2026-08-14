/**
 * The rate table.
 *
 * One table, held as the value of one unit in RWF: RWF 1, TL 34, USD 1420,
 * EUR 1560, KES 11. The rate shown for any pair is rates[from]/rates[main],
 * rounded to two decimals. Editing a shown rate writes back
 * rates[code] = shown x rates[main], so every place that shows that pair
 * updates at once.
 *
 * Unlike the prototype, the starting numbers are refreshed from the internet
 * when there is a connection. A rate the person has typed themselves is never
 * overwritten by a refresh, and with no connection the app keeps the last
 * numbers it saw.
 */

export const BASE_CURS = ['RWF', 'TL', 'USD', 'EUR', 'KES']

export const BASE_RATES: Record<string, number> = {
  RWF: 1,
  TL: 34,
  USD: 1420,
  EUR: 1560,
  KES: 11,
}

/** Codes this app spells differently from the currency feed. */
const FEED_ALIAS: Record<string, string> = { TL: 'TRY' }

/** The rate to show for `from`, expressed in `main`. */
export function estRate(
  rates: Record<string, number>,
  from: string,
  main: string,
): number {
  const a = rates[from]
  const b = rates[main]
  if (!a || !b) return 0
  return Math.round((a / b) * 100) / 100
}

/** Write a shown rate back into the table. Zero and blank are ignored. */
export function withRate(
  rates: Record<string, number>,
  code: string,
  shown: number,
  main: string,
): Record<string, number> {
  if (!shown || shown <= 0) return rates
  const base = rates[main]
  if (!base) return rates
  return { ...rates, [code]: shown * base }
}

/** Convert an amount between two currencies using the table. */
export function convert(
  rates: Record<string, number>,
  amount: number,
  from: string,
  to: string,
): number {
  if (from === to) return amount
  const a = rates[from]
  const b = rates[to]
  if (!a || !b) return amount
  return (amount * a) / b
}

/**
 * Ask the internet for fresh rates. Returns the value of one unit of each
 * wanted currency in RWF, or null when it cannot be reached. Never throws —
 * the app must keep working on a bad connection or none at all.
 */
export async function fetchRates(
  wanted: string[],
  signal?: AbortSignal,
): Promise<Record<string, number> | null> {
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/RWF', { signal })
    if (!res.ok) return null
    const body: unknown = await res.json()
    const feed = (body as { rates?: Record<string, number> })?.rates
    if (!feed || typeof feed !== 'object') return null

    const out: Record<string, number> = { RWF: 1 }
    for (const code of wanted) {
      if (code === 'RWF') continue
      const perRwf = feed[FEED_ALIAS[code] ?? code]
      // The feed gives how much of `code` one RWF buys; we store the reverse.
      if (typeof perRwf === 'number' && perRwf > 0 && isFinite(perRwf)) {
        out[code] = 1 / perRwf
      }
    }
    return Object.keys(out).length > 1 ? out : null
  } catch {
    return null
  }
}
