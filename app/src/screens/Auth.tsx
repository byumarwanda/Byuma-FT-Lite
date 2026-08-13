import type { App } from '../useApp'
import { ACCENT, DANGER, FormError, LINE } from '../components/ui'

const border = (app: App, field: string) => (app.errField === field ? DANGER : LINE)

export function SignUp({ app }: { app: App }) {
  return (
    <div className="page-auth">
      <div className="wordmark">BYUMA FT</div>
      <div className="headline-auth">Track what you spend.</div>

      <div className="field-group">
        <input
          className="field"
          type="text"
          autoComplete="name"
          placeholder="Name"
          value={app.fName}
          onChange={(e) => {
            app.setFName(e.target.value)
            app.clearErr()
          }}
          style={{ borderColor: border(app, 'name') }}
        />
        <input
          className="field"
          type="email"
          autoComplete="email"
          autoCapitalize="none"
          placeholder="Email"
          value={app.fEmail}
          onChange={(e) => {
            app.setFEmail(e.target.value)
            app.clearErr()
          }}
          style={{ borderColor: border(app, 'email') }}
        />
        <input
          className="field"
          type="password"
          autoComplete="new-password"
          placeholder="Password"
          value={app.fPass}
          onChange={(e) => {
            app.setFPass(e.target.value)
            app.clearErr()
          }}
          style={{ borderColor: border(app, 'pass') }}
        />
        <FormError message={app.formError} />
      </div>

      <button
        type="button"
        className="btn-primary mt-22"
        style={{ background: ACCENT }}
        onClick={() => void app.signUp()}
      >
        Create account
      </button>

      <div className="auth-alt">
        <span className="auth-alt-text">Already have an account?</span>
        <button
          type="button"
          className="auth-alt-link"
          style={{ color: ACCENT }}
          onClick={() => app.go('signin')}
        >
          Sign in
        </button>
      </div>
    </div>
  )
}

export function SignIn({ app }: { app: App }) {
  return (
    <div className="page-auth">
      <div className="wordmark">BYUMA FT</div>
      <div className="headline-auth">Welcome back.</div>

      <div className="field-group">
        <input
          className="field"
          type="email"
          autoComplete="email"
          autoCapitalize="none"
          placeholder="Email"
          value={app.fEmail}
          onChange={(e) => {
            app.setFEmail(e.target.value)
            app.clearErr()
          }}
          style={{ borderColor: border(app, 'email') }}
        />
        <input
          className="field"
          type="password"
          autoComplete="current-password"
          placeholder="Password"
          value={app.fPass}
          onChange={(e) => {
            app.setFPass(e.target.value)
            app.clearErr()
          }}
          style={{ borderColor: border(app, 'pass') }}
        />
        <FormError message={app.formError} />
      </div>

      <button
        type="button"
        className="btn-primary mt-22"
        style={{ background: ACCENT }}
        onClick={() => void app.signIn()}
      >
        Sign in
      </button>

      <div className="auth-alt">
        <span className="auth-alt-text">New here?</span>
        <button
          type="button"
          className="auth-alt-link"
          style={{ color: ACCENT }}
          onClick={() => app.go('signup')}
        >
          Create an account
        </button>
      </div>
    </div>
  )
}
