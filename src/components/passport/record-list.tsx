import { CircleCheck, CircleX, Flag, Loader2 } from "lucide-react"

import type { Dictionary } from "@/i18n"
import { t } from "@/i18n/t"
import type { Locale } from "@/i18n/config"
import { org } from "@/lib/demo/orgs"
import type { Batch, LedgerEvent } from "@/lib/demo/types"
import { dateTime, lt, num, qty, shortHash, temp } from "@/lib/format"
import { cn } from "@/lib/utils"

import { Stamp } from "./stamp"

export type CheckState = "idle" | "running" | "ok" | "bad"

/** One-line human description of a record's payload. */
export function recordDetail(e: LedgerEvent, b: Batch, dict: Dictionary, locale: Locale): string[] {
  const d = e.data
  const out: string[] = []
  const r = dict.record
  if (e.kind === "readings-sealed" && d.readings) {
    out.push(t(r.readings, { n: d.readings, logger: d.loggerId ?? "", root: shortHash(d.root ?? "") }))
    return out
  }
  if (e.kind === "excursion" && d.peak !== undefined) {
    out.push(t(r.excursion, { peak: temp(d.peak, locale), minutes: d.minutes ?? 0, min: d.min ?? 0, max: d.max ?? 0 }))
    return out
  }
  if (typeof d.count === "number") {
    if (e.kind === "handoff-accepted" || e.kind === "handoff-exception" || e.kind === "handoff-refused") {
      out.push(t(r.counted, { count: num(d.count, locale) }))
      if (typeof d.declaredCount === "number" && d.declaredCount !== d.count) out.push(t(r.declared, { count: num(d.declaredCount, locale) }))
    } else {
      out.push(qty(dict.units, b.unit, d.count, locale))
    }
  }
  if (d.seal) out.push(t(r.seal, { seal: d.seal }) + (d.sealOk === true ? ` (${r.sealOk})` : d.sealOk === false ? ` (${r.sealBad})` : ""))
  if (e.kind === "registered" && d.min !== undefined && d.max !== undefined) {
    out.push(t(r.coldChain, { min: d.min, max: d.max, logger: d.loggerId ?? "" }))
  }
  return out
}

export function recordTitle(e: LedgerEvent, dict: Dictionary): string {
  return t(dict.events[e.kind], { actor: org(e.actor).name, cp: e.counterparty ? org(e.counterparty).name : "" })
}

export function RecordList({
  batch,
  events,
  dict,
  locale,
  checks,
  animateLast = false,
  compact = false,
}: {
  batch: Batch
  events?: LedgerEvent[]
  dict: Dictionary
  locale: Locale
  /** Per-record integrity state, aligned with `events`. */
  checks?: CheckState[]
  animateLast?: boolean
  compact?: boolean
}) {
  const list = events ?? batch.events
  return (
    <ol className="relative">
      {list.map((e, i) => {
        const check = checks?.[i]
        const note = lt(e.data.note, locale)
        const details = recordDetail(e, batch, dict, locale)
        const isAnswer = e.kind === "handoff-accepted" || e.kind === "handoff-exception" || e.kind === "handoff-refused"
        const isFlag = e.kind === "excursion"
        const last = i === list.length - 1
        return (
          <li
            key={e.id}
            className={cn(
              "relative grid grid-cols-[2.25rem_1fr] gap-x-3 pb-5 last:pb-0 sm:grid-cols-[2.5rem_1fr_auto] sm:gap-x-4",
              check === "bad" && "text-destructive",
            )}
          >
            {!last && <span aria-hidden className="absolute top-10 bottom-0 left-[1.05rem] w-0.5 bg-border sm:left-[1.2rem]" />}
            <span
              className={cn(
                "relative z-10 flex size-9 items-center justify-center rounded-sm border-2 font-mono text-xs font-bold sm:size-10",
                isFlag ? "border-destructive bg-danger-soft text-destructive" : "border-rule bg-card text-foreground",
                check === "bad" && "border-destructive bg-danger-soft text-destructive",
                check === "ok" && "border-success",
              )}
            >
              {isFlag ? <Flag className="size-4" aria-hidden /> : String(e.seq).padStart(2, "0")}
            </span>
            <div className="min-w-0">
              <p className="font-semibold leading-snug">{recordTitle(e, dict)}</p>
              <p className="text-sm text-muted-foreground">
                <time dateTime={e.at}>{dateTime(e.at, locale)}</time> · {lt(e.place, locale)}
              </p>
              {details.length > 0 && (
                <p className={cn("mt-1 font-mono text-[13px]", isFlag && "font-semibold text-destructive")}>{details.join(" · ")}</p>
              )}
              {note && <p className="mt-1 text-sm">“{note}”</p>}
              {!compact && (
                <p className="mt-1.5 flex flex-wrap gap-x-3 font-mono text-[11px] text-muted-foreground">
                  <span>{t(dict.record.block, { block: num(e.block, locale) })}</span>
                  <span title={e.hash}>
                    {dict.record.hash} {shortHash(e.hash)}
                  </span>
                </p>
              )}
              {isAnswer && (
                <div className="mt-2 sm:hidden">
                  <Stamp
                    tone={e.kind === "handoff-accepted" ? "ok" : e.kind === "handoff-exception" ? "exception" : "refused"}
                    label={e.kind === "handoff-accepted" ? dict.stamp.accepted : e.kind === "handoff-exception" ? dict.stamp.exception : dict.stamp.refused}
                    codes={`${org(e.counterparty ?? "").code} → ${org(e.actor).code}`}
                    animate={animateLast && last}
                  />
                </div>
              )}
            </div>
            <div className="hidden flex-col items-end gap-2 sm:flex">
              {isAnswer && (
                <Stamp
                  tone={e.kind === "handoff-accepted" ? "ok" : e.kind === "handoff-exception" ? "exception" : "refused"}
                  label={e.kind === "handoff-accepted" ? dict.stamp.accepted : e.kind === "handoff-exception" ? dict.stamp.exception : dict.stamp.refused}
                  codes={`${org(e.counterparty ?? "").code} → ${org(e.actor).code}`}
                  block={`#${num(e.block, locale)}`}
                  animate={animateLast && last}
                />
              )}
            </div>
            {check && check !== "idle" && (
              <span className="col-start-2 mt-1.5 inline-flex items-center gap-1.5 text-xs font-semibold sm:col-start-2">
                {check === "running" && <Loader2 className="size-3.5 animate-spin text-muted-foreground" aria-hidden />}
                {check === "ok" && <CircleCheck className="size-3.5 text-success animate-tick" aria-hidden />}
                {check === "bad" && <CircleX className="size-3.5 text-destructive animate-tick" aria-hidden />}
                <span className={check === "ok" ? "text-success" : check === "bad" ? "text-destructive" : "text-muted-foreground"}>
                  {check === "ok" ? dict.integrity.recordOk : check === "bad" ? dict.integrity.recordBad : "…"}
                </span>
              </span>
            )}
          </li>
        )
      })}
    </ol>
  )
}
