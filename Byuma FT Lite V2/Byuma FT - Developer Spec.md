# Byuma FT — Mobile App Design Specification

Handoff document for a developer who cannot see the design.
Source of truth: `MeridianPhone.dc.html` (phone app), `MeridianDesktop.dc.html` (desktop/business surface), `meridian-data.js` (all seed data).

---

## 1. Product summary

Byuma FT is a personal money app for someone living across **three currencies** (Turkish lira ₺ TRY, US dollars $ USD, Rwandan francs RF RWF). The core idea: the user records money in one plain sentence — spoken, typed, or photographed from a receipt — and the app files it into the right account, category, loan or subscription. Nothing connects to a bank; the user's own records are the ledger.

Main jobs the app does:
- Show **Free to spend** (money left after committed "musts" and money kept aside for priority plans) and **Total money** across all accounts, converted to a base currency.
- Keep a **ledger** of transactions across eleven accounts.
- Track **loans** lent and borrowed with people, and settle them.
- Track **subscriptions** and warn before a charge breaks an account floor.
- Keep a locked **Vault** of things owned outside bank accounts (land, cars, papers) with photos and documents.
- **Plans & musts** — planning room with priorities, expected money, and a "What if" simulator.
- **Bank fees** on file, per bank, editable.

---

## 2. Device frame and canvas

Everything renders inside a phone mock:

| Layer | Size | Style |
|---|---|---|
| Outer bezel | 412 × 866 px | `border-radius: 56px`, background `#d7d7de` (token `--m-bezel`), padding 11px, shadow `0 1px 2px rgba(20,22,31,.14)` |
| Screen | 390 × 844 px | `border-radius: 45px`, `overflow: hidden`, background `--m-bg` (`#f4f4f7`) |
| Page background outside the phone | — | `#e9e9ee` |

**Status bar** — absolutely positioned, top 0, height 46px, padding `0 26px 0 30px`, `font: 500 13.5px Instrument Sans`, colour `--m-ink`. Left: `9:41`. Right: three inline SVGs at 5px gap — cellular bars (17×11), wifi (15×11), battery (25×12).

**Body area** — `top: 46px`, `bottom: 78px` when the tab bar shows (`0` when it is hidden, e.g. sign-in, onboarding), `overflow: hidden`. Each screen inside scrolls itself with `padding: 6px 22px 30px` (26px on auth screens).

**Home indicator** — 126 × 4.5px pill, `border-radius: 3px`, colour `--m-ink` at 22% opacity, 7px from the bottom, centred, non-interactive.

All numerals render with `font-variant-numeric: tabular-nums lining-nums`.

---

## 3. Design system

### 3.1 Colour tokens

Every colour is a CSS variable set on the screen wrapper, with the light value as the inline fallback. Dark and coloured themes override the same variables (see 3.2).

| Token | Light value | Used for |
|---|---|---|
| `--m-bg` | `#f4f4f7` | screen background |
| `--m-surface` | `#ffffff` | cards, sheets, tab bar, inputs |
| `--m-surface-2` | `#fafafb` | nested/secondary panels, table footers, hover fill |
| `--m-ink` | `#14161f` | primary text, big numbers |
| `--m-ink-2` | `#4b4f5e` | secondary text, body copy |
| `--m-ink-3` | `#8a8e9e` | labels, hints, meta, muted values |
| `--m-line` | `rgba(20,22,31,.075)` | card borders (also used at `.09`–`.14` for stronger control borders) |
| `--m-line-2` | `rgba(20,22,31,.055)` | row separators inside cards and lists |
| `--m-line-strong` | `rgba(20,22,31,.16)–(.22)` | dashed borders, sheet grab handle, editable-value underline |
| `--m-chip` | `rgba(20,22,31,.05)` | chip fills, avatar circles, icon buttons, bar-track fills |
| `--m-input` | `rgba(20,22,31,.04)` | filled field backgrounds |
| `--m-brand` | `#3b45c9` (indigo) | primary buttons, active states, links, accents, charts |
| `--m-brand-press` | `#323bb0` | primary button hover/press |
| `--m-brand-tint` | `rgba(59,69,201,.07)` | tinted info panels, selected chips |
| `--m-brand-line` | `rgba(59,69,201,.28)` | outlined brand buttons and selected borders |
| `--m-brand-fade` | `rgba(59,69,201,.09)` – `.35` | chart area fills, "kept for plans" bar segment |
| `--m-brand-shadow` | `rgba(59,69,201,.28)` | glow under the centre FAB and shutter button |
| `--m-pos` | `#3d7a5f` (green) | money in, owed to you, positive deltas, success tick |
| `--m-pos-tint` | `rgba(61,122,95,.12)` | success circle background |
| `--m-neg` | `#b04a45` (red) | money out, you owe, destructive actions |
| `--m-neg-tint` | `rgba(176,74,69,.07)–(.08)` | destructive confirm panel |
| `--m-neg-line` | `rgba(176,74,69,.3)` | destructive button border |
| `--m-scrim` | `rgba(20,22,31,.28)` | sheet/menu backdrop (with `backdrop-filter: blur(2px)`) |
| `--m-bezel` | `#d7d7de` | phone bezel |
| `--m-shim` | `rgba(255,255,255,.75)` | skeleton shimmer highlight |

Attachment-viewer scrim is darker: `rgba(20,22,31,.62)`.

Category dot colours come from `meridian-data.js` (one hex per spending category) and are reused for the donut chart, ledger dots, category chips and receipt lines.

### 3.2 Themes

Chosen from the **Colour** row at the bottom of the profile menu (three swatch buttons). Each theme rewrites the token block, including `--m-brand`, so the balance-card gradient, charts and accents repaint. Light is the default; a dark theme flips `--m-bg`/`--m-surface`/ink ramp; accent themes change `--m-brand` and its tint/line/fade/shadow derivatives.

### 3.3 Typography

Two families, loaded from Google Fonts:

- **Instrument Sans** — `ital,wght@0,400..700;1,400`. The UI font. Every label, row, button, input and body sentence.
- **Instrument Serif** — `ital@0;1`, with `Georgia, serif` fallback. Used **only** for money figures and short display headlines, which gives the app its voice.

Fallback stack for sans: `system-ui, sans-serif`.

Type scale actually in use (all Instrument Sans unless marked *serif*):

| Role | Spec |
|---|---|
| Hero balance (dashboard) | *serif* 47px / 1.02, letter-spacing −.012em |
| Screen display headline (Vault, Settings, Profile) | *serif* 31px / 1.1 |
| Account detail balance | *serif* 41px / 1 |
| Numpad expression | *serif* 42px / 1 |
| Section money (Plans free-to-spend, loan remaining, subs monthly) | *serif* 38–39px / 1 |
| Card money | *serif* 25–33px / 1 |
| Total-money line on hero card | *serif* 21px / 1 |
| Onboarding / tour titles | *serif* 27–34px / 1.15–1.22 |
| Quoted example sentences | *serif* 15.5–19px / 1.35–1.4 |
| Screen title (Accounts, Loans, Transactions…) | 500 21px / 1, letter-spacing −.015em |
| Sheet title | 500 16px / 1 |
| List row title | 500 14.5px / 1.3 |
| Row secondary line | 400 12.5px / 1.35, `--m-ink-3` |
| Section label (uppercase) | 400–500 11.5–13px / 1, letter-spacing .09–.1em, `text-transform: uppercase`, `--m-ink-3` |
| Field label (uppercase, inside inputs) | 400 10–10.5px / 1, letter-spacing .09em |
| Button label | 500 12.5–15px / 1 |
| Tab bar label | 500 10.5px / 1 |
| Micro tag / badge | 400 10–11px / 1, letter-spacing .06em, uppercase |
| Wordmark "BYUMA FT" | 600 15.5px / 1, letter-spacing .15–.16em, uppercase |

Long paragraphs use `text-wrap: pretty`.

### 3.4 Shape (corner radii)

| Element | Radius |
|---|---|
| Phone bezel / screen | 56px / 45px |
| Bottom sheets | `26px 26px 45px 45px` (bottom corners follow the screen) |
| Large cards, vault items, plan cards | 14–16px |
| Sheets' inner panels, inputs (tall) | 12–15px |
| Buttons (primary, 50–54px tall) | 13–14px |
| Small buttons, chips, kind tiles | 8–12px |
| Pills (month chips, Lock button) | 17–18px (fully round ends) |
| Circles: avatars, icon buttons, toggle knobs, dots | 50% |
| Progress bars / meters | 3–5px (half the bar height) |
| Micro tags | 5px |

### 3.5 Elevation

Shadows are deliberately rare:
- Profile menu popover: `0 18px 44px rgba(20,22,31,.18)`
- Centre FAB in the tab bar: `0 4px 14px var(--m-brand-shadow)`
- Camera shutter: `0 4px 16px var(--m-brand-shadow)`
- Big voice mic button: `0 6px 20px var(--m-brand-shadow)`
- Phone bezel: `0 1px 2px rgba(20,22,31,.14)`

Everything else separates with 1px borders and background steps.

### 3.6 Spacing rules

The app uses a small, repeated set of values. Anything not listed below is one of these numbers.

**Horizontal**

| Where | Value |
|---|---|
| Screen side padding | **22px** (26px on sign-in, create account, personalise, tour) |
| Card inner side padding | **16–20px** (18px is the norm; 14–17px on compact cards) |
| List-row side padding inside a card | **14–18px** |
| Field / input side padding | **14–15px** |
| Chip side padding | **11–15px** |
| Gap between chips in a row | **7px** (8px on filter rows) |
| Gap between buttons in a footer row | **9px** |
| Gap between the three currency buttons | **6–7px** |
| Icon-to-label gap inside a button | **6–10px** |
| Gap between an icon column (dot, avatar, badge) and its text | **10–12px** |
| Grid gap in 2-column tile grids | **8px** |
| Full-bleed rails inside a padded screen | `margin: 0 -22px` + `padding: 0 22px` so chips scroll edge to edge |

**Vertical**

| Where | Value |
|---|---|
| Screen root padding | `6px 22px 30px` — 6px top, 30px bottom |
| Header row | **44px** tall, sits flush at the top of the screen |
| Header → first block | **14–16px** |
| Between stacked cards | **12px** |
| Card → next section label | **22–30px** (26px is the norm) |
| Section label → its content | **10px** |
| Section label block, written as one rule | `margin: 20px 0 10px` (26–30px top for a major break) |
| Card inner block padding | `14–22px` top/bottom (`22px 20px 24px` on the balance card) |
| List rows | **13–15px** top/bottom padding, divided by a 1px `--m-line-2` top border; no border on the first row |
| Between form fields | **9px** |
| Between sheet fields | **11–12px** |
| Label → field | **8px** |
| Field → helper/note text | **8–9px** |
| Inline panel revealed under a control | **8px** below it, entering with `m-rise` |
| Above a footer button row | **20–26px** |
| Footer button row → closing note | **13px** |
| Divider before a bottom-of-sheet action | **26px** above the 1px line, **18px** below it |
| Sheet padding | `20px 22px 30px` |

**Per-screen vertical rhythm** (top to bottom, gaps between blocks):

| Screen | Rhythm |
|---|---|
| Dashboard | header 44px → 14px → currency buttons → 16px → balance card → 30px → ACCOUNTS label → 10px → account rows → 26px → July spending card → 12px → free-to-spend card |
| Accounts | header → 14px → total-money card → 12px → currency buttons → rates line 9px under them → **40px between currency groups**, 10px between a group header and its card |
| New account | header → 16px → kind grid (8px gaps) → 22px → Name field → 9px → currency buttons → 9px → Purpose → 22px → optional panels (12px apart) → 24px → footer buttons |
| Account detail | header → 14px → title row → 4px → purpose → 18px → balance row → 20px → toggle card → 12px → abonman → 26px → seven-months card → 26px → RECORDS label → 10px → rows → 20px → ledger button |
| Transactions | header → 14px → filter chips → 20px → first day group; **22px between day groups**, 8px between a day header and its first row |
| Insights / Plans & musts | header → 14px → headline → 20px → first card; cards 12px apart, section labels 26px above and 10px below |
| Settings / Edit profile | header → 14px → headline → 22px → first group; **26px between groups**, rows 13–15px tall inside each card |
| Vault | header → 14px → summary → 22px → item cards 12px apart → 26px → Add something button |
| Sheets | grab handle → 16px → title block → 16px → body → 22px → footer buttons → 13px → closing note |

### 3.7 Controls

**Primary button** — height 50–54px, `border: 0`, radius 13–14px, background `--m-brand`, white text `500 14.5px`, hover `--m-brand-press`.

**Secondary button** — same height, `background: none` or `--m-surface`, `1px solid --m-line`, text `--m-ink-2`.

**Destructive button** — `1px solid --m-neg-line`, text `--m-neg`, hover fill `--m-neg-tint`. Filled red (`--m-neg`, white text) only for the confirm step.

**Toggle switch** — track 38 × 22px, radius 11px; knob 19px white circle inset 2px, animates `left` over .18s. Off track `--m-line-strong`; on track `--m-brand`. Settings toggles are slightly larger (40 × 23, knob 19).

**Text input** — height 46–52px, radius 11–13px, `1px solid rgba(20,22,31,.12)`, background `--m-surface`, `400 14.5–15px`, `outline: none`, padding `0 14–15px`. Focused/primary field variant: `1.5px solid --m-brand` on `--m-input` fill with a blinking 1.5px caret bar.

**Editable money value** — rendered as a button with `border-bottom: 1.5px dashed --m-line-strong`, serif type. Tapping opens the numpad sheet.

**Selectable chip / segmented option** — height 34–42px, radius 9–12px, `1px solid` border; unselected `--m-line` border on `--m-surface`; selected `--m-brand-line` border on `--m-brand-tint` with `--m-brand` text.

**Radio row** — 17px circle, `1.5px` ring, 9px inner dot; selected ring and dot `--m-brand`.

### 3.8 Motion

Keyframes defined once in the head; durations in brackets.

| Name | What it does | Where |
|---|---|---|
| `m-caret` | 1.05s blinking text caret | every "typed" field |
| `m-wave` | bars scale 0.22→1 | voice waveform |
| `m-ring` | expanding fading ring | mic pulses (1.8–1.9s, second ring delayed .6s) |
| `m-dot` | three bouncing dots | "Reading that…" |
| `m-shim` | 1.2s left-to-right shimmer | skeleton loading bars |
| `m-pop` | scale .6→1 with overshoot | success tick circle |
| `m-rise` | 10px up + fade in (.18–.22s) | popovers, inline panels |
| `m-sheet` | 26px up + fade (.26s, `cubic-bezier(.2,.8,.2,1)`) | bottom sheets |
| `m-slide` | 14px up + fade | onboarding panels, inline editors |
| `m-scan` | scanning line travel (2.1s) | receipt camera |
| `m-draw` | stroke-dashoffset 32→0 | success checkmark |
| `m-fill` | width grow to `--to` | tour loan progress bar |
| `m-float` | ±5px vertical drift (3.4s) | tour quote bubble |
| `m-blink` | opacity 1→.18 | tour balance figure |

Hover/active transitions: `.14–.18s` on background/border/transform. Buttons that press use `transform: scale(.96)`.

---

## 4. Global chrome

### 4.1 Tab bar (`chromeOn`)

Fixed to the bottom of the screen: height 78px, `background: --m-surface`, `border-top: 1px solid --m-line`, padding `11px 12px 0`, items aligned to the top. Five slots: four labelled tabs and a raised centre button.

Each tab: `flex: 1`, column layout, 21×21 stroked SVG icon over a `500 10.5px` label, 5px gap. Inactive colour `--m-ink-3`; active colour `--m-brand`.

| Slot | Icon | Label | Goes to |
|---|---|---|---|
| 1 | house outline | Home | Dashboard |
| 2 | card/bank rectangle with stripe | Accounts | Accounts |
| centre | changes with context (plus / mic) | — | Opens the capture sheet (or the screen's contextual action) |
| 4 | three stacked lines | Records | Transactions (ledger) |
| 5 | flag on a pole | Plans | Plans & musts |

Centre button: 54 × 54px, `margin-top: -14px` so it lifts above the bar, background `--m-brand`, white 22px icon, radius varies by context (circle for capture), shadow `0 4px 14px --m-brand-shadow`, hover lifts 1px, active scales .96.

The tab bar is hidden on: Sign in, Create account, Personalise, Tour.

### 4.2 Profile menu (popover)

Opened by the round avatar button in the top-right of the Dashboard (34px circle, `1px solid --m-line`, `--m-chip` fill, shows the profile photo or the user's initials in `500 11.5px`).

Popover: `top: 52px; right: 16px`, width 236px, padding 8px, radius 16px, white, `1px solid --m-line`, shadow `0 18px 44px rgba(20,22,31,.18)`, enters with `m-rise`. Backdrop is a full-screen `--m-scrim` that closes on tap.

Contents top to bottom:
1. **Identity row** — 38px avatar circle (photo or initials, `--m-brand-tint` fill, `--m-brand` text), name `500 14px`, email `400 12px` `--m-ink-3`, truncated.
2. **Menu rows** — 44px tall, radius 10px, `400 14px`, label left, muted hint right. Rows: Edit profile; Insights (hint "July"); Loans (hint "3"); Vault (hint "locked"); Bank fees (hint "3 banks"); Settings; Sign out.
3. **Colour** — uppercase 10.5px label, then three theme buttons in a row (36px tall, radius 10px) each showing two 14px colour circles from that theme.

### 4.3 Bottom sheets

All modal flows are bottom sheets: full-width, anchored to the bottom, white, radius `26px 26px 45px 45px`, padding `20px 22px 30px`, entering with `m-sheet`. Every sheet starts with a 38 × 4px grab handle in `--m-line-strong`, centred, 18–20px below it. Backdrop `--m-scrim` + 2px blur; tapping it closes the sheet.

---

## 5. Screens

Order below follows the app's flow. Each screen's root has `padding: 6px 22px 30px` and its own scroll.

### 5.1 Sign in

**Purpose:** entry point.

Top to bottom:
- Wordmark `BYUMA FT`, `600 15.5px`, letter-spacing .16em, uppercase, 56px from the top.
- Headline *serif* 34px: "Welcome back, Placide." (38px above)
- Sub-copy `400 13.5px/1.6` `--m-ink-3`, max-width 290px: "Three currencies, eleven accounts and one loan book, exactly where you left them."
- **Email field** (active look): filled `--m-input`, `1.5px solid --m-brand`, radius 12px, padding `13px 15px`; uppercase 10.5px label "Email"; value `placide@byuma.app` in `500 14.5px` with a blinking caret.
- **Password field**: same box with a plain `--m-line` border; label "Password"; ten dots at `500 15px` letter-spacing .22em; a "Show" link in `--m-brand` on the right.
- **Sign in** — primary button, 54px → Dashboard.
- **Use Face ID** — secondary button, 52px, white, with a 17px face-frame icon → Dashboard.
- Spacer, then centred footer: "New here? " + **Create an account** link (`--m-brand`) → Create account.

### 5.2 Create account

Header row (44px) with a back chevron + "Back" → Sign in.
- Headline *serif* 30px: "Start your book."
- Sub-copy: "Four questions after this, then you are in. No card, no bank login."
- Three fields at 9px gap: **Your name** (active, caret, "Placide Zigira"), **Email**, **Password** (dots + three 16×3px green strength ticks + hint "Long enough. It never leaves the phone in the clear.").
- **Create account** primary button → Personalise.
- Privacy note card: white, radius 13px, `400 12px/1.6` `--m-ink-2`.
- Footer: "Already have one? " + **Sign in** link.

### 5.3 Personalise (4-step onboarding)

Header: step label ("Step 1 of 4") left, **Skip** right → Tour.
- Progress: four 3px bars, `flex: 1` each, 5px gap; completed bars `--m-brand`, pending `--m-chip`.
- Title *serif* 28px, hint `400 12.5px/1.6`.
- Body is either **freeform** (a large `--m-input` box with `1.5px --m-brand` border, min-height 96px, serif 19px answer with caret) or **option chips** (wrapping buttons, 12px 14px padding, radius 11px; each shows a small muted prefix then the label; selected uses brand tint/border).
- Pinned above the buttons: **What this changes** panel — `--m-brand-tint`, radius 13px, uppercase brand label, then a sentence explaining the effect of the current answer.
- Footer buttons: **Back** (88px fixed) and the primary CTA (`flex: 1`) which advances, and on the last step goes to Tour.

### 5.4 Tour (4 slides)

Header: wordmark left, **Skip the tour** right → Dashboard.
- A 290px-tall white demo card, radius 20px, centred content, one of four animated demos:
  1. **Capture** — pulsing mic circle (74px) with two expanding rings, a 21-bar animated waveform, and the quote "spent 240 lira at Migros".
  2. **Total money** — label, blinking ₺486,715 in serif 34px, a divider, two account rows.
  3. **Accounts** — four chip rows sliding in with staggered delays, each with a currency square, name and amount.
  4. **Loans** — Ahmet Yıldız owes you ₺14,500 in green serif, an animated progress bar filling to 44%, "₺6,500 back / 2 loans", and a floating quote bubble.
- Below: title *serif* 27px and body `400 13px/1.6` (min-height 62px so slides don't jump).
- Footer: progress dots (the active one is a wide 5px pill in `--m-brand`, others short and grey) and a primary CTA on the right (26px side padding) that advances; the final CTA opens the Dashboard.

### 5.5 Dashboard *(home)*

**Purpose:** the money-at-a-glance screen.

1. **Header row (44px)** — wordmark `BYUMA FT` left; avatar button right → opens the profile menu. (There is no notification icon.)
2. **Currency selector** — three equal buttons, 40px tall, radius 11px, 6px gap, `500 12.5px` letter-spacing .06em: TRY / USD / RWF. The active one uses brand tint + brand border + brand text; others are white with `--m-line`. Changing it re-converts every figure on the screen.
3. **Balance card** — radius 20px, padding `22px 20px 24px`. Background is a four-stop vertical gradient built with `color-mix` from `--m-brand`: 12% → 8% → 2.5% → pure `--m-surface`, so the card fades from a tinted top into white at the bottom (it repaints with the theme).
   - Row: uppercase brand label **"Free to spend"** + a 27px round eye button that hides/shows amounts (icon swaps between eye and eye-with-slash; title text swaps between "Hide the total"/"Show the total").
   - **The figure** — *serif* 47px, e.g. `₺48,900`. Hidden state shows dots.
   - To its right: a 104 × 42px sparkline SVG — area filled with a vertical brand gradient (26% → 0), a 2px line with a horizontal gradient (35% → 100% opacity), and an end dot (3px brand circle with a 1.4px white ring inside a 6px 16%-opacity halo). Under it, uppercase 10.5px "7 months".
   - 44px lower, edge to edge: a **Total money** row — uppercase 11.5px label left, *serif* 21px amount right. It sits in the white part of the gradient, giving the effect of one card fading down into a second value.
4. **Accounts section** — label "ACCOUNTS" + a 27px eye button (hides balances only) on the left; a **Rates** text button on the right that expands a brand-tint panel listing the two conversion pairs and "Rates as of {date}".
5. **Account rows** — only the four frequently used accounts (Garanti BBVA, cash lira, Wise, Bank of Kigali). Each row: 36px rounded square with the currency code (`500 10.5px`), name `500 14.5px` + purpose line `400 12.5px`, and on the right the native amount over its converted value. Rows are separated by 1px `--m-line-2`. Tapping a row → Account detail. Everything else lives in the Accounts screen.
6. **July spending card** — white, radius 14px: label "JULY SPENDING" + month on the right; the month total in `500 27px`; a five-bar week chart (15px wide bars, up to 40px tall, radius `3px 3px 2px 2px`; the current week in brand, past weeks in a muted fill); then the top three categories as rows — 7px colour dot, category name, percentage in grey, amount in `500 13.5px`.
7. **Free-to-spend card (link)** — brand-tint card with `--m-brand-line` border, radius 14px. Uppercase "FREE TO SPEND" left, "Plans & musts ›" right; the figure in *serif* 31px; then two lines: "Musts this month −₺…" and "Keep for P1 plans ₺…". The whole card is a button → Plans & musts.

### 5.6 Accounts

**Purpose:** every account, grouped by currency.

- Header: title "Accounts" + eye toggle; **Add** button (34px, white, `+` icon) → New account.
- **Total money card** — brand tint, radius 13px: uppercase "Total money · {base}", eye toggle, the total in *serif* 33px, a summary line (how many accounts, how many currencies) and an "excluded" line naming anything not counted.
- Currency selector (same three buttons as the dashboard) and "Rates as of {date}".
- **One group per currency**, 40px apart. Group header: `CUR · Currency name` on the left (uppercase, the name in normal case grey), subtotal on the right. The group body is a white card with radius 15px and 1px border, containing:
  - Account rows: name `500 14.5px`; below it a bordered micro-tag for the kind (BANK / SAVINGS / WALLET / CASH / CAMPUS / TRANSIT / LOAN) and the purpose + last-6 digits; an optional brand-coloured note if the account is excluded from the total; right side native amount over converted amount. Tap → Account detail.
  - **Abonman panel** (transit cards with a monthly pass): brand-tint band with a top brand border — pass label + price in *serif* 19px, a 5px progress bar showing the month elapsed, then start date / days left (in brand) / end date.
  - Footer strip in `--m-surface-2`: "Subtotal in {base}" + value.
- **+ Add an account** — full-width dashed button, radius 12px, brand text → New account.

### 5.7 New account

- Header: "New account" + **Cancel** → Accounts.
- **Kind** — 2-column grid of tiles, 8px gap, radius 12px, each with a title `500 13.5px` and a hint `400 11.5px`: Bank account, Savings, Wallet, Cash, Campus card, Transit card, Loan book. Selecting a kind rewrites the default Name, Purpose and which extra panels show.
- **Name** input (46px) and, under it, the three currency buttons (42px).
- **Purpose** input (46px).
- **Transit only — abonman panel**: brand tint, radius 13px; "This card has an abonman" + toggle; one line "A flat monthly fare, not a balance."; two white mini-cards for **Fare** (*serif* 20px) and **Renews** (`500 15px`, "Monthly").
- **Card · optional** — white card: a "Last six digits" input, then a row with **MM/YY** (auto-inserts the slash) and **CVC** (max two digits, 96px wide). Footer note: "First two CVC digits at most. Leave it empty to keep none." (No "Scan it" and no icon picker on this screen.)
- Footer: **Back** and **Add account** (primary) — both return to Accounts.

### 5.8 Account detail

- Header: back chevron + "Accounts"; **Settings** button (gear icon) → Account settings.
- Title row: account name `500 21px` + kind micro-tag. Purpose sentence beneath, max-width 330px.
- Balance row: *serif* 41px native amount, converted value beside it in grey, and on the right a 38px square **pencil** button that opens the inline **balance correction editor**:
  - "Byuma has {amount}" row;
  - "THE BANK SAYS" row on `--m-surface-2` with a dashed-underline editable amount (opens the numpad);
  - "Difference" row, coloured by sign;
  - if there is a difference: a question, then radio options for where the difference goes (e.g. a missed spend / an unrecorded top-up), each with a hint; choosing one that needs detail reveals a "What was it" note field with category chips;
  - an apply button.
- **Count in total money** — white card with a toggle and a one-line hint.
- **Abonman card** (if the account has a pass) — same anatomy as in Accounts, plus a note line.
- **Seven months** card — uppercase label + trend label (green/red), a full-width 94px area+line chart, and seven month initials underneath.
- **Records** — section label + **Add** button (brand outline) that opens the capture sheet; then recent rows: colour dot, date (44px column), merchant + category, amount coloured by sign.
- **See everything in the ledger** — full-width outlined button → Transactions.
- If the account is the loan book: **Open the loan book** primary button → Loans.

### 5.9 Account settings

- Header: back chevron + account name; **Done** (brand) — both return to Account detail.
- Title "Account settings".
- **Name** field (active style with caret) and **Purpose** field (read-style box).
- **Currency** — three chips (42px) + note: "Converts at today's rate · history keeps its own currency".
- **Card on this account** — label + a "Scan it" text button with camera icon. If a card exists: white card with the card label, two mini-panels (**Last six digits** in *serif* 20px with .08em tracking, **Expires** in *serif* 20px), a note, and a red "Remove this card" text button. If not: dashed "+ Add a card" button.
- **Count in total money** — toggle card (same as detail).
- **Delete this account** — destructive outline button; tapping it swaps in a confirm panel ("Delete {name}?", consequence sentence, **Keep it** / **Delete**).

### 5.10 Transactions (ledger)

- Header: title + a 34px round search button.
- **Filter chips** — horizontally scrolling row, 8px radius, each with a small chevron: e.g. All accounts, All categories, This month, All currencies. Active chips take brand tint.
- **Day groups** — for each day: an uppercase header ("Today · 24 Jul") with the day's total on the right, then rows separated by 1px lines. Each row: 8px category dot, merchant `500 14.5px`, "category · account" line, and on the right the amount (green for money in, ink for money out) over the converted value. Tapping a row opens the **Edit record** sheet.

### 5.11 Insights (reached from the profile menu)

- Header: "Insights" + "July 2026".
- **Spending, cumulative** card — label, total in `500 25px`, a 112px-tall area chart with a dashed baseline, and three x-axis captions ("1 Jul", "rent posted 22 Jul", "24 Jul").
- **By category** card — a 112px donut (16 radius, 7 stroke, rotated −90°, one arc per category using its dot colour) beside a legend list of category name + percentage.
- **Month over month** card — two labelled bars (June grey at 95.5%, July brand at 100%) with amounts, and a sentence explaining the change.
- **Record keeping** card — the drift percentage in *serif* 38px with "of July needed correcting" beside it; a seven-bar weekday chart with labels; then correction rows (date column, reason, account · tag, signed delta); and a closing note.

### 5.12 Subscriptions

- Header: title + **Add** (brand outline) → capture sheet.
- **Committed each month** card — uppercase label, amount in *serif* 38px, then a line with the count, the next charge date and the reminder rule.
- **Rows** — 38px rounded-square avatar with the service initial on a tinted fill, the name plus a kind micro-tag and a state pill (e.g. "active", "paused"), a "cycle · card" line, and on the right the amount over the next date. Tap → Subscription settings.
- **Warning card** (brand tint) — e.g. "Canal+ Rwanda renews in 3 days" with an explanation of the floor conflict and a suggested action.

### 5.13 Subscription settings

- Header: back to Subscriptions; **Done** (brand).
- Identity row: 42px tinted rounded square with the initial, name `500 19px`, kind line.
- A one-line "Or just say it — '…'" hint with a **Examples/Hide** button that expands a brand-tint panel of serif example sentences.
- **Name** field (active style).
- Row of two: **Amount** (dashed-underline serif 26px → numpad) and **Charged on** (a day stepper: − button, day in *serif* 22px, + button). Below: the next-charge sentence.
- **How often** — three equal chips (Monthly / Yearly / Weekly).
- **Paid from** — a bordered card of radio rows: bank name, sub-line, and a right-hand coverage note coloured green or red.
- **Remind me a day before** — toggle card with a hint.
- **Remove subscription** — destructive outline → confirm panel ("…?", consequence, **Keep it** / **Yes, remove it**).

### 5.14 Loans

- Header: "Loans" + **New** (brand outline) → capture sheet in loan mode.
- Two summary cards side by side: **Owed to you** (amount in green *serif* 27px) and **You owe** (red).
- **Person groups** — one white card per person, tappable: name + a loan-count micro-tag, a sub-line, and a kind pill on the right ("owes you" / "you owe"); the person total in *serif* 26px with two right-aligned caption lines; then, under a divider, one block per loan: note + remaining amount, a 5px progress bar, and a line with the window and "next {amount} on {date}". Tap → Loan detail.
- **Closed** — section header with a summary, then compact rows: dot, person, a status micro-tag (paid/forgiven), "note · detail", and on the right the amount returned over the close date.

### 5.15 Loan detail

- Header: back to Loans; a kind pill on the right.
- Person name `500 21px` + loan-count tag; a meta line "note · start → due (· phone)"; a brand-coloured line with the person's total across loans.
- **Remaining card** — uppercase label, amount in *serif* 39px (green if owed to you, red if you owe), beside it "of {principal}" and the interest line ("No interest" or "{x}% simple, yearly"); a 7px progress bar; "{paid} paid" and "{pct} settled"; then a divider and a "Next · {date}" row with the amount.
- **Payments** — rows with the amount + a "how" micro-tag (cash / transfer), "where → into", an italic note, and the date on the right.
- Actions: **Say a payment** (primary, mic icon) and **Type it** (secondary, lines icon) side by side; below, a full-width outlined **Settle** button.
- **Also open with them** — other live loans with the same person, each a tappable row with a progress bar.
- **Earlier / closed with them** — historical rows.

### 5.16 Bank fees

**Purpose:** keep each bank's fee schedule on file so transfers can be predicted.

- Header: "Bank fees".
- **Last transfer** card — three rows: "{from} → {to}" with the amount sent, "Fee" in red, and (above a divider) "Landed" with what arrived; then the rule that produced the fee in small grey type.
- **Fees on file** section header with a **Check weekly** toggle (34 × 20px switch + brand label) that turns on automatic re-reading of published tariffs.
- **One card per bank**: bank name + a status pill (e.g. "current" / "changed"), then each fee as an editable row — a **What for** text input (`flex: 1`, 40px, radius 10px), a right-aligned **Fee** input (100px), and a 34px round ✕ button that deletes the row. Below the rows, a dashed **+ Fee** button adds one.
- Card footer: a link to the bank's published tariff page on the left, "read {date}" on the right.

### 5.17 Vault

**Purpose:** things owned that are not in a bank account — land, vehicles, papers — behind a lock.

**Locked state (default):** a 74px brand-tint circle with a face-frame icon, headline *serif* 30px "Vault locked", one line "Look at the phone to open it.", a full-width primary **Face ID** button (54px, with icon), and beneath it a muted text button **Use passcode**.

**Passcode state:** headline *serif* 26px "Passcode", six 12px dot placeholders that fill with brand as digits are entered, a 3 × 4 keypad (62px keys, radius 16px, `400 22px`), and a **Use Face ID** text button to go back. Six digits unlock.

**Unlocked state:**
- Title *serif* 31px "What you hold" with a line under it: "{low} – {high} · {n} things"; on the right a pill **Lock** button (36px, brand tint, brand border, padlock icon) that re-locks.
- **Count in total money** — brand-tint card with a toggle and a hint ("Counted as an estimate" / "Kept out").
- **Item cards** (12px apart, padding `20px 18px`, radius 16px, white): name `500 15px` + kind in uppercase micro type on the right; the value range in *serif* 25px; then a row with the drift line (green if appreciating, red if depreciating, grey if new) on the left and, on the right, the papers count — "4 papers" / "No papers" when collapsed, "Hide papers" when open.
  - **The whole card is a press target.** Documents stay hidden until it is pressed; pressing again collapses them.
  - Opened, an 8px-gap chip row appears: one 36px chip per attachment (a 6px square colour dot — brand for photo, green for voice, grey for a document — plus the label) which opens the **viewer**, and a dashed **Add** chip with a hidden file input accepting images and PDFs. Chip taps do not collapse the card.
- **Add something** — full-width primary button (54px) → the Add-to-vault sheet.

### 5.18 Attachment viewer (overlay)

Full-screen overlay above everything (z 14) on a `rgba(20,22,31,.62)` blurred scrim. Panel inset 16px left/right and 64px top/bottom, radius 20px, white, entering with `m-rise`.
- Header: title `500 14px` + meta line (`type · when`), and a 32px round ✕ on the right.
- Body scrolls on `--m-surface-2` with 18px padding, and shows one of:
  - **Photo** — the uploaded image, full width, rounded;
  - **Placeholder** — a 200px grey block with a short caption, when no file is attached;
  - **Document** — one white page block per page with an uppercase page label and grey line bars simulating text;
  - **Voice** — a white card with a 44px brand play circle, a 26-bar waveform in `--m-brand-fade`, and the transcript underneath in `400 12.5px/1.6`.

### 5.19 Add to vault (sheet)

Four steps in one sheet.
1. **Ways** — headline *serif* 26px "Add something you own", then three tall option rows (radius 14px, 1px border, hover border brand): 36px tinted icon square + label + hint —
   - **Say what you own** — "Speak, we fill the form"
   - **Type it in** — "Name and rough value"
   - **Photograph the papers** — "Deed, card, receipt"
2. **Voice** — centred title, hint, and an 88px brand mic circle; tapping toggles listening.
3. **Type** — title "Type it in", a name input ("What is it? Land plot — Bugesera"), a value input ("Roughly what is it worth? RWF"), and a wrapping row of kind chips (34px pills).
4. **Photo** — title "Photograph the papers", a 150px dashed drop area with a camera icon and the hint "Take a photo of the papers" / "Add another page" (hidden `capture="environment"` file input), then 62px thumbnails of what was shot.
5. **Review** — title, then a `--m-surface-2` panel listing Name / Kind / Worth / Papers.
Footer on every step after the first: **Back** and a primary button labelled "Next", or **Save to vault** on review.

### 5.20 Plans & musts

**Purpose:** the planning room — what is committed, what is wished for, what is expected, and what a new expense would do.

- Header: "Plans & musts" + the month on the right.
- **Free to spend card** — brand tint, radius 16px: uppercase brand label, the figure in *serif* 38px, then, under a divider, the arithmetic rows (income / musts / kept for P1 plans / free), each label left and value right.
- **What if card** — white, radius 16px:
  - uppercase label "What if";
  - two equal chips: **Spend** / **Income**;
  - an amount input (50px) with placeholder "Spend this much — then what?" (or "Get this much — then what?");
  - a 9px stacked bar showing the month split into three segments — **Musts** (`--m-ink-3`), **Kept for plans** (`--m-brand-fade`), **Free** (`--m-brand`);
  - a legend of those three colours as 8px squares with labels;
  - result rows (e.g. "Free after this", "Kept for P1", "Left at month end") with the value in the row's own colour;
  - a verdict strip (radius 11px) whose fill and text colour switch between positive tint and negative tint depending on whether the amount fits.
- **Month chips** — a horizontally scrolling row of 34px pills (bleeding to the screen edges) that filter the lists below by month.
- **Musts** — section label + "{amount} committed"; one card per must (radius 14px, 16px 17px padding, 10px apart) with the name, the "when" line, and the amount on the right. **Pressing a card reveals** an inline action row: **Make it a plan** (brand chip) and **Edit**.
- **Plan groups by priority** — a labelled section per priority (P1 / P2 / P3) with a note explaining that group's treatment; each row is a card like the musts, and pressing it reveals priority chips (P1 / P2 / P3) plus a **To must** button on the right.
- **Expected money** — section label + the total in green; one card per expected item showing name, "when · certainty", and the amount in green. Pressing reveals **Edit** and **Remove**.
- Centred hint: "Tap a row to change it".
- **Add** — full-width primary button → the Add-a-plan sheet.

### 5.21 Add a plan (sheet)

- Title *serif* 24px ("Add a plan" or "Edit" when opened from a row).
- Three equal type chips: **Must** / **Plan** / **Expected**.
- Fields, 11px apart: **name** (placeholder changes with type), **when** (date or month the item happens), **amount** ("How much, in {base}").
- If the type is a plan: a row of three priority chips (P1 / P2 / P3).
- Footer: **Cancel** and **Save**.

### 5.22 Settings

- Header: back to Dashboard; uppercase "Settings" on the right; then the display headline *serif* 31px.
- **Choice groups** — for each: an uppercase label, an optional right-hand outline CTA, and a wrapping row of option buttons (42px tall, radius 12px, `flex: 1 1 88px`), selected = brand tint + brand border + brand text.
  - **Language** — English / Türkçe / Kinyarwanda.
  - **Default currency** — the currencies in use, with a **Change** CTA. Pressing Change reveals a **search field** ("Search a currency"), the line "Replaces {code}", and a list of suggested/matching currencies as rows (symbol column, code, full name, hint on the right). Picking one replaces the current base. "No match" shows when the search finds nothing.
  - **Theme** — Light / Dark / (accent).
- **Toggle card** — one white card, radius 16px, rows separated by 1px lines, each with a label `500 14px`, a hint `400 12px`, and a switch: Hide the total; Hide balances; Face ID for the vault; Bill reminders; Weekly summary.
- Centred footer note (version/sync line).

### 5.23 Edit profile

- Header: back to Dashboard; uppercase "Profile"; headline *serif* 31px "Edit profile".
- **Avatar row** — 82px circle (photo, or initials in `500 24px` brand on brand tint) beside a stacked pair: **Change photo** (40px outlined label wrapping a hidden image file input) and **Remove photo** (muted text button).
- **Name** and **Email** fields — uppercase label above a 52px input, 14px apart.
- **Save** — full-width primary button (label switches to a confirmation state after saving).

---

## 6. Capture sheet (the app's central flow)

Opened by the tab-bar centre button and by every "Add"/"New" affordance. One sheet, many states:

| State | What it shows |
|---|---|
| **Idle** | "Add a transaction" + "Say it or type it, in any currency."; a rounded input bar (radius 15px, `--m-input`) with the ghost text "Spent 240 lira at Migros…", a 48px **camera** button and a 48px brand **mic** button; the line "One sentence files any of them." At the very bottom, below a 1px `--m-line-2` divider with 18px of padding above it: a full-width 50px outlined **Enter it manually** button (pencil icon + label, radius 13px, hover `--m-chip`) and, centred under it, the note "No internet? Fill the fields yourself — it syncs later." |
| **Manual** | See 6.1. |
| **Voice-first / Listening** | A 78–96px brand mic circle with two expanding rings, a 21-bar waveform, the uppercase brand caption "Listening" (or "Listening · release to file"), and the live transcript in *serif* 23–24px; secondary buttons **Type it** and **Scan**; **Cancel**. |
| **Typing** | The same input bar with a `1.5px` brand border, a caret after the typed sentence, a 48px send arrow, and a live parse hint: "Reading currency, category and merchant as you type". |
| **Parsing** | Three bouncing dots + "Reading that…", the heard sentence, and four shimmering skeleton bars. |
| **Camera** | "Scan a receipt" + Cancel; a 260px hatched viewfinder with four brand corner brackets and a scanning line; a caption; then a library button, a 74px brand shutter (with a white inner ring), and a flash button. |
| **Receipt read** | Merchant + "date · read at {confidence} confidence"; a bordered list of the parsed lines (dot, name, category label, amount); a "KDV included" row; a total block on `--m-surface-2` with the amount as a dashed-underline red serif button; then "Which account paid?" with account option cards. |
| **Ambiguous** | "Which account?" plus a one-line reason, and two account cards to choose from. |
| **Parsed (review)** | "Got this — look right?" + ✕. A bordered block: the amount (dashed-underline *serif* 34px, red) with an **Edit** chip; an **Account** strip of horizontally scrolling account chips with a note; detail rows (date, merchant, currency, converted); a **Category** row showing the auto-detected category as a tinted chip with an "auto" badge and a **Change** link that expands category chips. Footer: **Discard** / primary save. |
| **Split** | "Heard 'split' — splitting it" with "merchant · total · account"; the heard sentence in serif; three mode chips (**Even**, **Custom**, …); a bordered people list — 30px initial avatar, name, note, and either a fixed share or an editable amount input (92px, brand border) in custom mode; an "Add someone else" row that expands into a name field plus known-people chips; a footer strip with what is owed. Note: "Your share is the spend. The rest files as lent." |
| **Exchange** | Title + the heard sentence; route chips; one card per leg — "① from → to", the in amount and the out amount (green, both editable), and a rate/fee row; then a brand-tint summary with the spread and a note. |
| **Loan (type)** | Title, "Write it how you'd say it — amount, and where it came in."; an active input with send button; three tappable example sentences in serif. |
| **Loan payment** | "Paid back" block with the amount as an editable green serif value; detail rows; a "Where did it come in" chip row; footer note: "It posts twice — on the loan, and into the account that received it." |
| **Settle** | "Final payment" block, detail rows, a "where did it come in" chip row, a brand-tint explanation, then **Not yet** / **Settle and close**. |
| **Recurring** | "Filed as a subscription" + the heard sentence; a bordered table of parsed fields; a reminder toggle row; **All subs** / **Save subscription**. |
| **Balance correction** | "Correct the balance" + the account; a block with "Byuma has", an editable "THE BANK SAYS" amount, and a signed "Difference"; then "Where does the difference go" radio cards; an "Or just say it" hint with an examples toggle; **Cancel** / primary; a closing note that corrections stay out of spending and surface in Insights. |
| **Edit record** | "Edit this record" + origin; the amount (editable, coloured by sign) with the converted value; merchant, date (with a "change" affordance) and note rows; category chips; a "Paid from" chip strip; an "Or fix it out loud" hint; **Delete** / **Save changes**, where Delete swaps in a confirm panel. |
| **Saved** | A 62px green-tint circle with an animated drawn checkmark, a *serif* 26px confirmation title, a sub-line, then **Undo** / **Add another**. |

### 6.1 Manual entry (offline path)

**Purpose:** record a transaction with no speech recognition, no receipt reading and no network — every field is typed or picked by hand. Reached only from **Enter it manually** at the bottom of the Idle state. Opening it resets every manual field (amount, description, direction, currency, date, calendar month, and both inline add-forms), so the form is never pre-filled with a previous entry.

The sheet's own container is `max-height: 88%` with `overflow: auto` so this longer state scrolls inside the sheet.

**Header** — "Enter it manually" (`500 16px`) with the sub-line "Nothing is read or guessed. Works offline." (`400 12.5px`, `--m-ink-3`) and a 30px round ✕ close button on the right that returns to Idle (also clearing the fields).

**Direction** — two equal-width 42px buttons in a row, radius 11px: **Money out** (default) and **Money in**. The selected one fills `--m-brand` with white text; the other is `--m-surface` with a `--m-line` border.

**Field block** — one bordered container (radius 15px, `--m-line`, `overflow: hidden`) with rows divided by 1px `--m-line-2`:

1. **Amount** — background `--m-surface-2`, `cursor: text`. The label sits left; the input is right-aligned in *serif* 30px with placeholder "0" and `inputMode="decimal"`. **The whole row is a click target** — tapping anywhere in it focuses the input (implemented with a ref on the input and an `onClick` on the row).
2. **Currency** — a horizontally scrolling row of 40px chips (radius 11px), one per live base currency. The selected chip is `--m-brand-tint` fill / `--m-brand` text / `--m-brand-line` border.
3. **What for / From** — the label switches with direction ("What for" for money out, "From" for money in), as does the placeholder ("Shop or reason" / "Who paid you"). Right-aligned `500 14px` text input.
4. **Date** — a tappable row showing the label left, the formatted value right ("Today", otherwise "12 Aug 2026"), and a 15px calendar glyph. Tapping toggles the inline calendar (6.2).

**Category** — uppercase section label, then a **single-row horizontal rail** (`overflow-x: auto`, `scroll-snap-type: x proximity`, negative 22px side margins so it bleeds to both screen edges, 7px gaps). Each chip is 42px tall, radius 11px, with the 7px category dot and the name on one line (`white-space: nowrap`); the selected chip takes the category's tint plus `--m-line-strong`. The rail ends with a **dashed** "＋ New category" box of the same height. Tapping it reveals an inline row beneath the rail (`m-rise`): a 42px text field "Name it" plus a brand **Add** button. Saving appends the name to the user's own category list, selects it immediately, and closes the row; an empty name just closes it. User-added categories have no colour of their own — they render with a neutral `--m-ink-3` dot and a `--m-chip` selected fill, and every category-colour lookup must tolerate a name that is absent from the data's `categories` map.

**Account** — same rail pattern: 42px chips (radius 11px, `white-space: nowrap`), the selected one brand-tinted, ending in a dashed "＋ New account" box that opens an inline "Bank or wallet name" field plus **Add**. A newly added account is appended to the account rail *after* the real account list is built, is selected on save, and de-highlights the real accounts while it is the chosen one; picking a real account again clears the manual selection.

**Footer** — **Back** (fixed width, outlined, returns to Idle) and a primary save button that reads "Save" or, once an amount is typed, "Save {formatted amount}". Under it, centred: "Saved on this phone. It uploads next time you have internet."

**On save** the sheet goes to the shared **Saved** state, with the title "Saved by hand." and a sub-line of the form `−₺240 · Groceries · Migros · waiting to sync` (sign follows direction, the description is omitted when blank). **Add another** returns to a freshly cleared Idle.

### 6.2 Inline calendar

Opens inside the manual sheet's Date row (`m-rise`), in the app's own visual language — no native date control anywhere.

- **Month header** — a 32px outlined chevron button left, "August 2026" (`500 13.5px`) centred, a 32px chevron right. The arrows move the displayed month without changing the selection.
- **Grid** — `grid-template-columns: repeat(7, 1fr)`, 3px gaps. A weekday header row (M T W T F S S, `400 11px`, `--m-ink-3`) — **weeks start on Monday**; leading blanks are rendered as disabled transparent cells.
- **Day cells** — 36px, radius 9px. Selected: `--m-brand` fill, white text, brand border. Today (when not selected): `--m-brand-tint` fill. Future dates stay selectable but render in `--m-ink-3` to read as unusual. Choosing a day sets the date, closes the calendar and resets the browsed month.
- **Shortcuts** — a row of two equal 36px outlined buttons: **Today** and **Yesterday**.

### Numpad sheet

Opens from every dashed-underline amount. Header "AMOUNT · {currency}" + **Cancel**. The expression renders in *serif* 42px with a blinking caret bar; below it "= {result} {converted}". A 4-column grid of 56px keys (radius 14px) covers digits, decimal, operators and backspace. A final row: **Clear** (76px outlined), **=** (60px, brand tint, serif), and **Done** (primary, `flex: 1`). Footer: "Hardware keypad works too — digits, + − × ÷, ↵ to confirm".

---

## 7. Navigation map

| From | Control | To |
|---|---|---|
| Sign in | Sign in / Use Face ID | Dashboard |
| Sign in | Create an account | Create account |
| Create account | Create account | Personalise |
| Personalise | Skip / finish last step | Tour |
| Tour | Skip the tour / final CTA | Dashboard |
| Any screen | Tab: Home / Accounts / Records / Plans | Dashboard / Accounts / Transactions / Plans & musts |
| Any screen | Tab centre button | Capture sheet |
| Dashboard | Avatar | Profile menu |
| Profile menu | Edit profile / Insights / Loans / Vault / Bank fees / Settings | those screens |
| Dashboard | Account row | Account detail |
| Dashboard | Free-to-spend card | Plans & musts |
| Accounts | Add / + Add an account | New account |
| Accounts | Account row | Account detail |
| New account | Back / Cancel / Add account | Accounts |
| Account detail | Settings | Account settings |
| Account detail | See everything in the ledger | Transactions |
| Account detail | Open the loan book | Loans |
| Account settings | Back / Done | Account detail |
| Transactions | Transaction row | Capture sheet → Edit record |
| Subscriptions | Row | Subscription settings |
| Loans | Person card / closed row | Loan detail |
| Loan detail | Say a payment / Type it / Settle | Capture sheet in the matching state |
| Vault | Face ID / 6-digit passcode | Vault unlocked |
| Vault | Item card | Reveals/hides its papers |
| Vault | Paper chip | Attachment viewer |
| Vault | Add something | Add-to-vault sheet |
| Vault | Lock | Vault locked |
| Plans | Add / row press → Edit | Add-a-plan sheet |
| Capture (Idle) | Enter it manually | Manual entry state |
| Manual entry | ✕ / Back | Capture (Idle), fields cleared |
| Manual entry | Date row | Opens/closes the inline calendar |
| Manual entry | Calendar day / Today / Yesterday | Sets the date, closes the calendar |
| Manual entry | ＋ New category | Inline name field → adds and selects it |
| Manual entry | ＋ New account | Inline name field → adds and selects it |
| Manual entry | Save | Saved state ("Saved by hand.") |
| Saved | Add another | Capture (Idle), fields cleared |
| Settings | Change (default currency) | In-place currency search |
| Any sheet | Backdrop tap / Cancel / ✕ | Closes, returns to the screen behind |

---

## 8. Images, icons and logos

**There are no bitmap images or logo files in the design.** Everything is drawn as inline SVG, typography, or user-supplied uploads.

- **Logo/wordmark** — the text `BYUMA FT` set in Instrument Sans 600, uppercase, letter-spacing .15–.16em. No mark.
- **User-supplied images** — profile photo (Edit profile, shown in the avatar everywhere), vault paper photos (camera capture or file upload), vault attachments (images or PDFs). All are read locally as data URLs; there are no packaged assets.
- **Service and person avatars** — generated from the first letter of the name on a tinted square/circle; no logos are used.

**Full icon inventory** (all inline SVG, `fill: none`, `stroke: currentColor`, round caps/joins, stroke-width 1.3–1.8):

| Icon | Size | Where |
|---|---|---|
| Cellular bars, wifi arcs, battery | 17×11, 15×11, 25×12 | status bar |
| Back chevron | 8×13 | every sub-screen header |
| Face-frame (Face ID) | 17–34px | sign-in, vault lock, vault CTA |
| Microphone | 15–32px | capture, tour, vault voice, loan payment |
| Camera | 12–26px | capture, receipt scan, vault photo step, card scan |
| Plus | 12–15px | Add buttons, add-paper chip, add-person row, manual-entry New category / New account |
| Pencil | 16px | Enter it manually button |
| Calendar (rounded rect, two ticks, rule) | 15px | manual-entry Date row |
| Close ✕ | 12–13px | sheet close buttons, fee row delete |
| Search (circle + handle) | 16px | Transactions header |
| Gear | 14px | Account detail → Settings |
| Pencil | 12–15px | balance edit, amount edit |
| House | 21px | tab bar Home |
| Card/bank rectangle | 21px | tab bar Accounts |
| Three lines | 17–21px | tab bar Records, "Type it" buttons |
| Flag | 21px | tab bar Plans |
| Eye / eye-with-slash | 15px | hide-total and hide-balance toggles |
| Padlock | 13px | Vault Lock button |
| Arrow right | 18–19px | send buttons, exchange leg arrow |
| Play triangle | 16px | voice attachment |
| Image/landscape | 19px | camera library button |
| Lightning bolt | 19px | camera flash button |
| Checkmark | 28px | saved confirmation |
| Chevron down | 9px | ledger filter chips |
| Picture frame + circle | 26px | vault photo drop area |

**Charts and generated graphics** (also SVG/CSS, not assets): dashboard sparkline, account 7-month area chart, insights cumulative area chart, insights category donut, week bars, weekday correction bars, loan progress bars, abonman progress bars, the Plans "What if" stacked bar, the voice waveform, the receipt-scan viewfinder, and the document-page line placeholders.

---

## 9. Data

All content comes from `meridian-data.js`, which exports:

- **`accounts`** — eleven accounts. Fields: `id`, `bank`, `name` (purpose), `kind` (`bank | savings | wallet | cash | campus | transit | loan`), `cur`, `balance`, `last` (last-6 digits), `inNet` (false keeps it out of total money but it still keeps its own ledger), `frequent` (true = shown on the dashboard), optional `abon` (pass fare, start, end), optional `card` (last6, exp).
- **`rates`** — conversion rates between TRY, USD, RWF, and the "as of" date.
- **`transactions`** — merchant, amount, currency, account, category, date, note, direction.
- **`categories`** — name + hex dot colour.
- **`subs`** — subscriptions: name, amount, currency, cycle, day, card/account, state.
- **`loans`** — person, direction, principal, paid, currency, rate, note, start, due, payments[].
- **`vault`** — owned things: name, kind, low/high value estimate, currency, drift line, direction, `files[]` (type `photo | doc | voice`, label, meta, src/pages/transcript).
- **`tariffs`** — per bank: name, badge, rules[] (label + fee), source URL, checked date.
- **`planning`** — `musts[]`, `wants[]` (each with priority p1–p3), `expected[]`, and `keepShare` (0.7 — the share of P1 plans kept back from free-to-spend).

Currency formatting: `₺` prefix for TRY, `$` for USD, `RF ` prefix for RWF, thousands separated with commas, no decimals on display totals.

---

## 10. Behaviour notes worth implementing exactly

1. **Hide toggles** — two independent switches: hide the total (dashboard hero + accounts total) and hide balances (account rows). Both persist and swap the eye icon.
2. **Base currency** — changing it re-converts every displayed value at the stored rate; each account keeps its own native amount, and history is never rewritten.
3. **Currencies in use** — only currencies in use can be the base. A currency is swapped, not added ad hoc, from Settings → Default currency → Change.
4. **Corrections are not spending** — balance corrections never appear in the spending totals; they feed the "Record keeping" card in Insights.
5. **Splits create loans** — the user's share posts as a spend, everyone else's share posts as a small lent loan on the loan book.
6. **Loan payments post twice** — once against the loan, once into the receiving account.
7. **Vault documents are collapsed by default** and only reveal on a press of the item card; taps on a paper chip or the Add tile must not collapse the card (stop propagation).
8. **Plans rows edit on press**, not on hover — pressing a row reveals its action chips inline; a second press hides them.
9. **Face ID first** — the vault always opens on the Face ID state; the passcode keypad is only reachable through "Use passcode".
10. **Copy style** — short, direct, lowercase-friendly, no explanatory paragraphs. Forms explain themselves through labels and placeholders; a sentence is only added when the consequence isn't obvious (money moving, something being deleted, or something leaving the total).
