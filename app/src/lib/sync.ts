import type { UserData } from '../types'

/**
 * Bringing the phone's copy and the account's copy together.
 *
 * The app opens on the phone's copy and asks the server afterwards, so the
 * two can differ when the answer arrives: another phone may have saved in
 * the meantime, this one may have changes still waiting to go up, or both.
 *
 * Every save stamps the document with `updatedAt`, and the phone remembers
 * the stamp its copy last matched (its base). That is enough to tell the
 * four cases apart:
 *
 *   - no copy on the server        → put this phone's up
 *   - server unchanged since base  → keep ours; send it if it has changes
 *   - server changed, none here    → take the server's
 *   - server changed, and here too → merge, then send the result
 *
 * A merge never loses an expense: everything on either side is kept, apart
 * from what was deleted on this phone since the base. The rest of the data
 * — balances, settings, rates — is this phone's, which has the newer edit.
 */

export interface CloudCopy {
  data: UserData
  updatedAt: number
}

export type Pull =
  | { kind: 'keep' }
  | { kind: 'push' }
  | { kind: 'take'; data: UserData; base: number }
  | { kind: 'merge'; data: UserData; base: number }

export function reconcile(
  local: UserData,
  base: number,
  pending: boolean,
  deleted: ReadonlySet<string>,
  cloud: CloudCopy | null,
): Pull {
  if (!cloud) return { kind: 'push' }
  if (cloud.updatedAt === base) return pending ? { kind: 'push' } : { kind: 'keep' }
  if (!pending) return { kind: 'take', data: cloud.data, base: cloud.updatedAt }
  return { kind: 'merge', data: merge(local, cloud.data, deleted), base: cloud.updatedAt }
}

/** Ours, plus theirs that we do not have and did not delete. */
function union<T extends { id: string }>(
  mine: T[],
  theirs: T[],
  deleted: ReadonlySet<string>,
): T[] {
  const have = new Set(mine.map((x) => x.id))
  return [...mine, ...theirs.filter((x) => !have.has(x.id) && !deleted.has(x.id))]
}

export function merge(
  local: UserData,
  cloud: UserData,
  deleted: ReadonlySet<string>,
): UserData {
  const lower = new Set(local.cats.map((c) => c.toLowerCase()))
  const items = union(local.items, cloud.items, deleted)
  return {
    ...local,
    // Newest first, as the recorder adds them.
    items: items.slice().sort((a, b) => b.at - a.at),
    plans: union(local.plans, cloud.plans, deleted),
    incomes: union(local.incomes, cloud.incomes, deleted),
    phases: union(local.phases, cloud.phases, deleted),
    checkups: union(local.checkups, cloud.checkups, deleted).sort((a, b) => b.at - a.at),
    cats: [...local.cats, ...cloud.cats.filter((c) => !lower.has(c.toLowerCase()))],
    cleared: local.cleared && items.length === 0,
  }
}
