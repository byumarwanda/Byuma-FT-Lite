import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type {
  Account,
  ConfirmState,
  Expense,
  Income,
  Method,
  Plan,
  Prio,
  Screen,
  Settings,
  ToastState,
  UserData,
} from './types'
import { clean, fmt as fmtMoney, toNumber } from './lib/money'
import { BASE_CURS, estRate, fetchRates, withRate } from './lib/rates'
import {
  applyDelete,
  applyDeleteAll,
  applyEdit,
  applyRecord,
  countedIncome,
  p1Shortfall,
  plansTake,
  safetyTake,
  totalBalance,
} from './lib/calc'
import { hashPassword, verifyPassword } from './lib/crypto'
import { passkeyAvailable, registerPasskey, verifyPasskey } from './lib/passkey'
import {
  findAccount,
  freshData,
  loadAccounts,
  loadData,
  loadLastAccountId,
  loadSession,
  newId,
  rememberCategory,
  removeAccount,
  saveAccounts,
  saveData,
  saveLastAccountId,
  saveSession,
} from './lib/storage'

/** How long each consequential action holds the freeze, from the spec. */
const FREEZE = {
  signup: 1100,
  signin: 1000,
  saveName: 700,
  saveEmail: 900,
  savePassword: 1000,
  unlock: 700,
  resetPassword: 900,
  erase: 1200,
  saveBalance: 800,
  deleteOne: 600,
  deleteAll: 1200,
  signOut: 1100,
  retry: 900,
} as const

const emailOk = (v: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.trim())

export interface ExtraState {
  cur: string
  amt: string
  rate: string
}

/** A plan or income being typed. id is null while it is a new one. */
export interface PlanForm {
  id: string | null
  name: string
  amt: string
  cur: string
  prio: Prio
  date: string
}

export interface IncomeForm {
  id: string | null
  name: string
  amt: string
  cur: string
  date: string
  counted: boolean
}

/** Screens the phone's back button leaves the app from, not walks back from. */
const ROOTS: Screen[] = ['home', 'signin', 'signup', 'error']

export function useApp() {
  const [account, setAccount] = useState<Account | null>(null)
  const [data, setData] = useState<UserData>(freshData)
  const [ready, setReady] = useState(false)

  const [screen, setScreen] = useState<Screen>('signup')
  const [back, setBack] = useState<Screen>('home')

  // recorder
  const [amt, setAmt] = useState('')
  const [method, setMethod] = useState<Method | null>(null)
  const [note, setNote] = useState('')

  // forms
  const [fName, setFName] = useState('')
  const [fEmail, setFEmail] = useState('')
  const [fPass, setFPass] = useState('')
  const [fNew, setFNew] = useState('')
  const [fNew2, setFNew2] = useState('')
  const [newCat, setNewCat] = useState('')
  const [newCur, setNewCur] = useState('')
  const [formError, setFormError] = useState('')
  const [errField, setErrField] = useState('')

  // overlays
  const [toast, setToast] = useState<ToastState | null>(null)
  const [confirm, setConfirm] = useState<ConfirmState | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  // money screens
  const [balCur, setBalCur] = useState('RWF')
  const [fBal, setFBal] = useState<Record<string, string>>({})
  const [planForm, setPlanForm] = useState<PlanForm | null>(null)
  const [incomeForm, setIncomeForm] = useState<IncomeForm | null>(null)
  const [fSafety, setFSafety] = useState('')
  const [extra, setExtra] = useState<ExtraState | null>(null)
  const [rateEdit, setRateEdit] = useState<{ code: string; value: string } | null>(null)

  // inline editor
  const [editId, setEditId] = useState<string | null>(null)
  const [eAmt, setEAmt] = useState('')
  const [eNote, setENote] = useState('')
  const [eDetail, setEDetail] = useState('')
  const [eMethod, setEMethod] = useState<Method>('cash')

  // unlocking with the phone
  const [canUsePhone, setCanUsePhone] = useState(false)
  const [lastAccount, setLastAccount] = useState<Account | null>(null)
  // the account being recovered on the forgot-password screen
  const [recovering, setRecovering] = useState<Account | null>(null)
  const [recovered, setRecovered] = useState(false)

  const toastT = useRef<number | undefined>(undefined)
  const busyT = useRef<number | undefined>(undefined)

  /* ---------------- derived ---------------- */

  const selCurs = data.selCurs.length ? data.selCurs : ['RWF']
  const mainCur = selCurs.includes(data.mainCur) ? data.mainCur : selCurs[0]
  const activeCur = selCurs.includes(balCur) ? balCur : mainCur

  const fmt = useCallback((n: number) => fmtMoney(n, mainCur), [mainCur])
  const fmtIn = useCallback((n: number, code: string) => fmtMoney(n, code), [])

  /* ---------------- boot ---------------- */

  useEffect(() => {
    const id = loadSession()
    if (id) {
      const list = loadAccounts()
      const found = list.find((a) => a.id === id)
      if (found) {
        const d = loadData(found.id)
        setAccount(found)
        setData(d)
        setBalCur(d.selCurs.includes(d.mainCur) ? d.mainCur : d.selCurs[0])
        setScreen('home')
      } else {
        saveSession(null)
      }
    }
    const lastId = loadLastAccountId()
    if (lastId) {
      const remembered = loadAccounts().find((a) => a.id === lastId)
      if (remembered) setLastAccount(remembered)
    }
    void passkeyAvailable().then(setCanUsePhone)
    setReady(true)
  }, [])

  /* ---------------- persist ---------------- */

  useEffect(() => {
    if (!ready || !account) return
    saveData(account.id, data)
  }, [ready, account, data])

  /* ---------------- live rates ---------------- */

  useEffect(() => {
    if (!ready || !account) return
    const ctl = new AbortController()
    let cancelled = false
    void (async () => {
      const fresh = await fetchRates(data.allCurs, ctl.signal)
      if (!fresh || cancelled) return
      setData((d) => {
        const next = { ...d.rates }
        for (const [code, value] of Object.entries(fresh)) {
          // Never overwrite a rate the person typed themselves.
          if (d.manualRates.includes(code)) continue
          next[code] = value
        }
        return { ...d, rates: next, ratesFetchedAt: Date.now() }
      })
    })()
    return () => {
      cancelled = true
      ctl.abort()
    }
    // Refreshing once per sign-in is enough; the person can always edit a rate.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, account?.id])

  useEffect(() => {
    return () => {
      window.clearTimeout(toastT.current)
      window.clearTimeout(busyT.current)
    }
  }, [])

  /* ---------------- helpers ---------------- */

  const showToast = useCallback((text: string, kind: ToastState['kind'] = 'warn') => {
    window.clearTimeout(toastT.current)
    setToast({ text, kind })
    toastT.current = window.setTimeout(() => setToast(null), 2600)
  }, [])

  const freeze = useCallback((label: string, ms: number, done: () => void) => {
    setBusy(label)
    setConfirm(null)
    window.clearTimeout(busyT.current)
    busyT.current = window.setTimeout(() => {
      setBusy(null)
      done()
    }, ms)
  }, [])

  const clearErr = useCallback(() => {
    setFormError('')
    setErrField('')
  }, [])

  const fail = useCallback((field: string, msg: string) => {
    setErrField(field)
    setFormError(msg)
  }, [])

  const resetForms = useCallback(() => {
    setFName('')
    setFEmail('')
    setFPass('')
    setFNew('')
    setFNew2('')
    setNewCat('')
    setNewCur('')
    clearErr()
  }, [clearErr])

  const go = useCallback(
    (next: Screen, from: Screen = 'home') => {
      setScreen(next)
      setBack(from)
      resetForms()
      setEditId(null)
      setPlanForm(null)
      setIncomeForm(null)
    },
    [resetForms],
  )

  const goBack = useCallback(() => {
    go(screen === 'stats' || screen === 'profile' ? 'home' : back)
  }, [go, screen, back])

  /* ---------------- the phone's back button ---------------- */

  // The app is one page, so the phone's back button would close it from any
  // screen. One spare history entry is kept above the real one; pressing
  // back pops it, which closes whatever is open — the confirm sheet, an
  // expense editor, a plan or income form — or walks one screen back, and
  // the entry is put back for the next press. On home or sign-in nothing is
  // re-armed, so pressing back there leaves the app, as the phone expects.
  const armed = useRef(false)
  const onHardwareBack = useRef<() => boolean>(() => false)
  onHardwareBack.current = () => {
    if (busy) return true
    if (confirm) {
      setConfirm(null)
      return true
    }
    if (editId) {
      setEditId(null)
      return true
    }
    if (planForm) {
      setPlanForm(null)
      return true
    }
    if (incomeForm) {
      setIncomeForm(null)
      return true
    }
    if (ROOTS.includes(screen)) return false
    const dest = screen === 'stats' || screen === 'profile' ? 'home' : back
    goBack()
    return !ROOTS.includes(dest)
  }

  useEffect(() => {
    const onPop = () => {
      armed.current = false
      if (onHardwareBack.current()) {
        history.pushState({ byuma: true }, '')
        armed.current = true
      }
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  useEffect(() => {
    if (!ready) return
    const needsGuard =
      !ROOTS.includes(screen) || !!confirm || !!editId || !!planForm || !!incomeForm
    if (needsGuard && !armed.current) {
      history.pushState({ byuma: true }, '')
      armed.current = true
    }
  }, [ready, screen, confirm, editId, planForm, incomeForm])

  /* ---------------- auth ---------------- */

  const signUp = useCallback(async () => {
    if (!fName.trim()) return fail('name', 'Your name is missing.')
    if (!emailOk(fEmail)) return fail('email', 'That email does not look right.')
    if (fPass.length < 8) return fail('pass', 'Use at least 8 characters.')
    if (findAccount(fEmail)) return fail('email', 'That email already has an account.')

    const { salt, hash, iterations } = await hashPassword(fPass)
    const acc: Account = {
      id: newId(),
      name: fName.trim(),
      email: fEmail.trim(),
      salt,
      hash,
      iterations,
      createdAt: Date.now(),
    }
    const fresh = freshData()
    saveAccounts([...loadAccounts(), acc])
    saveData(acc.id, fresh)
    saveSession(acc.id)
    saveLastAccountId(acc.id)

    freeze('Creating your account', FREEZE.signup, () => {
      setAccount(acc)
      setData(fresh)
      setBalCur(fresh.mainCur)
      setScreen('home')
      resetForms()
      showToast('Account ready.', 'ok')
    })
  }, [fName, fEmail, fPass, fail, freeze, resetForms, showToast])

  const signIn = useCallback(async () => {
    if (!emailOk(fEmail)) return fail('email', 'That email does not look right.')
    if (!fPass) return fail('pass', 'Enter your password.')

    const acc = findAccount(fEmail)
    const ok = acc
      ? await verifyPassword(fPass, acc.salt, acc.hash, acc.iterations)
      : false
    if (!acc || !ok) return fail('pass', 'Wrong email or password.')

    const d = loadData(acc.id)
    saveSession(acc.id)
    saveLastAccountId(acc.id)
    setLastAccount(acc)
    freeze('Signing in', FREEZE.signin, () => {
      setAccount(acc)
      setData(d)
      setBalCur(d.selCurs.includes(d.mainCur) ? d.mainCur : d.selCurs[0])
      setScreen('home')
      resetForms()
      showToast('Signed in.', 'ok')
    })
  }, [fEmail, fPass, fail, freeze, resetForms, showToast])

  const askSignOut = useCallback(() => {
    setConfirm({
      title: 'Sign out?',
      body: 'You will need your password to get back in.',
      cta: 'Sign out',
      yes: () =>
        freeze('Signing out', FREEZE.signOut, () => {
          // lastAccount is already what it should be, set on sign-in and kept
          // current by enabling or disabling phone unlock. Do not touch it
          // here — signing out must not forget who to offer the unlock for.
          saveSession(null)
          setAccount(null)
          setData(freshData())
          setScreen('signin')
          setBack('home')
          resetForms()
          showToast('Signed out.', 'ok')
        }),
    })
  }, [freeze, resetForms, showToast])

  /* ---------------- unlocking with the phone ---------------- */

  /** Sign in straight from the phone's own fingerprint, face or PIN. */
  const unlockWithPhone = useCallback(async () => {
    if (!lastAccount?.passkeyId) return
    const ok = await verifyPasskey(lastAccount.passkeyId)
    if (!ok) return fail('pass', 'That did not match. Use your password instead.')
    const d = loadData(lastAccount.id)
    saveSession(lastAccount.id)
    freeze('Signing in', FREEZE.unlock, () => {
      setAccount(lastAccount)
      setData(d)
      setBalCur(d.selCurs.includes(d.mainCur) ? d.mainCur : d.selCurs[0])
      setScreen('home')
      resetForms()
      showToast('Signed in.', 'ok')
    })
  }, [lastAccount, fail, freeze, resetForms, showToast])

  /** Ask the phone to remember this account, from Profile. */
  const enablePhoneUnlock = useCallback(async () => {
    if (!account) return
    const id = await registerPasskey(account.id, account.email, account.name)
    if (!id) return showToast('Your phone did not confirm it.')
    const updated = { ...account, passkeyId: id }
    saveAccounts(loadAccounts().map((a) => (a.id === account.id ? updated : a)))
    setAccount(updated)
    setLastAccount(updated)
    showToast('Phone unlock is on.', 'ok')
  }, [account, showToast])

  const disablePhoneUnlock = useCallback(() => {
    if (!account) return
    setConfirm({
      title: 'Turn off phone unlock?',
      body: 'You will go back to typing your password to sign in.',
      cta: 'Turn off',
      yes: () => {
        const updated = { ...account, passkeyId: undefined }
        saveAccounts(loadAccounts().map((a) => (a.id === account.id ? updated : a)))
        setAccount(updated)
        setLastAccount(updated)
        showToast('Phone unlock is off.', 'ok')
      },
    })
  }, [account, showToast])

  /* ---------------- forgot password ---------------- */

  const goForgot = useCallback(() => {
    // Carry over whatever was typed on the sign-in screen.
    const typed = fEmail.trim()
    setRecovering(typed ? (findAccount(typed) ?? null) : lastAccount)
    setRecovered(false)
    setScreen('forgot')
    setBack('signin')
    setFPass('')
    setFNew('')
    setFNew2('')
    clearErr()
  }, [fEmail, lastAccount, clearErr])

  /** Look up the account whose password is being reset. */
  const findForRecovery = useCallback(() => {
    if (!emailOk(fEmail)) return fail('email', 'That email does not look right.')
    const acc = findAccount(fEmail)
    if (!acc) return fail('email', 'No account on this phone uses that email.')
    setRecovering(acc)
    clearErr()
  }, [fEmail, fail, clearErr])

  /**
   * Prove who you are with the phone, which unlocks the new-password fields.
   * Accounts live only on this phone, so the phone's own screen lock is the
   * identity check — whoever can pass it owns the phone and the accounts on
   * it, whether or not phone unlock was ever switched on. An account that
   * never enrolled gets its passkey made right here, so from then on the
   * phone also remembers it at sign-in.
   */
  const proveWithPhone = useCallback(async () => {
    if (!recovering) return
    if (recovering.passkeyId) {
      const ok = await verifyPasskey(recovering.passkeyId)
      if (!ok) return fail('pass', 'That did not match. Try again.')
    } else {
      const id = await registerPasskey(recovering.id, recovering.email, recovering.name)
      if (!id) return fail('pass', 'Your phone did not confirm it. Try again.')
      const updated = { ...recovering, passkeyId: id }
      saveAccounts(loadAccounts().map((a) => (a.id === recovering.id ? updated : a)))
      setRecovering(updated)
      if (lastAccount?.id === updated.id) setLastAccount(updated)
    }
    setRecovered(true)
    clearErr()
  }, [recovering, lastAccount, fail, clearErr])

  const resetPassword = useCallback(async () => {
    if (!recovering || !recovered) return
    if (fNew.length < 8) return fail('new', 'New password needs 8 characters.')
    if (fNew !== fNew2) return fail('new2', 'The two new passwords do not match.')
    const creds = await hashPassword(fNew)
    const updated = { ...recovering, ...creds }
    saveAccounts(loadAccounts().map((a) => (a.id === recovering.id ? updated : a)))
    const d = loadData(updated.id)
    saveSession(updated.id)
    saveLastAccountId(updated.id)
    freeze('Saving', FREEZE.resetPassword, () => {
      setAccount(updated)
      setLastAccount(updated)
      setData(d)
      setBalCur(d.selCurs.includes(d.mainCur) ? d.mainCur : d.selCurs[0])
      setRecovering(null)
      setRecovered(false)
      setScreen('home')
      resetForms()
      showToast('Password changed.', 'ok')
    })
  }, [recovering, recovered, fNew, fNew2, fail, freeze, resetForms, showToast])

  /**
   * The last resort when there is no phone unlock to prove anything with.
   * Nothing can verify the person, so the only honest option is to start the
   * account over — and to be blunt that the expenses go with it.
   */
  const eraseAndStartOver = useCallback(() => {
    if (!recovering) return
    setConfirm({
      title: 'Erase and start over?',
      body:
        'Every expense saved under ' +
        recovering.email +
        ' on this phone is deleted. This cannot be undone.',
      cta: 'Erase',
      danger: true,
      yes: () =>
        freeze('Erasing', FREEZE.erase, () => {
          removeAccount(recovering.id)
          setRecovering(null)
          setRecovered(false)
          setLastAccount(null)
          setAccount(null)
          setData(freshData())
          setScreen('signup')
          resetForms()
          showToast('Account erased.', 'ok')
        }),
    })
  }, [recovering, freeze, resetForms, showToast])

  /* ---------------- recorder ---------------- */

  const num = toNumber(amt)

  const record = useCallback(() => {
    if (num <= 0) return
    if (!method) return showToast('Pick cash, MoMo or bank first.')
    const item: Expense = {
      id: newId(),
      amount: num,
      method,
      note: note.trim(),
      cur: mainCur,
      at: Date.now(),
    }
    setData((d) => ({
      ...d,
      items: [item, ...d.items],
      // Recording spends the money, so the total comes down by itself.
      balances: applyRecord(d.balances, item),
      // A note typed by hand becomes a category, ready as a chip next time.
      cats: rememberCategory(d.cats, item.note),
      cleared: false,
    }))
    setAmt('')
    setNote('')
    setMethod(null)
    showToast('Recorded ' + fmt(num) + '.', 'ok')
  }, [num, method, note, mainCur, fmt, showToast])

  const askDelete = useCallback(
    (item: Expense) => {
      setEditId(null)
      setConfirm({
        title: 'Delete this expense?',
        body:
          fmtIn(item.amount, item.cur) +
          ' · ' +
          (item.note || { cash: 'Cash', momo: 'MoMo', bank: 'Bank' }[item.method]),
        cta: 'Delete',
        danger: true,
        yes: () =>
          freeze('Deleting', FREEZE.deleteOne, () => {
            setData((d) => ({
              ...d,
              items: d.items.filter((x) => x.id !== item.id),
              // Undoing the spend puts the money back.
              balances: applyDelete(d.balances, item),
            }))
            showToast('Expense deleted.', 'ok')
          }),
      })
    },
    [freeze, showToast, fmtIn],
  )

  const openEditor = useCallback(
    (item: Expense) => {
      if (editId === item.id) {
        setEditId(null)
        return
      }
      setEditId(item.id)
      setEAmt(String(item.amount))
      setENote(item.note)
      setEDetail(item.detail ?? '')
      setEMethod(item.method)
    },
    [editId],
  )

  const saveEdit = useCallback(
    (item: Expense) => {
      const v = toNumber(eAmt)
      if (v <= 0) {
        showToast('Amount cannot be zero.')
        return
      }
      setData((d) => ({
        ...d,
        items: d.items.map((x) =>
          x.id === item.id
            ? {
                ...x,
                amount: v,
                note: eNote.trim(),
                detail: eDetail.trim() || undefined,
                method: eMethod,
              }
            : x,
        ),
        // Move the balance by the difference only.
        balances: applyEdit(d.balances, item, v),
        cats: rememberCategory(d.cats, eNote),
      }))
      setEditId(null)
      showToast('Expense updated.', 'ok')
    },
    [eAmt, eNote, eDetail, eMethod, showToast],
  )

  const askClear = useCallback(() => {
    if (!data.items.length) return showToast('Nothing to delete.')
    setConfirm({
      title: 'Delete all expenses?',
      body: 'All ' + data.items.length + ' of them. This cannot be undone.',
      cta: 'Delete all',
      danger: true,
      yes: () =>
        freeze('Deleting everything', FREEZE.deleteAll, () => {
          setData((d) => ({
            ...d,
            items: [],
            balances: applyDeleteAll(d.balances, d.items),
            cleared: true,
          }))
          setScreen('home')
          showToast('All expenses deleted.', 'ok')
        }),
    })
  }, [data.items.length, freeze, showToast])

  /* ---------------- balance ---------------- */

  // `from` is where the back chevron returns to. Analytics is the usual way
  // in, but the empty home screen also offers it to a person who has not set
  // a balance yet.
  const goBalance = useCallback(
    (from: Screen = 'stats') => {
      const next: Record<string, string> = {}
      for (const c of selCurs) next[c] = data.balances[c] ? String(data.balances[c]) : ''
      setFBal(next)
      setExtra(null)
      clearErr()
      setScreen('balance')
      setBack(from)
    },
    [selCurs, data.balances, clearErr],
  )

  /* ---------------- plans, safety net, expected income ---------------- */

  const goPlans = useCallback(() => {
    setPlanForm(null)
    setIncomeForm(null)
    setFSafety(data.safety.amt ? String(data.safety.amt) : '')
    clearErr()
    setScreen('plans')
    setBack('stats')
  }, [data.safety.amt, clearErr])

  /**
   * Open the form empty for a new plan, or filled to edit one — dropped in
   * right under its own row. Tapping the row again folds it away.
   */
  const openPlanForm = useCallback(
    (p?: Plan) => {
      setIncomeForm(null)
      setPlanForm((cur) => {
        if (p && cur && cur.id === p.id) return null
        return p
          ? { id: p.id, name: p.name, amt: String(p.amt), cur: p.cur, prio: p.prio, date: p.date }
          : { id: null, name: '', amt: '', cur: mainCur, prio: 1, date: '' }
      })
      clearErr()
    },
    [mainCur, clearErr],
  )

  const savePlan = useCallback(() => {
    if (!planForm) return
    const name = planForm.name.trim()
    const amt = Number(planForm.amt) || 0
    if (!name) return fail('pname', 'Say what it is.')
    if (amt <= 0) return fail('pamt', 'Give it an amount.')
    const saved: Plan = {
      id: planForm.id ?? newId(),
      name,
      amt,
      cur: planForm.cur,
      prio: planForm.prio,
      date: planForm.date,
    }
    setData((d) => ({
      ...d,
      plans: planForm.id
        ? d.plans.map((p) => (p.id === planForm.id ? saved : p))
        : [...d.plans, saved],
    }))
    setPlanForm(null)
    showToast(planForm.id ? 'Plan updated.' : 'Plan added.', 'ok')
  }, [planForm, fail, showToast])

  const askDeletePlan = useCallback(
    (p: Plan) => {
      setConfirm({
        title: 'Remove ' + p.name + '?',
        body: fmtIn(p.amt, p.cur) + ' · P' + p.prio + '. Its share comes back to spendable.',
        cta: 'Remove',
        danger: true,
        yes: () => {
          setData((d) => ({ ...d, plans: d.plans.filter((x) => x.id !== p.id) }))
          setPlanForm(null)
          showToast('Plan removed.', 'ok')
        },
      })
    },
    [fmtIn, showToast],
  )

  const openIncomeForm = useCallback(
    (i?: Income) => {
      setPlanForm(null)
      setIncomeForm((cur) => {
        if (i && cur && cur.id === i.id) return null
        return i
          ? { id: i.id, name: i.name, amt: String(i.amt), cur: i.cur, date: i.date, counted: i.counted }
          : { id: null, name: '', amt: '', cur: mainCur, date: '', counted: false }
      })
      clearErr()
    },
    [mainCur, clearErr],
  )

  const saveIncome = useCallback(() => {
    if (!incomeForm) return
    const name = incomeForm.name.trim()
    const amt = Number(incomeForm.amt) || 0
    if (!name) return fail('iname', 'Say where it comes from.')
    if (amt <= 0) return fail('iamt', 'Give it an amount.')
    const saved: Income = {
      id: incomeForm.id ?? newId(),
      name,
      amt,
      cur: incomeForm.cur,
      date: incomeForm.date,
      counted: incomeForm.counted,
    }
    setData((d) => ({
      ...d,
      incomes: incomeForm.id
        ? d.incomes.map((i) => (i.id === incomeForm.id ? saved : i))
        : [...d.incomes, saved],
    }))
    setIncomeForm(null)
    showToast(incomeForm.id ? 'Income updated.' : 'Income added.', 'ok')
  }, [incomeForm, fail, showToast])

  const askDeleteIncome = useCallback(
    (i: Income) => {
      setConfirm({
        title: 'Remove ' + i.name + '?',
        body: fmtIn(i.amt, i.cur) + (i.counted ? '. It stops counting into spendable.' : '.'),
        cta: 'Remove',
        danger: true,
        yes: () => {
          setData((d) => ({ ...d, incomes: d.incomes.filter((x) => x.id !== i.id) }))
          setIncomeForm(null)
          showToast('Income removed.', 'ok')
        },
      })
    },
    [fmtIn, showToast],
  )

  /** The switch on an income row: count it into spendable, or not. */
  const toggleCounted = useCallback((id: string) => {
    setData((d) => ({
      ...d,
      incomes: d.incomes.map((i) => (i.id === id ? { ...i, counted: !i.counted } : i)),
    }))
  }, [])

  /** Typing only stages the safety net; the Set button makes it count. */
  const editSafety = useCallback(
    (raw: string) => {
      setFSafety(clean(raw))
      clearErr()
    },
    [clearErr],
  )

  const saveSafety = useCallback(() => {
    const amt = Number(fSafety) || 0
    if (amt <= 0) return fail('safety', 'Give it an amount first.')
    setData((d) => ({ ...d, safety: { ...d.safety, amt } }))
    clearErr()
    showToast('Safety net set.', 'ok')
  }, [fSafety, fail, clearErr, showToast])

  const resetSafety = useCallback(() => {
    setData((d) => ({ ...d, safety: { ...d.safety, amt: 0 } }))
    setFSafety('')
    clearErr()
    showToast('Safety net reset.', 'ok')
  }, [clearErr, showToast])

  const setSafetyCur = useCallback((cur: string) => {
    setData((d) => ({ ...d, safety: { ...d.safety, cur } }))
  }, [])

  const saveBalance = useCallback(() => {
    const vals: Record<string, number> = { ...data.balances }
    for (const c of selCurs) {
      const raw = (fBal[c] ?? '').trim()
      if (raw && isNaN(Number(raw))) return fail('bal' + c, 'That is not a number.')
      vals[c] = Number(raw) || 0
    }
    let added = 0
    if (extra && extra.amt) {
      const a = Number(extra.amt) || 0
      const r = Number(extra.rate) || 0
      if (a > 0 && r <= 0) return fail('exrate', 'Set a rate first.')
      added = a * r
    }
    if (!selCurs.some((c) => vals[c] > 0) && added <= 0) {
      return fail('bal' + selCurs[0], 'Enter at least one total.')
    }
    if (added > 0) vals[mainCur] = (vals[mainCur] ?? 0) + added

    freeze('Saving balance', FREEZE.saveBalance, () => {
      setData((d) => ({ ...d, balances: vals }))
      setExtra(null)
      setScreen('stats')
      showToast(
        added > 0
          ? 'Balance updated with ' + fmtIn(added, mainCur) + ' added.'
          : 'Balance updated.',
        'ok',
      )
    })
  }, [data.balances, selCurs, fBal, extra, mainCur, fail, freeze, showToast, fmtIn])

  /* ---------------- rates ---------------- */

  const shownRate = useCallback(
    (code: string) =>
      rateEdit && rateEdit.code === code
        ? rateEdit.value
        : String(estRate(data.rates, code, mainCur)),
    [rateEdit, data.rates, mainCur],
  )

  const editRate = useCallback(
    (code: string, raw: string) => {
      const value = clean(raw)
      setRateEdit({ code, value })
      const n = Number(value)
      if (!value || !n || n <= 0) return
      setData((d) => ({
        ...d,
        rates: withRate(d.rates, code, n, mainCur),
        manualRates: d.manualRates.includes(code)
          ? d.manualRates
          : [...d.manualRates, code],
      }))
    },
    [mainCur],
  )

  /* ---------------- currencies ---------------- */

  const openExtra = useCallback(() => {
    const other = data.allCurs.find((c) => !selCurs.includes(c))
    if (!other) return showToast('Add a currency in your profile first.')
    setExtra({ cur: other, amt: '', rate: String(estRate(data.rates, other, mainCur)) })
    clearErr()
  }, [data.allCurs, data.rates, selCurs, mainCur, showToast, clearErr])

  const addCur = useCallback(() => {
    const n = newCur.trim()
    if (n.length < 2) return fail('cur', 'Use 2 to 4 letters.')
    if (data.allCurs.includes(n)) return fail('cur', 'You already have that one.')
    setData((d) => ({ ...d, allCurs: [...d.allCurs, n] }))
    setNewCur('')
    clearErr()
    showToast(n + ' added.', 'ok')
  }, [newCur, data.allCurs, fail, clearErr, showToast])

  const toggleCur = useCallback(
    (code: string) => {
      const on = selCurs.includes(code)
      if (on) {
        if (selCurs.length <= 1) return showToast('Keep at least one currency.')
        const next = selCurs.filter((x) => x !== code)
        setData((d) => ({
          ...d,
          selCurs: next,
          mainCur: code === d.mainCur ? next[0] : d.mainCur,
        }))
        setBalCur((b) => (next.includes(b) ? b : next[0]))
        setExtra(null)
      } else {
        if (selCurs.length >= 3) return showToast('Three at a time. Unpick one first.')
        setData((d) => ({
          ...d,
          selCurs: [...selCurs, code],
          balances: { ...d.balances, [code]: d.balances[code] ?? 0 },
        }))
        setExtra(null)
      }
    },
    [selCurs, showToast],
  )

  const removeCur = useCallback(
    (code: string) => {
      if (selCurs.includes(code)) return showToast('Unpick it first.')
      setData((d) => ({ ...d, allCurs: d.allCurs.filter((x) => x !== code) }))
      showToast(code + ' removed.', 'ok')
    },
    [selCurs, showToast],
  )

  const canRemoveCur = useCallback((code: string) => !BASE_CURS.includes(code), [])

  /* ---------------- categories ---------------- */

  const addCat = useCallback(() => {
    const n = newCat.trim()
    if (!n) return fail('cat', 'Type a name first.')
    if (n.length > 18) return fail('cat', 'Keep it under 18 characters.')
    if (data.cats.some((c) => c.toLowerCase() === n.toLowerCase())) {
      return fail('cat', 'You already have that one.')
    }
    setData((d) => ({ ...d, cats: [...d.cats, n] }))
    setNewCat('')
    clearErr()
    showToast(n + ' added.', 'ok')
  }, [newCat, data.cats, fail, clearErr, showToast])

  const removeCat = useCallback(
    (name: string) => {
      setConfirm({
        title: 'Remove ' + name + '?',
        body: 'Expenses already filed under it keep their label.',
        cta: 'Remove',
        danger: true,
        yes: () => {
          setData((d) => ({ ...d, cats: d.cats.filter((x) => x !== name) }))
          showToast(name + ' removed.', 'ok')
        },
      })
    },
    [showToast],
  )

  /* ---------------- profile edits ---------------- */

  const saveName = useCallback(() => {
    if (!fName.trim()) return fail('name', 'Your name is missing.')
    const next = fName.trim()
    freeze('Saving', FREEZE.saveName, () => {
      setAccount((a) => {
        if (!a) return a
        const updated = { ...a, name: next }
        saveAccounts(loadAccounts().map((x) => (x.id === a.id ? updated : x)))
        return updated
      })
      setScreen('profile')
      resetForms()
      showToast('Name changed.', 'ok')
    })
  }, [fName, fail, freeze, resetForms, showToast])

  const saveEmail = useCallback(async () => {
    if (!account) return
    if (!emailOk(fEmail)) return fail('email', 'That email does not look right.')
    if (fEmail.trim().toLowerCase() === account.email.toLowerCase()) {
      return fail('email', 'That is already your email.')
    }
    if (!fPass) return fail('pass', 'Enter your password to confirm.')
    const taken = findAccount(fEmail)
    if (taken && taken.id !== account.id) {
      return fail('email', 'That email already has an account.')
    }
    const ok = await verifyPassword(fPass, account.salt, account.hash, account.iterations)
    if (!ok) return fail('pass', 'Wrong email or password.')

    const next = fEmail.trim()
    setConfirm({
      title: 'Change your email?',
      body: 'You will sign in with ' + next + ' from now on.',
      cta: 'Change',
      yes: () =>
        freeze('Saving', FREEZE.saveEmail, () => {
          setAccount((a) => {
            if (!a) return a
            const updated = { ...a, email: next }
            saveAccounts(loadAccounts().map((x) => (x.id === a.id ? updated : x)))
            return updated
          })
          setScreen('profile')
          resetForms()
          showToast('Email changed.', 'ok')
        }),
    })
  }, [account, fEmail, fPass, fail, freeze, resetForms, showToast])

  const savePassword = useCallback(async () => {
    if (!account) return
    if (!fPass) return fail('pass', 'Enter your current password.')
    if (fNew.length < 8) return fail('new', 'New password needs 8 characters.')
    if (fNew !== fNew2) return fail('new2', 'The two new passwords do not match.')
    if (fNew === fPass) return fail('new', 'Pick a password you have not used.')
    const ok = await verifyPassword(fPass, account.salt, account.hash, account.iterations)
    if (!ok) return fail('pass', 'Wrong email or password.')

    const creds = await hashPassword(fNew)
    setConfirm({
      title: 'Change your password?',
      body: 'You stay signed in on this phone. Other phones sign out.',
      cta: 'Change',
      yes: () =>
        freeze('Saving', FREEZE.savePassword, () => {
          setAccount((a) => {
            if (!a) return a
            const updated = { ...a, ...creds }
            saveAccounts(loadAccounts().map((x) => (x.id === a.id ? updated : x)))
            return updated
          })
          setScreen('profile')
          resetForms()
          showToast('Password changed.', 'ok')
        }),
    })
  }, [account, fPass, fNew, fNew2, fail, freeze, resetForms, showToast])

  const setSetting = useCallback((key: keyof Settings) => {
    setData((d) => ({ ...d, settings: { ...d.settings, [key]: !d.settings[key] } }))
  }, [])

  const setMainCur = useCallback((code: string) => {
    setData((d) => ({ ...d, mainCur: code }))
    setBalCur(code)
  }, [])

  /* ---------------- error screen ---------------- */

  const retry = useCallback(() => {
    freeze('Trying again', FREEZE.retry, () => {
      setScreen(account ? 'home' : 'signin')
    })
  }, [freeze, account])

  /* ---------------- chip order ---------------- */

  const catFreq = useMemo(() => {
    const freq: Record<string, number> = {}
    for (const i of data.items) if (i.note) freq[i.note] = (freq[i.note] || 0) + 1
    return freq
  }, [data.items])

  const orderedCats = useMemo(
    () => data.cats.slice().sort((a, b) => (catFreq[b] || 0) - (catFreq[a] || 0)),
    [data.cats, catFreq],
  )

  // The card shows one ultimate total, not a slice per currency: every
  // currency's money, plans and income are converted at the current rates
  // and added up, then expressed in whichever currency is being viewed.
  const balance = totalBalance(data.rates, data.balances, selCurs, activeCur)
  const plansOff = plansTake(data.rates, data.plans, activeCur)
  const safetyOff = safetyTake(data.rates, data.safety, activeCur)
  const incomeIn = countedIncome(data.rates, data.incomes, activeCur)
  const spend = balance - plansOff - safetyOff + incomeIn
  const shortfall = p1Shortfall(data.rates, balance, data.plans, activeCur)

  // "Hide totals", from Profile or the eye beside a figure. Hiding the big
  // figure while the rows beneath still add up to it would hide nothing, so
  // every amount on the home and analytics screens goes through priv().
  const hidden = data.settings.hide
  const toggleHide = useCallback(() => setSetting('hide'), [setSetting])
  const priv = useCallback((s: string) => (hidden ? '•••' : s), [hidden])

  return {
    // state
    ready,
    account,
    data,
    screen,
    back,
    selCurs,
    mainCur,
    activeCur,
    balance,
    plansOff,
    safetyOff,
    incomeIn,
    spend,
    shortfall,
    hidden,
    amt,
    num,
    method,
    note,
    fName,
    fEmail,
    fPass,
    fNew,
    fNew2,
    newCat,
    newCur,
    formError,
    errField,
    toast,
    confirm,
    busy,
    fBal,
    planForm,
    incomeForm,
    fSafety,
    extra,
    editId,
    eAmt,
    eNote,
    eDetail,
    eMethod,
    catFreq,
    orderedCats,
    canUsePhone,
    lastAccount,
    recovering,
    recovered,

    // setters
    setAmt,
    setMethod,
    setNote,
    setFName,
    setFEmail,
    setFPass,
    setFNew,
    setFNew2,
    setNewCat,
    setNewCur,
    setFBal,
    setPlanForm,
    setIncomeForm,
    setExtra,
    setEAmt,
    setENote,
    setEDetail,
    setEMethod,
    setBalCur,
    setConfirm,
    clearErr,

    // helpers
    fmt,
    fmtIn,
    priv,
    shownRate,
    editRate,
    canRemoveCur,

    // actions
    go,
    goBack,
    goBalance,
    goPlans,
    openPlanForm,
    savePlan,
    askDeletePlan,
    openIncomeForm,
    saveIncome,
    askDeleteIncome,
    toggleCounted,
    editSafety,
    saveSafety,
    resetSafety,
    setSafetyCur,
    toggleHide,
    signUp,
    signIn,
    askSignOut,
    unlockWithPhone,
    enablePhoneUnlock,
    disablePhoneUnlock,
    goForgot,
    findForRecovery,
    proveWithPhone,
    resetPassword,
    eraseAndStartOver,
    record,
    askDelete,
    openEditor,
    saveEdit,
    askClear,
    saveBalance,
    openExtra,
    addCur,
    toggleCur,
    removeCur,
    addCat,
    removeCat,
    saveName,
    saveEmail,
    savePassword,
    setSetting,
    setMainCur,
    retry,
    showToast,
  }
}

export type App = ReturnType<typeof useApp>
