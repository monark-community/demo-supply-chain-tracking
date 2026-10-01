import { Flag } from "lucide-react"

import type { Dictionary } from "@/i18n"
import type { Locale } from "@/i18n/config"
import { t } from "@/i18n/t"
import { batchStatus, excursions } from "@/lib/demo/ops"
import { org } from "@/lib/demo/orgs"
import type { Batch } from "@/lib/demo/types"
import { dayOnly, lt, qty, temp } from "@/lib/format"
import { cn } from "@/lib/utils"

import { RouteRail } from "./route-rail"

export function StatusChip({ batch, dict, className }: { batch: Batch; dict: Dictionary; className?: string }) {
  const s = batchStatus(batch)
  return (
    <span
      className={cn(
        "label-caps inline-flex h-6 items-center gap-1.5 rounded-sm border px-2 text-[11px] whitespace-nowrap",
        s === "handoff" && "border-rule bg-hi text-hi-ink",
        s === "delivered" && "border-success text-success",
        (s === "moving" || s === "origin") && "border-input text-foreground",
        className,
      )}
    >
      {dict.status[s]}
    </span>
  )
}

export function FlagChip({ label, className }: { label: string; className?: string }) {
  return (
    <span
      className={cn(
        "label-caps inline-flex h-6 items-center gap-1 rounded-sm border border-destructive bg-danger-soft px-2 text-[11px] whitespace-nowrap text-destructive",
        className,
      )}
    >
      <Flag className="size-3" aria-hidden />
      {label}
    </span>
  )
}

/** The batch "passport" drawn as a shipping manifest: lot header, facts, custody route, optional footer. */
export function Manifest({
  batch,
  dict,
  locale,
  animate = false,
  footer,
  headingLevel = 2,
  className,
}: {
  batch: Batch
  dict: Dictionary
  locale: Locale
  animate?: boolean
  footer?: React.ReactNode
  headingLevel?: 1 | 2 | 3
  className?: string
}) {
  const p = dict.passport
  const flags = excursions(batch)
  const H = `h${headingLevel}` as "h1" | "h2" | "h3"
  const producer = org(batch.route[0] ?? "")
  const facts: [string, string][] = [
    [p.quantity, `${qty(dict.units, batch.unit, batch.quantity, locale)}${batch.unitSize ? ` × ${lt(batch.unitSize, locale)}` : ""}`],
    [p.origin, `${lt(batch.origin, locale)} · ${producer.name}`],
    [p.produced, dayOnly(batch.producedOn, locale)],
    [p.certifications, batch.certifications.length ? batch.certifications.join(", ") : "—"],
  ]
  return (
    <article className={cn("border-2 border-rule bg-card text-card-foreground", className)}>
      <header className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-rule px-4 py-3 sm:px-5">
        <p className="flex items-baseline gap-2">
          <span className="label-caps text-muted-foreground">{p.lot}</span>
          <span className="font-mono text-2xl font-bold tracking-tight sm:text-[28px]">{batch.id}</span>
        </p>
        <div className="flex flex-wrap gap-1.5">
          {flags.length > 0 && <FlagChip label={dict.status.flagged} />}
          <StatusChip batch={batch} dict={dict} />
        </div>
      </header>
      <div className="px-4 pt-4 pb-2 sm:px-5">
        <H className="font-display text-2xl leading-tight sm:text-[28px]">{lt(batch.product, locale)}</H>
        <dl className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
          {facts.map(([k, v]) => (
            <div key={k} className="min-w-0">
              <dt className="label-caps text-[10px] text-muted-foreground">{k}</dt>
              <dd className="truncate font-medium" title={v}>
                {v}
              </dd>
            </div>
          ))}
        </dl>
        {batch.coldChain && (
          <p className="mt-2 font-mono text-xs text-muted-foreground">
            {t(dict.record.coldChain, { min: batch.coldChain.min, max: batch.coldChain.max, logger: batch.coldChain.loggerId })}
          </p>
        )}
        {flags.map((f) => (
          <p key={f.id} className="mt-3 flex items-start gap-2 border-l-4 border-destructive bg-danger-soft px-3 py-2 text-sm font-medium text-destructive">
            <Flag className="mt-0.5 size-4 shrink-0" aria-hidden />
            {t(dict.record.excursion, { peak: temp(f.data.peak ?? 0, locale), minutes: f.data.minutes ?? 0, min: f.data.min ?? 0, max: f.data.max ?? 0 })}
          </p>
        ))}
      </div>
      <div className="px-3 pt-3 pb-4 sm:px-5">
        <p className="label-caps mb-1 text-[10px] text-muted-foreground">{p.route}</p>
        <RouteRail batch={batch} dict={dict} locale={locale} animate={animate} />
      </div>
      {footer && <footer className="border-t-2 border-rule px-4 py-3 sm:px-5">{footer}</footer>}
    </article>
  )
}
