import { useEffect, useRef } from 'react'
import type { App } from '../useApp'
import type { Expense, Method } from '../types'
import { amountIn, byDay, sumIn } from '../lib/calc'
import { groupTyped, sanitizeAmount } from '../lib/money'
import {
  BarsIcon,
  CrossIcon,
  METHODS,
  MICON,
  MLABEL,
  PlusIcon,
  PlusSmallIcon,
  BinIcon,
} from '../components/icons'
import { ACCENT, ChipScroller, HideEye, LINE, pick } from '../components/ui'

const MIXCOL: Record<Method, string> = {
  cash: ACCENT,
  momo: '#4b4f5e',
  bank: '#8f92a0',
}

export function Home({ app }: { app: App }) {
  const hidden = useRef<HTMLInputElement>(null)
  const cta = useRef<HTMLButtonElement>(null)
  const { data, mainCur, num, amt } = app
  const items = data.items
  const rates = data.rates

  const ready = num > 0 && !!app.method
  const ctaLabel =
    num <= 0 ? 'Record expense' : !app.method ? 'Pick a method' : 'Record ' + app.fmt(num)

  // A balance of zero everywhere means the person has not told the app what
  // they have yet.
  const hasBalance = app.selCurs.some((c) => (data.balances[c] ?? 0) !== 0)

  // The phone's keyboard covers the bottom of the screen while an amount or a
  // new category is being typed. The moment the expense is ready to record,
  // bring the button into view so it is never buried under the keyboard.
  useEffect(() => {
    if (ready) cta.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [ready])

  // Choosing a category is the last step, so let the keyboard go with it.
  const done = () => (document.activeElement as HTMLElement | null)?.blur()

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
        {items.length === 0 ? (
          <div className="empty">
            <span className="empty-badge">{data.cleared ? <BinIcon /> : <PlusIcon />}</span>
            <div className="empty-title">
              {data.cleared ? 'Everything deleted' : 'No expenses yet'}
            </div>
            <div className="empty-sub">
              {data.cleared ? 'Nothing left to show.' : 'Your first one lands here.'}
            </div>

            {/* With nothing recorded there is no Analytics button, which used to
                leave a new person with no way to reach the balance at all. The
                same slot now offers the balance until one has been set. */}
            {hasBalance ? (
              <button
                type="button"
                className="btn-analytics empty-action"
                onClick={() => app.go('stats')}
              >
                <BarsIcon />
                Analytics
              </button>
            ) : (
              <button
                type="button"
                className="btn-analytics empty-action"
                style={{ background: ACCENT }}
                onClick={() => app.goBalance('home')}
              >
                <PlusSmallIcon />
                Add your balance
              </button>
            )}
          </div>
        ) : (
          <div>
            <div className="label-eye">
              <span className="label-sm">Spent so far</span>
              <HideEye hidden={app.hidden} onToggle={app.toggleHide} />
            </div>
            <div className="spent-figure">{app.hidden ? '••••••' : app.fmt(total)}</div>

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
                    <span className="mix-sum">{app.priv(app.fmt(v))}</span>
                  </div>
                )
              })}
            </div>

            <button type="button" className="btn-analytics" onClick={() => app.go('stats')}>
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
                    <span className="tl-sum">
                      {app.priv(app.fmt(sumIn(rates, g.items, mainCur)))}
                    </span>
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
        <span className="tl-amount">{app.priv(app.fmt(shown))}</span>
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
              value={app.eAmt ? groupTyped(app.eAmt) : ''}
              onChange={(e) => app.setEAmt(sanitizeAmount(e.target.value))}
            />
          </div>
          <input
            className="editor-note"
            type="text"
            placeholder="What was it for?"
            value={app.eNote}
            onChange={(e) => app.setENote(e.target.value)}
          />
          <input
            className="editor-note"
            type="text"
            placeholder="Details, if it needs any"
            value={app.eDetail}
            onChange={(e) => app.setEDetail(e.target.value)}
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
