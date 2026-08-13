# Byuma FT — Calculation & Logic Specification

Companion to *Byuma FT — Developer Spec.md*. This document defines every number the app computes.

Anything the design does not settle is marked **[THIERRY MUST CONFIRM]** — do not guess.

**Source-of-number legend used throughout:**
- **(U)** typed by the user
- **(L)** chosen from a list / toggle by the user
- **(F)** fixed by us — a constant or seed data
- **(C)** calculated from another result

---

## 0. Foundations

### 0.1 Currency table (F)

Rates are stored as *the value of 1 unit of the currency, expressed in TRY*:

| Code | Symbol | Name | Rate (TRY per 1 unit) | Display decimals |
|---|---|---|---|---|
| TRY | `₺` | Turkish lira | 1 | 2 |
| USD | `$` | US dollar | 47.10 | 2 |
| RWF | `RF ` | Rwandan franc | 0.032937 | 0 |

Snapshot timestamp `rateAsOf = "24 Jul 2026, 09:15"` (F). Rates are a **daily snapshot**, never live — every screen that shows a converted figure also shows "Rates as of {rateAsOf}".

Currencies added later (Settings → Change) bring their own `rate` (TRY per unit), `symbol` and `name` from the currency catalogue (F). Display decimals for an added currency: **[THIERRY MUST CONFIRM — the design only defines 0 dp for RWF and 2 dp for everything else]**.

### 0.2 Conversion — the only conversion formula in the app

```
converted = amount × rate[from] ÷ rate[to]
```

**In words:** take the amount, multiply it by how many lira one unit of its own currency is worth, then divide by how many lira one unit of the target currency is worth.

- `amount` — **(F/U)** the account balance, transaction amount, plan amount, etc.
- `rate[from]`, `rate[to]` — **(F)** from the table above.
- Result unit: the target currency.

**No rounding happens at conversion time.** Full floating-point precision is carried through every intermediate step; rounding happens **only at display**, per §0.3. This matters: a sum of converted values must be computed from unrounded values and rounded once at the end.

Worked examples:

| Inputs | Arithmetic | Result (unrounded) | Shown as |
|---|---|---|---|
| 2,480.15 USD → TRY | 2480.15 × 47.10 ÷ 1 | 116,815.065 | `₺116,815.07` |
| 1,860,000 RWF → TRY | 1860000 × 0.032937 ÷ 1 | 61,262.82 | `₺61,262.82` |
| 84,260.40 TRY → RWF | 84260.4 × 1 ÷ 0.032937 | 2,558,229.166… | `RF 2,558,229` |

### 0.3 Display formatting and rounding

```
shown = sign + symbol[cur] + |value| formatted with exactly d decimal places, comma thousands separators
```

- `d` = 0 for RWF, 2 for TRY and USD, **unless the call site passes an explicit override** (see the list below).
- Rounding mode: **round half away from zero to `d` places** (JavaScript's `toLocaleString` behaviour — 0.5 rounds up in magnitude). Applied once, at render.
- Negative values render with the typographic minus `−` (U+2212) **before** the symbol: `−₺243.75`.
- `signed()` adds a `+` for values > 0; zero gets no sign.

Explicit decimal overrides in the design:

| Where | Decimals |
|---|---|
| Every Plans & musts figure (free to spend, musts, keep, expected, What-if rows) | **0** |
| Exchange spread difference amount | **0** |
| Everywhere else | 0 for RWF, 2 for TRY/USD |

**Compact form** (used only inside the Vault and other "short" labels):

```
|v| ≥ 1,000,000 → symbol + (v ÷ 1,000,000) to 1 dp if ≥ 10M else 2 dp, + "M"
|v| ≥ 1,000     → symbol + round(v ÷ 1,000) + "K"        (round half away from zero)
otherwise       → symbol + round(v)
```

Examples: `18,500,000 RWF → "RF 18.50M"`; `1,860,000 → "RF 1.86M"`; `420,500 → "RF 421K"`; `62 → "RF 62"`.

### 0.4 Rate line

```
r = rate[from] ÷ rate[to]
shown = "1 {from} = {r} {to}"
```
`r` is printed to **5 decimals if r < 0.01**, **4 decimals if r < 1**, otherwise **2 decimals** — all round-half-away-from-zero.

Examples: USD→TRY `1 USD = 47.10 TRY`; TRY→RWF `1 TRY = 30.3608 RWF`; RWF→TRY `1 RWF = 0.0329 TRY` **(0.032937 < 1, so 4 dp)**.

### 0.5 Zero, empty, negative, and very large values — global rules

| Case | Behaviour |
|---|---|
| Empty numeric input | Treated as `0`. No error message is shown anywhere in the design. |
| Non-digit characters typed into an amount field | Stripped on input: `value.replace(/[^0-9]/g, "")`. Amount fields therefore accept **integers only** — no decimal point, no minus sign. |
| Zero amount | Renders normally (`₺0.00`); the What-if verdict switches to its prompt state (§4.3). |
| Negative results | Allowed only where a sign is meaningful (transaction amounts, balance deltas, total money, exchange spread). Free-to-spend, kept-for-plans and after-musts are floored at 0 (§4). |
| Division by zero | Only possible in loan % (principal 0) and category % (sum 0). **[THIERRY MUST CONFIRM — the design has no guard; recommend showing "—" instead of NaN]** |
| Very large numbers | No cap in the design. Display uses comma grouping; the compact form (§0.3) keeps Vault figures short. **[THIERRY MUST CONFIRM — upper input limit and what happens beyond it]** |
| Error messages | **The design contains no validation error messages anywhere.** Invalid input is prevented at the keystroke, not reported. **[THIERRY MUST CONFIRM if any errors are wanted]** |

---

## 1. Total money (Dashboard, Accounts)

### 1.1 Loan book balance (a derived account)

```
loanNet = Σ over all loans of  convert( (principal − paid) × s , loan.currency , TRY )
          where s = +1 if the loan is "lent", −1 if it is "borrowed"
```

**In words:** for each loan, take what is still outstanding; count it positive if someone owes you, negative if you owe it; convert each to lira and add them up.

- `principal`, `paid`, `kind`, `cur` — **(F)** loan record.
- Result unit: TRY (the loan book account's own currency). Unrounded.

Worked examples (using the seeded loans):

| Loan | outstanding | sign | in TRY |
|---|---|---|---|
| Ahmet Yıldız, lent, ₺15,000 principal, ₺5,000 paid | 10,000 TRY | + | +10,000.00 |
| Claudine M., lent, RF 900,000 principal, RF 150,000 paid | 750,000 RWF | + | +24,702.75 |
| Ziraat kredisi, borrowed, ₺67,200 principal, ₺16,800 paid | 50,400 TRY | − | −50,400.00 |
| **loanNet** | | | **−15,697.25 TRY** |

### 1.2 Total money

```
total = Σ over accounts where countsInTotal(a) of  convert( balanceOf(a) , a.currency , base )

balanceOf(a)     = loanNet          if a is the loan book
                 = a.bal            otherwise
countsInTotal(a) = the account's "Count in total money" toggle (defaults to the seeded inNet flag)
```

**In words:** convert every included account's balance into the base currency and add them together. The loan book contributes what people owe you minus what you owe.

- `a.bal` — **(F)** seed, or **(U)** after a balance correction.
- `countsInTotal` — **(L)** per-account toggle; also the Vault's "Count in total money" toggle adds the vault mid-estimate **[THIERRY MUST CONFIRM — the vault toggle exists but the design never adds the vault range into `total`; confirm whether it should, and whether it uses the low, mid or high estimate]**.
- `base` — **(L)** TRY / USD / RWF selector.
- Rounding: none until display; displayed with the base currency's decimals (2 for TRY/USD, 0 for RWF).

Worked examples with the seeded accounts (base TRY):

1. Base **TRY** → `total = 84,260.40 + 142,500 + 3,200 + (2,480.15 × 47.10) + (1,150 × 47.10) + (1,860,000 × 0.032937) + (420,500 × 0.032937) + (85,000 × 0.032937) + (−15,697.25)` = **₺464,536.94**. (Yemekhane ₺386.50 and EGO ₺62.00 are excluded — `inNet: false`.)
2. Same set, base **USD** → divide the TRY total by 47.10 → **$9,862.78**.
3. Same set, base **RWF** → divide by 0.032937 → **RF 14,103,527**.

Excluded-accounts note: `"{names} excluded"` when any account has the toggle off, otherwise `"All counted"` — a text join, no arithmetic.

### 1.3 Currency group subtotal (Accounts screen)

```
groupSubtotal      = Σ of a.bal for accounts in that currency        (native currency, all accounts in the group)
groupSubtotalBase  = convert(groupSubtotal, groupCurrency, base)
```
Excluded accounts **[THIERRY MUST CONFIRM — whether an account with the toggle off should still appear in its currency subtotal; the design shows all rows in the group]**.

---

## 2. Account detail

### 2.1 Converted balance line

`convert(a.bal, a.cur, base)` — §0.2. Hidden as `••••` when "Hide balances" is on.

### 2.2 Seven-month trend

Each account carries seven monthly closing balances as **shares of today's balance** (F, `trend[]`):

```
monthValue[i] = a.bal × trend[i]
delta         = monthValue[6] − monthValue[0]
trendPercent  = round( |delta ÷ (monthValue[0] or 1)| × 100 )     → nearest whole percent
label         = (delta ≥ 0 ? "+" : "−") + trendPercent + "% since January"
```
Colour: green when `delta ≥ 0`, red otherwise. `Math.round` = round half up.

The chart path maps values into a 300 × 94 viewBox: **[THIERRY MUST CONFIRM — the exact y-scaling of the sparkline is presentational; specify min/max padding if the real data range differs]**.

Examples: start 0.62 × 84,260.40 = 52,241.4, end 84,260.40 → delta +32,019 → `+61% since January`. Start 100,000, end 90,000 → `−10% since January`. Start 0, end 5,000 → divide-by-zero guard makes the denominator 1 → `+500000%` **[THIERRY MUST CONFIRM — cap or suppress the percentage when the starting value is 0]**.

### 2.3 Balance correction

```
delta = bankSays − byumaHas
```
- `byumaHas` — **(C)** the account's current balance.
- `bankSays` — **(U)** typed on the numpad.
- Sign drives the colour (green positive, red negative) and the wording of the follow-up question.
- Rounding: display only, account currency decimals.
- The correction **never enters spending totals**; it is recorded as a keeping-drift entry (§6.4).

Examples: 84,260.40 → 84,015.65 gives `−₺244.75`. 420,500 → 420,500 gives `RF 0` and the follow-up question is hidden. 2,480.15 → 2,600.00 gives `+$119.85`.

### 2.4 Abonman (transit pass) progress

```
elapsed  = daysTotal − daysLeft
percent  = round( elapsed ÷ daysTotal × 100 )        → nearest whole percent, rendered as the bar width
```
`daysTotal`, `daysLeft` — **(F)** from the pass record (31 and 19 in the seed → `39%`).
Special cases: `daysLeft = 0` → 100%; `daysLeft > daysTotal` → **[THIERRY MUST CONFIRM — clamp to 0% is recommended]**.

---

## 3. Loans

### 3.1 Outstanding and progress

```
remaining = principal − paid
percent   = round( paid ÷ principal × 100 )       → nearest whole percent
```
Both `principal` and `paid` are in the loan's own currency (F/U). The progress bar width is `percent`.

Examples: 15,000 / 5,000 paid → remaining ₺10,000, `33%`. 900,000 / 150,000 → RF 750,000, `17%`. 67,200 / 16,800 → ₺50,400, `25%`.

### 3.2 Interest

The design **states** interest but never compounds it:

```
rateLabel = rate = 0 ? "No interest" : rate + "% a year"
```
`rate` — **(F)** per loan, percent per year, simple. **[THIERRY MUST CONFIRM — whether interest should actually accrue into `remaining`, and on what day-count basis; today it is display-only.]**

### 3.3 Summary cards

```
owedToYou = Σ convert(principal − paid, cur, base) over loans where kind = "lent"
youOwe    = Σ convert(principal − paid, cur, base) over loans where kind = "borrowed"
```
Both shown positive, in their own colour (green / red). Note `loanNet = owedToYou − youOwe` (§1.1).

### 3.4 Recording a repayment

```
newPaid      = paid + payment
newRemaining = principal − newPaid
lpSub        = "max(0, remaining − payment) would be left of {principal}"
```
- `payment` — **(U)** typed/edited on the numpad, default = the loan's `nextAmt` (F).
- The `max(0, …)` floor means an overpayment shows "0 would be left", it does not show a negative. **[THIERRY MUST CONFIRM — what happens to an overpayment: refuse it, cap it, or record the excess as a new loan in the other direction.]**
- One payment posts **twice**: against the loan, and as an inbound record on the receiving account (chosen from the "Where did it come in" chips, **(L)**).

Examples: remaining ₺10,000, payment ₺5,000 → `₺5,000 would be left of ₺15,000`. Remaining RF 750,000, payment RF 750,000 → `RF 0 would be left`. Remaining ₺10,000, payment ₺12,000 → `₺0 would be left` (excess unhandled — see confirm above).

### 3.5 Settle and close

Final payment defaults to the full remaining balance; on save the loan moves to **Closed** with the close date. **[THIERRY MUST CONFIRM — whether "forgiven" (closing with a non-zero remaining) writes the shortfall off as a spend, or simply closes.]**

---

## 4. Plans & musts

Constants: `keepShare = 0.7` **(F)**. Every plan/must/expected amount is stored in its own currency and converted with §0.2 into the base before any arithmetic:

```
inBase(x) = convert(x.amt, x.cur, base)
```

### 4.1 The core budget chain

```
mustsTotal = Σ inBase(x) for items typed "must"
p1Total    = Σ inBase(x) for items typed "want" with priority = 1
expected   = Σ inBase(x) for items typed "expected"

available  = max(0, totalMoney − mustsTotal)
keep       = min(available, round(p1Total × keepShare))
free       = max(0, available − keep)
```

**In words:** start from total money; take out everything you have committed (musts) — that is what is *available*; hold back 70% of your priority-1 plans, but never more than is available — that is *kept*; what is left is *free to spend*. Expected money is displayed but is **never added in**.

- `totalMoney` — **(C)** §1.2, in base currency.
- `x.type` — **(F)** seed, or **(L)** after the user swaps a row between must and plan.
- `x.p` (priority) — **(F)** seed, or **(L)** via the P1/P2/P3 chips. Default when unset: **2**.
- `keepShare` — **(F)** 0.7.
- `round()` on the keep line is **round half up to the nearest whole unit of the base currency**; every other line stays unrounded until display.
- **P2 and P3 plans have no effect on any of these numbers.** They are wishes.
- All four figures display with **0 decimals**.

Worked examples (base TRY, totalMoney = 464,537; musts = rent 28,500 + tuition 18,400 + family 12,000 + subs 1,180 = 60,080; P1 = MacBook $1,200 + flight $900 = 2,100 × 47.10 = 98,910):

1. **As seeded:** available = 464,537 − 60,080 = 404,457. keep = min(404,457, round(98,910 × 0.7) = 69,237) = 69,237. free = 404,457 − 69,237 = **₺335,220**.
2. **Poor month** — totalMoney = 70,000: available = 9,920. keep = min(9,920, 69,237) = 9,920. free = **₺0**.
3. **Musts exceed total** — totalMoney = 50,000: available = max(0, −10,080) = 0. keep = 0. free = **₺0**. (Nothing goes negative; the shortfall is not surfaced — **[THIERRY MUST CONFIRM — should the app say "musts exceed your money by ₺10,080"?]**)

### 4.2 Section totals and month filter

The month chips filter the lists (not the budget chain). A row's month is the first three-letter month name found in its `when` text; rows with no date are shown under every filter.

```
mustsShownTotal    = Σ inBase(x) over musts passing the filter
expectedShownTotal = Σ inBase(x) over expected passing the filter
```
The headline free-to-spend is always computed from **all** items, never the filtered subset.

**[THIERRY MUST CONFIRM — whether the budget chain should also respect the month filter; today it does not.]**

### 4.3 "What if" simulator

```
delta      = (mode = "spend") ? −amount : +amount
wfFree     = free + delta
wfKeepLeft = wfFree ≥ 0 ? keep : max(0, keep + wfFree)
wfAvail    = max(0, available + delta)
```

**In words:** apply the amount to free-to-spend. If that pushes free below zero, the overflow eats into the money kept for P1 plans; if it eats past that too, the plan no longer fits at all.

- `amount` — **(U)**, digits only, empty = 0, always in the **base currency**.
- `mode` — **(L)** Spend / Income.
- All three rows display with 0 decimals; `wfFree` is displayed as `max(0, wfFree)` (never negative) but is coloured red when the true value is negative.

Bar segment widths:

```
span     = max(1, mustsTotal + keep + max(0, wfFree))
mustsW   = mustsTotal ÷ span × 100 %
keepW    = wfKeepLeft ÷ span × 100 %
freeW    = max(0, wfFree) ÷ span × 100 %
```
Percentages are **not rounded** — they go straight into the CSS width.

Verdict text and colour:

| Condition | Text | Tone |
|---|---|---|
| `amount = 0` | "Type an amount to see where it leaves you." | green tint |
| mode = income | "Adds {amount} to what is free." | green tint |
| `wfFree ≥ 0` | "Fits. {wfFree} still free." | green tint |
| `wfFree < 0` but `available + delta ≥ 0` | "Takes {−wfFree} out of your P1 plans." | brand tint |
| otherwise | "More than you have after musts." | red tint |

Worked examples (from the seeded state: free = 335,220, keep = 69,237, musts = 60,080, available = 404,457):

1. **Spend 100,000** → wfFree = 235,220 ≥ 0 → rows: free 235,220 / kept 69,237 / after musts 304,457. Verdict *"Fits. ₺235,220 still free."*
2. **Spend 380,000** → wfFree = −44,780 → kept = max(0, 69,237 − 44,780) = 24,457; after musts = 24,457. Free displays ₺0 in red. Verdict *"Takes ₺44,780 out of your P1 plans."*
3. **Spend 450,000** → wfFree = −114,780; available + delta = −45,543 < 0 → kept = 0, after musts = 0. Verdict *"More than you have after musts."*
4. **Income 25,000** → wfFree = 360,220. Verdict *"Adds ₺25,000 to what is free."*

### 4.4 Editing a row

Opening a row for editing pre-fills the amount as `round(inBase(x))` — the value **converted into the base currency and rounded half-up to a whole unit**. Saving therefore stores the amount in the base currency, not the original one. **[THIERRY MUST CONFIRM — whether editing a USD plan while the base is TRY should convert it permanently, or keep it in USD.]**

---

## 5. Splitting a bill

```
n         = number of people on the split (including the user)
perHead   = total ÷ n                                   (exact, unrounded)
share[i]  = perHead                                       in "Even" mode
          = the amount typed for that person              in "Custom" mode (digits only, empty = 0)
owed      = Σ share[i] over people not marked settled
```

**In words:** split the bill evenly by default; in custom mode each person's amount is typed. Whatever the others owe is filed as small lent loans; your own share stays as the spend.

- `total`, `people[]`, `settled` — **(F)** from the parsed sentence.
- Custom fields pre-fill with `round(perHead)` (half up, whole units).
- The "Add someone else" row previews the recalculation as `total ÷ (n + 1)`.
- Display: split amounts use the transaction's own currency and its normal decimals.

Worked examples (₺1,240 at Kebapçı Halil, 4 people):

1. **Even, nobody settled** → perHead = ₺310.00 each; owed (3 others) = **₺930.00**.
2. **Even, one person already settled** → owed = **₺620.00**.
3. **Custom** — you 400, Emre 300, Zeynep 300, Deniz 240 → owed = 300 + 300 + 240 = **₺840.00**. Note the custom amounts are **not validated against the total** — they may sum to more or less than ₺1,240. **[THIERRY MUST CONFIRM — should custom shares be forced to sum to the total, and what is shown when they do not?]**
4. **Add a 5th person** → preview reads "splits ₺248.00 each".

---

## 6. Exchanges and transfers

### 6.1 One leg

```
net = (fee is charged in the incoming currency) ? amount − fee : amount
out = net × rate
out = out − fee            only if the fee is charged in the outgoing currency and the currencies differ
```

**In words:** if the fee comes out of what you send, subtract it before converting; convert at the rate you actually got; if the fee is charged on the far side instead, subtract it after converting.

- `amount` — **(F)** parsed, **(U)** editable on the first leg only.
- `rate` — **(F)** parsed, **(U)** editable on the first leg only (and only when it is not a same-currency transfer, `rate = 1`).
- `fee`, `feeCur` — **(F)** from the leg / the bank's fee table.
- Unrounded through the chain; each leg's `out` becomes the next leg's `amount`.

### 6.2 Multi-leg chain

```
amount[0]   = user amount
out[i]      = leg formula above
amount[i+1] = out[i]
finalOut    = out[last]
```

### 6.3 Spread against the market

```
marketOut = convert(amount[0], firstLegCurrency, lastLegOutCurrency)
spreadPct = (finalOut ÷ marketOut − 1) × 100
spreadTxt = (spreadPct ≥ 0 ? "+" : "−") + |spreadPct| to exactly 2 decimals
            + " · " + format(finalOut − marketOut, lastOutCurrency, 0 decimals)
```
Green when `spreadPct ≥ 0` (you beat the snapshot rate), red when negative. `marketOut = 0` → **[THIERRY MUST CONFIRM — cannot happen with the seeded rates; guard needed if a rate can be 0.]**

Worked examples:

1. **$100 cash → lira at 47.40, no fee.** net = 100, out = 4,740.00 TRY. market = 100 × 47.10 = 4,710.00. spread = (4740 ÷ 4710 − 1) × 100 = **+0.64% · ₺30**.
2. **₺8,000 Garanti → Ziraat, same currency, ₺7.50 EFT fee.** net = 8,000 − 7.50 = 7,992.50; rate 1 → out = **₺7,992.50**. market = 8,000 → spread = **−0.09% · −₺8**.
3. **RF 1,500,000 → USD → TRY.** Leg 1: fee RF 1,200 in the incoming currency → net 1,498,800 × 0.000679 = **$1,017.68**. Leg 2: fee $4.69 incoming → net 1,012.99 × 47.10 = **₺47,711.83**. market = 1,500,000 × 0.032937 ÷ 1 = ₺49,405.50 → spread = **−3.43% · −₺1,694**.

### 6.4 Bank fees on file

Fees are stored as free text per rule (label + fee string) and are **not parsed into arithmetic** in this design — the "Last transfer" card shows a pre-computed sent / fee / landed triple:

```
landed = sent − fee
```
with all three in the same currency. **[THIERRY MUST CONFIRM — whether fee rules should be machine-readable (flat amount, percentage, min/max, band) so transfers can be predicted automatically; today they are display text the user edits.]**

---

## 7. Spending, insights and record keeping

### 7.1 Category share

```
sum     = Σ v over all categories in the month
percent = round( v ÷ sum × 1000 ) ÷ 10          → one decimal place, half up
```
Displayed as e.g. `41.2%`. Percentages are computed independently and therefore **may not sum to exactly 100.0%** — do not force them to.

Examples (sum 35,502): Housing 14,600 → **41.1%**; Groceries 5,240 → **14.8%**; Transport 1,180 → **3.3%**.

### 7.2 Donut arcs

Each category arc uses the same `percent`, converted to a stroke-dasharray on a circle of radius 16 (circumference ≈ 100.53), with each arc's offset being the running total of the previous arcs. Presentational; no rounding rule needed beyond §7.1.

### 7.3 Bar charts

```
barHeight = max(floor, round( value ÷ maxValue × fullHeight ))
```
- Week bars: `fullHeight = 40px`, `floor = 5px`.
- Keeping (weekday drift) bars: `fullHeight = 48px`, `floor = 4px`.
- `maxValue` = the largest value in that series. If every value is 0 the division is undefined → **[THIERRY MUST CONFIRM — render all bars at the floor height.]**

### 7.4 Month over month

```
change = thisMonthTotal ÷ lastMonthTotal − 1        expressed as a percentage
```
Bar widths are the two totals scaled against the larger of the pair (the larger bar is 100%).

Examples: July 35,502 vs June 33,900 → **+4.7%**, June bar 95.5%, July bar 100%. July 30,000 vs June 40,000 → −25%, July bar 75%. Last month 0 → **[THIERRY MUST CONFIRM]**.

### 7.5 Record-keeping drift

```
driftPercent(month) = Σ|correction amounts in the month| ÷ Σ|recorded amounts in the month| × 100
```
**[THIERRY MUST CONFIRM — the design ships the drift percentages as seed data (`keeping.driftPct`); this formula is the intended definition but has never been implemented. Confirm the numerator (absolute corrections) and the denominator (all recorded movement, or spending only).]**

Corrections are excluded from every spending total — they only appear here.

---

## 8. Receipt scanning

```
confidencePercent = round( confidence × 100 )        → nearest whole percent
lineTotal         = Σ line amounts
```
- `confidence` — **(F)** 0–1 from the vision model.
- The displayed **Total** is the model's stated total, which the user can overwrite on the numpad. The design does **not** check that the lines sum to the total. **[THIERRY MUST CONFIRM — should a mismatch between Σ lines and the stated total be flagged?]**
- VAT (`KDV included`) is displayed as read; it is **not** deducted from anything.

Examples: confidence 0.94 → `94%`; 0.5 → `50%`; 0.996 → `100%`.

---

## 9. The numpad (arithmetic entry)

The numpad accepts a small expression and evaluates it:

```
result = n₀ ± n₁ ± n₂ …          evaluated strictly left to right
result = round(result × 100) ÷ 100        → 2 decimal places, half away from zero
```

- Operators available: `+` and `−` (and `×` `÷` on the keypad face — **[THIERRY MUST CONFIRM: the key faces show × and ÷ but the evaluator implements only + and −; either implement them with normal precedence or remove the keys]**).
- **There is no operator precedence** in the current implementation: `100 + 20 × 3` would not be evaluated as 160.
- Empty expression → 0.
- The converted line underneath shows `convert(result, fieldCurrency, base)`.
- On **Done**, the rounded result is written back into whichever field opened the pad (amount, bank-says balance, exchange amount/rate/out, loan payment, plan amount).

Examples: `240 + 3.75` → **243.75**. `1000 − 250 − 125` → **625.00**. `33.333 + 33.333 + 33.333` → 99.999 → **100.00**.

---

## 10. Vault

```
totalLow  = Σ item.low   (all items)
totalHigh = Σ item.high
rangeText = compact(totalLow) + " – " + compact(totalHigh)
count     = number of items + " things"
```
All vault values are stored in **RWF** and shown in the compact form of §0.3 — the vault does **not** follow the base-currency selector. **[THIERRY MUST CONFIRM — whether the vault should convert into the base currency like everything else.]**

New item created by typing a value `v` **(U)**:

```
low = round(v × 0.9)      mid = v      high = round(v × 1.1)
```
(round half up, whole francs). A ±10% band around what the user said it is worth.

Examples: v = 18,000,000 → `RF 16.20M – RF 19.80M`. v = 4,500,000 → `RF 4.05M – RF 4.95M`. v = 0 → `RF 0 – RF 0` (allowed; the review step shows "You can add this later").

Whether the vault range is added into Total money when its toggle is on: see §1.2 **[THIERRY MUST CONFIRM]**.

---

## 11. Subscriptions

```
monthlyCommitment = Σ convert( normalisedMonthly(s) , s.cur , base )

normalisedMonthly(s) = s.amt              if cycle = monthly
                     = s.amt ÷ 12         if cycle = yearly
                     = s.amt × 52 ÷ 12    if cycle = weekly
```
**[THIERRY MUST CONFIRM — the design ships a pre-computed "Committed each month" figure; the normalisation above is the intended rule but the divisor for weekly (52/12 = 4.333…) has never been agreed.]**

Coverage check on the "Paid from" list:

```
covers = accountBalance − chargeAmount ≥ accountFloor
```
- `accountFloor` — **(F/U)** e.g. the RF 400,000 floor on Equity Savings. **[THIERRY MUST CONFIRM — where the floor is set; there is no UI for editing it in this design.]**
- Green note when it covers, red when it does not; the warning card names the shortfall.

Next charge date: the subscription's `day` in the current month if that day has not passed, otherwise the same day next month; a day greater than the length of the month clamps to the last day **[THIERRY MUST CONFIRM — clamping vs skipping for the 29th–31st.]**

Examples (base TRY): Netflix ₺229.99 monthly → 229.99. Linear $14 monthly → 14 × 47.10 = ₺659.40. Domain $18/year → 18 ÷ 12 × 47.10 = **₺70.65/month**.

---

## 12. Order of operations across the app

To keep every screen agreeing with every other, compute in this order:

1. **Rates** loaded (§0.1).
2. **loanNet** from all loans (§1.1).
3. **Account balances**, with corrections applied (§2.3).
4. **Total money** in the base currency (§1.2).
5. **Plans chain** — musts, P1, available, keep, free (§4.1).
6. **What-if** overlay on top of the plans chain (§4.3) — never written back into stored state.
7. **Display formatting** last, once per figure (§0.3).

A figure must never be computed from an already-rounded figure. The only intentional exceptions — where a rounded value feeds the next step — are:
- `keep = min(available, round(p1Total × 0.7))` (§4.1),
- the numpad result written back into a field (§9),
- the vault ±10% band (§10),
- pre-filled edit values (§4.4, §5).

---

## 13. Open confirmations, collected

1. Display decimals for currencies added after setup (§0.1).
2. Upper input limit and behaviour beyond it (§0.5).
3. Whether any validation error messages exist at all (§0.5).
4. Whether the Vault total joins Total money, and at which estimate (§1.2, §10).
5. Whether excluded accounts still count in their currency subtotal (§1.3).
6. Sparkline y-scaling, and the trend percentage when the first month is 0 (§2.2).
7. Abonman clamping when days left exceeds the term (§2.4).
8. Whether loan interest accrues, and on what basis (§3.2).
9. Overpayment handling on a loan (§3.4) and what "forgiven" writes off (§3.5).
10. Whether the budget chain respects the month filter (§4.2).
11. Whether musts exceeding total money should be surfaced (§4.1).
12. Whether editing a plan converts it permanently into the base currency (§4.4).
13. Whether custom split shares must sum to the bill total (§5).
14. Whether bank fee rules should be machine-readable and used to predict transfers (§6.4).
15. Definition of record-keeping drift (§7.5).
16. Whether a receipt's line sum should be checked against its stated total (§8).
17. Multiplication and division on the numpad, and operator precedence (§9).
18. Subscription cycle normalisation, the account floor's origin, and month-end date clamping (§11).
19. Division-by-zero guards: loan percent with principal 0, category percent with sum 0, month-over-month with a zero previous month, empty bar-chart series (§0.5, §3.1, §7.1, §7.3, §7.4).
