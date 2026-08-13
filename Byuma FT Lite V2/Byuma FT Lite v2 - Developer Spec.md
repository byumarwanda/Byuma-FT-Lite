# Byuma FT Lite v2 — Developer Spec

Written for someone who has never seen the design. It describes what is on every screen, what each control does, what the rules are, and what is deliberately not built yet.

Companion files: **Byuma FT Lite v2.dc.html** (the working prototype) and **Byuma FT Lite v2 Flowboard.dc.html** (all seventeen states side by side, numbered as in this document).

---

## 1. What the product is

A single-person expense tracker. Two jobs:

1. **Record an expense in under five seconds** — type an amount, tap how you paid, tap what it was for.
2. **Know what you can safely spend** — hold a balance in up to three currencies, reserve the money you must keep, and see what is left.

Everything else (categories, profile, currencies) exists to serve those two. There is no dashboard, no budget wizard, no reports.

The prototype is a phone-sized artifact: **390 × 844 px** viewport inside a **412 × 866** bezel, 45 px inner corner radius. Nothing is designed for tablet or desktop.

---

## 2. Design language

### Type
Two families only.

| Role | Family | Usage |
| --- | --- | --- |
| Interface | Instrument Sans | Labels, buttons, body, table rows. Weights 400 and 500; 600 only for the uppercase wordmark. |
| Money and headlines | Instrument Serif | Every figure that represents money, and every page headline. |

Serif for numbers is the core signature: an amount is never set in the sans. Sizes in use — 70 px (amount being typed), 42 px (Spendable, month total), 40 px (spent so far), 36 px (auth headline), 30/28/26/24 px (screen headlines), 26/24 px (amount inputs).

Small-label convention: 12.5 px, weight 400, `letter-spacing:.09em`, uppercase, muted grey. Used for every section heading inside a screen. The top bar title is the same but weight 600 and `.16em`.

### Colour
| Token | Value | Where |
| --- | --- | --- |
| Ink | `#14161f` | Primary text, entered values |
| Ink secondary | `#4b4f5e` | Row labels, quiet buttons |
| Muted | `#6b6f80` | Section labels, helper text |
| Faint | `#83869a` | Placeholders, the un-typed `0` |
| Icon faint | `#9497a5` | Delete crosses, chevrons |
| Accent | `#3b45c9` | Selection, primary buttons, today's dot, first bar in a chart |
| Danger / strict | `#b4553a` | Errors, the Must limit, destructive actions |
| Flexible | `#7b5ec7` | The Safety net limit and its warning |
| Good | `#1f7a5c` | Strong password only |
| Fair | `#c08a2e` | Fair password only |
| Canvas | `#f5f4f9` | Screen background — white with a trace of purple |
| Surface | `#fff` | Cards, rows, inputs |
| Sunken input | `#faf9fc` | Secondary inputs inside a card |
| Key | `#efeef6` | Numpad keys |
| Hairline | `rgba(20,22,31,.12)` | Input and button borders |
| Divider | `rgba(20,22,31,.055)` | Between rows in a list |

Only three chromatic colours carry meaning: accent (chosen / active), red (strict, irreversible), violet (flexible, advisory). Everything else is greyscale on a faintly purple ground.

### Shape and depth
Radii: 45 px screen, 26 px confirm sheet, 18 px cards, 16 px primary buttons, 14 px inputs, 13 px numpad keys and secondary buttons, 11 px chips, 9 px row icon tiles, 50 % avatars and dots.

Almost no shadow. Cards sit on the canvas by contrast alone (`0 1px 2px rgba(20,22,31,.05)` at most). Two exceptions: the toast (`0 6px 20px`) and numpad keys, which get a 1 px border plus a `0 1px 0` bottom edge so they read as pressable.

Heights: 56 px primary button, 54 px input and secondary button, 52 px numpad key and row button, 50 px note field, 46 px small input, 44 px inline-edit button, 34 px chip.

### Motion
Four keyframes, all short.

- `l-rise` 200–240 ms — sheets, inline editors, empty states.
- `l-drop` 180–200 ms — toasts and inline error lines.
- `l-pop` — reserved.
- `l-caret` 1.1 s step blink — the caret next to the typed amount.
- `l-spin` 700 ms — the freeze spinner.

No parallax, no bouncing, no page transitions. Screens swap instantly; only overlays animate.

### Voice
Short and plain. Sentence case. No exclamation marks, no jokes, no emoji. Errors say what is wrong and, where useful, by how much ("Under your must limit by RWF 12,000."). Confirmations are past tense and one clause ("Balance updated."). Helper text appears only where a rule is not self-evident ("Replaces the old totals. Rates are estimates you can edit.").

### Money formatting
One function. `CODE + space + grouped integer`, e.g. `RWF 840,000`, `USD 1,240`. Negative values put the minus **before** the code: `−RWF 26,500`. Amounts are rounded to whole units for display; decimals are accepted on input. Thousands are grouped with commas everywhere, including live while a person types on the numpad.

---

## 3. Global chrome

**Status bar** (top 46 px): 9:41, signal, wifi, battery. Decorative.

**Top bar** (38 px, below the status bar): optional back chevron in a 34 px bordered square, the screen title in uppercase, and on the right a 34 px profile button. Present on every screen except sign up, sign in, and the error screen. On home it sits on white; elsewhere it is transparent over the canvas. The profile button fills with accent when profile is the current screen.

Back behaviour: from Analytics or Profile it goes home; from Update balance and Limits it returns to Analytics; from the profile sub-screens it returns to Profile.

**Toast**: 14 px pill 56 px from the top, inset 16 px, icon plus one line of white text, auto-dismiss after **2.6 s**. Dark `#14161f` for a confirmation with a tick, red `#b4553a` for a refusal with a warning circle. Toasts never block.

**Confirm sheet**: bottom sheet, white, 26 px top corners matching the 45 px screen corners at the bottom, over a `rgba(20,22,31,.42)` scrim. Serif title, one grey line of consequence, then Cancel and the action side by side. The action button is red when the operation destroys data, accent otherwise.

**Freeze**: a near-opaque veil over the whole screen with a spinner and a label ("Saving balance", "Deleting everything"). Nothing is tappable while it shows. Every consequential action passes through it, with a deliberate duration so the person sees that something happened:

| Action | Label | ms |
| --- | --- | --- |
| Create account | Creating your account | 1100 |
| Sign in | Signing in | 1000 |
| Google | Connecting to Google | 1200 |
| Save name | Saving | 700 |
| Save email | Saving | 900 |
| Change password | Saving | 1000 |
| Save balance | Saving balance | 800 |
| Save limits | Saving limits | 700 |
| Delete one expense | Deleting | 600 |
| Delete all expenses | Deleting everything | 1200 |
| Sign out | Signing out | 1100 |
| Retry after error | Trying again | 900 |

**Error convention.** Forms show the error inside the screen: the offending field's border turns red and one red line with a warning circle appears under the group. Actions show a red toast. The two are never mixed for the same event.

---

## 4. The screens

Numbering matches the flowboard.

### 1.1 Sign up
Wordmark, then the serif line "Track what you spend." Three stacked inputs (Name, Email, Password), the inline error slot, a primary "Create account", an "or" divider, "Continue with Google", and a footer link to sign in.

Validation, in order, first failure wins:
1. Name empty → "Your name is missing."
2. Email fails `x@y.z` → "That email does not look right."
3. Password under 8 characters → "Use at least 8 characters."

On success: freeze, then home with **no expenses and a zero balance in every currency**, plus the toast "Account ready." Google skips validation and signs in a seeded demo account.

Any keystroke in any field clears the current error and the red border.

### 1.2 Sign in
Same skeleton, headline "Welcome back.", two inputs. Email must parse; empty password → "Enter your password."; a password under 8 characters stands in for a wrong credential → "Wrong email or password." On success the account is seeded with sample expenses, balances and limits so the rest of the app has something to show.

### 1.3 Nothing recorded yet
Home with the recorder fully usable, but where the totals and timeline would be there is a circle with a plus, "No expenses yet", and "Your first one lands here."

### 1.4 Something broke
Full screen, no chrome: a red warning triangle, "Something broke", the line "Your expenses are safe on this phone.", a primary "Try again" and a secondary "Back to expenses". This is also where signing out lands, so "Try again" performs the actual sign-out: it clears the session and returns to 1.2 with the toast "Signed out."

### 2.1 Record an expense — the home screen
The top two thirds are a white card with a 30 px bottom radius, holding the whole recorder:

1. **Amount display** — the currency code in serif at 26 px, the figure in serif at 70 px, and a blinking accent caret. Untyped it shows a faint `0`. Tapping anywhere on it focuses a hidden input so a hardware keyboard also works.
2. **Method** — three equal buttons, Cash / MoMo / Bank, each with a line icon. **Nothing is preselected.** The chosen one fills with accent.
3. **What was it for?** — one centred field, 50 px.
4. **Category chips** — a horizontal scroller of the person's categories, ordered by how often they have been used, most used first; tapping one fills the note field, tapping it again clears it. A dashed `＋` at the end opens Categories.
5. **Numpad** — 1–9, `.`, 0, backspace. Digits are serif, backspace is sans. Keys are raised light-lilac with a hairline border and a pressed state.
6. **The action button**, whose label and state track readiness:
   - no amount → "Record expense", disabled grey;
   - amount but no method → "Pick a method", still grey; tapping it raises the red toast "Pick cash, MoMo or bank first.";
   - both → "Record RWF 12,500" in accent.

Input rules: digits only plus one decimal point, maximum two decimals, maximum nine characters, live comma grouping.

Recording prepends the expense to today, clears amount, note and method, and confirms by toast.

Below the card:

- **Spent so far** — the label, then the all-time total in serif 40 px. Under it a single 7 px segmented bar showing how that total splits across Cash (accent), MoMo (dark grey) and Bank (light grey), sized by real share; then a legend row of three dot + name + figure groups. The earlier right-hand stack of three numbers was dropped: it read as unrelated to the total and was easy to miss.
- **Analytics** — a filled accent button, full width, 54 px, with a small bar-chart icon. It is the loudest thing below the recorder on purpose: the balance mechanism lives behind it.
- **Timeline** — grouped by day, newest first. Each group has a dot (accent for today, grey otherwise) on a vertical rule, the day label ("Today", "Yesterday", then "12 Aug"), the day's total, and a white card of rows. Each row: a 30 px tile with the method icon, the note (or the method name if there is no note), the amount, and a `×`.
  - Tapping the row opens an **inline editor** beneath it — amount, note, the three methods, Cancel and Save changes. Saving with a zero amount is refused by toast. Only one row can be open at a time; tapping the row again closes it.
  - Tapping `×` does **not** open the editor; it asks "Delete this expense?" with the amount and label as the consequence line, then freezes and deletes.

### 2.2 Categories
An input plus Add, then a white list of categories with a use count and a delete cross. Rules: empty → "Type a name first."; over 18 characters → "Keep it under 18 characters."; duplicate, case-insensitive → "You already have that one." Removing asks first and warns that expenses already filed under it keep their label. Reachable from the `＋` chip on home and from Profile.

### 2.3 Everything deleted
Same shape as 1.3 but with a bin icon, "Everything deleted" and "Nothing left to show." Kept separate from 1.3 so a person can tell a wipe from a fresh start.

### 3.1 Analytics
Headline "Where the money went", then five blocks in this order.

**a. Currency tabs** — one button per picked currency (up to three), the active one filled with accent. The tabs govern the balance card only; the spending charts below are always in the main currency.

**b. The balance card** — the heart of v2.
- Label "Spendable" and, in serif 42 px, the amount a person can spend: **balance − must − 0.75 × safety net.**
- Three stacked rows underneath — Balance, Must (red dot), Safety net (violet dot) — label left, figure right-aligned, hairline between. Stacked rather than three columns so long figures (RWF runs to seven digits) can never collide.
- A warning row appears when one of two thresholds is crossed:
  - **balance < must** → red row, red Spendable figure, "Under your must limit by RWF 12,000."
  - otherwise **spendable < 0** → violet row, violet Spendable figure, "Safety net is thin."
  - Neither → no row, ink figure.
- The card's bottom edge is a divided two-button strip flush to the card's corners: **Update balance | Limits**, each half-width, 50 px tall, quiet 13 px label with a chevron, hover tint. Deliberately calm — people go there only when they need to.

**c. This month** — a card with the month's spending total.

**d. How you paid** — three rows, Cash / MoMo / Bank, each with a dot, the sum, the share as a percentage of all recorded spending, and a bar. Accent, dark grey, light grey — the same three colours as the segmented bar on home, so the two read as one system.

**e. By category** — the top five categories by amount, each with a bar scaled against the largest. The largest is accent, the rest neutral.

**f. Last months** — six columns, one per month; the current month is accent with its figure printed above the bar, the others neutral. Heights scale against the largest of the six, with a 6 px minimum so an empty month still shows a tick.

### 3.2 Update balance
Headline "What do you have now?" then one row per picked currency: the code on the left, a right-aligned serif input on the right. Values here **replace** the stored totals; there is no history and no ledger.

Under the totals sits a white **Rates** card: one row per picked currency other than the main one, reading `1 TL = [ 41.76 ] RWF` with the number in an editable 96 px field. This is the primary place to correct a rate, because it is the moment a person is reconciling real money. Edits write straight to the shared rate table.

Below that, a quiet **＋ Add from another currency**. Opening it reveals a white sub-card:
- chips for every currency the person has that is not one of the three picked;
- an amount field in that currency;
- a rate row reading `1 EUR = [1,560] RWF`, prefilled with the app's estimate and **editable**;
- a live line "Adds ≈ RWF 156,000" and a Remove link.

On save the converted amount is **added to the main currency total**, and the toast names what was added. If there is no other currency to pick, the link raises "Add a currency in your profile first."

Validation: a non-numeric total → that row turns red, "That is not a number."; nothing entered anywhere → "Enter at least one total."; an amount entered with a rate of zero → the rate row turns red, "Set a rate first."

**Rates.** One table, held as the value of one unit in RWF: RWF 1, TL 34, USD 1,420, EUR 1,560, KES 11. The rate shown for any pair is `rates[from] / rates[main]`, rounded to two decimals. Editing a shown rate writes back `rates[code] = shown × rates[main]`, so every place that displays that pair updates at once — the Rates card here, the Currencies screen, and the add-from-another-currency row. Zero and blank edits are ignored rather than rejected. **The table is a placeholder, not a feed.**

Rates are editable in three places, all sharing one state: the Rates card on this screen, the row on Currencies (3.4), and the conversion row inside the extra-currency block.

### 3.3 Limits
The same currency tabs at the top — limits are stored per currency, so switching tabs reloads both fields.

Two labelled fields:
- **Must** — red dot, hint "strict". Money that is already committed: rent, school fees, loan. Subtracted in full.
- **Safety net** — violet dot, hint "flexible". A cushion. Only 75 % of it is subtracted, because a person will dip into it and the app should not pretend otherwise.

A grey strip below shows "Spendable after limits" recomputed as you type. Saving a Must larger than the balance is refused: "More than your balance."

### 3.4 Currencies
Reached from Profile → Currencies.

- An input that accepts letters only, uppercases them, and caps at four ("Code, e.g. EUR"), plus Add. Under two letters → "Use 2 to 4 letters."; duplicate → "You already have that one."
- A count line, "2 of 3 picked".
- A list of every currency the person has. Each row: a 24 px tick box (accent and filled when picked), the code, and on the right either "main currency" or an editable rate — `1 EUR = [ 1560 ] RWF` in a 74 px field. Custom codes also get a delete cross; the five built-ins (RWF, TL, USD, EUR, KES) cannot be deleted.
- The header line pairs the pick count with "Rates are estimates. Edit any."
- Rules: at most **three** picked — a fourth raises "Three at a time. Unpick one first."; at least **one** — "Keep at least one currency."; unpicking the main currency moves main to the first remaining pick; a picked currency must be unpicked before it can be deleted ("Unpick it first.").

Unpicked currencies are not lost. They keep their place in the list and remain available as the source in Update balance.

### 4.1 Profile
Avatar (first initial on accent), name in serif, email in grey. Then:

- **Account** — Name, Email, Password (shown as dots), Categories (count), Currencies (the picked codes joined with `·`). Each row is a chevron button.
- **Main currency** — one chip per picked currency; the active one is filled. This drives every figure outside the balance card: the recorder, the timeline, the totals and all four charts.
- **Settings** — three toggles: Round amounts, Evening reminder, Hide totals. **Visual only in this prototype.**
- **Data** — the expense count, and "Delete all expenses" in red. With nothing to delete it just says "Nothing to delete."; otherwise it names the count in the confirm sheet and warns that it cannot be undone.
- **Sign out** — bordered, quiet, confirmed first.

### 4.2 Change name
One field, save. Empty → "Your name is missing." Saves through a freeze, returns to Profile, toasts "Name changed."

### 4.3 Change email
The current email in a small card labelled "Now", then New email and Password. Checks: valid email; not the same as the current one ("That is already your email."); password present ("Enter your password to confirm."). Then a confirm sheet naming the new address, then a freeze.

### 4.4 Change password
Current, new, repeat new, plus a three-segment strength meter with a word.

Strength: nothing typed → empty; under 8 characters → **weak**, red; 8 or more → **fair**, amber; 8 or more with at least one digit **and** one symbol → **strong**, green.

Checks: current password present; new password at least 8; the two new fields match ("The two new passwords do not match."); new differs from current ("Pick a password you have not used."). Then a confirm sheet stating that other devices sign out, then a freeze.

### 5.1 / 5.2 Confirm and freeze
Not screens of their own — the two overlays described in section 3, shown in the flowboard so the handoff includes their exact treatment. Every one of these passes through both: delete one expense, delete all, change email, change password, sign out, remove a category (confirm only).

---

## 5. Data model

```
user      { name, email }
expense   { id, amount:number, method:'cash'|'momo'|'bank', note:string, offset:number }
category  string                      // max 18 chars, unique case-insensitively
currency  string                      // 2–4 uppercase letters
balances  { [code]: number }          // one ultimate total per currency
limits    { [code]: { must:number, net:number } }
rates     { [code]: number }          // value of one unit in RWF
selCurs   string[]                    // 1–3 picked codes
mainCur   string                      // must be one of selCurs
settings  { round:boolean, reminder:boolean, hide:boolean }
```

`offset` is days before today; the production model should store a real timestamp and derive the grouping.

**Derived values**

```
spendable(code) = balances[code] − limits[code].must − 0.75 × limits[code].net
estRate(from)   = round(rates[from] / rates[mainCur] × 100) / 100
editRate(c, x)  → rates[c] = x × rates[mainCur]
extraAdded      = amount × rate            // added to balances[mainCur] on save
overMust(code)  = balances[code] < limits[code].must          // red
overNet(code)   = !overMust && spendable(code) < 0            // violet
```

**Deliberate simplification:** expenses are single-currency. They are recorded and displayed in the main currency and they do **not** reduce the stored balance — balance is whatever the person last told the app they had. If production wants spending to draw down the balance, that is a decision to take before build, and it changes the meaning of "Update balance".

---

## 6. Prototype controls

The prototype exposes three tweaks:

- **currency** — the fallback main currency (RWF / TL / USD).
- **accent** — the accent colour; every selection, primary button and first chart series follows it.
- **startScreen** — jumps straight to any of the seventeen states, which is how the flowboard renders them all at once.

---

## 7. Not built

Honest list, for planning:

1. No real authentication, session or password handling. Google is a stub.
2. No persistence — a reload restarts the seeded state.
3. No live FX. Rates start from a static table; a person can edit any pair by hand and the edit holds for the session. No rate history, no date-stamped rate, no rounding policy beyond two decimals.
4. The three settings toggles do nothing.
5. No notifications, no export, no sharing, no multi-device sync (though copy mentions other devices signing out).
6. Dates are day-offsets, not timestamps; there is no date picker for a past expense.
7. No accessibility pass beyond colour contrast and 44 px+ hit targets: no focus rings, no screen-reader labels, no dynamic type.
