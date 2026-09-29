"use client"

import { Flag, TriangleAlert } from "lucide-react"
import { useState } from "react"

import { useI18n } from "@/components/i18n-provider"
import { TempChart } from "@/components/passport/temp-chart"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { t } from "@/i18n/t"
import type { HandoffInput, ReviewDecision, ReviewInput } from "@/lib/demo/ops"
import { excursions } from "@/lib/demo/ops"
import { org } from "@/lib/demo/orgs"
import { findExcursion } from "@/lib/demo/readings"
import type { Batch } from "@/lib/demo/types"
import { num, qty, temp } from "@/lib/format"
import { cn } from "@/lib/utils"

import { describedBy, Field } from "./field"

function Shell({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  title: string
  description: string
  children: React.ReactNode
  className?: string
}) {
  const { dict } = useI18n()
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent closeLabel={dict.common.close} className={cn("max-w-lg", className)}>
        <DialogHeader className="pr-8 text-left">
          <DialogTitle className="font-display text-2xl leading-tight">{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  )
}

/* ---------------------------------------------------------------- hand off */

export function HandoffDialog({
  batch,
  to,
  open,
  onOpenChange,
  onSubmit,
}: {
  batch: Batch
  to: string
  open: boolean
  onOpenChange: (o: boolean) => void
  onSubmit: (v: HandoffInput) => void
}) {
  const { dict } = useI18n()
  const h = dict.app.handoff
  const [count, setCount] = useState(String(batch.quantity))
  const [seal, setSeal] = useState(() => `${org(batch.custodian).code}-${String(20000 + (batch.events.length * 7919) % 70000)}`)
  const [note, setNote] = useState("")
  const [errors, setErrors] = useState<{ count?: string; seal?: string }>({})

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const n = Number(count)
    const errs: typeof errors = {}
    if (!Number.isInteger(n) || n <= 0) errs.count = h.errors.count
    if (!seal.trim()) errs.seal = h.errors.seal
    setErrors(errs)
    if (Object.keys(errs).length) return
    onSubmit({ to, count: n, seal: seal.trim(), note: note.trim() || undefined })
  }

  return (
    <Shell open={open} onOpenChange={onOpenChange} title={t(h.title, { lot: batch.id })} description={t(h.description, { org: org(to).name })}>
      <form onSubmit={submit} noValidate className="grid gap-4">
        <div className="grid gap-1.5">
          <p className="text-sm font-semibold">{h.to}</p>
          <p className="flex items-center gap-2 rounded-md border border-input bg-muted px-3 py-2 text-sm">
            <span className="font-mono text-xs font-bold">{org(to).code}</span>
            {org(to).name} · {dict.roles[org(to).role]}
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="ho-count" label={h.count} error={errors.count}>
            <Input
              id="ho-count"
              inputMode="numeric"
              value={count}
              onChange={(e) => setCount(e.target.value)}
              aria-invalid={!!errors.count}
              aria-describedby={describedBy("ho-count", errors.count)}
              className="font-mono"
            />
          </Field>
          <Field id="ho-seal" label={h.seal} error={errors.seal}>
            <Input
              id="ho-seal"
              value={seal}
              onChange={(e) => setSeal(e.target.value)}
              aria-invalid={!!errors.seal}
              aria-describedby={describedBy("ho-seal", errors.seal)}
              className="font-mono"
            />
          </Field>
        </div>
        <Field id="ho-note" label={`${h.note} (${dict.common.optional})`}>
          <Textarea id="ho-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder={h.notePlaceholder} rows={2} />
        </Field>
        <DialogFooter>
          <Button type="submit">{h.submit}</Button>
        </DialogFooter>
      </form>
    </Shell>
  )
}

/* ---------------------------------------------------------------- review */

export function ReviewDialog({
  batch,
  open,
  onOpenChange,
  onSubmit,
}: {
  batch: Batch
  open: boolean
  onOpenChange: (o: boolean) => void
  onSubmit: (v: ReviewInput) => void
}) {
  const { dict, locale } = useI18n()
  const r = dict.app.review
  const p = batch.pending!
  const flags = excursions(batch)
  const flag = flags[flags.length - 1]
  const flagText = flag
    ? t(dict.record.excursion, { peak: temp(flag.data.peak ?? 0, locale), minutes: flag.data.minutes ?? 0, min: flag.data.min ?? 0, max: flag.data.max ?? 0 })
    : ""
  const [count, setCount] = useState(String(p.count))
  const [sealOk, setSealOk] = useState(true)
  const [decision, setDecision] = useState<ReviewDecision>(flag ? "exception" : "accept")
  const [note, setNote] = useState(flag ? `${dict.app.readings.outOfRange}: ${flagText}` : "")
  const [errors, setErrors] = useState<{ count?: string; note?: string }>({})

  const n = Number(count)
  const countOk = count.trim() !== "" && Number.isInteger(n) && n >= 0
  const mismatch = countOk && n !== p.count
  const acceptBlocked = mismatch || !sealOk
  const effective: ReviewDecision = decision === "accept" && acceptBlocked ? "exception" : decision

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const errs: typeof errors = {}
    if (!countOk) errs.count = r.countError
    if (effective !== "accept" && !note.trim()) errs.note = r.noteRequired
    setErrors(errs)
    if (Object.keys(errs).length) return
    onSubmit({ decision: effective, count: n, sealOk, note: note.trim() || undefined })
  }

  const options: { v: ReviewDecision; label: string; hint: string }[] = [
    { v: "accept", label: r.accept, hint: r.acceptHint },
    { v: "exception", label: r.exception, hint: r.exceptionHint },
    { v: "refuse", label: r.refuse, hint: r.refuseHint },
  ]

  return (
    <Shell open={open} onOpenChange={onOpenChange} title={t(r.title, { lot: batch.id })} description={t(r.description, { org: org(p.from).name })}>
      <form onSubmit={submit} noValidate className="grid gap-4">
        <div className="border-2 border-rule bg-background p-3">
          <p className="label-caps text-[10px] text-muted-foreground">{r.declared}</p>
          <dl className="mt-1 grid grid-cols-2 gap-2 font-mono text-sm">
            <div>
              <dt className="text-xs text-muted-foreground">{r.declaredCount}</dt>
              <dd className="font-bold">{qty(dict.units, batch.unit, p.count, locale)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">{r.declaredSeal}</dt>
              <dd className="font-bold break-all">{p.seal}</dd>
            </div>
          </dl>
          {p.note && <p className="mt-2 text-sm">“{p.note}”</p>}
        </div>

        {flag && (
          <p role="alert" className="flex gap-2 border-l-4 border-destructive bg-danger-soft px-3 py-2 text-sm font-medium text-destructive">
            <Flag className="mt-0.5 size-4 shrink-0" aria-hidden />
            {t(r.flagWarning, { flag: flagText })}
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-[10rem_1fr] sm:items-end">
          <Field id="rv-count" label={r.received} error={errors.count}>
            <Input
              id="rv-count"
              inputMode="numeric"
              value={count}
              onChange={(e) => setCount(e.target.value)}
              aria-invalid={!!errors.count}
              aria-describedby={describedBy("rv-count", errors.count)}
              className="font-mono"
            />
          </Field>
          <div className="flex min-h-10 items-center gap-2.5">
            <Checkbox id="rv-seal" checked={sealOk} onCheckedChange={(v) => setSealOk(v === true)} />
            <Label htmlFor="rv-seal" className="text-sm leading-snug">
              {r.sealOk}
            </Label>
          </div>
        </div>

        {acceptBlocked && (
          <p className="flex gap-2 text-sm font-semibold text-warning" role="status">
            <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
            {mismatch ? r.mismatch : r.sealBroken}
          </p>
        )}

        <fieldset>
          <legend className="mb-1.5 text-sm font-semibold">{r.decision}</legend>
          <div role="radiogroup" className="grid gap-1.5 sm:grid-cols-3">
            {options.map((o) => {
              const disabled = o.v === "accept" && acceptBlocked
              const on = effective === o.v
              return (
                <button
                  key={o.v}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  disabled={disabled}
                  onClick={() => setDecision(o.v)}
                  className={cn(
                    "flex min-h-16 flex-col items-start rounded-md border p-2.5 text-left transition-colors disabled:opacity-45",
                    on
                      ? o.v === "refuse"
                        ? "border-2 border-destructive bg-danger-soft"
                        : o.v === "exception"
                          ? "border-2 border-warning bg-warning-soft"
                          : "border-2 border-success bg-success-soft"
                      : "border-input bg-card hover:bg-muted",
                  )}
                >
                  <span className="text-sm font-bold">{o.label}</span>
                  <span className="text-xs text-muted-foreground">{o.hint}</span>
                </button>
              )
            })}
          </div>
        </fieldset>

        {effective !== "accept" && (
          <Field id="rv-note" label={r.note} error={errors.note}>
            <Textarea
              id="rv-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={r.notePlaceholder}
              rows={2}
              aria-invalid={!!errors.note}
              aria-describedby={describedBy("rv-note", errors.note)}
            />
          </Field>
        )}

        <DialogFooter>
          <Button type="submit" variant={effective === "refuse" ? "destructive" : "default"}>
            {r.submit}
          </Button>
        </DialogFooter>
      </form>
    </Shell>
  )
}

/* ---------------------------------------------------------------- checkpoint */

export function CheckpointDialog({
  batch,
  open,
  onOpenChange,
  onSubmit,
}: {
  batch: Batch
  open: boolean
  onOpenChange: (o: boolean) => void
  onSubmit: (v: { note: string; place: string }) => void
}) {
  const { dict } = useI18n()
  const c = dict.app.checkpoint
  const [place, setPlace] = useState(org(batch.custodian).city)
  const [note, setNote] = useState("")
  const [error, setError] = useState<string>()
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!note.trim()) return setError(c.error)
    onSubmit({ note: note.trim(), place: place.trim() })
  }
  return (
    <Shell open={open} onOpenChange={onOpenChange} title={t(c.title, { lot: batch.id })} description={c.description}>
      <form onSubmit={submit} noValidate className="grid gap-4">
        <Field id="cp-place" label={c.place}>
          <Input id="cp-place" value={place} onChange={(e) => setPlace(e.target.value)} />
        </Field>
        <Field id="cp-note" label={c.note} error={error}>
          <Textarea
            id="cp-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={c.notePlaceholder}
            rows={3}
            aria-invalid={!!error}
            aria-describedby={describedBy("cp-note", error)}
          />
        </Field>
        <DialogFooter>
          <Button type="submit">{c.submit}</Button>
        </DialogFooter>
      </form>
    </Shell>
  )
}

/* ---------------------------------------------------------------- seal readings */

export function SealDialog({
  batch,
  open,
  onOpenChange,
  onSubmit,
}: {
  batch: Batch
  open: boolean
  onOpenChange: (o: boolean) => void
  onSubmit: () => void
}) {
  const { dict, locale } = useI18n()
  const rd = dict.app.readings
  const cc = batch.coldChain!
  const ex = findExcursion(batch.unsealed, cc)
  return (
    <Shell open={open} onOpenChange={onOpenChange} title={rd.sealTitle} description={rd.sealDescription} className="max-w-2xl">
      <div className="grid gap-3">
        <p className="flex flex-wrap gap-x-3 font-mono text-xs text-muted-foreground">
          <span>{t(rd.logger, { id: cc.loggerId })}</span>
          <span>{t(rd.range, { min: cc.min, max: cc.max })}</span>
        </p>
        <div className="border border-border bg-background p-2">
          <TempChart
            sealed={[]}
            unsealed={batch.unsealed}
            cc={cc}
            locale={locale}
            height={200}
            labels={{ chart: rd.chart, outOfRange: rd.outOfRange, unsealed: rd.unsealed, range: t(rd.range, { min: cc.min, max: cc.max }) }}
          />
        </div>
        <p
          className={cn(
            "flex gap-2 px-3 py-2 text-sm font-semibold",
            ex ? "border-l-4 border-destructive bg-danger-soft text-destructive" : "border-l-4 border-success bg-success-soft text-success",
          )}
        >
          {ex ? <Flag className="mt-0.5 size-4 shrink-0" aria-hidden /> : null}
          {ex ? t(rd.summaryEx, { minutes: ex.minutes, peak: temp(ex.peak, locale) }) : t(rd.summaryOk, { n: num(batch.unsealed.length, locale) })}
        </p>
      </div>
      <DialogFooter>
        <Button onClick={onSubmit}>{t(rd.seal, { n: batch.unsealed.length })}</Button>
      </DialogFooter>
    </Shell>
  )
}
