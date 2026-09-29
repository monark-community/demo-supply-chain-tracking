# ChainProof

**Every handoff, signed by both hands.**

ChainProof keeps one custody record per batch of goods. Every handoff is signed twice (the sender declares the count and seal, the receiver signs what actually arrived, records an exception, or refuses), temperature loggers are sealed on the way, and anyone holding the label can scan it and re-check the whole record against the ledger.

This repository is the **interactive demo site**: a Next.js app where you can walk a batch of Colombian coffee, a pallet of vaccine or a load of glulam beams through ten organizations. It is an independent product incubated by [Monark](https://www.monark.io); project documentation: https://www.monark.io/en/project/supply-chain-tracking.

> Demo · simulated data. No real chain, wallet, sensor or backend is involved; everything runs in your browser.

## Run it locally

Requirements: Node 22 and pnpm 10.

```bash
pnpm install
pnpm dev          # http://localhost:3152
```

Production build:

```bash
pnpm lint && pnpm typecheck && pnpm build
pnpm start        # http://localhost:3152
```

No environment variables are needed. `NEXT_PUBLIC_SITE_URL` (optional) sets the absolute URL used in metadata, the sitemap and the QR labels; it defaults to `https://chainproof.monark.io`.

## What you can do in the demo

1. **Connect** a demo wallet: pick one of ten organizations (producers, carriers, a distributor, retailers, a construction site). Switch organization at any time from the header.
2. **Register a batch** as a producer, sign it, and print its QR label.
3. **Hand off custody** with two signatures: send as the holder, then switch to the receiver and accept, accept with an exception, or refuse.
4. **Seal logger readings** as a cold-chain carrier; an out-of-range stretch becomes a permanent excursion flag that the next receiver sees before signing.
5. **Verify a label** at `/verify`: the passport plus an integrity check that re-computes every record hash. "Simulate a tampered copy" shows how one edited number breaks the chain.

"Demo controls" (in the wallet menu) can force the next transaction to fail, and reset the demo.

## How the simulation works

Everything lives behind a small typed data layer in `src/lib/demo/`, so it could be swapped for a real contract client (wagmi/viem) without touching UI code:

| File | Role |
|-|-|
| `types.ts` | Domain types: `Batch`, `LedgerEvent`, `Org`, `Reading`, `DemoState`. |
| `orgs.ts` | The ten demo organizations and their addresses. |
| `seed.ts` | Four seed batches with chained, hashed records; simulated block numbers (12 s blocks). |
| `hash.ts` | Deterministic demo digest (not cryptographic), record hashing chained to the previous hash. |
| `ops.ts` | Pure ledger operations: register, hand off, cancel, review, seal readings, checkpoint, verify, tamper. |
| `readings.ts` | Deterministic logger traces and excursion detection. |
| `chain.ts` | Simulated wallet and network: 1.2–2.6 s confirmation latency, optional forced failure. |
| `store.ts` | `useSyncExternalStore` store persisted to `localStorage` (every access wrapped in try/catch). |

Each signed action goes through the same path (`useLedgerAction` in `src/components/demo/app-context.tsx`): signature prompt (sign or reject) → broadcast (pending, with a transaction hash) → confirmed in a block, or failed with nothing recorded.

## Project structure

```
src/
  app/
    [locale]/            en and fr routes (proxy.ts redirects / to the visitor's language)
      (site)/            home, how-it-works, verify, credits, pricing (unlinked, noindex), 404 catch-all
      app/               the demo: ledger, register, batch/[id]
      opengraph-image.tsx
    globals.css          ChainProof theme over the Monark UI registry variables
    icon.svg, robots.ts, sitemap.ts
  components/
    ui/                  Monark UI registry components (re-themed)
    site/                header, footer, brand, locale switch, theme toggle
    passport/            manifest, route rail, stamps, record list, temperature chart, QR label
    demo/                app shell, wallet gate, sign prompt, overview, batch view, dialogs, register, verify
  i18n/                  typed dictionaries (en, fr)
  lib/                   demo data layer, formatting, metadata, photo credits
docs/
  site-plan.md           product brief, identity, flows, copy (kept in sync with what shipped)
  assets.md              photo sources and credits
  screenshots/           Playwright screenshots (390px and 1440px, light and dark, EN and FR)
scripts/screenshots.mjs  regenerates docs/screenshots against a running production build
```

UI components come from the [Monark UI registry](https://ui.monark.io) (`@monark` in `components.json`), re-themed with ChainProof's own palette and type (Archivo and JetBrains Mono).

## Deploy to Vercel

Import the repository in Vercel and deploy with the framework defaults (Next.js, pnpm). No configuration file or environment variable is required. All pages prerender; lots registered in a visitor's browser render their batch page on demand.

## Screenshots

`pnpm build && pnpm start`, then in another terminal `pnpm screenshots` (optionally filtered, e.g. `pnpm screenshots en-390-light`). Output goes to `docs/screenshots/`.
