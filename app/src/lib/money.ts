/**
 * One money formatter for the whole product.
 *
 *   CODE + space + grouped integer      RWF 840,000
 *   the minus goes before the code      −RWF 26,500
 *
 * Amounts are rounded to whole units for display; decimals are accepted
 * on input. The minus is U+2212, not a hyphen.
 */

export const MINUS = '−'

export function group(n: number): string {
  return Math.abs(Math.round(n)).toLocaleString('en-US')
}

export function fmt(n: number, code: string): string {
  return (n < 0 ? MINUS : '') + code + ' ' + group(n)
}

/** Live comma grouping while a person types: 12 -> 123 -> 1,234 */
export function groupTyped(v: string): string {
  const parts = v.split('.')
  const whole = Number(parts[0] || 0).toLocaleString('en-US')
  return parts.length > 1 ? whole + '.' + parts[1] : whole
}

/** Strip everything that is not a digit or a decimal point. */
export function clean(v: string): string {
  return v.replace(/[^0-9.]/g, '')
}

/**
 * The rules the numpad used to enforce, now applied to whatever the phone's
 * own keyboard sends: digits only plus one decimal point, at most two
 * decimals, at most nine characters.
 */
export function sanitizeAmount(raw: string): string {
  let v = raw.replace(/[^0-9.]/g, '')
  const dot = v.indexOf('.')
  if (dot !== -1) {
    // Keep the first point, drop any others, then cap the decimals at two.
    const whole = v.slice(0, dot)
    const rest = v.slice(dot + 1).replace(/\./g, '')
    v = whole + '.' + rest.slice(0, 2)
  }
  return v.slice(0, 9)
}

export function toNumber(v: string): number {
  return Number(clean(v)) || 0
}
