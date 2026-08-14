import type { App } from '../useApp'
import { ACCENT, DANGER, FormError, LINE, PasswordField } from '../components/ui'
import { UnlockIcon } from '../components/icons'

const border = (app: App, field: string) => (app.errField === field ? DANGER : LINE)

/** Offered only when this phone can do it and it has been set up. */
function UnlockButton({ app, label }: { app: App; label: string }) {
  return (
    <button type="button" className="unlock" onClick={() => void app.unlockWithPhone()}>
      <UnlockIcon />
      {label}
    </button>
  )
}

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
        <PasswordField
          placeholder="Password"
          autoComplete="new-password"
          value={app.fPass}
          onChange={(v) => {
            app.setFPass(v)
            app.clearErr()
          }}
          borderColor={border(app, 'pass')}
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
  const phoneReady = app.canUsePhone && !!app.lastAccount?.passkeyId

  return (
    <div className="page-auth">
      <div className="wordmark">BYUMA FT</div>
      <div className="headline-auth">Welcome back.</div>

      {phoneReady && (
        <>
          <div className="field-group">
            <UnlockButton app={app} label={'Unlock as ' + (app.lastAccount?.name || 'you')} />
          </div>
          <div className="auth-divider">
            <span />
            <span className="auth-divider-word">or</span>
            <span />
          </div>
        </>
      )}

      <div className={phoneReady ? 'mt-22' : 'field-group'}>
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
        <PasswordField
          placeholder="Password"
          autoComplete="current-password"
          value={app.fPass}
          onChange={(v) => {
            app.setFPass(v)
            app.clearErr()
          }}
          borderColor={border(app, 'pass')}
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

      <button type="button" className="forgot-link" onClick={app.goForgot}>
        Forgot your password?
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

/**
 * There is no email server behind this app, so a reset link cannot be sent.
 * What the phone can do is prove it is you, using the same fingerprint, face
 * or PIN that unlocks it — but only if that was switched on beforehand.
 * Without it nothing can tell one person from another, and the only honest
 * offer is to start the account over.
 */
export function Forgot({ app }: { app: App }) {
  const acc = app.recovering
  const canProve = app.canUsePhone && !!acc?.passkeyId

  return (
    <div className="page">
      <div className="headline-26">Forgot your password?</div>

      {!acc ? (
        <>
          <div className="forgot-note">
            Type the email you signed up with and we will look for it on this phone.
          </div>
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
            <FormError message={app.formError} />
          </div>
          <button
            type="button"
            className="btn-primary mt-22"
            style={{ background: ACCENT }}
            onClick={app.findForRecovery}
          >
            Continue
          </button>
        </>
      ) : !app.recovered ? (
        <>
          <div className="forgot-note">
            {canProve
              ? 'Confirm it is you with the same fingerprint, face or PIN that unlocks this phone. Then you can pick a new password.'
              : 'This account never turned on phone unlock, so nothing on this phone can prove who you are. Your password cannot be recovered.'}
          </div>

          {canProve ? (
            <div className="field-group">
              <button
                type="button"
                className="unlock"
                onClick={() => void app.proveWithPhone()}
              >
                <UnlockIcon />
                Confirm with your phone
              </button>
              <FormError message={app.formError} />
            </div>
          ) : (
            <>
              <div className="forgot-note">
                You can start this account over. Every expense saved under{' '}
                {acc.email} on this phone is deleted.
              </div>
              <button
                type="button"
                className="danger-btn"
                onClick={app.eraseAndStartOver}
              >
                Erase and start over
              </button>
            </>
          )}

          <button
            type="button"
            className="btn-quiet mt-22"
            onClick={() => app.go('signin')}
          >
            Back to sign in
          </button>
        </>
      ) : (
        <>
          <div className="forgot-note">Pick a new password for {acc.email}.</div>
          <div className="field-group">
            <PasswordField
              placeholder="New password"
              autoComplete="new-password"
              value={app.fNew}
              onChange={(v) => {
                app.setFNew(v)
                app.clearErr()
              }}
              borderColor={border(app, 'new')}
            />
            <PasswordField
              placeholder="Repeat new password"
              autoComplete="new-password"
              value={app.fNew2}
              onChange={(v) => {
                app.setFNew2(v)
                app.clearErr()
              }}
              borderColor={border(app, 'new2')}
            />
            <FormError message={app.formError} />
          </div>
          <button
            type="button"
            className="btn-primary mt-22"
            style={{ background: ACCENT }}
            onClick={() => void app.resetPassword()}
          >
            Save new password
          </button>
        </>
      )}
    </div>
  )
}
