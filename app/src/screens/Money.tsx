import type { App } from '../useApp'
import { spendable, totalLimits } from '../lib/calc'
import { clean } from '../lib/money'
import { estRate } from '../lib/rates'
import { ChipScroller, DANGER, FormError, LINE, VIOLET, pick } from '../components/ui'
import { ACCENT } from '../components/ui'
import { CurrencyTabs } from './Stats'

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

export function LimitsScreen({ app }: { app: App }) {
  const { activeCur, balance } = app
  const must = Number(app.fLim.must) || 0
  const net = Number(app.fLim.net) || 0

  // Limits are typed one currency at a time but spent from one pot, so the
  // preview shows what is left of the whole balance once every currency's
  // limits are counted — with the figures being typed here standing in.
  const wholeLimits = totalLimits(
    app.data.rates,
    { ...app.data.limits, [activeCur]: { must, net } },
    app.selCurs,
    activeCur,
  )

  const rows = [
    { k: 'must' as const, label: 'Must', hint: 'strict', dot: DANGER },
    { k: 'net' as const, label: 'Safety net', hint: 'flexible', dot: VIOLET },
  ]

  return (
    <div className="page">
      <CurrencyTabs app={app} flush />

      <div className="limits-body">
        {rows.map((r) => (
          <div className="limit-block" key={r.k}>
            <div className="limit-head">
              <span className="dot-8" style={{ background: r.dot }} />
              <span className="limit-label">{r.label}</span>
              <span className="limit-hint">{r.hint}</span>
            </div>
            <div
              className="money-row limit-row"
              style={{ borderColor: border(app, 'lim' + r.k) }}
            >
              <span className="money-code">{activeCur}</span>
              <input
                className="money-input"
                type="text"
                inputMode="decimal"
                aria-label={r.label}
                placeholder="0"
                value={app.fLim[r.k]}
                onChange={(e) => {
                  app.setFLim({ ...app.fLim, [r.k]: clean(e.target.value) })
                  app.clearErr()
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <FormError message={app.formError} />

      <div className="limit-preview">
        <span className="limit-preview-label">Spendable after limits</span>
        <span className="limit-preview-value">
          {app.fmtIn(spendable(balance, wholeLimits), activeCur)}
        </span>
      </div>

      <button
        type="button"
        className="btn-save"
        style={{ background: ACCENT }}
        onClick={app.saveLimits}
      >
        Save
      </button>
    </div>
  )
}
