import { ArrowDown, ArrowRight } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

import { Stamp } from "@/components/passport/stamp"
import { Button } from "@/components/ui/button"
import { href, isLocale } from "@/i18n/config"
import { getDictionary, t } from "@/i18n"
import { seedState } from "@/lib/demo/seed"
import { shortHash } from "@/lib/format"
import { pageMetadata } from "@/lib/metadata"
import { cn } from "@/lib/utils"

export async function generateMetadata({ params }: PageProps<"/[locale]/how-it-works">) {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  const d = getDictionary(locale)
  return pageMetadata(locale, "/how-it-works", d.how.title, d.how.intro)
}

const ORDER = ["records", "handoff", "sensors", "verify", "privacy", "format"] as const

export default async function HowItWorks({ params }: PageProps<"/[locale]/how-it-works">) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const dict = getDictionary(locale)
  const h = dict.how
  const s = h.sections
  const sample = seedState().batches["HU-2584"]!
  const rec = sample.events[5]!
  const recordJson = JSON.stringify(
    {
      batchId: sample.id,
      seq: rec.seq,
      kind: rec.kind,
      actor: rec.actor,
      counterparty: rec.counterparty,
      at: rec.at,
      place: typeof rec.place === "string" ? rec.place : rec.place.en,
      data: rec.data,
      prevHash: rec.prevHash,
      hash: rec.hash,
      txHash: rec.txHash,
      block: rec.block,
    },
    null,
    2,
  )
  const chain = sample.events.slice(0, 4)
  const dg = s.handoff.diagram

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 md:py-16">
      <header className="max-w-3xl border-b-2 border-rule pb-8">
        <h1 className="font-display text-5xl leading-none sm:text-6xl">{h.title}</h1>
        <p className="mt-4 text-lg text-muted-foreground">{h.intro}</p>
      </header>

      <div className="mt-10 grid gap-10 lg:grid-cols-[13rem_1fr]">
        <nav aria-label={h.toc} className="lg:sticky lg:top-24 lg:self-start">
          <p className="label-caps text-[10px] text-muted-foreground">{h.toc}</p>
          <ol className="mt-2 space-y-1 text-sm">
            {ORDER.map((k, i) => (
              <li key={k}>
                <a href={`#${k}`} className="flex min-h-9 items-center gap-2 font-medium hover:underline">
                  <span className="font-mono text-xs text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                  {s[k].title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="min-w-0 space-y-16">
          {ORDER.map((k, i) => (
            <section key={k} id={k} aria-labelledby={`${k}-h`} className="scroll-mt-24">
              <p className="font-mono text-sm font-bold text-muted-foreground">{String(i + 1).padStart(2, "0")}</p>
              <h2 id={`${k}-h`} className="font-display mt-1 text-3xl leading-tight sm:text-4xl">
                {s[k].title}
              </h2>
              <div className="mt-4 max-w-2xl space-y-4 text-lg leading-relaxed">
                {s[k].body.map((p) => (
                  <p key={p}>{p}</p>
                ))}
              </div>

              {k === "handoff" && (
                <figure className="mt-8 border-2 border-rule bg-card p-4 sm:p-6">
                  <div className="grid items-center gap-4 md:grid-cols-[12rem_2.5rem_1fr]" role="img" aria-label={dg.label}>
                    <div className="border-2 border-rule bg-hi p-3 text-hi-ink">
                      <p className="font-bold">{dg.sent}</p>
                      <p className="text-sm">{dg.sentSub}</p>
                    </div>
                    <ArrowRight className="mx-auto hidden size-6 md:block" aria-hidden />
                    <ArrowDown className="mx-auto size-6 md:hidden" aria-hidden />
                    <ul className="grid gap-2 sm:grid-cols-2">
                      {(
                        [
                          ["ok", dg.accepted, dg.custodyMoves, dict.stamp.accepted],
                          ["exception", dg.exception, dg.custodyMoves, dict.stamp.exception],
                          ["refused", dg.refused, dg.custodyStays, dict.stamp.refused],
                          ["awaiting", dg.cancelled, dg.custodyStays, "—"],
                        ] as const
                      ).map(([tone, label, sub, stamp]) => (
                        <li key={label} className="flex items-center justify-between gap-3 border border-border bg-background p-3">
                          <span>
                            <span className="block font-semibold">{label}</span>
                            <span className="block text-sm text-muted-foreground">{sub}</span>
                          </span>
                          {stamp !== "—" && <Stamp tone={tone} label={stamp} compact />}
                        </li>
                      ))}
                    </ul>
                  </div>
                </figure>
              )}

              {k === "verify" && (
                <figure className="mt-8 border-2 border-rule bg-card p-4 sm:p-6">
                  <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" role="img" aria-label={s.verify.diagram.label}>
                    {chain.map((e, j) => {
                      const broken = j >= 2
                      return (
                        <li
                          key={e.id}
                          className={cn("relative border-2 p-3 font-mono text-xs", broken ? "border-destructive bg-danger-soft" : "border-rule bg-background")}
                        >
                          <p className={cn("font-sans text-sm font-bold", broken && "text-destructive")}>
                            {t(s.verify.diagram.record, { n: e.seq })}
                            {j === 2 && (
                              <span className="label-caps ml-2 rounded-sm bg-destructive px-1 text-[9px] text-destructive-foreground">{s.verify.diagram.edited}</span>
                            )}
                          </p>
                          <p className="mt-2 text-muted-foreground">prev {shortHash(e.prevHash)}</p>
                          <p className={cn(broken && "text-destructive line-through")}>hash {shortHash(e.hash)}</p>
                        </li>
                      )
                    })}
                  </ol>
                </figure>
              )}

              {k === "format" && (
                <figure className="mt-6">
                  <figcaption className="label-caps mb-2 text-[10px] text-muted-foreground">{s.format.codeLabel}</figcaption>
                  <pre className="overflow-x-auto border-2 border-rule bg-[#15171a] p-4 font-mono text-[12px] leading-relaxed text-[#ece9e0]">
                    <code>{recordJson}</code>
                  </pre>
                </figure>
              )}
            </section>
          ))}

          <Button asChild size="lg">
            <Link href={href(locale, "/app")}>
              {h.cta}
              <ArrowRight aria-hidden />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
