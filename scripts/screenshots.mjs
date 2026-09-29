// Visual check of every page and key flow with Playwright.
// Usage: pnpm build && pnpm start        (serves on port 3152)
//        pnpm screenshots                (BASE_URL defaults to http://localhost:3152)
//        pnpm screenshots en-390-light   (optional filter on the variant tag)
// Output: docs/screenshots/<locale>-<width>-<theme>-<name>.png
import { mkdir } from "node:fs/promises"
import { fileURLToPath } from "node:url"
import { chromium } from "playwright"

const BASE = process.env.BASE_URL ?? "http://localhost:3152"
const OUT = fileURLToPath(new URL("../docs/screenshots/", import.meta.url))
const ONLY = process.env.ONLY ?? process.argv[2]

const sizes = { 390: { width: 390, height: 844 }, 1440: { width: 1440, height: 900 } }
const variants = []
for (const w of [390, 1440]) for (const theme of ["light", "dark"]) variants.push({ locale: "en", w, theme })
for (const w of [390, 1440]) variants.push({ locale: "fr", w, theme: "light" })

const L = {
  en: {
    connect: "Connect demo wallet",
    connectBtn: "Connect",
    reject: "Reject",
    sign: "Sign",
    ledger: "Ledger",
    handoffTo: /^Hand off to /,
    sendSubmit: "Sign and send",
    actAs: (o) => `Act as ${o}`,
    review: "Review handoff",
    signDecision: "Sign decision",
    confirmed: /Confirmed in block/,
    failed: /didn't confirm the transaction/,
    sealReview: "Review and seal readings",
    seal: /^Seal \d+ readings$/,
    exception: "Accept with exception",
    note: "What did you find?",
    registerSubmit: "Sign and register",
    blank: "Blank",
    coffee: "Green coffee",
    onLedger: /is on the ledger/,
    verified: /records match the ledger/,
    tamper: "Simulate a tampered copy",
    mismatch: /doesn't match the ledger/,
    check: "Check",
    code: "Lot code",
    notFound: "Not on the ledger",
    menu: "Open menu",
    orgs: { tmv: "Torréfaction Maisonneuve", fnt: "Froid Nord Transport", pdp: "Pharmacie du Plateau", ccs: "Cooperativa Cafetera del Sur", chw: "Chantier Wellington" },
  },
  fr: {
    connect: "Connecter le portefeuille de démo",
    connectBtn: "Connecter",
    reject: "Refuser",
    sign: "Signer",
    ledger: "Registre",
    handoffTo: /^Remettre à /,
    sendSubmit: "Signer et envoyer",
    actAs: (o) => `Agir pour ${o}`,
    review: "Examiner la passation",
    signDecision: "Signer la décision",
    confirmed: /Confirmé au bloc/,
    verified: /concordent avec le registre/,
    orgs: { tmv: "Torréfaction Maisonneuve" },
  },
}

async function newPage(browser, { locale, w, theme }) {
  const context = await browser.newContext({
    viewport: sizes[w],
    colorScheme: theme,
    locale: locale === "fr" ? "fr-CA" : "en-CA",
    reducedMotion: "no-preference",
    hasTouch: w < 768,
    isMobile: w < 768,
  })
  await context.addInitScript((t) => {
    try {
      window.localStorage.setItem("theme", t)
    } catch {}
  }, theme)
  const page = await context.newPage()
  page.on("pageerror", (e) => console.error("  pageerror:", e.message))
  return { context, page }
}

const shot = async (page, v, name, fullPage = false) => {
  const path = `${OUT}${v.locale}-${v.w}-${v.theme}-${name}.png`
  if (fullPage) {
    await page.evaluate(() => window.scrollTo(0, 0))
    const height = await page.evaluate(() => document.documentElement.scrollHeight)
    await page.setViewportSize({ width: sizes[v.w].width, height: Math.max(height, sizes[v.w].height) })
    await page.waitForTimeout(500)
    await page.screenshot({ path })
    await page.setViewportSize(sizes[v.w])
  } else {
    await page.waitForTimeout(350)
    await page.screenshot({ path })
  }
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
  console.log("  ✓", `${v.locale}-${v.w}-${v.theme}-${name}`, overflow ? "  ⚠ horizontal overflow" : "")
}

const main = (page) => page.locator("main")
const dialog = (page) => page.getByRole("dialog").last()
const go = (page, v, path) => page.goto(`${BASE}/${v.locale}${path}`, { waitUntil: "networkidle" })
const sign = async (page, v) => {
  await dialog(page).getByRole("button", { name: L[v.locale].sign, exact: true }).waitFor()
  await dialog(page).getByRole("button", { name: L[v.locale].sign, exact: true }).click()
}
const panel = (page) => page.locator("aside").first()
const actAs = async (page, v, org) => {
  await main(page).getByRole("button", { name: L[v.locale].actAs(org) }).first().click()
  await page.waitForTimeout(400)
}
const waitConfirmed = async (page, v) => {
  await panel(page).getByText(L[v.locale].confirmed).waitFor({ timeout: 12000 })
  await page.waitForTimeout(900)
}
const setFailNext = async (page) => {
  await page.locator("header").getByRole("button", { name: /^Acting as/ }).click()
  await page.getByRole("menuitem", { name: "Demo controls" }).click()
  await dialog(page).getByRole("switch", { name: "Fail the next transaction" }).click()
  await page.keyboard.press("Escape")
  await page.waitForTimeout(400)
}

async function connect(page, v, capture) {
  await go(page, v, "/app")
  const btn = main(page).getByRole("button", { name: L[v.locale].connect })
  await btn.waitFor()
  if (capture) await shot(page, v, "flow0-01-gate", true)
  await btn.click()
  await dialog(page).waitFor()
  if (capture) {
    await shot(page, v, "flow0-02-connect-prompt")
    await dialog(page).getByRole("button", { name: L[v.locale].reject, exact: true }).click()
    await page.getByRole("alert").first().waitFor()
    await shot(page, v, "flow0-03-connect-rejected")
    await btn.click()
    await dialog(page).waitFor()
  }
  await dialog(page).getByRole("button", { name: L[v.locale].connectBtn, exact: true }).click()
  await page.getByRole("heading", { level: 1, name: L[v.locale].ledger }).waitFor({ timeout: 10000 })
}

async function marketing(page, v) {
  for (const [name, path] of [
    ["home", ""],
    ["how-it-works", "/how-it-works"],
    ["verify", "/verify"],
    ["credits", "/credits"],
    ["pricing", "/pricing"],
    ["404", "/this-page-does-not-exist"],
  ]) {
    await go(page, v, path)
    await page.waitForTimeout(2600)
    await shot(page, v, `page-${name}`, true)
  }
  if (v.w < 768) {
    await go(page, v, "")
    await page.getByRole("button", { name: L.en.menu }).click()
    await dialog(page).waitFor()
    await shot(page, v, "page-mobile-menu")
  }
}

async function appFlows(page, v) {
  const l = L.en
  // Flow 0: connect
  await connect(page, v, true)
  await shot(page, v, "flow0-04-ledger", true)

  // Flow 2: two-signature handoff (with a forced failure on the receiver's side)
  await go(page, v, "/app/batch/HU-2611")
  await shot(page, v, "flow2-01-batch", true)
  await panel(page).getByRole("button", { name: l.handoffTo }).click()
  await dialog(page).waitFor()
  await shot(page, v, "flow2-02-handoff-form")
  await dialog(page).getByRole("button", { name: l.sendSubmit }).click()
  await page.waitForTimeout(400)
  await dialog(page).getByRole("button", { name: l.sign, exact: true }).waitFor()
  await shot(page, v, "flow2-03-sign-prompt")
  await sign(page, v)
  await page.waitForTimeout(500)
  await panel(page).scrollIntoViewIfNeeded()
  await shot(page, v, "flow2-04-pending")
  await waitConfirmed(page, v)
  await shot(page, v, "flow2-05-sent-waiting")
  await actAs(page, v, l.orgs.tmv)
  await shot(page, v, "flow2-06-receiver-view")
  await setFailNext(page)
  await panel(page).getByRole("button", { name: l.review }).click()
  await dialog(page).waitFor()
  await dialog(page).getByLabel("Counted on arrival").fill("273")
  await dialog(page).getByLabel(l.note).fill("2 bags torn at the seam, contents lost in transit.")
  await shot(page, v, "flow2-07-review-exception")
  await dialog(page).getByRole("button", { name: l.signDecision }).click()
  await sign(page, v)
  await panel(page).getByText(l.failed).waitFor({ timeout: 12000 })
  await panel(page).scrollIntoViewIfNeeded()
  await shot(page, v, "flow2-08-failed")
  await panel(page).getByRole("button", { name: l.review }).click()
  await dialog(page).waitFor()
  await dialog(page).getByLabel("Counted on arrival").fill("273")
  await dialog(page).getByLabel(l.note).fill("2 bags torn at the seam, contents lost in transit.")
  await dialog(page).getByRole("button", { name: l.signDecision }).click()
  await sign(page, v)
  await waitConfirmed(page, v)
  await page.evaluate(() => window.scrollTo(0, 0))
  await shot(page, v, "flow2-09-stamped")
  await page.getByRole("tab", { name: "Custody record" }).scrollIntoViewIfNeeded()
  await shot(page, v, "flow2-10-record", true)

  // Timber: plain accept
  await go(page, v, "/app/batch/SB-0932")
  await actAs(page, v, l.orgs.chw)
  await panel(page).getByRole("button", { name: l.review }).click()
  await dialog(page).waitFor()
  await shot(page, v, "flow2-11-review-accept")
  await dialog(page).getByRole("button", { name: l.signDecision }).click()
  await sign(page, v)
  await waitConfirmed(page, v)
  await page.evaluate(() => window.scrollTo(0, 0))
  await shot(page, v, "flow2-12-timber-delivered")

  // Flow 3: seal logger readings, excursion flagged, next receiver sees it
  await go(page, v, "/app/batch/NV-0417")
  await actAs(page, v, l.orgs.fnt)
  await shot(page, v, "flow3-01-unsealed", true)
  await panel(page).getByRole("button", { name: l.sealReview }).click()
  await dialog(page).waitFor()
  await page.waitForTimeout(400)
  await shot(page, v, "flow3-02-seal-dialog")
  await dialog(page).getByRole("button", { name: l.seal }).click()
  await sign(page, v)
  await waitConfirmed(page, v)
  await shot(page, v, "flow3-03-sealed-flagged", true)
  await panel(page).getByRole("button", { name: l.handoffTo }).click()
  await dialog(page).getByRole("button", { name: l.sendSubmit }).click()
  await sign(page, v)
  await waitConfirmed(page, v)
  await actAs(page, v, l.orgs.pdp)
  await panel(page).getByRole("button", { name: l.review }).click()
  await dialog(page).waitFor()
  await shot(page, v, "flow3-04-receiver-sees-flag")
  await dialog(page).getByRole("button", { name: l.signDecision }).click()
  await sign(page, v)
  await waitConfirmed(page, v)
  await page.evaluate(() => window.scrollTo(0, 0))
  await shot(page, v, "flow3-05-delivered-with-exception")

  // Flow 1: register a batch
  await go(page, v, "/app/register")
  await shot(page, v, "flow1-01-role-gate")
  await actAs(page, v, l.orgs.ccs)
  await main(page).getByRole("button", { name: l.blank }).click()
  await main(page).getByRole("button", { name: l.registerSubmit }).click()
  await page.waitForTimeout(300)
  await shot(page, v, "flow1-02-errors", true)
  await main(page).getByRole("button", { name: l.coffee }).click()
  await shot(page, v, "flow1-03-form", true)
  await main(page).getByRole("button", { name: l.registerSubmit }).click()
  await dialog(page).getByRole("button", { name: l.sign, exact: true }).waitFor()
  await shot(page, v, "flow1-04-sign-prompt")
  await sign(page, v)
  await main(page).getByText(l.onLedger).waitFor({ timeout: 12000 })
  await page.waitForTimeout(600)
  await shot(page, v, "flow1-05-label", true)

  // Flow 4: verify
  await go(page, v, "/verify?code=HU-2584")
  await page.getByText(l.verified).waitFor({ timeout: 12000 })
  await page.waitForTimeout(400)
  await shot(page, v, "flow4-01-verified", true)
  await page.getByRole("button", { name: l.tamper }).click()
  await page.getByText(l.mismatch).first().waitFor({ timeout: 12000 })
  await page.waitForTimeout(400)
  await page.getByText(l.mismatch).first().scrollIntoViewIfNeeded()
  await shot(page, v, "flow4-02-tampered")
  await go(page, v, "/verify")
  await page.getByRole("button", { name: /HU-2590/ }).click()
  await page.getByText(l.notFound).waitFor({ timeout: 12000 })
  await page.getByText(l.notFound).scrollIntoViewIfNeeded()
  await shot(page, v, "flow4-03-not-found")
  await page.getByLabel(l.code).fill("coffee")
  await main(page).getByRole("button", { name: l.check, exact: true }).click()
  await page.waitForTimeout(300)
  await shot(page, v, "flow4-04-invalid-code")

  await go(page, v, "/app")
  await shot(page, v, "app-ledger-after", true)
}

async function frenchFlow(page, v) {
  const l = L.fr
  await go(page, v, "")
  await page.waitForTimeout(2600)
  await shot(page, v, "page-home", true)
  await connect(page, v, false)
  await shot(page, v, "flow0-04-ledger", true)
  await go(page, v, "/app/batch/HU-2611")
  await panel(page).getByRole("button", { name: l.handoffTo }).click()
  await dialog(page).waitFor()
  await shot(page, v, "flow2-02-handoff-form")
  await dialog(page).getByRole("button", { name: l.sendSubmit }).click()
  await dialog(page).getByRole("button", { name: l.sign, exact: true }).waitFor()
  await shot(page, v, "flow2-03-sign-prompt")
  await sign(page, v)
  await waitConfirmed(page, v)
  await actAs(page, v, l.orgs.tmv)
  await panel(page).getByRole("button", { name: l.review }).click()
  await dialog(page).waitFor()
  await shot(page, v, "flow2-07-review")
  await dialog(page).getByRole("button", { name: l.signDecision }).click()
  await sign(page, v)
  await waitConfirmed(page, v)
  await page.evaluate(() => window.scrollTo(0, 0))
  await shot(page, v, "flow2-09-stamped", true)
  await go(page, v, "/verify?code=HU-2584")
  await page.getByText(l.verified).waitFor({ timeout: 12000 })
  await shot(page, v, "flow4-01-verified", true)
}

const browser = await chromium.launch()
await mkdir(OUT, { recursive: true })
for (const v of variants) {
  const tag = `${v.locale}-${v.w}-${v.theme}`
  if (ONLY && !tag.includes(ONLY)) continue
  console.log(tag)
  const { context, page } = await newPage(browser, v)
  try {
    if (v.locale === "fr") await frenchFlow(page, v)
    else {
      await marketing(page, v)
      await appFlows(page, v)
    }
  } catch (e) {
    console.error("  ✗", tag, e.message.split("\n")[0])
    await page.screenshot({ path: `${OUT}_error-${tag}.png` }).catch(() => {})
    process.exitCode = 1
  }
  await context.close()
}
await browser.close()
