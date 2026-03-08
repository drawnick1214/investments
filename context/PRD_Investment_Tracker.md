# Product Requirements Document
## Personal Investment Portfolio Tracker
**Version:** 1.0  
**Author:** Portfolio Owner  
**Date:** March 5, 2026  
**Status:** Draft — Ready for Development

---

## 1. Product Vision

A personal, single-user web application that allows the owner to **record end-of-day snapshots** of all investment accounts, visualize portfolio performance over time, and understand daily gains and losses across currencies (USD and COP) in one unified view.

> **North Star:** Open the app at night, spend 5 minutes entering today's numbers, and immediately know if today was a good or bad day — and why.

---

## 2. User Profile

| Attribute | Description |
|-----------|-------------|
| User | Single owner (you) |
| Frequency | Daily, after market close (~10PM Bogotá time) |
| Device | Mobile-first, also usable on desktop |
| Technical level | Non-developer — the interface must be self-explanatory |
| Language | Spanish preferred, English acceptable |

---

## 3. Portfolio Scope

The app must cover all of the following asset categories:

### 3.1 XTB Platform (USD)
| Asset | Type |
|-------|------|
| Nvidia | Stock (fractional) |
| Palantir | Stock (fractional) |
| Bitcoin Trust | CFD |
| Alphabet (Google) | Stock (fractional) |
| Nu Holdings | Stock (fractional) |
| Investment Plan #2 | Managed plan |
| Gold | Managed plan |

### 3.2 Trii Platform (COP — BVC)
| Asset | Type |
|-------|------|
| Terpel | Colombian stock |
| Cemargos | Colombian stock |
| Accicuenta Moderado | Investment fund |

### 3.3 Savings & Fixed Deposits (COP)
| Account | Type | Rate |
|---------|------|------|
| Savings account | Liquid — open term | 8.75% EA |
| CDT #1 | Fixed — 2 months | 9.00% EA |
| CDT #2 | Fixed — 5 months | 9.75% EA |

---

## 4. Core Features

### Feature 1 — Daily Entry Form
**Purpose:** Let the user record closing values in under 5 minutes.

**Acceptance Criteria:**
- [ ] Form is accessible from a persistent bottom navigation bar or prominent button
- [ ] Date field defaults to today; user can backfill past dates
- [ ] TRM (COP/USD exchange rate) field is required and prominent
- [ ] XTB section: one price input per open position; value is auto-calculated (shares × price)
- [ ] XTB Investment Plans: one total value input each (not price × shares)
- [ ] Trii stocks: one price input per stock; value is auto-calculated
- [ ] Trii Accicuenta Moderado: one total NAV value input
- [ ] Savings & CDTs: one balance input each (user copies from app)
- [ ] Interest is **auto-calculated** — user never manually enters interest
- [ ] A "Save" button commits the snapshot; user sees a confirmation
- [ ] If a snapshot for today already exists, the form pre-fills with today's data (edit mode)
- [ ] Validation: no field may be zero or empty before saving

---

### Feature 2 — Dashboard (Main View)
**Purpose:** The home screen. Answer the question: *"How is my portfolio doing right now?"*

**Acceptance Criteria:**
- [ ] Shows **Total Portfolio Value in USD** prominently at the top
- [ ] Shows **daily change** (USD amount + %) compared to yesterday's snapshot
- [ ] Color coding: green = positive day, red = negative day
- [ ] Shows a **breakdown strip** with subtotals: XTB | Trii | Savings
- [ ] Shows the **date and TRM** of the current snapshot
- [ ] If no snapshot has been entered today, shows yesterday's data with a banner: *"No entry for today yet"*
- [ ] A quick-action button: *"Enter today's data"* visible from the dashboard

---

### Feature 3 — Portfolio Timeline Chart
**Purpose:** See how total portfolio value evolves over days/weeks/months.

**Acceptance Criteria:**
- [ ] Line chart showing total portfolio value (USD) over all recorded dates
- [ ] X-axis: dates; Y-axis: USD value
- [ ] Hovering/tapping a point shows the exact value and date
- [ ] Time filter buttons: Last 7 days / Last 30 days / All time
- [ ] Chart renders correctly with as few as 2 data points
- [ ] If only 1 snapshot exists, a friendly message is shown instead of an empty chart

---

### Feature 4 — Asset Allocation View
**Purpose:** Understand how the portfolio is distributed across assets and platforms.

**Acceptance Criteria:**
- [ ] Donut/pie chart showing % of total portfolio per asset category
- [ ] Categories: XTB Stocks/CFDs | XTB Plans | Trii Stocks | Trii Fund | Savings | CDT #1 | CDT #2
- [ ] Tapping a slice shows the exact USD value and % for that category
- [ ] Below the chart: a ranked list of all individual assets by value (largest first)

---

### Feature 5 — XTB Detail View
**Purpose:** Drill into all XTB positions and understand individual P&L.

**Acceptance Criteria:**
- [ ] Lists all open positions with: asset name, number of shares, average buy price, current price, current value, P&L (USD + %)
- [ ] Total XTB P&L shown at top
- [ ] **Margin level indicator** always visible:
  - Green if ≥ 150%
  - Yellow warning if between 108–150%
  - Red alert if < 108% with text: *"Danger: margin call risk"*
- [ ] Available cash in XTB shown
- [ ] Investment Plans shown separately with their P&L

---

### Feature 6 — Trii Detail View
**Purpose:** Drill into Colombian market positions.

**Acceptance Criteria:**
- [ ] Shows Terpel and Cemargos with: shares, average cost (COP), current price (COP), total value (COP), P&L (COP + %)
- [ ] All values also shown in USD equivalent using today's TRM
- [ ] Accicuenta Moderado: shows invested amount, current NAV, and P&L
- [ ] Total Trii P&L in COP and USD shown at top
- [ ] Weekly balance chart pulled from snapshot history (value over last 7 days)

---

### Feature 7 — Savings & CDT View
**Purpose:** Track interest-bearing accounts and know when CDTs mature.

**Acceptance Criteria:**
- [ ] Shows each account: name, balance (COP), rate (EA), account type
- [ ] For CDTs: shows maturity date and days/months remaining
- [ ] Auto-calculates and displays:
  - Daily interest accrued (COP and USD)
  - Monthly interest (COP and USD)
  - Annual interest (COP and USD)
- [ ] Formula used: `Daily = Balance × ((1 + EA)^(1/365) − 1)`
- [ ] Total savings P&L (interest earned since tracking began) shown
- [ ] **CDT maturity countdown**: a badge showing "X days until CDT #1 matures"

---

### Feature 8 — Snapshot History Log
**Purpose:** Review all past entries and edit mistakes.

**Acceptance Criteria:**
- [ ] List of all snapshots in reverse chronological order
- [ ] Each row shows: date, total portfolio value (USD), daily change vs prior day
- [ ] Tapping a row opens that day's full detail
- [ ] Each snapshot has an **Edit** option that pre-fills the entry form
- [ ] Each snapshot has a **Delete** option with a confirmation dialog
- [ ] Export option: download all history as a CSV file

---

### Feature 9 — Currency & Exchange Rate Handling
**Purpose:** Correctly handle the COP/USD conversion throughout the app.

**Acceptance Criteria:**
- [ ] Every daily snapshot stores the TRM used that day
- [ ] All COP values are shown in COP natively; USD equivalent shown as secondary label
- [ ] The consolidated total always uses the **snapshot's TRM**, not today's rate (for historical accuracy)
- [ ] Dashboard shows today's TRM prominently
- [ ] User can optionally view the full portfolio in COP instead of USD (toggle)

---

## 5. Non-Functional Requirements

| Requirement | Expectation |
|-------------|-------------|
| Performance | All views load in < 1 second; no spinners for local data |
| Offline use | App works fully offline after first load (PWA or local storage) |
| Data persistence | Data must survive closing the browser (localStorage or IndexedDB) |
| Data export | User can export all snapshots as CSV at any time |
| Data import | User can import a previously exported CSV to restore data |
| Mobile UX | All interactions usable with one thumb on a phone screen |
| No login required | Single-user, no authentication needed |
| No backend required | All data stored locally on the device |

---

## 6. UX & Design Principles

| Principle | Description |
|-----------|-------------|
| **Speed first** | The daily entry flow must take under 5 minutes |
| **Numbers are the hero** | Large, readable typography for portfolio values |
| **Color = emotion** | Green/red everywhere there is a P&L — no ambiguity |
| **Minimal navigation** | Max 5 screens; bottom navigation bar |
| **No surprises** | User always knows what data they're looking at and when it was entered |
| **Dark theme** | Matches the aesthetic of XTB and Trii apps; easier to read at night |

---

## 7. Screen Map

```
┌─────────────────────────────────┐
│         BOTTOM NAV BAR          │
│  Dashboard | Assets | History   │
│        | Entry (FAB)            │
└─────────────────────────────────┘

Dashboard
  ├── Total value (hero)
  ├── Daily change
  ├── Platform breakdown strip
  ├── Timeline chart (7d default)
  └── Allocation donut

Assets
  ├── XTB tab
  │    ├── Open positions list
  │    ├── Investment plans
  │    └── Margin level alert
  ├── Trii tab
  │    ├── BVC stocks list
  │    └── Fund (Accicuenta)
  └── Savings tab
       ├── Liquid savings card
       ├── CDT #1 card
       └── CDT #2 card

History
  ├── Snapshot list (reverse chrono)
  ├── Edit / Delete per row
  └── Export CSV button

Entry Form (modal or full screen)
  ├── Date + TRM
  ├── XTB prices section
  ├── Trii prices section
  ├── Savings balances section
  └── Save button
```

---

## 8. Acceptance Criteria Summary (Definition of Done)

The product is considered **complete** when:

- [ ] User can enter a daily snapshot in under 5 minutes
- [ ] Dashboard shows total portfolio in USD with correct daily change
- [ ] All 3 platforms (XTB, Trii, Savings) are tracked and displayed
- [ ] Interest is auto-calculated for all savings/CDT accounts
- [ ] XTB margin level is always visible with appropriate alert color
- [ ] Timeline chart displays portfolio value history
- [ ] COP values are shown with correct TRM conversion
- [ ] All data persists after closing and reopening the browser/app
- [ ] User can export all data to CSV
- [ ] App is fully usable on a mobile screen (375px wide minimum)
- [ ] No snapshot data is ever lost silently

---

## 9. Out of Scope (Version 1.0)

These features are intentionally excluded from the first version to keep scope tight:

- Automatic price fetching (no API integrations — manual entry only)
- Push notifications or alerts
- Multiple user accounts or cloud sync
- Tax calculations or reporting
- Stock news or market data feeds
- Comparison against benchmarks (S&P 500, etc.)
- Support for additional platforms beyond XTB, Trii, and COP savings

---

## 10. Future Enhancements (Version 2.0 Backlog)

| Feature | Value |
|---------|-------|
| Auto-fetch closing prices via API (Yahoo Finance, Alpha Vantage) | Eliminates manual price entry |
| Weekly/monthly summary email or PDF report | Long-term performance review |
| Goal tracking (e.g. "reach $5,000 by Dec 2026") | Motivation and planning |
| Benchmark comparison vs S&P 500 | Relative performance context |
| Cloud sync (optional) | Access from multiple devices |
| CDT renewal reminders | Never miss a maturity date |

---

*Document version 1.0 — March 5, 2026*  
*Next step: Review acceptance criteria, then begin development sprint*
