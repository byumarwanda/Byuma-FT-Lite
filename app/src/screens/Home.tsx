import { useRef } from 'react'
import type { App } from '../useApp'
import type { Expense, Method } from '../types'
import { amountIn, byDay, sumIn } from '../lib/calc'
import { clean, groupTyped } from '../lib/money'
import {
  BarsIcon,
  CrossIcon,
  METHODS,
  MICON,
  MLABEL,
  PlusIcon,
  BinIcon,
} from '../components/icons'
import { ACCENT, ChipScroller, LINE, pick } from '../components/ui'

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫']

const MIXCOL: Record<Method, string> = {
  cash: ACCENT,
  momo: '#4b4f5e',
  bank: '#8f92a0',
}

export function Home({ app }: { app: App }) {
  const hidden = useRef<HTMLInputElement>(null)
  const { data, mainCur, num, amt } = app
  const items = data.items
  const rates = data.rates

  const ready = num > 0 && !!app.method
  const ctaLabel =
    num <= 0 ? 'Record expense' : !app.method ? 'Pick a method' : 'Record ' + app.fmt(num)

  const total = sumIn(rates, items, mainCur)
  const allSum = total || 1
  const groups = byDay(items)

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
          value={amt}
          onChange={(e) => {
            const next = clean(e.target.value)
            if (next.length <= 9) app.setAmt(next)
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
          value={app.note}
          onChange={(e) => app.setNote(e.target.value)}
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
                onClick={() => app.setNote(on ? '' : c)}
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

        <div className="numpad">
          {KEYS.map((k) => (
            <button
              key={k}
              type="button"
              className={k === '⌫' ? 'key key-back' : 'key'}
              aria-label={k === '⌫' ? 'Backspace' : k}
              onClick={() => app.setAmt((cur) => pressed(cur, k))}
            >
              {k}
            </button>
          ))}
        </div>

        <button
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
        {items.length === 0 ? (
          <div className="empty">
            <span className="empty-badge">{data.cleared ? <BinIcon /> : <PlusIcon />}</span>
            <div className="empty-title">
              {data.cleared ? 'Everything deleted' : 'No expenses yet'}
            </div>
            <div className="empty-sub">
              {data.cleared ? 'Nothing left to show.' : 'Your first one lands here.'}
            </div>
          </div>
        ) : (
          <div>
            <div className="label-sm">Spent so far</div>
            <div className="spent-figure">{app.fmt(total)}</div>

            <div className="mixbar">
              {METHODS.map(({ k }) => {
                const v = sumIn(
                  rates,
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
            </div>
            <div className="mixlegend">
              {METHODS.map(({ k, label }) => {
                const v = sumIn(
                  rates,
                  items.filter((i) => i.method === k),
                  mainCur,
                )
                return (
                  <div key={k}>
                    <span className="dot-7" style={{ background: MIXCOL[k] }} />
                    <span className="mix-name">{label}</span>
                    <span className="mix-sum">{app.fmt(v)}</span>
                  </div>
                )
              })}
            </div>

            <button
              type="button"
              className="btn-analytics"
              style={{ background: ACCENT }}
              onClick={() => app.go('stats')}
            >
              <BarsIcon />
              Analytics
            </button>

            <div className="timeline">
              {groups.map((g) => (
                <div className="tl-group" key={g.off}>
                  <span className="tl-rule" />
                  <span
                    className="tl-dot"
                    style={{ background: g.off === 0 ? ACCENT : 'rgba(20,22,31,.22)' }}
                  />
                  <div className="tl-head">
                    <span className="tl-day">{g.label}</span>
                    <span className="tl-sum">{app.fmt(sumIn(rates, g.items, mainCur))}</span>
                  </div>
                  <div className="tl-card">
                    {g.items.map((item, ix) => (
                      <Row key={item.id} app={app} item={item} first={ix === 0} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function pressed(current: string, key: string): string {
  if (key === '⌫') return current.slice(0, -1)
  if (key === '.') {
    if (current.includes('.')) return current
    return current === '' ? '0.' : current + '.'
  }
  if (current.includes('.') && current.split('.')[1].length >= 2) return current
  if (current.length >= 9) return current
  return current + key
}

function Row({ app, item, first }: { app: App; item: Expense; first: boolean }) {
  const Icon = MICON[item.method]
  const editing = app.editId === item.id
  const shown = amountIn(app.data.rates, item, app.mainCur)

  return (
    <div style={{ borderTop: first ? '1px solid transparent' : '1px solid rgba(20,22,31,.055)' }}>
      <div className="tl-row" onClick={() => app.openEditor(item)}>
        <span
          className="tl-tile"
          style={{
            background:
              item.method === 'cash' ? 'rgba(20,22,31,.05)' : 'rgba(20,22,31,.08)',
          }}
        >
          <Icon />
        </span>
        <span className="tl-note">{item.note || MLABEL[item.method]}</span>
        <span className="tl-amount">{app.fmt(shown)}</span>
        <button
          type="button"
          className="x-btn"
          aria-label="Delete"
          onClick={(e) => {
            e.stopPropagation()
            app.askDelete(item)
          }}
        >
          <CrossIcon />
        </button>
      </div>

      {editing && (
        <div className="editor">
          <div className="editor-amt">
            <span className="editor-amt-label">Amount</span>
            <input
              type="text"
              inputMode="decimal"
              aria-label="Amount"
              value={app.eAmt}
              onChange={(e) => app.setEAmt(clean(e.target.value))}
            />
          </div>
          <input
            className="editor-note"
            type="text"
            placeholder="What was it for?"
            value={app.eNote}
            onChange={(e) => app.setENote(e.target.value)}
          />
          <div className="editor-methods">
            {METHODS.map(({ k, label }) => (
              <button
                key={k}
                type="button"
                className="editor-method"
                style={pick(app.eMethod === k)}
                onClick={() => app.setEMethod(k)}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="editor-actions">
            <button
              type="button"
              className="editor-cancel"
              onClick={() => app.openEditor(item)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="editor-save"
              style={{ background: ACCENT, borderColor: LINE }}
              onClick={() => app.saveEdit(item)}
            >
              Save changes
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
