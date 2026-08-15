# Byuma FT Lite

A simple personal expense tracker. You type an amount, tap how you paid
(Cash, MoMo or Bank), tap what it was for, and it is recorded. It keeps a
balance in up to three currencies, takes off the money you must keep, and
shows you what you can actually spend.

The app is built exactly from the designs in the `Byuma FT Lite V2` folder.
Those files stay in this repository as the reference.

---

## 1. Putting the app on your phone

You only do this once. It takes about five minutes.

### Step 1 — Turn on the website for this repository

1. Open this page in a browser:
   **https://github.com/byumarwanda/Byuma-FT-Lite/settings/pages**
2. You will see a box titled **Build and deployment**, and under it the
   word **Source** with a dropdown.
3. Click that dropdown and choose **GitHub Actions**.
   (Do **not** choose "Deploy from a branch".)
4. That is all. There is no Save button — it saves by itself.

### Step 2 — Wait for it to build

1. Open **https://github.com/byumarwanda/Byuma-FT-Lite/actions**
2. You will see a job called **Build and publish Byuma FT**.
3. When it has a green tick ✅ next to it, the app is live. It usually
   takes one or two minutes. If it has a red ✗, tell me and I will fix it.

### Step 3 — Open it on your phone

Your app address is:

**https://byumarwanda.github.io/Byuma-FT-Lite/**

Open that link in Chrome on your Tecno.

### Step 4 — Add it to your home screen

So it opens like a normal app, without the browser bars:

**On an Android phone (your Tecno Spark 7T), in Chrome:**
1. Open the link above.
2. Tap the three dots **⋮** at the top right.
3. Tap **Add to Home screen** (on some versions it says **Install app**).
4. Tap **Add**, then **Add** again.
5. Close Chrome. You now have a **Byuma FT** icon with your other apps.

**On an iPhone (your friends), in Safari:**
1. Open the link above in **Safari** (it must be Safari, not Chrome).
2. Tap the **Share** button at the bottom — the square with an arrow
   pointing up.
3. Scroll down the list and tap **Add to Home Screen**.
4. Tap **Add** at the top right.

### Step 5 — Make your account

Open the app from your home screen and tap through **Create account**.
Your name, your email, and a password of at least 8 characters.

You will land on the home screen with **no expenses**, exactly as in the
design. Go to **Analytics → Update balance** whenever you want to tell the
app how much money you actually have.

### When the app is improved

The address above is the only link, and it never changes — it always serves
the newest version. Your phone keeps a saved copy so the app opens even
without internet; when a new version is published, the app notices the next
time you open it (or bring it back to the front) with internet on, downloads
the new version in the background, and refreshes itself within a few
seconds. You never reinstall anything and the icon on your home screen stays
the same.

To see which version you are running: open **Profile** and look at the very
bottom — a small line shows the day that version was published.

---

## 2. How the money works

**Recording an expense lowers your balance.** If your balance is
RWF 840,000 and you record RWF 2,400, your balance becomes RWF 837,600 on
its own. You do not have to correct it by hand.

**Update balance** (Analytics → Update balance) is for when you want to
correct the app — for example after counting the real cash in your pocket.
Whatever you type there replaces the old totals.

**Plans** (Analytics → Plans) is where you protect money before it is
spent. A plan is anything you know is coming: rent, school fees, a loan
payment. Each one has a name, an amount, a currency, a priority and, if
you like, a date:

- **P1 — certain.** All of its amount is set aside.
- **P2 — likely.** Half is set aside.
- **P3 — loose.** A fifth is set aside.

Below the plans sits the **Safety net** — the money you want to remain
with if every plan happened and the musts were done. **70% of it** is held
back, because in real life a person dips into their cushion, and the app
should not pretend otherwise.

And below that, **Expected income** — money on its way to you: a salary,
a client paying. Each row has a switch: flip it on and that money counts
into what you can spend before it arrives; leave it off and the app waits
until you actually have it.

So:

```
Spendable = Balance
          − (all of P1 + half of P2 + a fifth of P3)
          − 70% of Safety net
          + Expected income you count in
```

The bottom of the Plans screen shows exactly this sum with your own
numbers, so you can always see where the figure comes from.

The app warns you in two ways:

- **Red** — your balance cannot cover your P1 plans in full. It tells you
  by how much. Expected income cannot save this: money that has not
  arrived cannot pay a certain bill.
- **Violet** — the P1s are covered, but you are eating into your safety
  net.

Never both at once.

If you saved limits in an earlier version, nothing is lost: each old
**Must** became a P1 plan called "Musts", and your old safety nets were
pooled into the one safety net, in your main currency.

**Exchange rates.** The app fetches today's rates from the internet when
you open it. If you have no internet it keeps the last rates it saw. You
can type over any rate yourself, in three places — the Rates card on
Update balance, the Currencies screen, and the "add from another currency"
box. Once you type a rate yourself, the app will not overwrite it.

---

## 3. Signing in

Three ways in, and one way back if you forget.

**Your password.** What you set when you created the account. The eye at the
right of any password box shows what you have typed, so you are never
guessing on a phone keyboard.

**Your phone's fingerprint, face or PIN.** Go to **Profile → Security** and
turn on **Unlock with your phone**. After that the sign-in screen offers
*Unlock as <your name>* and you are in with one tap — no typing. Your
fingerprint never leaves your phone; the app only ever learns whether your
phone said yes.

**If you forget your password.** Tap **Forgot your password?** on the sign-in
screen. Your account lives only on this phone, so the phone itself can vouch
for you: confirm with the same fingerprint, face or PIN that unlocks the
phone, and set a new password straight away. Your expenses are untouched.
This works even if you never turned on phone unlock — and after it, phone
unlock is on for that account, so the next sign-in is one tap.

Be clear-eyed about what that means: anyone who can unlock your phone can
also reset a password in this app. On your own phone that person is you; if
you share your phone and its PIN, you share what the PIN can open.

Only a phone with no screen lock at all (or a browser that cannot ask for
one) has nothing to check against. There is no email server behind this app
to send a reset link to, so the only honest option left there is to erase
that account and start over, which deletes its expenses. The app says so
plainly before it does anything.

**Phone unlock is still worth turning on early** — it is the fast way in:
one tap instead of typing a password.

---

## 4. Where your information is kept

Everything is stored **inside your own phone**. Nothing is uploaded
anywhere and nobody else can see it. Your password is not stored — only a
scrambled version of it that cannot be turned back into your password.

Be clear-eyed about what the lock does: it keeps the app shut, not the file.
Your expenses sit in ordinary browser storage on the phone, unencrypted, so
somebody who knows their way around a browser's developer tools could read
them. The password and the phone unlock guard the app, not the data at rest.
For a personal expense tracker on your own phone that is a fair trade; it is
not a safe.

Three things to know:

- Your expenses **do not follow you to a second phone**. Each phone keeps
  its own. Your friends each get their own private account on their own
  phone.
- If you **clear your browser data** for this site, or delete the app and
  choose to clear its data, your expenses go with it.
- **Phone unlock only works on the phone you set it up on.** It is tied to
  that handset, so it cannot let you in from a different one.

If you later want your account to work on any phone, with a real backup,
that needs an online service behind it. Tell me and I will add it.

---

## 5. Where the design was not followed exactly

Three deliberate changes. Everything else matches the designs.

1. **Recording an expense lowers the balance.** The design prototype did
   not do this — its balance only changed when you typed it. You asked for
   the expense to come off the total, so it does. Nothing on screen looks
   different; only the numbers move.

2. **Signing out goes straight back to the sign-in screen.** In the
   prototype, signing out landed on the "Something broke" screen, which
   was only a trick so that screen could be shown in the demo. On a real
   phone that would look like a fault, so signing out just signs you out.
   The "Something broke" screen is still in the app for real errors.

3. **"Continue with Google" is gone.** It cannot really work while your
   account lives only on your phone, and a button that does not do what it
   says is worse than no button.

Two smaller adjustments you asked for during the build:

- The **category strip** on the home screen now keeps the same strict left
  and right margin as everything else, and fades out at whichever edge
  still has more categories to scroll to.
- The **Cash / MoMo / Bank** buttons are 44px tall instead of 54px, so they
  stop competing with the amount. They are still clearly taller than the
  category chips.
- A small **Version** line sits at the very bottom of Profile, under
  Sign out. It shows the day the running version was published, so you can
  tell at a glance that an update has arrived.
- **Limits grew into Plans** — named plans with P1/P2/P3 priorities, one
  safety net (70% held back instead of the design's 75%), and expected
  income you can count in. Section 2 has the current formula.
- An **eye** beside "Spent so far" and "Spendable" hides every amount on
  the home and analytics screens — the same switch as "Hide totals" in
  Profile, so the toggle and the eye always agree.
- The **phone's back button** steps back one screen — or closes whatever
  sheet or form is open — instead of leaving the app. It only leaves from
  the home or sign-in screen, the way a phone app should.
- **Last months** has a small switch: the design's bars answer for the
  months, and the graph answers for the days — one point per day, from
  the first day anything was recorded to today, with day marks along the
  axis. One heavy day shows as its own spike.
- Editing an expense offers a **Details** line for clarification. It lives
  only inside the editor — the list stays as clean as the design drew it.
- On the Plans screen each section keeps its explanation behind a small
  **(i)**, shows its own **total on the right**, and every amount field
  groups thousands with commas as you type.
- A short **first-run tour** appears once, right after sign-up: four
  swipeable slides whose pictures are working miniatures of the app's own
  cards. Skippable, and it holds still for phones that ask for reduced
  motion.
- The **Analytics button** sits quieter now — a soft wash of the accent
  instead of a solid block shouting over the screen.
- Profile → Data ends with **Delete account** — it removes the account
  and everything under it from the phone, after saying so plainly.

---

## 6. How it fits different phones

The design was drawn on a 390px-wide screen. Every single measurement —
margins, padding, corner radius, text size — is stored as a fraction of
the screen width instead of a fixed number. So the whole layout keeps
exactly the same proportions on any phone:

| Phone | Screen width | Everything scales to |
| --- | --- | --- |
| Tecno Spark 7T (720×1600) | 360px | 92% of the design |
| iPhone 14 Pro | 393px | 101% |
| iPhone 15 Pro | 393px | 101% |
| iPhone 17 Pro Max | 440px | 113% |

Checked automatically on all four: no screen scrolls sideways and nothing
runs off the edge. On a tablet or computer the app stops growing at 440px
and sits in the middle of the window.

---

## 7. For a developer

```bash
cd app
npm install
npm run dev          # http://localhost:5173
npm test             # 56 unit tests over the money engine
npm run build        # production build into app/dist
```

Layout check across all four phones (needs Playwright, which is not a
project dependency so CI stays fast):

```bash
npm install --no-save playwright
npm run build
npx vite preview --port 4173 &
node scripts/check-layout.mjs   # writes app/shots/
```

**How the responsive scaling works.** All CSS is written with the design's
literal pixel numbers. `postcss-pxtorem` converts them to `rem` at build
time with `1rem = 10 design px`, and `base.css` sets the root font size to
`min(100vw, 440px) / 39`. Hairlines of 1px are left alone so they stay
crisp. `base.css` itself is excluded from the conversion because it is
written in real viewport pixels.

**Layout of the code**

```
app/src/
  lib/money.ts      formatting, numpad rules
  lib/rates.ts      the rate table, live FX fetch, conversion
  lib/calc.ts       spendable, the warnings, balance arithmetic, aggregates
  lib/crypto.ts     PBKDF2 password hashing
  lib/passkey.ts    unlocking with the phone's own fingerprint/face/PIN
  lib/storage.ts    accounts, session and per-account data in localStorage
  useApp.ts         all state and every action
  screens/          one file per group of screens
  styles/           tokens, base (real px), app (design px)
```
