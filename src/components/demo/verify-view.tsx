"use client"

import { Coffee, ExternalLink, HelpCircle, Loader2, RotateCcw, ScanLine, ShieldAlert, ShieldCheck, Syringe, TreePine } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"

import { useI18n } from "@/components/i18n-provider"
import { Manifest } from "@/components/passport/manifest"
import { RecordList, type CheckState } from "@/components/passport/record-list"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { href } from "@/i18n/config"
import { t } from "@/i18n/t"
import { LOT_CODE_RE, normalizeLotCode, tamperedCopy, verifyRecords } from "@/lib/demo/ops"
import { SAMPLE_CODES } from "@/lib/demo/seed"
import { getState, useHydrated } from "@/lib/demo/store"
import type { Batch, LedgerEvent } from "@/lib/demo/types"
import { lt } from "@/lib/format"
import { cn } from "@/lib/utils"

type Phase = "idle" | "loading" | "found" | "notFound" | "invalid"

const sampleIcon: Record<string, typeof Coffee> = { HU: Coffee, NV: Syringe, SB: TreePine }

export function VerifyView() {
  const { dict, locale } = useI18n()
  const v = dict.verify
  const ig = dict.integrity
  const router = useRouter()
  const pathname = usePathname()
  const search = useSearchParams()
  const hydrated = useHydrated()

  const [input, setInput] = useState("")
  const [phase, setPhase] = useState<Phase>("idle")
  const [code, setCode] = useState("")
  const [batch, setBatch] = useState<Batch | null>(null)
  const [tampered, setTampered] = useState<{ events: LedgerEvent[]; index: number } | null>(null)
  const [progress, setProgress] = useState(0)
  const timer = useRef<number | null>(null)
  const resultRef = useRef<HTMLDivElement>(null)

  const runCheck = useCallback((n: number) => {
    if (timer.current) window.clearInterval(timer.current)
    setProgress(0)
    let i = 0
    timer.current = window.setInterval(() => {
      i++
      setProgress(i)
      if (i >= n && timer.current) {
        window.clearInterval(timer.current)
        timer.current = null
      }
    }, 170)
  }, [])

  useEffect(() => () => {
    if (timer.current) window.clearInterval(timer.current)
  }, [])

  const lookup = useCallback(
    (raw: string, updateUrl = true) => {
      const c = normalizeLotCode(raw)
      setInput(c)
      setTampered(null)
      if (!LOT_CODE_RE.test(c)) {
        setPhase("invalid")
        setBatch(null)
        return
      }
      setCode(c)
      setPhase("loading")
      if (updateUrl) router.replace(`${pathname}?code=${c}`, { scroll: false })
      window.setTimeout(() => {
        const b = getState().batches[c]
        if (!b) {
          setBatch(null)
          setPhase("notFound")
        } else {
          setBatch(b)
          setPhase("found")
          runCheck(b.events.length)
        }
        requestAnimationFrame(() => resultRef.current?.focus({ preventScroll: false }))
      }, 900)
    },
    [pathname, router, runCheck],
  )

  // Open the passport named in the URL (what a scanned QR code does), once the demo data is loaded.
  const initial = search.get("code")
  const started = useRef(false)
  useEffect(() => {
    if (!hydrated || started.current || !initial) return
    started.current = true
    const id = window.setTimeout(() => lookup(initial, false), 0)
    return () => window.clearTimeout(id)
  }, [hydrated, initial, lookup])

  const events = tampered ? tampered.events : batch?.events ?? []
  const results = batch ? verifyRecords(batch.id, events, batch.events) : []
  const checks: CheckState[] = results.map((r, i) => (i < progress ? (r.ok ? "ok" : "bad") : i === progress ? "running" : "idle"))
  const doneChecking = batch ? progress >= results.length : false
  const firstBad = results.findIndex((r) => !r.ok)

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 md:py-12">
      <header className="border-b-2 border-rule pb-6">
        <h1 className="font-display text-4xl leading-none sm:text-6xl">{v.title}</h1>
        <p className="mt-3 max-w-2xl text-lg text-muted-foreground">{v.intro}</p>
      </header>

      <section aria-labelledby="scan-h" className="mt-8 grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <div>
          <h2 id="scan-h" className="label-caps flex items-center gap-2">
            <ScanLine className="size-4" aria-hidden />
            {v.scanTitle}
          </h2>
          <div
            className="relative mt-3 aspect-[4/3] overflow-hidden border-2 border-rule bg-[#15171a]"
            role="img"
            aria-label={v.viewfinder}
          >
            <div className="absolute inset-[12%] text-[#f5c400]" aria-hidden>
              {["top-0 left-0 border-t-4 border-l-4", "top-0 right-0 border-t-4 border-r-4", "bottom-0 left-0 border-b-4 border-l-4", "right-0 bottom-0 border-r-4 border-b-4"].map((c) => (
                <span key={c} className={cn("absolute size-8 border-current", c)} />
              ))}
            </div>
            {phase === "loading" ? (
              <div className="absolute inset-0 flex items-center justify-center font-mono text-sm text-[#f3f1ea]">
                <span className="rounded-sm bg-[#15171a]/80 px-2 py-1">
                  {code} · {v.loading}
                </span>
              </div>
            ) : (
              <span className="animate-scan absolute inset-x-[14%] h-0.5 bg-[#f5c400] shadow-[0_0_0_1px_#15171a]" aria-hidden />
            )}
            <p className="absolute inset-x-0 bottom-2 text-center font-mono text-[11px] text-[#a6a59e]">{v.viewfinder}</p>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">{v.scanHint}</p>
        </div>

        <div className="flex flex-col gap-5">
          <div>
            <p className="label-caps text-[10px] text-muted-foreground">{v.shelf}</p>
            <ul className="mt-2 grid grid-cols-2 gap-2">
              {SAMPLE_CODES.map((c) => {
                const b = getState().batches[c]
                const Icon = sampleIcon[c.slice(0, 2)] ?? HelpCircle
                const known = hydrated && !!b
                return (
                  <li key={c}>
                    <button
                      type="button"
                      onClick={() => lookup(c)}
                      disabled={phase === "loading"}
                      className={cn(
                        "flex h-full min-h-20 w-full flex-col items-start gap-1 border-2 bg-white p-2.5 text-left text-[#15171a] transition-transform hover:-translate-y-0.5 disabled:opacity-60",
                        code === c && phase !== "idle" ? "border-[#15171a] shadow-[3px_3px_0_0_#f5c400]" : "border-[#15171a]/70",
                      )}
                    >
                      <span className="flex w-full items-center justify-between">
                        <span className="font-mono text-base font-bold">{c}</span>
                        <Icon className="size-4" aria-hidden />
                      </span>
                      <span className="line-clamp-2 text-xs">{known && b ? lt(b.product, locale) : v.unknownLabel}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              lookup(input)
            }}
            className="grid gap-1.5"
            noValidate
          >
            <label htmlFor="lot-code" className="text-sm font-semibold">
              {v.codeLabel}
            </label>
            <div className="flex gap-2">
              <Input
                id="lot-code"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={v.codePlaceholder}
                autoCapitalize="characters"
                autoComplete="off"
                spellCheck={false}
                className="font-mono uppercase"
                aria-invalid={phase === "invalid"}
                aria-describedby={phase === "invalid" ? "lot-code-error" : undefined}
              />
              <Button type="submit" disabled={phase === "loading"}>
                {phase === "loading" ? <Loader2 className="animate-spin" aria-hidden /> : null}
                {v.check}
              </Button>
            </div>
            {phase === "invalid" && (
              <p id="lot-code-error" className="text-sm font-semibold text-destructive">
                {v.invalid}
              </p>
            )}
          </form>
        </div>
      </section>

      <div ref={resultRef} tabIndex={-1} className="mt-10 outline-none" aria-live="polite">
        {phase === "loading" && (
          <p role="status" className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="size-4 animate-spin" aria-hidden />
            {v.loading}
          </p>
        )}

        {phase === "notFound" && (
          <div role="alert" className="border-2 border-destructive bg-danger-soft p-5 sm:p-6">
            <p className="flex items-center gap-2 text-xl font-bold text-destructive">
              <ShieldAlert className="size-6" aria-hidden />
              {v.notFoundTitle}
            </p>
            <p className="mt-2 font-medium">{t(v.notFound, { code })}</p>
          </div>
        )}

        {phase === "found" && batch && (
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start">
            <div className="space-y-3">
              <Manifest batch={batch} dict={dict} locale={locale} className="shadow-hard" />
              <Button asChild variant="link" className="px-0">
                <Link href={href(locale, `/app/batch/${batch.id}`)}>
                  <ExternalLink aria-hidden />
                  {v.openInDemo}
                </Link>
              </Button>
            </div>
            <section aria-labelledby="integrity-h" className="border-2 border-rule bg-card">
              <header className="border-b-2 border-rule px-4 py-3 sm:px-5">
                <h2 id="integrity-h" className="text-lg font-bold">
                  {ig.title}
                </h2>
                <p className="text-sm text-muted-foreground">{ig.idle}</p>
              </header>
              <div
                className={cn(
                  "flex items-start gap-2 px-4 py-3 text-sm font-semibold sm:px-5",
                  !doneChecking && "text-muted-foreground",
                  doneChecking && firstBad < 0 && "bg-success-soft text-success",
                  doneChecking && firstBad >= 0 && "bg-danger-soft text-destructive",
                )}
                role="status"
              >
                {!doneChecking ? (
                  <>
                    <Loader2 className="mt-0.5 size-4 shrink-0 animate-spin" aria-hidden />
                    {t(ig.running, { i: Math.min(progress + 1, results.length), n: results.length })}
                  </>
                ) : firstBad < 0 ? (
                  <>
                    <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden />
                    {t(ig.ok, { n: results.length })}
                  </>
                ) : (
                  <>
                    <ShieldAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
                    {t(ig.bad, { i: firstBad + 1 })}
                  </>
                )}
              </div>
              <div className="px-4 py-4 sm:px-5">
                <RecordList batch={batch} events={events} dict={dict} locale={locale} checks={checks} compact />
              </div>
              <footer className="space-y-3 border-t-2 border-rule px-4 py-4 sm:px-5">
                {tampered && <p className="text-sm text-muted-foreground">{ig.tamperExplain}</p>}
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={tampered ? "outline" : "destructive"}
                    disabled={!doneChecking}
                    onClick={() => {
                      if (tampered) {
                        setTampered(null)
                      } else {
                        setTampered(tamperedCopy(batch.events))
                      }
                      runCheck(batch.events.length)
                    }}
                  >
                    {tampered ? <RotateCcw aria-hidden /> : <ShieldAlert aria-hidden />}
                    {tampered ? ig.restore : ig.tamper}
                  </Button>
                </div>
              </footer>
            </section>
          </div>
        )}
      </div>
    </div>
  )
}
