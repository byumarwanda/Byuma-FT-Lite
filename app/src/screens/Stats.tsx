import type { App } from '../useApp'
import type { Method } from '../types'
import { monthIndex, monthName, sumIn, topCategories } from '../lib/calc'
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

  const red = app.shortfall > 0
  const violet = !red && spend < 0

  // "Hide totals" masks the money, not the structure.
  const m = (s: string) => (app.hidden ? '••••••' : s)

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
          <HideEye hidden={app.hidden} onToggle={app.toggleHide} />
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
        <div className="label-sm">This month</div>
        <div className="figure-42">{m(app.fmt(monthTotal))}</div>
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
                <span className="paid-sum">{app.priv(app.fmt(v))}</span>
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
              <span className="cat-sum">{app.priv(app.fmt(c.value))}</span>
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
      <div className="section-label">Last months</div>
      <div className="card-months">
        <div className="months">
          {months.map((m) => (
            <div className="month" key={m.mi}>
              <span className="month-figure">
                {m.mi === thisMonth && m.v ? app.priv(app.fmt(m.v)) : ''}
              </span>
              <span
                className="month-bar"
                style={{
                  // Inline styles skip the build's px-to-rem step, so the
                  // design's px are converted here (1rem = 10 design px).
                  height: Math.max(6, Math.round((m.v / monthMax) * 78)) / 10 + 'rem',
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
      </div>
    </div>
  )
}
