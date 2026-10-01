"use client"

import { ArrowRight, ChevronDown, Inbox, Package, Thermometer } from "lucide-react"
import Link from "next/link"
import { useMemo, useState } from "react"

import { useI18n } from "@/components/i18n-provider"
import { FlagChip, StatusChip } from "@/components/passport/manifest"
import { recordTitle } from "@/components/passport/record-list"
import { Button } from "@/components/ui/button"
import { href } from "@/i18n/config"
import { t } from "@/i18n/t"
import { batchStatus, excursions, lastEvent, nextOnRoute } from "@/lib/demo/ops"
import { getOrg, org } from "@/lib/demo/orgs"
import { useDemo } from "@/lib/demo/store"
import type { Batch, BatchStatus, LedgerEvent } from "@/lib/demo/types"
import { dateTime, lt, num, qty, unitLabel } from "@/lib/format"
import { cn } from "@/lib/utils"

type Filter = "all" | BatchStatus | "flagged"
const FILTERS: Filter[] = ["all", "handoff", "moving", "origin", "delivered", "flagged"]

export function Overview() {
  const { dict, locale } = useI18n()
  const o = dict.app.overview
  const batchesMap = useDemo((s) => s.batches)
  const order = useDemo((s) => s.order)
  const orgId = useDemo((s) => s.wallet.orgId)
  const me = getOrg(orgId)
  const [filter, setFilter] = useState<Filter>("all")

  const batches = useMemo(() => order.map((id) => batchesMap[id]).filter((b): b is Batch => !!b), [order, batchesMap])
  const inbox = batches.filter((b) => b.pending?.to === orgId)
  const sent = batches.filter((b) => b.pending?.from === orgId)
  const custody = batches.filter((b) => b.custodian === orgId && !b.pending)
  const filtered = batches.filter((b) => (filter === "all" ? true : filter === "flagged" ? excursions(b).length > 0 : batchStatus(b) === filter))
  const activity = useMemo(() => {
    const all: { e: LedgerEvent; b: Batch }[] = []
    for (const b of batches) for (const e of b.events) all.push({ e, b })
    return all.sort((a, b) => (a.e.at < b.e.at ? 1 : -1)).slice(0, 8)
  }, [batches])

  if (!me) return null
  const link = (b: Batch) => href(locale, `/app/batch/${b.id}`)

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 md:py-12">
      <header className="border-b-2 border-rule pb-6">
        <h1 className="font-display text-4xl leading-none sm:text-5xl">{o.title}</h1>
        <p className="mt-2 text-muted-foreground">{t(o.subtitle, { org: me.name, role: dict.roles[me.role].toLowerCase(), city: me.city })}</p>
      </header>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_18rem]">
        <div className="min-w-0 space-y-10">
          {/* Inbox */}
          <section aria-labelledby="inbox-h">
            <h2 id="inbox-h" className="label-caps flex items-center gap-2">
              <Inbox className="size-4" aria-hidden />
              {o.inboxTitle}
              {inbox.length > 0 && <span className="rounded-sm bg-hi px-1.5 font-mono text-hi-ink">{inbox.length}</span>}
            </h2>
            {inbox.length === 0 ? (
              <p className="mt-3 border border-dashed border-input px-4 py-5 text-sm text-muted-foreground">{o.inboxEmpty}</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {inbox.map((b) => (
                  <li key={b.id} className="flex flex-col gap-3 border-2 border-rule border-l-8 border-l-hi bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="font-semibold">
                        {t(o.inboxItem, { org: org(b.pending!.from).name, count: num(b.pending!.count, locale), unit: unitLabel(dict.units, b.unit, b.pending!.count, locale) })}
                      </p>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        <span className="font-mono font-semibold text-foreground">{b.id}</span> · {lt(b.product, locale)}
                      </p>
                      {excursions(b).length > 0 && <FlagChip label={dict.status.flagged} className="mt-2" />}
                    </div>
                    <Button asChild variant="hi" className="shrink-0">
                      <Link href={link(b)}>
                        {o.review}
                        <ArrowRight aria-hidden />
                      </Link>
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {sent.length > 0 && (
            <section aria-labelledby="sent-h">
              <h2 id="sent-h" className="label-caps">{o.sentTitle}</h2>
              <ul className="mt-3 divide-y divide-border border-y border-border">
                {sent.map((b) => (
                  <li key={b.id} className="flex items-center justify-between gap-3 py-3">
                    <Link href={link(b)} className="min-w-0 hover:underline">
                      <span className="font-mono font-semibold">{b.id}</span>
                      <span className="block truncate text-sm text-muted-foreground">{t(o.sentItem, { org: org(b.pending!.to).name })}</span>
                    </Link>
                    <StatusChip batch={b} dict={dict} />
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Custody */}
          <section aria-labelledby="custody-h">
            <h2 id="custody-h" className="label-caps flex items-center gap-2">
              <Package className="size-4" aria-hidden />
              {o.custodyTitle}
            </h2>
            {custody.length === 0 ? (
              <p className="mt-3 border border-dashed border-input px-4 py-5 text-sm text-muted-foreground">{o.custodyEmpty}</p>
            ) : (
              <ul className="mt-3 grid gap-3 sm:grid-cols-2">
                {custody.map((b) => {
                  const next = nextOnRoute(b)
                  return (
                    <li key={b.id}>
                      <Link href={link(b)} className="group flex h-full flex-col border-2 border-rule bg-card p-4 transition-shadow hover:shadow-hard">
                        <span className="flex items-center justify-between gap-2">
                          <span className="font-mono text-lg font-bold">{b.id}</span>
                          <StatusChip batch={b} dict={dict} />
                        </span>
                        <span className="mt-1 text-sm font-medium">{lt(b.product, locale)}</span>
                        <span className="mt-0.5 text-sm text-muted-foreground">{qty(dict.units, b.unit, b.quantity, locale)}</span>
                        {b.unsealed.length > 0 && (
                          <span className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-warning">
                            <Thermometer className="size-4" aria-hidden />
                            {t(o.unsealed, { n: b.unsealed.length })}
                          </span>
                        )}
                        <span className="mt-auto flex items-center justify-between pt-3 text-sm">
                          <span className="text-muted-foreground">{next ? t(o.next, { org: org(next).name }) : o.endOfRoute}</span>
                          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
                        </span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>

          {/* All batches */}
          <section aria-labelledby="all-h">
            <h2 id="all-h" className="label-caps">{o.allTitle}</h2>
            <div role="group" aria-label={o.filterLabel} className="mt-3 flex flex-wrap gap-1.5">
              {FILTERS.map((f) => (
                <button
                  key={f}
                  type="button"
                  aria-pressed={filter === f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    "h-9 rounded-sm border px-3 text-[13px] font-semibold transition-colors",
                    filter === f ? "border-rule bg-foreground text-background" : "border-input bg-card hover:bg-muted",
                  )}
                >
                  {o.filters[f]}
                </button>
              ))}
            </div>
            {filtered.length === 0 ? (
              <p className="mt-4 border border-dashed border-input px-4 py-5 text-sm text-muted-foreground">{o.allEmpty}</p>
            ) : (
              <>
                <table className="mt-4 hidden w-full border-collapse text-left text-sm md:table">
                  <thead>
                    <tr className="border-b-2 border-rule">
                      {[o.columns.lot, o.columns.product, o.columns.custodian, o.columns.status, o.columns.updated].map((c) => (
                        <th key={c} scope="col" className="label-caps py-2 pr-3 text-[10px] text-muted-foreground">
                          {c}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((b) => {
                      const last = lastEvent(b)
                      return (
                        <tr key={b.id} className="border-b border-border hover:bg-card">
                          <td className="py-3 pr-3">
                            <Link href={link(b)} className="font-mono font-bold whitespace-nowrap underline decoration-hi decoration-2 underline-offset-4">
                              {b.id}
                            </Link>
                          </td>
                          <td className="py-3 pr-3">{lt(b.product, locale)}</td>
                          <td className="py-3 pr-3">{org(b.custodian).name}</td>
                          <td className="py-3 pr-3">
                            <span className="flex flex-wrap gap-1">
                              <StatusChip batch={b} dict={dict} />
                              {excursions(b).length > 0 && <FlagChip label={dict.status.flagged} />}
                            </span>
                          </td>
                          <td className="py-3 font-mono text-xs text-muted-foreground">{last ? dateTime(last.at, locale) : "—"}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                <ul className="mt-4 divide-y divide-border border-y border-border md:hidden">
                  {filtered.map((b) => (
                    <li key={b.id}>
                      <Link href={link(b)} className="flex items-start justify-between gap-3 py-3">
                        <span className="min-w-0">
                          <span className="font-mono font-bold">{b.id}</span>
                          <span className="block truncate text-sm">{lt(b.product, locale)}</span>
                          <span className="block text-xs text-muted-foreground">{org(b.custodian).name}</span>
                        </span>
                        <span className="flex shrink-0 flex-col items-end gap-1">
                          <StatusChip batch={b} dict={dict} />
                          {excursions(b).length > 0 && <FlagChip label={dict.status.flagged} />}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>
        </div>

        <aside className="space-y-8">
          <details className="group border-2 border-rule bg-card">
            <summary className="label-caps flex min-h-11 cursor-pointer list-none items-center gap-2 px-4 [&::-webkit-details-marker]:hidden">
              <span className="inline-block size-2.5 bg-hi ring-1 ring-rule" aria-hidden />
              {o.guide}
              <ChevronDown className="ml-auto size-4 transition-transform group-open:rotate-180" aria-hidden />
            </summary>
            <ol className="space-y-3 px-4 pb-4 text-sm">
              {o.guideSteps.map((s, i) => (
                <li key={s} className="flex gap-2">
                  <span className="font-mono font-bold text-muted-foreground">{i + 1}.</span>
                  <span>{s}</span>
                </li>
              ))}
            </ol>
          </details>
          <section aria-labelledby="act-h">
            <h2 id="act-h" className="label-caps">{o.activityTitle}</h2>
            {activity.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">{o.activityEmpty}</p>
            ) : (
              <ol className="mt-3 space-y-3">
                {activity.map(({ e, b }) => (
                  <li key={e.id} className="border-l-2 border-border pl-3 text-sm">
                    <p className="leading-snug">
                      <Link href={link(b)} className="font-mono font-semibold hover:underline">
                        {b.id}
                      </Link>{" "}
                      {recordTitle(e, dict)}
                    </p>
                    <p className="font-mono text-xs text-muted-foreground">{dateTime(e.at, locale)}</p>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </aside>
      </div>
    </div>
  )
}
