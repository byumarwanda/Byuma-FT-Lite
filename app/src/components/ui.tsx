import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import type { ConfirmState, ToastState } from '../types'
import {
  ChevronLeft,
  ErrorIcon,
  EyeIcon,
  EyeOffIcon,
  OkIcon,
  PersonIcon,
  WarnIcon,
} from './icons'

export const ACCENT = '#3b45c9'
export const DANGER = '#b4553a'
export const VIOLET = '#7b5ec7'
export const LINE = 'rgba(20,22,31,.12)'

/**
 * A sideways strip that keeps the screen's strict left and right margin.
 * The content runs under that margin so it can scroll, and the edge it can
 * still scroll towards is faded out across it.
 */
export function ChipScroller({
  className,
  children,
}: {
  className: string
  children: ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [fade, setFade] = useState<'none' | 'left' | 'right' | 'both'>('none')

  const update = useCallback(() => {
    const el = ref.current
    if (!el) return
    const max = el.scrollWidth - el.clientWidth
    if (max <= 1) return setFade('none')
    const atStart = el.scrollLeft <= 1
    const atEnd = el.scrollLeft >= max - 1
    setFade(atStart ? 'right' : atEnd ? 'left' : 'both')
  }, [])

  useEffect(() => {
    update()
    const el = ref.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(update)
    ro.observe(el)
    for (const child of Array.from(el.children)) ro.observe(child)
    return () => ro.disconnect()
  }, [update, children])

  return (
    <div ref={ref} className={className} data-fade={fade} onScroll={update}>
      {children}
    </div>
  )
}

export function TopBar({
  title,
  showBack,
  showProfile,
  profileActive,
  onBack,
  onProfile,
  white,
}: {
  title: string
  showBack: boolean
  showProfile: boolean
  profileActive: boolean
  onBack: () => void
  onProfile: () => void
  white: boolean
}) {
  return (
    <div className="topbar" style={{ background: white ? '#fff' : 'transparent' }}>
      <span className="topbar-left">
        {showBack && (
          <button type="button" className="icon-btn" onClick={onBack} aria-label="Back">
            <ChevronLeft />
          </button>
        )}
        <span className="topbar-title">{title}</span>
      </span>
      {showProfile && (
        <button
          type="button"
          className="icon-btn"
          onClick={onProfile}
          aria-label="Profile"
          style={{
            background: profileActive ? ACCENT : 'transparent',
            color: profileActive ? '#fff' : '#6b6f80',
            borderColor: profileActive ? ACCENT : LINE,
          }}
        >
          <PersonIcon />
        </button>
      )}
    </div>
  )
}

/**
 * A password field with an eye to reveal what has been typed. Typing a
 * password blind on a phone keyboard is where most sign-in failures come
 * from, so every password field in the app uses this.
 */
export function PasswordField({
  value,
  onChange,
  placeholder,
  autoComplete,
  borderColor,
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
  autoComplete: string
  borderColor: string
}) {
  const [shown, setShown] = useState(false)
  return (
    <div className="field-wrap">
      <input
        className="field"
        type={shown ? 'text' : 'password'}
        autoComplete={autoComplete}
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ borderColor }}
      />
      <button
        type="button"
        className="reveal"
        aria-label={shown ? 'Hide password' : 'Show password'}
        aria-pressed={shown}
        onClick={() => setShown((v) => !v)}
      >
        {shown ? <EyeOffIcon /> : <EyeIcon />}
      </button>
    </div>
  )
}

export function FormError({ message }: { message: string }) {
  if (!message) return null
  return (
    <div className="form-error" role="alert">
      <ErrorIcon />
      <span>{message}</span>
    </div>
  )
}

export function Toast({ toast }: { toast: ToastState | null }) {
  if (!toast) return null
  return (
    <div
      className="toast"
      role="status"
      style={{ background: toast.kind === 'ok' ? '#14161f' : DANGER }}
    >
      <span style={{ display: 'flex' }}>
        {toast.kind === 'ok' ? <OkIcon color="#fff" /> : <WarnIcon color="#fff" />}
      </span>
      <span>{toast.text}</span>
    </div>
  )
}

export function ConfirmSheet({
  confirm,
  onCancel,
}: {
  confirm: ConfirmState | null
  onCancel: () => void
}) {
  if (!confirm) return null
  return (
    <div className="scrim" role="dialog" aria-modal="true">
      <div className="sheet">
        <div className="sheet-title">{confirm.title}</div>
        <div className="sheet-body">{confirm.body}</div>
        <div className="sheet-actions">
          <button type="button" className="sheet-cancel" onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className="sheet-go"
            style={{ background: confirm.danger ? DANGER : ACCENT }}
            onClick={() => {
              const yes = confirm.yes
              onCancel()
              yes()
            }}
          >
            {confirm.cta}
          </button>
        </div>
      </div>
    </div>
  )
}

export function Freeze({ label }: { label: string | null }) {
  if (!label) return null
  return (
    <div className="freeze" role="alert" aria-busy="true">
      <span className="spinner" style={{ borderTopColor: ACCENT }} />
      <span className="freeze-label">{label}</span>
    </div>
  )
}

/** The two-state fill used by every pickable button in the design. */
export function pick(on: boolean, off = '#fff', offFg = '#14161f') {
  return on
    ? { background: ACCENT, color: '#fff', borderColor: ACCENT }
    : { background: off, color: offFg, borderColor: LINE }
}
