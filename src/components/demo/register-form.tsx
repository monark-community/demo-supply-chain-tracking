"use client"

import { ArrowRight, Printer, RotateCcw } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

import { useI18n } from "@/components/i18n-provider"
import { LabelCard } from "@/components/passport/label-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { href } from "@/i18n/config"
import { t } from "@/i18n/t"
import { applyRegister, newLotCode, registerDraft, type RegisterInput } from "@/lib/demo/ops"
import { getOrg, ORGS, orgsByRole } from "@/lib/demo/orgs"
import { getState, setState, useDemo } from "@/lib/demo/store"
import type { Industry, Unit } from "@/lib/demo/types"
import { num, unitLabel } from "@/lib/format"
import { cn } from "@/lib/utils"

import { useLedgerAction } from "./app-context"
import { useDemoUi } from "./app-shell"
import { describedBy, Field } from "./field"
import { TxFeedback } from "./tx-feedback"

type Template = "coffee" | "vaccine" | "timber" | "blank"

interface FormState {
  industry: Industry
  product: string
  quantity: string
  unit: Unit
  unitSize: string
  origin: string
  producedOn: string
  certifications: string
  note: string
  carrier: string
  receiver: string
  final: string
  cold: boolean
  min: string
  max: string
}

const today = () => new Date().toISOString().slice(0, 10)

function template(tpl: Template, locale: "en" | "fr", producerCity: string): FormState {
  const base: FormState = {
    industry: "other",
    product: "",
    quantity: "",
    unit: "pallets",
    unitSize: "",
    origin: producerCity,
    producedOn: today(),
    certifications: "",
    note: "",
    carrier: "",
    receiver: "",
    final: "",
    cold: false,
    min: "2",
    max: "8",
  }
  if (tpl === "coffee")
    return {
      ...base,
      industry: "coffee",
      product: locale === "fr" ? "Café vert, Caturra lavé du Huila" : "Green coffee, Huila washed Caturra",
      quantity: "120",
      unit: "bags",
      unitSize: "70 kg",
      certifications: "Fairtrade",
      carrier: "trc",
      receiver: "flv",
      final: "tmv",
    }
  if (tpl === "vaccine")
    return {
      ...base,
      industry: "vaccine",
      product: locale === "fr" ? "Vaccin antigrippal quadrivalent, 2026-2027" : "Influenza vaccine, quadrivalent, 2026–27",
      quantity: "80",
      unit: "cases",
      unitSize: "100 doses",
      certifications: "GMP lot release",
      carrier: "fnt",
      receiver: "pdp",
      cold: true,
    }
  if (tpl === "timber")
    return {
      ...base,
      industry: "timber",
      product: locale === "fr" ? "Poutres lamellées-collées, épinette-pin, 24f-EX" : "Glulam beams, spruce-pine, 24f-EX",
      quantity: "24",
      unit: "beams",
      unitSize: "12.2 m",
      certifications: "CSA O122, FSC Chain of Custody",
      carrier: "tlj",
      receiver: "chw",
    }
  return base
}

const defaultTemplate: Record<string, Template> = { ccs: "coffee", nvb: "vaccine", sbr: "timber" }
const UNITS: Unit[] = ["bags", "cases", "beams", "pallets", "crates"]
const NONE = "__none"

export function RegisterScreen() {
  const { dict } = useI18n()
  const orgId = useDemo((s) => s.wallet.orgId)
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 md:py-12">
      <header className="mb-8 border-b-2 border-rule pb-6">
        <h1 className="font-display text-4xl leading-none sm:text-5xl">{dict.app.register.title}</h1>
      </header>
      <RegisterForm key={orgId ?? "none"} />
    </div>
  )
}

function RegisterForm() {
  const { dict, locale } = useI18n()
  const r = dict.app.register
  const me = getOrg(useDemo((s) => s.wallet.orgId))
  const ui = useDemoUi()
  const action = useLedgerAction()
  const [tpl, setTpl] = useState<Template>(() => defaultTemplate[me?.id ?? ""] ?? "blank")
  const [f, setF] = useState<FormState>(() => template(defaultTemplate[me?.id ?? ""] ?? "blank", locale, me?.city ?? ""))
  const [lot, setLot] = useState(() => newLotCode(getState(), me?.lotPrefix ?? "XX"))
  const [errors, setErrors] = useState<Partial<Record<"product" | "quantity" | "origin" | "producedOn" | "route" | "range", string>>>({})
  const [done, setDone] = useState<string | null>(null)
  const registered = useDemo((s) => (done ? s.batches[done] : undefined))

  if (!me) return null

  if (me.role !== "producer") {
    return (
      <div className="border-2 border-rule bg-card p-6 sm:p-8">
        <h2 className="text-xl font-bold">{r.roleGateTitle}</h2>
        <p className="mt-2 text-muted-foreground">{t(r.roleGateBody, { org: me.name, role: dict.roles[me.role].toLowerCase() })}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          {orgsByRole("producer").map((p) => (
            <Button key={p.id} variant={p.id === "ccs" ? "hi" : "outline"} onClick={() => ui.switchTo(p.id)}>
              {t(dict.app.wallet.actAs, { org: p.name })}
            </Button>
          ))}
        </div>
      </div>
    )
  }

  if (registered) {
    return (
      <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-start">
        <div>
          <p className="label-caps text-success">✓ {dict.app.tx.confirmedShort}</p>
          <h2 className="font-display mt-2 text-4xl leading-none">{t(r.doneTitle, { lot: registered.id })}</h2>
          <p className="mt-3 max-w-md text-muted-foreground">{r.doneBody}</p>
          <TxFeedback state={action.state} className="mt-4" />
          <div className="no-print mt-6 flex flex-wrap gap-2">
            <Button onClick={() => window.print()}>
              <Printer aria-hidden />
              {r.print}
            </Button>
            <Button asChild variant="outline">
              <Link href={href(locale, `/app/batch/${registered.id}`)}>
                {r.open}
                <ArrowRight aria-hidden />
              </Link>
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setDone(null)
                action.reset()
                setLot(newLotCode(getState(), me.lotPrefix ?? "XX"))
              }}
            >
              <RotateCcw aria-hidden />
              {r.another}
            </Button>
          </div>
        </div>
        <LabelCard batch={registered} dict={dict} locale={locale} className="animate-tick shadow-hard" />
      </div>
    )
  }

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setF((prev) => ({ ...prev, [k]: v }))
  const carriers = orgsByRole("carrier")
  const receivers = ORGS.filter((o) => o.role !== "producer" && o.role !== "carrier")
  const allDownstream = ORGS.filter((o) => o.role !== "producer")

  const validate = (): RegisterInput | null => {
    const errs: typeof errors = {}
    const q = Number(f.quantity)
    if (!f.product.trim()) errs.product = r.errors.product
    if (!Number.isInteger(q) || q <= 0) errs.quantity = r.errors.quantity
    if (!f.origin.trim()) errs.origin = r.errors.origin
    if (!f.producedOn) errs.producedOn = r.errors.producedOn
    if (!f.carrier || !f.receiver) errs.route = r.errors.route
    const min = Number(f.min)
    const max = Number(f.max)
    if (f.cold && !(Number.isFinite(min) && Number.isFinite(max) && min < max)) errs.range = r.errors.range
    setErrors(errs)
    if (Object.keys(errs).length) return null
    const route = [f.carrier, f.receiver, f.final].filter((x) => x && x !== NONE)
    return {
      id: lot,
      industry: f.industry,
      product: f.product.trim(),
      quantity: q,
      unit: f.unit,
      unitSize: f.unitSize.trim() || undefined,
      origin: f.origin.trim(),
      producedOn: f.producedOn,
      certifications: f.certifications
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      route: Array.from(new Set(route)),
      coldChain: f.cold ? { min, max, loggerId: `LG-${2300 + Math.floor(Math.random() * 600)}` } : undefined,
      note: f.note.trim() || undefined,
    }
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const input = validate()
    if (!input) {
      requestAnimationFrame(() => document.querySelector<HTMLElement>("[aria-invalid=true]")?.focus())
      return
    }
    const at = new Date().toISOString()
    const rec = registerDraft(input, me.id, at)
    void action
      .run(
        {
          action: t(r.action, { count: num(input.quantity, locale), unit: unitLabel(dict.units, input.unit, input.quantity, locale), product: input.product }),
          batchId: input.id,
          recordHash: rec.hash,
        },
        (tx) => setState((s) => applyRegister(s, input, me.id, at, tx)),
      )
      .then((ok) => {
        if (ok) setDone(input.id)
      })
  }

  const orgSelect = (id: string, value: string, onChange: (v: string) => void, options: typeof ORGS, allowNone = false, invalid = false) => (
    <Select value={value || (allowNone ? NONE : undefined)} onValueChange={onChange}>
      <SelectTrigger id={id} aria-invalid={invalid} className={cn(invalid && "border-destructive")}>
        <SelectValue placeholder="—" />
      </SelectTrigger>
      <SelectContent>
        {allowNone && <SelectItem value={NONE}>{r.none}</SelectItem>}
        {options.map((o) => (
          <SelectItem key={o.id} value={o.id}>
            {o.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )

  return (
    <form onSubmit={submit} noValidate className="grid gap-8 lg:grid-cols-[1fr_18rem]">
      <div className="grid gap-6">
        <fieldset>
          <legend className="mb-2 text-sm font-semibold">{r.template}</legend>
          <div className="flex flex-wrap gap-1.5">
            {(["coffee", "vaccine", "timber", "blank"] as Template[]).map((k) => (
              <button
                key={k}
                type="button"
                aria-pressed={tpl === k}
                onClick={() => {
                  setTpl(k)
                  setF(template(k, locale, me.city))
                  setErrors({})
                }}
                className={cn(
                  "h-9 rounded-sm border px-3 text-[13px] font-semibold",
                  tpl === k ? "border-rule bg-foreground text-background" : "border-input bg-card hover:bg-muted",
                )}
              >
                {r.templates[k]}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="grid gap-4 border-t-2 border-rule pt-6 sm:grid-cols-2">
          <Field id="rg-product" label={r.product} error={errors.product} className="sm:col-span-2">
            <Input
              id="rg-product"
              value={f.product}
              onChange={(e) => set("product", e.target.value)}
              aria-invalid={!!errors.product}
              aria-describedby={describedBy("rg-product", errors.product)}
            />
          </Field>
          <div className="grid grid-cols-[1fr_1fr] gap-3">
            <Field id="rg-qty" label={r.quantity} error={errors.quantity}>
              <Input
                id="rg-qty"
                inputMode="numeric"
                value={f.quantity}
                onChange={(e) => set("quantity", e.target.value)}
                aria-invalid={!!errors.quantity}
                aria-describedby={describedBy("rg-qty", errors.quantity)}
                className="font-mono"
              />
            </Field>
            <Field id="rg-unit" label={r.unit}>
              <Select value={f.unit} onValueChange={(v) => set("unit", v as Unit)}>
                <SelectTrigger id="rg-unit">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNITS.map((u) => (
                    <SelectItem key={u} value={u}>
                      {dict.units[u].other}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <Field id="rg-size" label={`${r.unitSize} (${dict.common.optional})`}>
            <Input id="rg-size" value={f.unitSize} onChange={(e) => set("unitSize", e.target.value)} placeholder={r.unitSizePlaceholder} />
          </Field>
          <Field id="rg-origin" label={r.origin} error={errors.origin}>
            <Input
              id="rg-origin"
              value={f.origin}
              onChange={(e) => set("origin", e.target.value)}
              placeholder={r.originPlaceholder}
              aria-invalid={!!errors.origin}
              aria-describedby={describedBy("rg-origin", errors.origin)}
            />
          </Field>
          <Field id="rg-date" label={r.producedOn} error={errors.producedOn}>
            <Input
              id="rg-date"
              type="date"
              value={f.producedOn}
              max={today()}
              onChange={(e) => set("producedOn", e.target.value)}
              aria-invalid={!!errors.producedOn}
              aria-describedby={describedBy("rg-date", errors.producedOn)}
            />
          </Field>
          <Field id="rg-certs" label={`${r.certifications} (${dict.common.optional})`} hint={r.certificationsHint} className="sm:col-span-2">
            <Input id="rg-certs" value={f.certifications} onChange={(e) => set("certifications", e.target.value)} aria-describedby="rg-certs-hint" />
          </Field>
          <Field id="rg-note" label={`${r.note} (${dict.common.optional})`} className="sm:col-span-2">
            <Textarea id="rg-note" rows={2} value={f.note} onChange={(e) => set("note", e.target.value)} />
          </Field>
        </div>

        <fieldset className="grid gap-4 border-t-2 border-rule pt-6">
          <legend className="sr-only">{r.route}</legend>
          <div>
            <p className="text-sm font-semibold" aria-hidden>
              {r.route}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field id="rg-carrier" label={`1 · ${r.carrier}`}>
              {orgSelect("rg-carrier", f.carrier, (v) => set("carrier", v), carriers, false, !!errors.route && !f.carrier)}
            </Field>
            <Field id="rg-receiver" label={`2 · ${r.receiver}`}>
              {orgSelect("rg-receiver", f.receiver, (v) => set("receiver", v), receivers, false, !!errors.route && !f.receiver)}
            </Field>
            <Field id="rg-final" label={`3 · ${r.final} (${dict.common.optional})`}>
              {orgSelect("rg-final", f.final, (v) => set("final", v === NONE ? "" : v), allDownstream, true)}
            </Field>
          </div>
          {errors.route && <p className="text-xs font-semibold text-destructive">{errors.route}</p>}
        </fieldset>

        <fieldset className="grid gap-4 border-t-2 border-rule pt-6">
          <legend className="sr-only">{r.coldChain}</legend>
          <div className="flex items-start justify-between gap-4">
            <div>
              <label htmlFor="rg-cold" className="text-sm font-semibold">
                {r.coldChain}
              </label>
              <p className="text-xs text-muted-foreground">{r.coldChainHint}</p>
            </div>
            <Switch id="rg-cold" checked={f.cold} onCheckedChange={(v) => set("cold", v)} />
          </div>
          {f.cold && (
            <div className="grid max-w-xs grid-cols-2 gap-3">
              <Field id="rg-min" label={r.min} error={errors.range}>
                <Input id="rg-min" inputMode="decimal" value={f.min} onChange={(e) => set("min", e.target.value)} aria-invalid={!!errors.range} className="font-mono" />
              </Field>
              <Field id="rg-max" label={r.max}>
                <Input id="rg-max" inputMode="decimal" value={f.max} onChange={(e) => set("max", e.target.value)} aria-invalid={!!errors.range} className="font-mono" />
              </Field>
            </div>
          )}
        </fieldset>
      </div>

      <aside className="h-fit border-2 border-rule bg-card p-4 shadow-hard lg:sticky lg:top-24">
        <p className="label-caps text-[10px] text-muted-foreground">{r.lotCode}</p>
        <p className="font-mono text-3xl font-bold">{lot}</p>
        <p className="mt-4 text-sm">
          <span className="text-muted-foreground">{dict.app.sign.signingAs}</span>
          <br />
          <span className="font-semibold">{me.name}</span>
        </p>
        <Button type="submit" variant="hi" size="lg" className="mt-5 w-full" disabled={action.busy}>
          {r.submit}
        </Button>
        <TxFeedback state={action.state} className="mt-4" onRetry={() => document.querySelector<HTMLFormElement>("form")?.requestSubmit()} />
      </aside>
    </form>
  )
}
