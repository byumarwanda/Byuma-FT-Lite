import { useEffect, useRef, useState } from 'react'
import type { App } from '../useApp'
import type { Method } from '../types'
import { sumIn } from '../lib/calc'
import { groupTyped, sanitizeAmount } from '../lib/money'
import { METHODS, PlusSmallIcon, EyeIcon, EyeOffIcon } from '../components/icons'
import { ACCENT, ChipScroller, pick } from '../components/ui'

const MIXCOL: Record<Method, string> = {
  cash: ACCENT,
  momo: '#4b4f5e',
  bank: '#8f92a0',
}

/**
 * The recorder — the point of the app, and now the whole of this tab. The
 * timeline moved to its own tab so nothing competes with capturing an
 * expense in a few seconds.
 */
export function Home({ app }: { app: App }) {
  const hidden = useRef<HTMLInputElement>(null)
  const cta = useRef<HTMLButtonElement>(null)
  const { data, mainCur, num, amt } = app
  const items = data.items

  // A total left on screen is a total anyone glancing over can read, so it
  // starts covered and is shown only while it is deliberately asked for.
  // Leaving the tab unmounts this and closes it again.
  const [shown, setShown] = useState(false)

  const ready = num > 0 && !!app.method
  const ctaLabel =
    num <= 0 ? 'Record expense' : !app.method ? 'Pick a method' : 'Record ' + app.fmt(num)

  const hasBalance = app.selCurs.some((c) => (data.balances[c] ?? 0) !== 0)
  const total = sumIn(data.rates, items, mainCur)
  const allSum = total || 1

  useEffect(() => {
    if (ready) cta.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [ready])

  const done = () => (document.activeElement as HTMLElement | null)?.blur()

  return (
    <div>
      {/* ---------------- the recorder ---------------- */}
      <div className="recorder">
        <div className="amount-display" onClick={() => hidden.current?.focus()}>
          <span
            className="amount-code"
            style={{ color: amt === '' ? '#83869a' : '#4b4f5e' }}
          >
            {mainCur}
          </span>
          <span
            className="amount-figure"
            style={{ color: amt === '' ? '#83869a' : '#14161f' }}
          >
            {amt === '' ? '0' : groupTyped(amt)}
          </span>
          <span className="amount-caret" style={{ background: ACCENT }} />
        </div>
        <input
          ref={hidden}
          className="amount-hidden-input"
          type="text"
          inputMode="decimal"
          aria-label="Amount"
          enterKeyHint="done"
          value={amt}
          onChange={(e) => app.setAmt(sanitizeAmount(e.target.value))}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.currentTarget.blur()
          }}
        />

        <div className="methods">
          {METHODS.map(({ k, label, Icon }) => (
            <button
              key={k}
              type="button"
              className="method-btn"
              style={pick(app.method === k)}
              onClick={() => app.setMethod(k)}
            >
              <span style={{ display: 'flex' }}>
                <Icon />
              </span>
              {label}
            </button>
          ))}
        </div>

        <input
          className="note-field"
          type="text"
          placeholder="What was it for?"
          enterKeyHint="done"
          value={app.note}
          onChange={(e) => app.setNote(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.currentTarget.blur()
          }}
        />

        <ChipScroller className="chips">
          {app.orderedCats.slice(0, 8).map((c) => {
            const on = app.note.toLowerCase() === c.toLowerCase()
            return (
              <button
                key={c}
                type="button"
                className="chip"
                style={pick(on, '#fff', '#4b4f5e')}
                onClick={() => {
                  app.setNote(on ? '' : c)
                  done()
                }}
              >
                {c}
              </button>
            )
          })}
          <button
            type="button"
            className="chip-add"
            aria-label="Categories"
            onClick={() => app.go('cats', 'home')}
          >
            ＋
          </button>
        </ChipScroller>

        <button
          ref={cta}
          type="button"
          className="cta"
          onClick={app.record}
          style={{
            background: ready ? ACCENT : 'rgba(20,22,31,.06)',
            color: ready ? '#fff' : '#8f92a0',
            cursor: num > 0 ? 'pointer' : 'default',
          }}
        >
          {ctaLabel}
        </button>
      </div>

      {/* ---------------- below the card ---------------- */}
      <div className="below">
        {!hasBalance && (
          <button
            type="button"
            className="btn-analytics"
            style={{ background: ACCENT }}
            onClick={() => app.goBalance('home')}
          >
            <PlusSmallIcon />
            Add your balance
          </button>
        )}

        {items.length > 0 && (
          <button
            type="button"
            className={shown ? 'spent-card spent-open' : 'spent-card'}
            aria-expanded={shown}
            onClick={() => setShown((v) => !v)}
          >
            <span className="spent-top">
              <span className="label-sm">Spent so far</span>
              <span className="spent-eye">{shown ? <EyeOffIcon /> : <EyeIcon />}</span>
            </span>

            {shown ? (
              <>
                <span className="spent-figure">{app.fmt(total)}</span>
                <span className="mixbar">
                  {METHODS.map(({ k }) => {
                    const v = sumIn(
                      data.rates,
                      items.filter((i) => i.method === k),
                      mainCur,
                    )
                    return (
                      <span
                        key={k}
                        style={{
                          width: Math.round((v / allSum) * 1000) / 10 + '%',
                          background: MIXCOL[k],
                        }}
                      />
                    )
                  })}
                </span>
                <span className="mixlegend">
                  {METHODS.map(({ k, label }) => {
                    const v = sumIn(
                      data.rates,
                      items.filter((i) => i.method === k),
                      mainCur,
                    )
                    return (
                      <span className="mixleg" key={k}>
                        <span className="dot-7" style={{ background: MIXCOL[k] }} />
                        <span className="mix-name">{label}</span>
                        <span className="mix-sum">{app.fmt(v)}</span>
                      </span>
                    )
                  })}
                </span>
              </>
            ) : (
              <>
                <span className="spent-masked">••••••</span>
                <span className="spent-hint">Tap to show</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
