import { describe, expect, it } from 'vitest'
import { MAX_CAT, rememberCategory } from './storage'

const cats = ['Transport', 'Food', 'Groceries']

describe('categories learned while recording', () => {
  it('keeps a new note as a category', () => {
    expect(rememberCategory(cats, 'Airtime')).toEqual([...cats, 'Airtime'])
  })

  it('trims what it keeps', () => {
    expect(rememberCategory(cats, '  Airtime  ')).toEqual([...cats, 'Airtime'])
  })

  it('ignores one it already has, whatever the case', () => {
    expect(rememberCategory(cats, 'food')).toBe(cats)
    expect(rememberCategory(cats, 'FOOD')).toBe(cats)
    expect(rememberCategory(cats, 'Food')).toBe(cats)
  })

  it('ignores an empty note', () => {
    expect(rememberCategory(cats, '')).toBe(cats)
    expect(rememberCategory(cats, '   ')).toBe(cats)
  })

  it('leaves an over-long note as a one-off', () => {
    const long = 'a'.repeat(MAX_CAT + 1)
    expect(rememberCategory(cats, long)).toBe(cats)
    expect(rememberCategory(cats, 'a'.repeat(MAX_CAT))).toHaveLength(cats.length + 1)
  })

  it('does not disturb the ones already there', () => {
    expect(rememberCategory(cats, 'Airtime').slice(0, 3)).toEqual(cats)
  })
})
