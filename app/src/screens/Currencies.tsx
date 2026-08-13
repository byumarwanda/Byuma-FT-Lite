import type { App } from '../useApp'
import { ACCENT, DANGER, FormError, LINE } from '../components/ui'
import { CrossIcon, OkIcon } from '../components/icons'

export function Currencies({ app }: { app: App }) {
  const { data, selCurs, mainCur } = app

  return (
    <div className="page">
      <div className="add-row">
        <input
          className="add-input add-input-cur"
          type="text"
          autoCapitalize="characters"
          placeholder="Code, e.g. EUR"
          value={app.newCur}
          onChange={(e) => {
            app.setNewCur(e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4))
            app.clearErr()
          }}
          style={{ borderColor: app.errField === 'cur' ? DANGER : LINE }}
        />
        <button
          type="button"
          className="add-btn"
          style={{ background: ACCENT }}
          onClick={app.addCur}
        >
          Add
        </button>
      </div>

      <FormError message={app.formError} />

      <div className="cur-meta">
        <span>{selCurs.length} of 3 picked</span>
        <span>Rates are estimates. Edit any.</span>
      </div>

      <div className="list-card">
        {data.allCurs.map((c) => {
          const on = selCurs.includes(c)
          const isMain = c === mainCur
          return (
            <div className="cur-row" key={c}>
              <button
                type="button"
                className="tick"
                aria-label={on ? 'Unpick ' + c : 'Pick ' + c}
                onClick={() => app.toggleCur(c)}
                style={{
                  background: on ? ACCENT : 'transparent',
                  borderColor: on ? ACCENT : 'rgba(20,22,31,.18)',
                }}
              >
                {on && <OkIcon color="#fff" />}
              </button>
              <span className="cur-name">{c}</span>

              {isMain ? (
                <span className="cur-main">main currency</span>
              ) : (
                <span className="cur-rate">
                  1 {c} =
                  <input
                    type="text"
                    inputMode="decimal"
                    aria-label={'Rate for ' + c}
                    value={app.shownRate(c)}
                    onChange={(e) => app.editRate(c, e.target.value)}
                  />
                  {mainCur}
                </span>
              )}

              {app.canRemoveCur(c) && (
                <button
                  type="button"
                  className="x-btn x-btn-lg"
                  aria-label={'Remove ' + c}
                  onClick={() => app.removeCur(c)}
                >
                  <CrossIcon size={11} />
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function Categories({ app }: { app: App }) {
  return (
    <div className="page">
      <div className="add-row">
        <input
          className="add-input"
          type="text"
          placeholder="New category"
          value={app.newCat}
          onChange={(e) => {
            app.setNewCat(e.target.value)
            app.clearErr()
          }}
          style={{ borderColor: app.errField === 'cat' ? DANGER : LINE }}
        />
        <button
          type="button"
          className="add-btn"
          style={{ background: ACCENT }}
          onClick={app.addCat}
        >
          Add
        </button>
      </div>

      <FormError message={app.formError} />

      <div className="list-card cat-list">
        {app.data.cats.map((c) => (
          <div className="cat-row" key={c}>
            <span className="cat-row-name">{c}</span>
            <span className="cat-row-count">{(app.catFreq[c] || 0) + ' used'}</span>
            <button
              type="button"
              className="x-btn x-btn-lg"
              aria-label={'Remove ' + c}
              onClick={() => app.removeCat(c)}
            >
              <CrossIcon size={11} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
