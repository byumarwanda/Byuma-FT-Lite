import type { App } from '../useApp'
import { ACCENT } from '../components/ui'
import { TriangleIcon } from '../components/icons'

export function ErrorScreen({ app }: { app: App }) {
  return (
    <div className="error-page">
      <span className="error-badge">
        <TriangleIcon />
      </span>
      <div className="error-title">Something broke</div>
      <div className="error-sub">Your expenses are safe on this phone.</div>
      <button
        type="button"
        className="btn-save error-primary"
        style={{ background: ACCENT, marginTop: undefined }}
        onClick={app.retry}
      >
        Try again
      </button>
      <button
        type="button"
        className="btn-quiet mt-9"
        onClick={() => app.go(app.account ? 'home' : 'signin')}
      >
        Back to expenses
      </button>
    </div>
  )
}
