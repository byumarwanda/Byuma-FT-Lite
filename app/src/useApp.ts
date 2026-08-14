import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type {
  Account,
  ConfirmState,
  Expense,
  Limits,
  Method,
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
  limitsFor,
} from './lib/calc'
import { hashPassword, verifyPassword } from './lib/crypto'
import {
  findAccount,
  freshData,
  loadAccounts,
  loadData,
  loadSession,
  newId,
  saveAccounts,
  saveData,
  saveSession,
} from './lib/storage'

/** How long each consequential action holds the freeze, from the spec. */
const FREEZE = {
  signup: 1100,
  signin: 1000,
  saveName: 700,
  saveEmail: 900,
  savePassword: 1000,
  saveBalance: 800,
  saveLimits: 700,
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
  const [fLim, setFLim] = useState<{ must: string; net: string }>({ must: '', net: '' })
  const [extra, setExtra] = useState<ExtraState | null>(null)
  const [rateEdit, setRateEdit] = useState<{ code: string; value: string } | null>(null)

  // inline editor
  const [editId, setEditId] = useState<string | null>(null)
  const [eAmt, setEAmt] = useState('')
  const [eNote, setENote] = useState('')
  const [eMethod, setEMethod] = useState<Method>('cash')

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
    },
    [resetForms],
  )

  const goBack = useCallback(() => {
    go(screen === 'stats' || screen === 'profile' ? 'home' : back)
  }, [go, screen, back])

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
          x.id === item.id ? { ...x, amount: v, note: eNote.trim(), method: eMethod } : x,
        ),
        // Move the balance by the difference only.
        balances: applyEdit(d.balances, item, v),
      }))
      setEditId(null)
      showToast('Expense updated.', 'ok')
    },
    [eAmt, eNote, eMethod, showToast],
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

  const goLimits = useCallback(() => {
    const lim = limitsFor(data.limits, activeCur)
    setFLim({ must: lim.must ? String(lim.must) : '', net: lim.net ? String(lim.net) : '' })
    clearErr()
    setScreen('limits')
    setBack('stats')
  }, [data.limits, activeCur, clearErr])

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

  const saveLimits = useCallback(() => {
    const must = Number(fLim.must) || 0
    const net = Number(fLim.net) || 0
    const bal = data.balances[activeCur] ?? 0
    if (must > bal) return fail('limmust', 'More than your balance.')
    freeze('Saving limits', FREEZE.saveLimits, () => {
      setData((d) => ({ ...d, limits: { ...d.limits, [activeCur]: { must, net } } }))
      setScreen('stats')
      showToast('Limits saved.', 'ok')
    })
  }, [fLim, data.balances, activeCur, fail, freeze, showToast])

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
          limits: { ...d.limits, [code]: d.limits[code] ?? { must: 0, net: 0 } },
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

  const limits: Limits = limitsFor(data.limits, activeCur)
  const balance = data.balances[activeCur] ?? 0

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
    limits,
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
    fLim,
    extra,
    editId,
    eAmt,
    eNote,
    eMethod,
    catFreq,
    orderedCats,

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
    setFLim,
    setExtra,
    setEAmt,
    setENote,
    setEMethod,
    setBalCur,
    setConfirm,
    clearErr,

    // helpers
    fmt,
    fmtIn,
    shownRate,
    editRate,
    canRemoveCur,

    // actions
    go,
    goBack,
    goBalance,
    goLimits,
    signUp,
    signIn,
    askSignOut,
    record,
    askDelete,
    openEditor,
    saveEdit,
    askClear,
    saveBalance,
    saveLimits,
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
