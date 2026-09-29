import { Check } from "lucide-react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { isLocale } from "@/i18n/config"
import { getDictionary } from "@/i18n"
import { cn } from "@/lib/utils"

/** Internal strategy review only: never linked, not in the sitemap, not indexed. */
export async function generateMetadata({ params }: PageProps<"/[locale]/pricing">): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  const d = getDictionary(locale)
  return { title: d.pricing.title, description: d.pricing.intro, robots: { index: false, follow: false } }
}

export default async function Pricing({ params }: PageProps<"/[locale]/pricing">) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const p = getDictionary(locale).pricing
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 md:py-16">
      <p className="label-caps inline-block rounded-sm bg-hi px-2 py-1 text-[11px] text-hi-ink">{p.internal}</p>
      <h1 className="font-display mt-5 text-5xl leading-none sm:text-6xl">{p.title}</h1>
      <p className="mt-4 max-w-2xl text-lg text-muted-foreground">{p.intro}</p>

      <ul className="mt-10 grid gap-4 md:grid-cols-3">
        {p.plans.map((plan, i) => (
          <li key={plan.name} className={cn("flex flex-col border-2 border-rule bg-card p-5", i === 1 && "shadow-hard")}>
            <p className="label-caps">{plan.name}</p>
            <p className="mt-3 flex flex-wrap items-baseline gap-x-1.5">
              <span className="font-display text-4xl">{plan.price}</span>
              {plan.cadence && <span className="text-sm text-muted-foreground">{plan.cadence}</span>}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">{plan.body}</p>
            <ul className="mt-5 space-y-2 border-t border-border pt-4 text-sm">
              {plan.features.map((f) => (
                <li key={f} className="flex gap-2">
                  <Check className="mt-0.5 size-4 shrink-0" aria-hidden />
                  {f}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>

      <div className="mt-10 grid gap-8 md:grid-cols-2">
        <section>
          <h2 className="text-xl font-bold">{p.overageTitle}</h2>
          <p className="mt-2 text-muted-foreground">{p.overage}</p>
        </section>
        <section>
          <h2 className="text-xl font-bold">{p.whyTitle}</h2>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-muted-foreground">
            {p.why.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}
