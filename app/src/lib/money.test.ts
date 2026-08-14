import { describe, expect, it } from 'vitest'
import { clean, fmt, group, groupTyped, sanitizeAmount, toNumber } from './money'

describe('money formatting', () => {
  it('puts the code before a grouped integer', () => {
    expect(fmt(840000, 'RWF')).toBe('RWF 840,000')
    expect(fmt(1240, 'USD')).toBe('USD 1,240')
    expect(fmt(0, 'RWF')).toBe('RWF 0')
  })

  it('puts the minus before the code, not the number', () => {
    expect(fmt(-26500, 'RWF')).toBe('−RWF 26,500')
  })

  it('rounds to whole units for display', () => {
    expect(group(1234.4)).toBe('1,234')
    expect(group(1234.6)).toBe('1,235')
  })

  it('groups live while typing', () => {
    expect(groupTyped('12')).toBe('12')
    expect(groupTyped('123')).toBe('123')
    expect(groupTyped('1234')).toBe('1,234')
    expect(groupTyped('1234.5')).toBe('1,234.5')
  })
})

describe('amount input rules', () => {
  it('keeps plain digits', () => {
    expect(sanitizeAmount('123')).toBe('123')
  })

  it('strips anything that is not a digit or a point', () => {
    expect(sanitizeAmount('1a2 3,4')).toBe('1234')
  })

  it('keeps only the first decimal point', () => {
    expect(sanitizeAmount('1.5.2')).toBe('1.52')
    expect(sanitizeAmount('1..5')).toBe('1.5')
  })

  it('caps decimals at two', () => {
    expect(sanitizeAmount('1.234')).toBe('1.23')
  })

  it('caps the whole input at nine characters', () => {
    expect(sanitizeAmount('1234567890')).toBe('123456789')
  })

  it('allows a leading point through as typed', () => {
    expect(sanitizeAmount('.5')).toBe('.5')
  })

  it('is empty for empty input', () => {
    expect(sanitizeAmount('')).toBe('')
  })
})

describe('input cleaning', () => {
  it('strips anything that is not a digit or a point', () => {
    expect(clean('1a2,b3.4')).toBe('123.4')
  })

  it('reads a number safely', () => {
    expect(toNumber('2,400')).toBe(2400)
    expect(toNumber('')).toBe(0)
    expect(toNumber('abc')).toBe(0)
  })
})
