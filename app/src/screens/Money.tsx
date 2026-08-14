import type { App } from '../useApp'
import type { Income, Plan, Prio } from '../types'
import { shortDate } from '../lib/calc'
import { clean, MINUS } from '../lib/money'
import { estRate } from '../lib/rates'
import { ChipScroller, DANGER, FormError, LINE, pick } from '../components/ui'
import { ACCENT } from '../components/ui'
import { CrossIcon } from '../components/icons'

const border = (app: App, field: string) => (app.errField === field ? DANGER : LINE)

export function Balance({ app }: { app: App }) {
  const { data, selCurs, mainCur, extra } = app
  const others = data.allCurs.filter((c) => !selCurs.includes(c))
  const rateRows = selCurs.filter((c) => c !== mainCur)

  return (
    <div className="page">
      <div className="headline-26">What do you have now?</div>

      <div className="bal-inputs">
        {selCurs.map((c) => (
          <div className="money-row" key={c} style={{ borderColor: border(app, 'bal' + c) }}>
            <span className="money-code">{c}</span>
            <input
              className="money-input"
              type="text"
              inputMode="decimal"
              aria-label={c + ' total'}
              placeholder="0"
              value={app.fBal[c] ?? ''}
              onChange={(e) => {
                app.setFBal({ ...app.fBal, [c]: clean(e.target.value) })
                app.clearErr()
              }}
            />
          </div>
        ))}
      </div>

      <FormError message={app.formError} />

      {rateRows.length > 0 && (
        <div className="rates-card">
          <div className="label-sm">Rates</div>
          {rateRows.map((c) => (
            <div className="rate-row" key={c}>
              <span className="rate-row-label">1 {c} =</span>
              <input
                className="rate-input"
                type="text"
                inputMode="decimal"
                aria-label={'Rate for ' + c}
                value={app.shownRate(c)}
                onChange={(e) => app.editRate(c, e.target.value)}
              />
              <span className="rate-unit">{mainCur}</span>
            </div>
          ))}
        </div>
      )}

      {!extra ? (
        <button type="button" className="extra-link" onClick={app.openExtra}>
          ＋ Add from another currency
        </button>
      ) : (
        <div className="extra-card">
          <ChipScroller className="extra-chips">
            {others.map((c) => (
              <button
                key={c}
                type="button"
                className="extra-chip"
                style={pick(extra.cur === c, '#faf9fc', '#4b4f5e')}
                onClick={() =>
                  app.setExtra({
                    cur: c,
                    amt: extra.amt,
                    rate: String(estRate(data.rates, c, mainCur)),
                  })
                }
              >
                {c}
              </button>
            ))}
          </ChipScroller>

          <div className="extra-amt">
            <span className="extra-amt-code">{extra.cur}</span>
            <input
              type="text"
              inputMode="decimal"
              aria-label={'Amount in ' + extra.cur}
              placeholder="0"
              value={extra.amt}
              onChange={(e) => {
                app.setExtra({ ...extra, amt: clean(e.target.value) })
                app.clearErr()
              }}
            />
          </div>

          <div
            className="extra-rate"
            style={{ borderColor: border(app, 'exrate') }}
          >
            <span className="extra-rate-label">1 {extra.cur} =</span>
            <input
              type="text"
              inputMode="decimal"
              aria-label="Rate"
              value={extra.rate}
              onChange={(e) => {
                app.setExtra({ ...extra, rate: clean(e.target.value) })
                app.clearErr()
              }}
            />
            <span className="extra-rate-unit">{mainCur}</span>
          </div>

          <div className="extra-foot">
            <span className="extra-preview">
              Adds ≈{' '}
              {app.fmtIn(
                (Number(extra.amt) || 0) * (Number(extra.rate) || 0),
                mainCur,
              )}
            </span>
            <button
              type="button"
              className="extra-remove"
              onClick={() => app.setExtra(null)}
            >
              Remove
            </button>
          </div>
        </div>
      )}

      <div className="helper">Replaces the old totals. Rates are estimates you can edit.</div>

      <button
        type="button"
        className="btn-save"
        style={{ background: ACCENT }}
        onClick={app.saveBalance}
      >
        Save
      </button>
    </div>
  )
}

/** Currency chips inside a form — only shown when there is a choice. */
function CurPick({
  curs,
  value,
  onPick,
}: {
  curs: string[]
  value: string
  onPick: (c: string) => void
}) {
  if (curs.length < 2) return null
  return (
    <div className="pick-row">
      {curs.map((c) => (
        <button
          key={c}
          type="button"
          className="pick-chip"
          style={pick(c === value, '#faf9fc', '#4b4f5e')}
          onClick={() => onPick(c)}
        >
          {c}
        </button>
      ))}
    </div>
  )
}

function DateRow({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="date-row">
      <span className="date-label">Around when?</span>
      <input
        className="date-input"
        type="date"
        aria-label="Estimated date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}

const PRIO_WORDS: { p: Prio; word: string }[] = [
  { p: 1, word: 'all of it' },
  { p: 2, word: 'half' },
  { p: 3, word: 'a fifth' },
]

const PRIO_COLOR: Record<Prio, string> = { 1: DANGER, 2: '#7b5ec7', 3: '#8f92a0' }

// A missing date sorts last, so the vague plans sink below the dated ones.
const byPlan = (a: Plan, b: Plan) =>
  a.prio - b.prio || (a.date || '￿').localeCompare(b.date || '￿')
const byWhen = (a: Income, b: Income) =>
  (a.date || '￿').localeCompare(b.date || '￿')

/**
 * Plans, the safety net, and expected income — the three dials behind
 * spendable. Rows save the moment they are added or changed; there is no
 * screen-wide Save because there is nothing else to confirm.
 */
export function PlansScreen({ app }: { app: App }) {
  const { data, selCurs, activeCur } = app
  const pf = app.planForm
  const inf = app.incomeForm
  const plans = data.plans.slice().sort(byPlan)
  const incomes = data.incomes.slice().sort(byWhen)

  return (
    <div className="page">
      {/* ---------------- plans ---------------- */}
      {plans.length > 0 && (
        <div className="list-card mt-22">
          {plans.map((p) => (
            <div className="plan-row" key={p.id} onClick={() => app.openPlanForm(p)}>
              <span
                className="prio-badge"
                style={{ color: PRIO_COLOR[p.prio], borderColor: PRIO_COLOR[p.prio] }}
              >
                P{p.prio}
              </span>
              <span className="plan-main">
                <span className="plan-name">{p.name}</span>
                {p.date && <span className="plan-date">{shortDate(p.date)}</span>}
              </span>
              <span className="plan-amt">{app.fmtIn(p.amt, p.cur)}</span>
              <button
                type="button"
                className="x-btn"
                aria-label={'Remove ' + p.name}
                onClick={(e) => {
                  e.stopPropagation()
                  app.askDeletePlan(p)
                }}
              >
                <CrossIcon />
              </button>
            </div>
          ))}
        </div>
      )}

      {pf ? (
        <div className="mini-form">
          <input
            className="field"
            type="text"
            placeholder="What is it? Rent, school fees…"
            value={pf.name}
            onChange={(e) => {
              app.setPlanForm({ ...pf, name: e.target.value })
              app.clearErr()
            }}
            style={{ borderColor: border(app, 'pname') }}
          />
          <div className="money-row mt-9" style={{ borderColor: border(app, 'pamt') }}>
            <span className="money-code">{pf.cur}</span>
            <input
              className="money-input"
              type="text"
              inputMode="decimal"
              aria-label="Amount"
              placeholder="0"
              value={pf.amt}
              onChange={(e) => {
                app.setPlanForm({ ...pf, amt: clean(e.target.value) })
                app.clearErr()
              }}
            />
          </div>
          <CurPick curs={selCurs} value={pf.cur} onPick={(c) => app.setPlanForm({ ...pf, cur: c })} />

          <div className="prio-seg">
            {PRIO_WORDS.map(({ p, word }) => (
              <button
                key={p}
                type="button"
                className="prio-btn"
                style={pick(pf.prio === p, '#faf9fc', '#4b4f5e')}
                onClick={() => app.setPlanForm({ ...pf, prio: p })}
              >
                <span className="prio-btn-p">P{p}</span>
                <span className="prio-btn-word">{word}</span>
              </button>
            ))}
          </div>

          <DateRow value={pf.date} onChange={(v) => app.setPlanForm({ ...pf, date: v })} />
          <FormError message={app.formError} />
          <div className="form-actions">
            <button type="button" className="editor-cancel" onClick={() => app.setPlanForm(null)}>
              Cancel
            </button>
            <button
              type="button"
              className="editor-save"
              style={{ background: ACCENT, borderColor: LINE }}
              onClick={app.savePlan}
            >
              {pf.id ? 'Save changes' : 'Add plan'}
            </button>
          </div>
        </div>
      ) : (
        <button type="button" className="extra-link mt-14" onClick={() => app.openPlanForm()}>
          ＋ Add a plan
        </button>
      )}
      <div className="helper">
        A plan sets money aside before it is spent: all of a P1, half of a P2, a
        fifth of a P3.
      </div>

      {/* ---------------- safety net ---------------- */}
      <div className="section-label">Safety net</div>
      <div className="money-row" style={{ marginBottom: 0 }}>
        <span className="money-code">{data.safety.cur}</span>
        <input
          className="money-input"
          type="text"
          inputMode="decimal"
          aria-label="Safety net"
          placeholder="0"
          value={app.fSafety}
          onChange={(e) => app.editSafety(e.target.value)}
        />
      </div>
      <CurPick curs={selCurs} value={data.safety.cur} onPick={app.setSafetyCur} />
      <div className="helper">
        What should remain if every plan happened and the musts were paid. 70%
        of it is held back.
      </div>

      {/* ---------------- expected income ---------------- */}
      <div className="section-label">Expected income</div>
      {incomes.length > 0 && (
        <div className="list-card">
          {incomes.map((i) => (
            <div className="plan-row" key={i.id} onClick={() => app.openIncomeForm(i)}>
              <span className="plan-main">
                <span className="plan-name">{i.name}</span>
                {i.date && <span className="plan-date">{shortDate(i.date)}</span>}
              </span>
              <span className="plan-amt">{app.fmtIn(i.amt, i.cur)}</span>
              <button
                type="button"
                className="toggle toggle-sm"
                role="switch"
                aria-checked={i.counted}
                aria-label={'Count ' + i.name + ' into spendable'}
                onClick={(e) => {
                  e.stopPropagation()
                  app.toggleCounted(i.id)
                }}
                style={{
                  background: i.counted ? ACCENT : 'rgba(20,22,31,.14)',
                  justifyContent: i.counted ? 'flex-end' : 'flex-start',
                }}
              >
                <span />
              </button>
              <button
                type="button"
                className="x-btn"
                aria-label={'Remove ' + i.name}
                onClick={(e) => {
                  e.stopPropagation()
                  app.askDeleteIncome(i)
                }}
              >
                <CrossIcon />
              </button>
            </div>
          ))}
        </div>
      )}

      {inf ? (
        <div className="mini-form">
          <input
            className="field"
            type="text"
            placeholder="Where from? Salary, a client…"
            value={inf.name}
            onChange={(e) => {
              app.setIncomeForm({ ...inf, name: e.target.value })
              app.clearErr()
            }}
            style={{ borderColor: border(app, 'iname') }}
          />
          <div className="money-row mt-9" style={{ borderColor: border(app, 'iamt') }}>
            <span className="money-code">{inf.cur}</span>
            <input
              className="money-input"
              type="text"
              inputMode="decimal"
              aria-label="Amount"
              placeholder="0"
              value={inf.amt}
              onChange={(e) => {
                app.setIncomeForm({ ...inf, amt: clean(e.target.value) })
                app.clearErr()
              }}
            />
          </div>
          <CurPick curs={selCurs} value={inf.cur} onPick={(c) => app.setIncomeForm({ ...inf, cur: c })} />
          <DateRow value={inf.date} onChange={(v) => app.setIncomeForm({ ...inf, date: v })} />

          <div className="count-row">
            <span className="toggle-label">Count it in already</span>
            <button
              type="button"
              className="toggle"
              role="switch"
              aria-checked={inf.counted}
              aria-label="Count it in already"
              onClick={() => app.setIncomeForm({ ...inf, counted: !inf.counted })}
              style={{
                background: inf.counted ? ACCENT : 'rgba(20,22,31,.14)',
                justifyContent: inf.counted ? 'flex-end' : 'flex-start',
              }}
            >
              <span />
            </button>
          </div>

          <FormError message={app.formError} />
          <div className="form-actions">
            <button type="button" className="editor-cancel" onClick={() => app.setIncomeForm(null)}>
              Cancel
            </button>
            <button
              type="button"
              className="editor-save"
              style={{ background: ACCENT, borderColor: LINE }}
              onClick={app.saveIncome}
            >
              {inf.id ? 'Save changes' : 'Add income'}
            </button>
          </div>
        </div>
      ) : (
        <button type="button" className="extra-link mt-14" onClick={() => app.openIncomeForm()}>
          ＋ Add income
        </button>
      )}
      <div className="helper">
        The switch on a row counts that money into spendable before it arrives.
      </div>

      {/* ---------------- how spendable is born ---------------- */}
      <div className="sum-card">
        <div className="sum-row">
          <span>Balance</span>
          <span>{app.fmtIn(app.balance, activeCur)}</span>
        </div>
        <div className="sum-row">
          <span>Plans</span>
          <span>{MINUS + ' ' + app.fmtIn(app.plansOff, activeCur)}</span>
        </div>
        <div className="sum-row">
          <span>Safety net · 70%</span>
          <span>{MINUS + ' ' + app.fmtIn(app.safetyOff, activeCur)}</span>
        </div>
        {app.incomeIn > 0 && (
          <div className="sum-row">
            <span>Income counted</span>
            <span>{'+ ' + app.fmtIn(app.incomeIn, activeCur)}</span>
          </div>
        )}
        <div className="sum-total">
          <span>Spendable</span>
          <span>{app.fmtIn(app.spend, activeCur)}</span>
        </div>
      </div>
    </div>
  )
}
