# Building Meridian for real

A practical route from these screens to a shipped app. Written for one developer (you), shipping to yourself first.

## 1. Stack

- **App:** React Native + Expo. One codebase for iOS/Android, `expo-camera` for the scan, `expo-notifications` for reminders, `expo-secure-store` for tokens. The desktop view is a separate React web app later — don't start there.
- **Backend:** Supabase (Postgres + auth + storage + edge functions) or your own Node/Postgres. You need a server for three things only: FX rates, the OCR/parse call, and scheduled reminders. Everything else can be local-first.
- **Local-first data:** SQLite (Drizzle or WatermelonDB) as the source of truth on device, syncing to Postgres. Money app that works on a plane, in a tunnel, and in Kigali on bad data — that matters more than realtime.
- **Money:** store integer minor units (`amount_minor BIGINT`) plus `currency CHAR(3)`. Never floats. Format at the edge — the `fmt`/`convert` helpers in `meridian-data.js` are already the shape of that module.

## 2. Data model (the whole thing)

```
users(id, name, email, base_currency, dark_mode, momo_floor_minor)
accounts(id, user_id, bank, name, currency, balance_minor, mask, kind)   -- kind: bank|card|cash|wallet
categories(id, user_id, name, dot_hex, is_system)
transactions(id, user_id, account_id, category_id, merchant, note,
             amount_minor, currency, occurred_at, kind,                  -- spend|income|transfer|fee
             source, confidence, parent_id, receipt_id, external_id)     -- source: manual|voice|scan|import
receipts(id, user_id, image_path, merchant, occurred_at, total_minor,
         currency, vat_minor, raw_json, confidence)
receipt_lines(id, receipt_id, name, amount_minor, category_id, sure)
subscriptions(id, user_id, name, account_id, card_mask, category_id,
              amount_minor, currency, cycle, next_charge_on, remind, active)
loans(id, user_id, direction, counterparty, note, principal_minor, currency,
      annual_rate_bp, simple, started_on, due_on)                        -- direction: lent|borrowed
loan_payments(id, loan_id, amount_minor, paid_on, transaction_id)
tariffs(id, bank_key, currency, label, rule_json, source_url,
        fetched_at, verified_by_user_at)
fx_rates(day, currency, rate_to_try)
```

Two decisions that save you pain later:

- **Fees are transactions**, `kind='fee'`, with `parent_id` pointing at the transfer. Never a column on the transfer. That's what makes "split out" in the Bank fees screen a query, not a special case.
- **A receipt line is not a transaction.** Keep the receipt whole and post one transaction for the total (optionally split per category). Re-categorising a line then never rewrites history.

## 3. Receipt scanning

Skip classic OCR. Send the photo straight to a vision model with a strict JSON schema:

1. `expo-camera` → compress to ~1600px JPEG (quality 0.7) → upload to storage.
2. Edge function calls Claude (or GPT-4-class vision) with the image and a schema: `{merchant, address, occurred_at, currency, lines:[{name, amount, category, confidence}], vat, total, confidence}`. Give it your category list in the prompt so it can only choose from yours.
3. Validate server-side: do the lines plus VAT reconcile to the total? If not, trust the **total** (it's the biggest, clearest number) and mark lines `sure=false`.
4. Return it, show the parse panel, let the user fix. Store `raw_json` — you'll want it when you tune the prompt.

Rules that keep it honest: never auto-save a scan (always a confirm step), show the confidence, and **ask for the account** when the receipt doesn't name a card — a receipt almost never does. Cost is ~$0.005–0.02 per receipt; cache by image hash so a re-scan is free.

## 4. Voice and text capture

- Voice → text: on-device speech (`expo-speech-recognition` / iOS `SFSpeechRecognizer`) so audio never leaves the phone; fall back to Whisper API when the locale isn't supported. Turkish and Kinyarwanda-mixed input is the hard case — test with real sentences early.
- Text → structured: one LLM call with the same JSON-schema discipline, plus a fast local path for the obvious forms (`240 migros`, `-240 try groceries`). The local path handles most entries at zero cost and zero latency.
- The parse must return an **intent**: `transaction | subscription | loan | transfer`. That single field is what lets "Linear fourteen dollars a month on the Wise card" become a subscription instead of a spend.
- Always show what it heard and what it inferred, and never block on the network — queue the raw text, parse when connected.

## 5. Bank fees (the tariff problem)

This is the part where enthusiasm meets reality: **bank tariff pages are not an API.** They're HTML that changes, PDFs, sometimes login-walled. Do not build a scraper you trust.

Build it as a *fee library with provenance*:

1. `tariffs` rows hold a machine-readable rule: `{"type":"flat","amount":750}`, `{"type":"pct","bp":43,"plus":31}`, `{"type":"tiered","tiers":[...]}`, plus `min`/`max`/`cap`.
2. A weekly job fetches `source_url`, extracts candidate numbers (LLM with the old rule as context: "did any of these change?"), and writes a **proposal** — never the live rule.
3. The user sees "Garanti's EFT fee looks like ₺7.90 now, was ₺7.50 — confirm?" Confirmation sets `verified_by_user_at`. That's the badge on the Bank fees screen.
4. Independently, **learn from reality**: when a transfer of ₺1,000 leaves the account as ₺1,007.50, the difference is a fee. Propose the rule from observed deltas. This is more reliable than any scrape and it's free.
5. Seed the first version by hand for the 4–6 banks you actually use. Ship that. Automate later.

If you want proper balances without manual entry, the aggregator route differs by market: open banking APIs and licensed aggregators in the EU/UK/US; in Turkey, BDDK-licensed open-banking providers; in Rwanda, MTN MoMo / Airtel Money APIs and bank SMS parsing. SMS parsing (Android only) is the cheap, ugly, effective start.

## 6. Subscriptions and reminders

- Store `next_charge_on` and roll it forward on confirmation, not on a cron guess.
- A day before: server-side scheduled job (Supabase cron → edge function → push) so it fires with the app closed. Local notifications alone die when the OS evicts them.
- The cover check: `projected_balance(account, date) = balance − sum(scheduled outflows before date)`. Warn on two thresholds — "won't clear" and "clears but breaks your floor" (that `momo_floor_minor` on the user). The second one is the useful one.
- Detect unrecorded subscriptions: same merchant, similar amount, 28–31 day gaps, ≥3 occurrences → offer to file it.

## 7. Loans

- Simple interest by default: `owed = principal × (1 + rate × days/365) − repaid`. Compounding is a switch you probably never turn on.
- Every repayment is both a `loan_payments` row and a `transactions` row — link them, so the ledger and the loan agree.
- Reminders reuse the subscription job.
- Nice, cheap features: a shareable summary of a loan (WhatsApp text), and a nudge that drafts the message for you.

## 8. Build order

1. Accounts, manual transactions, multi-currency, FX snapshot. **Ship, use it for two weeks.**
2. Text capture with the local fast path, then the LLM fallback.
3. Receipt scan.
4. Subscriptions + reminders.
5. Loans.
6. Fee learning from observed deltas; tariff library after that.
7. Desktop web app, reusing the same API.

## 9. Things that will bite

- **Security:** balances and merchant history are sensitive. Biometric lock, encrypted local DB, TLS-only, no analytics on transaction contents, and don't log prompts containing merchant data.
- **Rounding:** convert once, at display; store native. Never re-convert a stored converted figure.
- **FX history:** a transaction's converted value must use the rate *of its date*, not today's — hence `fx_rates(day, ...)`.
- **Prompt drift:** pin model versions, keep a fixture set of 30 real receipts and 50 real phrases, and re-run them on every prompt change.
- **Cost:** ~$1–3/month per active user at heavy scan use. Fine for you; price it in if this becomes a product.
