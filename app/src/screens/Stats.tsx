import { useEffect, useRef, useState } from 'react'
import type { App } from '../useApp'
import type { Method } from '../types'
import {
  amountIn,
  DAY,
  dayOffset,
  dayStamp,
  monthIndex,
  monthName,
  sumIn,
  topCategories,
} from '../lib/calc'
import { MINUS } from '../lib/money'
import { ChevronRight, METHODS, MLABEL, WarnIcon } from '../components/icons'
import { ACCENT, DANGER, HideEye, VIOLET, pick } from '../components/ui'

const MIXCOL: Record<Method, string> = {
  cash: ACCENT,
  momo: '#4b4f5e',
  bank: '#8f92a0',
}

export function CurrencyTabs({ app, flush }: { app: App; flush?: boolean }) {
  return (
    <div className={flush ? 'cur-tabs cur-tabs-flush' : 'cur-tabs'}>
      {app.selCurs.map((c) => (
        <button
          key={c}
          type="button"
          className="cur-tab"
          style={pick(c === app.activeCur, '#fff', '#4b4f5e')}
          onClick={() => app.setBalCur(c)}
        >
          {c}
        </button>
      ))}
    </div>
  )
}

export function Stats({ app }: { app: App }) {
  const { data, activeCur, balance, plansOff, safetyOff, incomeIn, spend, mainCur } = app
  const rates = data.rates
  const items = data.items

  // Last months: the design's bars, or a line that records every single day.
  const [monthsView, setMonthsView] = useState<'bars' | 'graph'>('bars')

  const red = app.shortfall > 0
  const violet = !red && spend < 0

  // Each figure hides on its own: the balance card and This month keep
  // separate eyes, and the breakdowns below stay readable either way.
  const { hideBal, hideMonth } = data.settings
  const m = (s: string) => (hideBal ? '••••••' : s)

  const cells = [
    { label: 'Balance', text: app.fmtIn(balance, activeCur), color: '#4b4f5e' },
    { label: 'Plans', text: MINUS + ' ' + app.fmtIn(plansOff, activeCur), color: DANGER },
    { label: 'Safety net', text: MINUS + ' ' + app.fmtIn(safetyOff, activeCur), color: VIOLET },
    ...(incomeIn > 0
      ? [{ label: 'Income counted', text: '+ ' + app.fmtIn(incomeIn, activeCur), color: ACCENT }]
      : []),
  ]

  const thisMonth = monthIndex(Date.now())
  const monthTotal = sumIn(
    rates,
    items.filter((i) => monthIndex(i.at) === thisMonth),
    mainCur,
  )

  const total = sumIn(rates, items, mainCur) || 1

  const cats = topCategories(rates, items, mainCur, (i) => i.note || MLABEL[i.method])
  const catMax = cats.length ? cats[0].value : 1

  const months: { mi: number; v: number }[] = []
  for (let k = 5; k >= 0; k--) {
    const mi = thisMonth - k
    months.push({
      mi,
      v: sumIn(
        rates,
        items.filter((i) => monthIndex(i.at) === mi),
        mainCur,
      ),
    })
  }
  const monthMax = Math.max(...months.map((m) => m.v), 1)

  return (
    <div className="page">
      <div className="headline-30">Where the money went</div>

      <CurrencyTabs app={app} />

      {/* ---------------- the balance card ---------------- */}
      <div className="card card-balance">
        <div className="label-eye">
          <span className="label-sm">Spendable</span>
          <HideEye hidden={hideBal} onToggle={() => app.setSetting('hideBal')} />
        </div>
        <div
          className="figure-42"
          style={{ color: red ? DANGER : violet ? VIOLET : '#14161f' }}
        >
          {m(app.fmtIn(spend, activeCur))}
        </div>

        <div className="bal-rows">
          {cells.map((b) => (
            <div className="bal-row" key={b.label}>
              <span className="dot-7" style={{ background: b.color }} />
              <span className="bal-label">{b.label}</span>
              <span className="bal-value">{m(b.text)}</span>
            </div>
          ))}
        </div>

        {(red || violet) && (
          <div
            className="bal-warn"
            style={{ background: red ? 'rgba(180,85,58,.09)' : 'rgba(123,94,199,.1)' }}
          >
            <span style={{ display: 'flex' }}>
              <WarnIcon color={red ? DANGER : VIOLET} />
            </span>
            <span style={{ color: red ? DANGER : VIOLET }}>
              {red
                ? 'Under your P1 plans by ' + app.fmtIn(app.shortfall, activeCur) + '.'
                : safetyOff > 0
                  ? 'Eating into your safety net.'
                  : 'Your plans leave nothing spare.'}
            </span>
          </div>
        )}

        <div className="card-footer">
          <button type="button" className="card-footer-btn" onClick={() => app.goBalance('stats')}>
            Update balance
            <ChevronRight />
          </button>
          <span className="card-footer-divider" />
          <button type="button" className="card-footer-btn" onClick={app.goPlans}>
            Plans
            <ChevronRight />
          </button>
        </div>
      </div>

      {/* ---------------- this month ---------------- */}
      <div className="card card-month">
        <div className="label-eye">
          <span className="label-sm">This month</span>
          <HideEye hidden={hideMonth} onToggle={() => app.setSetting('hideMonth')} />
        </div>
        <div className="figure-42">{hideMonth ? '••••••' : app.fmt(monthTotal)}</div>
      </div>

      {/* ---------------- how you paid ---------------- */}
      <div className="section-label">How you paid</div>
      <div className="card-list">
        {METHODS.map(({ k, label }) => {
          const v = sumIn(
            rates,
            items.filter((i) => i.method === k),
            mainCur,
          )
          const pct = Math.round((v / total) * 100) + '%'
          return (
            <div className="paid-row" key={k}>
              <div className="paid-head">
                <span className="dot-9" style={{ background: MIXCOL[k] }} />
                <span className="paid-label">{label}</span>
                <span className="paid-sum">{app.fmt(v)}</span>
                <span className="paid-pct">{pct}</span>
              </div>
              <div className="track-8">
                <span style={{ width: pct, background: MIXCOL[k] }} />
              </div>
            </div>
          )
        })}
      </div>

      {/* ---------------- by category ---------------- */}
      <div className="section-label">By category</div>
      <div className="card-list">
        {cats.map((c, ix) => (
          <div className="paid-row" key={c.name}>
            <div className="cat-head">
              <span className="cat-name">{c.name}</span>
              <span className="cat-sum">{app.fmt(c.value)}</span>
            </div>
            <div className="track-7">
              <span
                style={{
                  width: Math.round((c.value / catMax) * 100) + '%',
                  background: ix === 0 ? ACCENT : 'rgba(20,22,31,.22)',
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* ---------------- last months ---------------- */}
      <div className="section-head">
        <span className="section-label">Last months</span>
        <div className="seg-mini">
          <button
            type="button"
            className="seg-btn"
            style={pick(monthsView === 'bars', '#fff', '#4b4f5e')}
            onClick={() => setMonthsView('bars')}
          >
            Bars
          </button>
          <button
            type="button"
            className="seg-btn"
            style={pick(monthsView === 'graph', '#fff', '#4b4f5e')}
            onClick={() => setMonthsView('graph')}
          >
            Graph
          </button>
        </div>
      </div>
      <div className="card-months">
        {monthsView === 'bars' ? (
          <>
            <div className="months">
              {months.map((m) => (
                <div className="month" key={m.mi}>
                  <span className="month-figure">
                    {m.mi === thisMonth && m.v ? (hideMonth ? '•••' : app.fmt(m.v)) : ''}
                  </span>
                  <span
                    className="month-bar"
                    style={{
                      // Inline styles skip the build's px-to-rem step, so the
                      // design's px are converted here (1rem = 10 design px).
                      height: Math.max(6, Math.round((m.v / monthMax) * 130)) / 10 + 'rem',
                      background: m.mi === thisMonth ? ACCENT : 'rgba(20,22,31,.15)',
                    }}
                  />
                </div>
              ))}
            </div>
            <div className="month-labels">
              {months.map((m) => (
                <span key={m.mi}>{monthName(m.mi)}</span>
              ))}
            </div>
          </>
        ) : (
          <DayGraph app={app} />
        )}
      </div>
    </div>
  )
}

/**
 * Day by day, one point per day at a fixed width, so a week and a bit
 * fills the view and the rest scrolls away to the left. The strip starts
 * at the first recorded day and grows a day at a time; it opens docked at
 * today, and the shared scale keeps every rise and fall comparable no
 * matter how far back you scroll.
 */
function DayGraph({ app }: { app: App }) {
  const scroller = useRef<HTMLDivElement>(null)
  const { items } = app.data
  const now = Date.now()

  // The span runs from the first day anything was recorded to today.
  const span = items.length
    ? Math.max(...items.map((i) => dayOffset(i.at, now))) + 1
    : 1
  const daily = new Array<number>(span).fill(0)
  for (const i of items) {
    const off = dayOffset(i.at, now)
    if (off >= 0 && off < span) {
      daily[span - 1 - off] += amountIn(app.data.rates, i, app.mainCur)
    }
  }
  const max = Math.max(...daily, 1)

  // Geometry in design px; inline sizes are converted to rem by hand
  // (1rem = 10 design px), same as everywhere the build cannot reach.
  const DAY_W = 38
  const BASE = 124
  const width = span * DAY_W
  const x = (ix: number) => ix * DAY_W + DAY_W / 2
  const y = (v: number) => Math.round((BASE - (v / max) * (BASE - 16)) * 10) / 10
  const pts = daily.map((v, ix) => x(ix) + ',' + y(v)).join(' ')

  // Open at the newest day.
  useEffect(() => {
    const el = scroller.current
    if (el) el.scrollLeft = el.scrollWidth
  }, [span])

  return (
    <div className="day-scroll" ref={scroller}>
      <div style={{ width: width / 10 + 'rem' }}>
        <svg
          className="day-line"
          viewBox={'0 0 ' + width + ' 140'}
          style={{ width: width / 10 + 'rem', height: '14rem' }}
          role="img"
          aria-label="Spending per day since the first recorded expense"
        >
          <polygon
            points={x(0) + ',' + BASE + ' ' + pts + ' ' + x(span - 1) + ',' + BASE}
            fill="rgba(59,69,201,.08)"
          />
          <polyline
            points={pts}
            fill="none"
            stroke={ACCENT}
            strokeWidth="2"
            strokeLinejoin="round"
          />
          {daily.map((v, ix) => (
            <circle
              key={ix}
              cx={x(ix)}
              cy={y(v)}
              r={ix === span - 1 ? 4.5 : 3}
              fill={ix === span - 1 ? ACCENT : '#fff'}
              stroke={ACCENT}
              strokeWidth="1.6"
            />
          ))}
        </svg>
        <div className="day-ticks">
          {daily.map((_, ix) => {
            const at = now - (span - 1 - ix) * DAY
            const d = new Date(at)
            // The first tick and every 1st of a month carry the month name.
            const label = ix === 0 || d.getDate() === 1 ? dayStamp(at) : String(d.getDate())
            return (
              <span key={ix} className={ix === span - 1 ? 'day-tick-today' : undefined}>
                {label}
              </span>
            )
          })}
        </div>
      </div>
    </div>
  )
}
