# PayzenMax.com — Offline-Ready GST Billing & Business Platform

An India-first billing and business-visibility platform built for small traders, service businesses, and counter operators based on the 30 October 2026 PRD.

---

## 🚀 Live Preview
The application is running live at:
- **Local:** [http://localhost:4173/](http://localhost:4173/) (landing) · [http://localhost:4173/app/](http://localhost:4173/app/) (app)
- **Network:** Accessible across your local network on port `4173`.

### Routes
- **`/`** — Marketing landing page (`src/pages/index.astro`): scroll-driven 3D laptop showing the live app, sticky feature story, 3D phone preview, testimonials and footer.
- **`/app/`** — The billing app itself (`src/pages/app.astro` mounts `src/App.tsx` as a client-only React island).

To start in developer mode with Hot Module Replacement:
```bash
npm run dev
```

To build for production:
```bash
npm run build
npm run preview
```

### Deploy to Cloudflare (Workers Static Assets)
Config lives in `wrangler.jsonc` (serves the static `dist/` build).
```bash
npx wrangler login     # once
npm run deploy         # astro build + wrangler deploy
npm run cf:dev         # preview the built site on the Workers runtime (localhost:8787)
```

---

## 🌟 Implemented Core Capabilities

### 1. Local-First & Online Setup
- **No Mandatory Login:** Business profile, masters, and invoices persist directly in browser storage (`localStorage` / offline-first).
- **CBIC Validation:** 15-character GSTIN validation (`27AABCV1234F1Z8`) with automatic state code extraction.
- **Configurable Series:** Sequential 16-character maximum invoice numbering (e.g. `VT/26-27/0108`) complying with Indian GST rules.

### 2. Deterministic GST Calculation Engine (`src/core/gstEngine.ts`)
- **Integer Paise Arithmetic:** Zero binary floating-point drift (`Math.round(val * 100)`).
- **Intra-State vs. Inter-State Detection:**
  - Intra-State (Seller State == Buyer State): Automatically splits tax evenly into **CGST** and **SGST**.
  - Inter-State (Seller State != Buyer State): Automatically applies **IGST**.
- **Tax Modes:** Line-level support for Tax-Exclusive and Tax-Inclusive pricing.
- **Mandatory HSN Aggregation:** Generates Table 12 HSN summaries with rate-wise taxable values and tax splits.
- **Automatic Round-Off:** Rounds grand total to the nearest whole Rupee with transparent round-off adjustment.

### 3. Fast Counter Billing & Invoicing (`src/components/Sales/InvoiceComposer.tsx`)
- **Keyboard-Optimized:** Quick add line items (`Alt+A`), issue bill (`Alt+Enter`), quick customer creation modal.
- **Live Stock Alerts:** Real-time indicator when goods are below reorder threshold.
- **Payment Collection:** Collect Cash, UPI, Bank IMPS/NEFT, or Cheque with transaction reference, or mark as Credit (Unpaid).

### 4. CBIC Rule 46 Compliant Printable Tax Invoice (`src/components/Sales/PrintableTaxInvoice.tsx`)
- **Standard Layout:** Original for Recipient, Duplicate for Transporter, Triplicate for Supplier.
- **Legal Requirements:** Supplier & Buyer GSTIN, State Codes, Place of Supply, Reverse Charge flag, HSN Summary Table.
- **Indian Numbering Words:** Full amount written in words in Indian English (e.g., *Rupees Fourteen Thousand Six Hundred Eighty-Three Only*).
- **Bank & UPI QR Code:** Generates standard `upi://pay?pa=...` QR code for instant counter scanning.
- **Clean Print Stylesheet:** `@media print` optimized for clean A4 single-sheet output without UI clutter.

### 5. Document Integrity & Immutability (FR-3 & FR-4)
- **Immutable Snapshots:** Issued invoices cannot be silently modified or renumbered.
- **Cancellation Workflow:** Voids invoice with mandatory reason, reverses customer balances, and restores inventory stock.
- **Credit Note Workflow:** Issues linked Credit Notes with tax reversal calculations.

### 6. Owner Visibility & Explainable Reports (FR-5)
- **Period Filtering:** Today, This Week, This Month, FY 2026-27.
- **Explainable Metrics:** Click any metric (Sales, GST, Receivables) to open the **Drilldown Modal** showing the exact formula, filters, and underlying invoices.
- **GSTR-1 Ready Reports:**
  - Table 4: B2B Registered Invoices
  - Table 7: B2C Small Consumer Supplies
  - Table 12: HSN Summary of Outward Supplies
  - Complete Sales Register (with CSV export)
  - Receivables Aging Report

### 7. Grounded AI Business Assistant (Beta - FR-8 & FR-9)
- **Deterministic Q&A:** Answers questions strictly by querying real transaction books:
  - *"How much did I sell this month?"*
  - *"Who hasn’t paid me and which bills are overdue?"*
  - *"What are my top selling items?"*
  - *"How much GST liability do I have?"*
  - *"Which items are running low on stock?"*
- **Clickable Citations:** Every answer links to the exact underlying transactions.
- **Push-to-Talk Voice Simulator:** Explicit speech-to-text input with editable transcript before submitting.

### 8. Backup & Portability (FR-7)
- **Export Backup:** One-click encrypted JSON database download.
- **Restore:** Restore database from backup JSON with structure validation.
- **Demo Data Seed / Reset:** One-click option to reset to realistic sample business records.

---

## 🛠 Tech Stack
- **Framework:** Astro 7 (pages & landing), React 18 + TypeScript (app island)
- **Landing animation:** GSAP ScrollTrigger + Lenis smooth scroll, pure CSS 3D devices
- **Styling:** Tailwind CSS (Custom slate & emerald enterprise theme)
- **Typography:** Outfit (Display), Plus Jakarta Sans (Body), JetBrains Mono (GSTIN/HSN/Amounts)
- **Icons:** Lucide React
- **Storage:** Browser localStorage with deterministic serialization
