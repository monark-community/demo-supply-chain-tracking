"use client"

import { ArrowLeft, ExternalLink, Flag, PackageCheck, Printer, ScrollText, Thermometer, Timer } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

import { useI18n } from "@/components/i18n-provider"
import { LabelCard } from "@/components/passport/label-card"
import { Manifest } from "@/components/passport/manifest"
import { RecordList } from "@/components/passport/record-list"
import { TempChart } from "@/components/passport/temp-chart"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { href } from "@/i18n/config"
import { t } from "@/i18n/t"
import {
  applyCancel,
  applyCheckpoint,
  applyHandoff,
  applyReview,
  applySeal,
  cancelDraft,
  checkpointDraft,
  draftRecord,
  handoffDraft,
  nextOnRoute,
  reviewDraft,
  sealDrafts,
  type DraftEvent,
} from "@/lib/demo/ops"
import { org } from "@/lib/demo/orgs"
import { findExcursion } from "@/lib/demo/readings"
import { setState, useDemo } from "@/lib/demo/store"
import { num, shortHash, temp, unitLabel } from "@/lib/format"

import { useLedgerAction } from "./app-context"
import { useDemoUi } from "./app-shell"
import { CheckpointDialog, HandoffDialog, ReviewDialog, SealDialog } from "./batch-dialogs"
import { TxFeedback } from "./tx-feedback"

type DialogKind = "handoff" | "review" | "checkpoint" | "seal" | null

export function BatchView({ id }: { id: string }) {
  const { dict, locale } = useI18n()
  const b = dict.app.batch
  const batch = useDemo((s) => s.batches[id])
  const me = useDemo((s) => s.wallet.orgId)
  const ui = useDemoUi()
  const action = useLedgerAction()
  const [dialog, setDialog] = useState<DialogKind>(null)
  const [stampKey, setStampKey] = useState(0)
  const [tab, setTab] = useState("record")

  if (!batch) {
    return (
      <section className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6">
        <div className="border-2 border-rule bg-card p-6 sm:p-10">
          <p className="font-mono text-sm text-muted-foreground">{id}</p>
          <h1 className="font-display mt-2 text-4xl leading-none">{b.notFoundTitle}</h1>
          <p className="mt-3 text-muted-foreground">{b.notFoundBody}</p>
          <Button asChild className="mt-6">
            <Link href={href(locale, "/app")}>
              <ArrowLeft aria-hidden />
              {b.back}
            </Link>
          </Button>
        </div>
      </section>
    )
  }

  const unitFor = (n: number) => unitLabel(dict.units, batch.unit, n, locale)
  const now = () => new Date().toISOString()
  const actor = me ?? ""

  /** Sign + anchor a single drafted record, then apply it to the store. */
  const runDraft = (d: DraftEvent, label: string, apply: (tx: { txHash: `0x${string}`; block: number }) => void, stamp = false) => {
    setDialog(null)
    const rec = draftRecord(batch, d)
    void action
      .run({ action: label, batchId: batch.id, recordHash: rec.hash }, (tx) => apply(tx))
      .then((ok) => {
        if (ok && stamp) setStampKey((k) => k + 1)
      })
  }

  const next = nextOnRoute(batch)
  const pending = batch.pending
  const isCustodian = batch.custodian === me
  const excursionsNow = findExcursion(batch.unsealed, batch.coldChain ?? { min: -99, max: 99, loggerId: "" })

  /* ---------------------------------------------------------- action panel */
  let panel: React.ReactNode
  if (pending && pending.to === me) {
    panel = (
      <>
        <h2 className="text-lg font-bold">{t(b.reviewTitle, { org: org(pending.from).name })}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t(b.reviewBody, { count: num(pending.count, locale), unit: unitFor(pending.count), seal: pending.seal })}
        </p>
        <Button variant="hi" className="mt-4 w-full" onClick={() => setDialog("review")} disabled={action.busy}>
          <PackageCheck aria-hidden />
          {b.reviewButton}
        </Button>
      </>
    )
  } else if (pending && pending.from === me) {
    panel = (
      <>
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <Timer className="size-5" aria-hidden />
          {t(b.waitingTitle, { org: org(pending.to).name })}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{b.waitingBody}</p>
        <div className="mt-4 grid gap-2">
          <Button variant="hi" onClick={() => ui.switchTo(pending.to)}>
            {t(b.actAs, { org: org(pending.to).name })}
          </Button>
          <Button
            variant="outline"
            disabled={action.busy}
            onClick={() => {
              const d = cancelDraft(batch, actor, now())
              runDraft(d, t(dict.app.cancel.action, { org: org(pending.to).name }), (tx) => setState((s) => applyCancel(s, batch.id, d, tx)))
            }}
          >
            {b.cancelButton}
          </Button>
        </div>
      </>
    )
  } else if (isCustodian && !pending) {
    const blocked = batch.unsealed.length > 0
    panel = (
      <>
        <h2 className="text-lg font-bold">{next ? b.holdTitle : b.deliveredTitle}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{next ? t(b.holdBody, { org: org(next).name }) : b.deliveredBody}</p>
        {blocked && batch.coldChain && (
          <div className="mt-4 border-l-4 border-warning bg-warning-soft px-3 py-2.5">
            <p className="flex items-center gap-2 text-sm font-bold text-warning-ink">
              <Thermometer className="size-4" aria-hidden />
              {t(b.unsealedTitle, { logger: batch.coldChain.loggerId, n: batch.unsealed.length })}
            </p>
          </div>
        )}
        <div className="mt-4 grid gap-2">
          {blocked && (
            <Button variant="hi" onClick={() => setDialog("seal")} disabled={action.busy}>
              <Thermometer aria-hidden />
              {b.reviewReadings}
            </Button>
          )}
          {next && (
            <Button
              variant={blocked ? "outline" : "hi"}
              onClick={() => setDialog("handoff")}
              disabled={blocked || action.busy}
              aria-describedby={blocked ? "handoff-blocked" : undefined}
            >
              {t(b.handoffButton, { org: org(next).name })}
            </Button>
          )}
          {blocked && next && (
            <p id="handoff-blocked" className="text-xs text-muted-foreground">
              {b.handoffBlocked}
            </p>
          )}
          <Button variant="outline" onClick={() => setDialog("checkpoint")} disabled={action.busy}>
            <ScrollText aria-hidden />
            {b.checkpointButton}
          </Button>
        </div>
      </>
    )
  } else {
    const who = pending ? pending.to : batch.custodian
    panel = (
      <>
        <p className="text-sm text-muted-foreground">{t(b.actingAs, { org: org(me ?? "").name })}</p>
        <h2 className="mt-1 text-lg font-bold">{t(b.notYours, { org: org(who).name })}</h2>
        <Button variant="hi" className="mt-4 w-full" onClick={() => ui.switchTo(who)}>
          {t(b.actAs, { org: org(who).name })}
        </Button>
      </>
    )
  }

  const cc = batch.coldChain
  const lastSeal = [...batch.events].reverse().find((e) => e.kind === "readings-sealed")

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 md:py-10">
      <Link href={href(locale, "/app")} className="inline-flex min-h-10 items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden />
        {b.back}
      </Link>

      <div className="mt-3 grid gap-6 lg:grid-cols-[1fr_20rem] lg:items-start">
        <Manifest key={stampKey} batch={batch} dict={dict} locale={locale} animate={stampKey > 0} headingLevel={1} />

        <aside aria-labelledby="panel-h" className="border-2 border-rule bg-card p-4 shadow-hard lg:sticky lg:top-24">
          <p id="panel-h" className="label-caps mb-2 text-[10px] text-muted-foreground">
            {org(me ?? "").code} · {dict.roles[org(me ?? "").role]}
          </p>
          {panel}
          <TxFeedback state={action.state} className="mt-4" />
        </aside>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="mt-10">
        <TabsList aria-label={b.tabsLabel}>
          <TabsTrigger value="record">
            <ScrollText className="size-4" aria-hidden />
            {b.tabs.record}
          </TabsTrigger>
          <TabsTrigger value="sensors">
            <Thermometer className="size-4" aria-hidden />
            {b.tabs.sensors}
            {batch.unsealed.length > 0 && <span className="size-2 bg-hi ring-1 ring-rule" aria-hidden />}
          </TabsTrigger>
          <TabsTrigger value="label">{b.tabs.label}</TabsTrigger>
        </TabsList>

        <TabsContent value="record">
          <div className="max-w-3xl">
            <RecordList batch={batch} dict={dict} locale={locale} animateLast={stampKey > 0} />
          </div>
        </TabsContent>

        <TabsContent value="sensors">
          {!cc ? (
            <p className="border border-dashed border-input px-4 py-5 text-sm text-muted-foreground">{dict.app.readings.none}</p>
          ) : batch.sealed.length + batch.unsealed.length === 0 ? (
            <p className="border border-dashed border-input px-4 py-5 text-sm text-muted-foreground">{dict.app.readings.empty}</p>
          ) : (
            <div className="max-w-3xl space-y-3">
              <p className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs text-muted-foreground">
                <span>{t(dict.app.readings.logger, { id: cc.loggerId })}</span>
                <span>{t(dict.app.readings.range, { min: cc.min, max: cc.max })}</span>
                {batch.sealed.length > 0 && (
                  <span>
                    {dict.app.readings.sealed}: {batch.sealed.length}
                  </span>
                )}
                {batch.unsealed.length > 0 && (
                  <span className="font-semibold text-warning">
                    {dict.app.readings.unsealed}: {batch.unsealed.length}
                  </span>
                )}
              </p>
              <div className="border-2 border-rule bg-card p-3">
                <TempChart
                  sealed={batch.sealed}
                  unsealed={batch.unsealed}
                  cc={cc}
                  locale={locale}
                  labels={{
                    chart: dict.app.readings.chart,
                    outOfRange: dict.app.readings.outOfRange,
                    unsealed: dict.app.readings.unsealed,
                    range: t(dict.app.readings.range, { min: cc.min, max: cc.max }),
                  }}
                />
              </div>
              {lastSeal?.data.root && (
                <p className="font-mono text-xs text-muted-foreground">{t(dict.app.readings.sealedNote, { root: shortHash(lastSeal.data.root) })}</p>
              )}
              {batch.events
                .filter((e) => e.kind === "excursion")
                .map((e) => (
                  <p key={e.id} className="flex gap-2 border-l-4 border-destructive bg-danger-soft px-3 py-2 text-sm font-semibold text-destructive">
                    <Flag className="mt-0.5 size-4 shrink-0" aria-hidden />
                    {t(dict.record.excursion, { peak: temp(e.data.peak ?? 0, locale), minutes: e.data.minutes ?? 0, min: e.data.min ?? 0, max: e.data.max ?? 0 })}
                  </p>
                ))}
              {isCustodian && batch.unsealed.length > 0 && (
                <Button variant="hi" onClick={() => setDialog("seal")} disabled={action.busy}>
                  {t(dict.app.readings.seal, { n: batch.unsealed.length })}
                </Button>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="label">
          <div className="flex flex-col items-start gap-4">
            <LabelCard batch={batch} dict={dict} locale={locale} />
            <div className="no-print flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => window.print()}>
                <Printer aria-hidden />
                {dict.app.register.print}
              </Button>
              <Button asChild variant="outline">
                <Link href={`${href(locale, "/verify")}?code=${batch.id}`}>
                  <ExternalLink aria-hidden />
                  {b.openPassport}
                </Link>
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* dialogs (mounted only while open so their forms start fresh) */}
      {dialog === "handoff" && next && (
        <HandoffDialog
          batch={batch}
          to={next}
          open
          onOpenChange={(o) => !o && setDialog(null)}
          onSubmit={(v) => {
            const d = handoffDraft(batch, actor, v, now())
            runDraft(d, t(dict.app.handoff.action, { count: num(v.count, locale), unit: unitFor(v.count), org: org(v.to).name }), (tx) =>
              setState((s) => applyHandoff(s, batch.id, d, tx)),
            )
          }}
        />
      )}
      {dialog === "review" && pending && (
        <ReviewDialog
          batch={batch}
          open
          onOpenChange={(o) => !o && setDialog(null)}
          onSubmit={(v) => {
            const d = reviewDraft(batch, actor, v, now())
            const label = t(dict.app.review.action[v.decision], { count: num(v.count, locale), unit: unitFor(v.count), org: org(pending.from).name })
            runDraft(d, label, (tx) => setState((s) => applyReview(s, batch.id, d, tx)), true)
          }}
        />
      )}
      {dialog === "checkpoint" && (
        <CheckpointDialog
          batch={batch}
          open
          onOpenChange={(o) => !o && setDialog(null)}
          onSubmit={(v) => {
            const d = checkpointDraft(actor, v.note, v.place, now())
            runDraft(d, t(dict.app.checkpoint.action, { note: v.note }), (tx) => setState((s) => applyCheckpoint(s, batch.id, d, tx)))
          }}
        />
      )}
      {dialog === "seal" && cc && (
        <SealDialog
          batch={batch}
          open
          onOpenChange={(o) => !o && setDialog(null)}
          onSubmit={() => {
            const drafts = sealDrafts(batch, actor, now())
            const first = drafts[0]
            if (!first) return
            const label = t(excursionsNow ? dict.app.readings.actionFlag : dict.app.readings.action, { n: batch.unsealed.length, logger: cc.loggerId })
            runDraft(first, label, (tx) => {
              setState((s) => applySeal(s, batch.id, drafts, tx))
              setTab("sensors")
            })
          }}
        />
      )}
    </div>
  )
}
