# Byuma FT Lite v2 — Handoff Pack

Practical companion to **Byuma FT Lite v2 - Developer Spec.md**. The spec explains the design; this explains how to build it, in what order, and how to tell when it is right.

Artifacts in this handoff:

| File | What it is |
| --- | --- |
| `Byuma FT Lite v2.dc.html` | The clickable prototype. Every rule in the spec is implemented here. |
| `Byuma FT Lite v2 Flowboard.dc.html` | All 17 states side by side, numbered 1.1 – 5.2. |
| `Byuma FT Lite v2 - Developer Spec.md` | Screens, design language, rules, data model. |
| `Byuma FT Lite v2 - Handoff Pack.md` | This file: build order, copy deck, QA list, decisions. |

---

## 1. Screen ↔ state map

The prototype exposes a `startScreen` control; each value renders one flowboard card. Use these as your route names.

| # | Flowboard label | Route | Enters from | Leaves to |
| --- | --- | --- | --- | --- |
| 1.1 | Sign up | `signup` | cold start | home (empty), signin |
| 1.2 | Sign in | `signin` | signup link, sign-out | home (seeded), signup |
| 1.3 | Nothing recorded yet | `empty` | after sign up | home (with items) |
| 1.4 | Something broke | `error` | failed action, sign-out | signin, home |
| 2.1 | Record an expense | `home` | everywhere | stats, profile, cats |
| 2.2 | Categories | `cats` | `＋` chip, profile row | back |
| 2.3 | Everything deleted | `cleared` | delete all | home (with items) |
| 3.1 | Analytics | `stats` | home button | balance, limits, profile, home |
| 3.2 | Update balance | `balance` | analytics footer | stats |
| 3.3 | Limits | `limits` | analytics footer | stats |
| 3.4 | Currencies | `currencies` | profile row | profile |
| 4.1 | Profile | `profile` | header button | name, email, password, cats, currencies, home |
| 4.2 | Change name | `name` | profile row | profile |
| 4.3 | Change email | `email` | profile row | profile |
| 4.4 | Change password | `password` | profile row | profile |
| 5.1 | Confirm sheet | `confirm` | 6 actions | dismiss or freeze |
| 5.2 | Freeze | `busy` | 12 actions | resolves to a toast |

Back button rule: `stats`/`profile` → `home`; `balance`/`limits` → `stats`; profile sub-screens → `profile`.

---

## 2. Suggested build order

1. **Money layer first.** The formatter (`CODE 1,234`, minus before the code), the rate table, and the three derived formulas. Everything visible depends on them; getting the format wrong late means touching every screen.
2. **Recorder (2.1 top card).** Amount input rules, three methods, note field, chips, numpad, the four CTA states. This is the product; ship nothing until it is fast.
3. **Timeline + inline edit + delete.** Including the `×` that deletes without opening the editor.
4. **Balance card (3.1b) and its two screens (3.2, 3.3).** Spendable, both thresholds, both warning colours.
5. **Currencies (3.4)** and the shared rate state.
6. **Charts (3.1c–f).** Pure presentation over data you already have.
7. **Profile and its four sub-screens.**
8. **Auth (1.1, 1.2), error (1.4), empty states (1.3, 2.3).**
9. **Overlays last but not optional** — the confirm sheet and the freeze are what make destructive actions feel safe.

---

## 3. Complete copy deck

Every string in the product, so nothing gets improvised during build. Sentence case, no exclamation marks, no emoji.

**Auth**
- "BYUMA FT" · "Track what you spend." · "Welcome back."
- Fields: Name · Email · Password · New email · Current password · New password · Repeat new password
- Buttons: Create account · Sign in · Continue with Google · Save · Change password
- "or" · "Already have an account?" · "Sign in" · "New here?" · "Create an account"

**Recorder**
- "What was it for?"
- Methods: Cash · MoMo · Bank
- CTA: "Record expense" → "Pick a method" → "Record RWF 12,500"
- "Spent so far"
- Button: "Analytics"
- Day labels: "Today" · "Yesterday" · "12 Aug"
- Inline editor: "Amount" · "What was it for?" · "Cancel" · "Save changes"

**Empty states**
- "No expenses yet" / "Your first one lands here."
- "Everything deleted" / "Nothing left to show."

**Analytics**
- "Where the money went" · "Spendable" · "Balance" · "Must" · "Safety net"
- "Update balance" · "Limits"
- "This month" · "How you paid" · "By category" · "Last months"

**Update balance**
- "What do you have now?" · "Rates" · "＋ Add from another currency"
- "1 EUR =" · "Adds ≈ RWF 156,000" · "Remove"
- "Replaces the old totals. Rates are estimates you can edit."

**Limits**
- "Must" / "strict" · "Safety net" / "flexible" · "Spendable after limits"

**Currencies**
- "Code, e.g. EUR" · "Add" · "2 of 3 picked" · "Rates are estimates. Edit any." · "main currency"

**Profile**
- Sections: "Account" · "Main currency" · "Settings" · "Data"
- Rows: Name · Email · Password · Categories · Currencies · Expenses
- Toggles: "Round amounts" · "Evening reminder" · "Hide totals"
- "Delete all expenses" · "Sign out"

**Errors (red border + inline line)**
- "Your name is missing."
- "That email does not look right."
- "Use at least 8 characters."
- "Enter your password."
- "Wrong email or password."
- "That is already your email."
- "Enter your password to confirm."
- "Enter your current password."
- "New password needs 8 characters."
- "The two new passwords do not match."
- "Pick a password you have not used."
- "Type a name first." · "Keep it under 18 characters." · "You already have that one."
- "Use 2 to 4 letters."
- "That is not a number." · "Enter at least one total." · "Set a rate first." · "More than your balance."

**Warnings (red toast)**
- "Pick cash, MoMo or bank first."
- "Amount cannot be zero."
- "Nothing to delete."
- "Three at a time. Unpick one first."
- "Keep at least one currency."
- "Unpick it first."
- "Add a currency in your profile first."

**Balance warnings (in-card)**
- Red: "Under your must limit by RWF 12,000."
- Violet: "Safety net is thin."

**Confirmations (dark toast)**
- "Account ready." · "Signed in." · "Signed in with Google." · "Signed out."
- "Recorded RWF 12,500." · "Expense deleted." · "Expense updated." · "All expenses deleted."
- "Name changed." · "Email changed." · "Password changed."
- "Balance updated." · "Balance updated with RWF 156,000 added." · "Limits saved."
- "Transport added." · "Transport removed." · "EUR added." · "EUR removed."

**Confirm sheets** (title / consequence / action)
- "Delete this expense?" / "RWF 2,400 · Groceries" / Delete
- "Delete all expenses?" / "All 15 of them, on every device. This cannot be undone." / Delete all
- "Change your email?" / "You will sign in with x@y.z from now on." / Change
- "Change your password?" / "You stay signed in on this phone. Other phones sign out." / Change
- "Remove Transport?" / "Expenses already filed under it keep their label." / Remove
- "Sign out?" / "You will need your password to get back in." / Sign out

**Error screen**
- "Something broke" / "Your expenses are safe on this phone." / "Try again" · "Back to expenses"

---

## 4. QA checklist

**Recorder**
- [ ] Numpad taps in fast succession never drop a digit.
- [ ] Second `.` is ignored; decimals cap at two; input caps at nine characters.
- [ ] Grouping appears live: `12` → `123` → `1,234`.
- [ ] No method selected: the CTA reads "Pick a method" and tapping raises the red toast.
- [ ] Recording clears amount, note **and** method, and prepends to Today.
- [ ] Chip tap fills the note, second tap clears it; chip order follows use frequency.

**Timeline**
- [ ] Tapping a row opens exactly one editor; opening another closes the first.
- [ ] `×` deletes without ever opening the editor.
- [ ] Saving an inline edit with 0 is refused by toast and keeps the editor open.
- [ ] Deleting the last expense lands on 2.3, not 1.3.

**Balance**
- [ ] Spendable = balance − must − 0.75 × net, per currency, recomputed on tab switch.
- [ ] balance < must → red row **and** red figure. Only net breached → violet row **and** violet figure. Never both colours at once.
- [ ] Seven-digit figures in all three rows do not collide or wrap.
- [ ] Update balance replaces totals; untouched currencies keep their old value.
- [ ] Extra-currency amount × rate is added to the **main** currency only, and the toast names it.
- [ ] Rate edited on 3.2 shows the same value on 3.4 and in the extra-currency row.
- [ ] Must > balance is refused.

**Currencies**
- [ ] Fourth pick refused; last unpick refused.
- [ ] Unpicking the main currency moves main to the first remaining pick, and every figure in the app follows.
- [ ] Lowercase input uppercases; non-letters are stripped; cap at four characters.
- [ ] Built-ins have no delete cross; a picked custom currency cannot be deleted.

**Global**
- [ ] Every consequential action passes through confirm → freeze → toast.
- [ ] Nothing is tappable during a freeze.
- [ ] Typing in a field clears its red border and the inline error.
- [ ] Back from each screen lands where section 1 says.
- [ ] All text passes 3:1 against its background; hit targets are 44 px or larger.

---

## 5. Decisions to take before production

1. **Does spending draw down the balance?** Today it does not — balance is only what the person last declared. If it should, "Update balance" becomes a reconciliation, not a replacement, and needs an opening-balance concept.
2. **Are expenses multi-currency?** Today every expense is in the main currency. Supporting per-expense currency touches the recorder, the timeline, all four charts and the category maths.
3. **Where do rates come from?** A feed with a manual override, or manual only. If a feed, decide staleness rules and whether an edited rate survives the next fetch.
4. **What is the Must limit made of?** Currently one number typed by hand. It could be derived from recurring expenses (rent, bills), which would make the red warning much stronger.
5. **Do the three settings toggles ship?** Each implies real work: rounding policy, a notification schedule, a privacy mode.
6. **Persistence and sync.** Local-only, or an account with real devices? Several strings already promise "on every device".
7. **Period for "Spent so far".** All-time today; a month-to-date reading would pair better with the balance mechanism.
