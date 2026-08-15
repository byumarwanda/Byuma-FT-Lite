import { useApp } from './useApp'
import { ConfirmSheet, Freeze, Toast, TopBar } from './components/ui'
import { Forgot, SignIn, SignUp } from './screens/Auth'
import { Tour } from './screens/Tour'
import { Home } from './screens/Home'
import { Stats } from './screens/Stats'
import { Balance, PlansScreen } from './screens/Money'
import { Categories, Currencies } from './screens/Currencies'
import {
  ChangeEmail,
  ChangeName,
  ChangePassword,
  Profile,
} from './screens/Profile'
import { ErrorScreen } from './screens/ErrorScreen'

const TITLES: Record<string, string> = {
  home: 'BYUMA FT',
  stats: 'ANALYTICS',
  profile: 'PROFILE',
  name: 'YOUR NAME',
  email: 'EMAIL',
  password: 'PASSWORD',
  cats: 'CATEGORIES',
  forgot: 'PASSWORD',
  curs: 'CURRENCIES',
  balance: 'BALANCE',
  plans: 'PLANS',
}

export default function App() {
  const app = useApp()
  const { screen } = app

  // Nothing is drawn until the saved session has been read, so a signed-in
  // person never sees the sign-up screen flash past on start-up.
  if (!app.ready) {
    return (
      <div className="shell">
        <div className="phone" />
      </div>
    )
  }

  const chrome =
    screen !== 'signup' && screen !== 'signin' && screen !== 'error' && screen !== 'tour'

  return (
    <div className="shell">
      <div className="phone">
        <div className="scroll">
          {chrome && (
            <TopBar
              title={TITLES[screen] ?? ''}
              showBack={screen !== 'home'}
              showProfile={screen === 'home' || screen === 'stats' || screen === 'profile'}
              profileActive={screen === 'profile'}
              onBack={app.goBack}
              onProfile={() => app.go('profile')}
              white={screen === 'home'}
            />
          )}

          {screen === 'signup' && <SignUp app={app} />}
          {screen === 'signin' && <SignIn app={app} />}
          {screen === 'tour' && <Tour app={app} />}
          {screen === 'forgot' && <Forgot app={app} />}
          {screen === 'home' && <Home app={app} />}
          {screen === 'stats' && <Stats app={app} />}
          {screen === 'balance' && <Balance app={app} />}
          {screen === 'plans' && <PlansScreen app={app} />}
          {screen === 'curs' && <Currencies app={app} />}
          {screen === 'cats' && <Categories app={app} />}
          {screen === 'profile' && <Profile app={app} />}
          {screen === 'name' && <ChangeName app={app} />}
          {screen === 'email' && <ChangeEmail app={app} />}
          {screen === 'password' && <ChangePassword app={app} />}
          {screen === 'error' && <ErrorScreen app={app} />}
        </div>

        <Toast toast={app.toast} />
        <ConfirmSheet confirm={app.confirm} onCancel={() => app.setConfirm(null)} />
        <Freeze label={app.busy} />
      </div>
    </div>
  )
}
