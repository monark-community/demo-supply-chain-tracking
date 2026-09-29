import { ArrowRight, Check, CircleCheck, Coffee, Syringe, TreePine, X } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"

import { Manifest } from "@/components/passport/manifest"
import { TempChart } from "@/components/passport/temp-chart"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { href, isLocale } from "@/i18n/config"
import { getDictionary, t } from "@/i18n"
import { seedState } from "@/lib/demo/seed"
import { verifyRecords } from "@/lib/demo/ops"
import { pageMetadata } from "@/lib/metadata"
import { PHOTOS } from "@/lib/photos"

export async function generateMetadata({ params }: PageProps<"/[locale]">) {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  const d = getDictionary(locale)
  return pageMetadata(locale, "/", null, d.meta.description)
}

const industryIcon = { coffee: Coffee, vaccine: Syringe, timber: TreePine } as const

export default async function Home({ params }: PageProps<"/[locale]">) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const dict = getDictionary(locale)
  const h = dict.home
  const seed = seedState()
  const hero = seed.batches["HU-2584"]!
  const vaccine = seed.batches["NV-0417"]!
  const n = hero.events.length
  const checks = verifyRecords(hero.id, hero.events, hero.events)
  const photos = [PHOTOS.harvest, PHOTOS.dock, PHOTOS.sacks]

  return (
    <>
      {/* Hero */}
      <section className="border-b-2 border-rule">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:py-16 lg:grid-cols-[1fr_1.05fr] lg:items-center lg:gap-12 lg:py-20">
          <div>
            <p className="label-caps flex items-center gap-2 text-muted-foreground">
              <span className="inline-block size-2.5 bg-hi ring-1 ring-rule" aria-hidden />
              {h.eyebrow}
            </p>
            <h1 className="font-display mt-5 text-[2.75rem] leading-[0.95] text-balance sm:text-6xl lg:text-[4.25rem]">{h.title}</h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">{h.subtitle}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href={href(locale, "/app")}>
                  {h.ctaPrimary}
                  <ArrowRight aria-hidden />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href={`${href(locale, "/verify")}?code=HU-2584`}>{h.ctaSecondary}</Link>
              </Button>
            </div>
            <p className="mt-6 text-xs text-muted-foreground">{dict.common.demoBadge}</p>
          </div>
          <figure className="min-w-0">
            <Manifest
              batch={hero}
              dict={dict}
              locale={locale}
              animate
              className="shadow-hard"
              footer={
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                  <span className="flex gap-1" aria-hidden>
                    {checks.map((c, i) => (
                      <CircleCheck key={c.seq} className="size-4 text-success animate-tick" style={{ animationDelay: `${1300 + i * 120}ms` }} />
                    ))}
                  </span>
                  <span className="text-sm font-semibold text-success">{t(dict.integrity.ok, { n })}</span>
                </div>
              }
            />
            <figcaption className="mt-3 font-mono text-xs text-muted-foreground">{h.heroCaption}</figcaption>
          </figure>
        </div>
      </section>

      {/* Compare */}
      <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 md:py-24">
        <h2 className="font-display max-w-3xl text-4xl leading-none text-balance sm:text-5xl">{h.compare.title}</h2>
        <div className="mt-10 grid gap-4 md:grid-cols-2 md:gap-6">
          <div className="border border-border bg-muted/60 p-5 sm:p-7">
            <h3 className="label-caps text-muted-foreground">{h.compare.leftTitle}</h3>
            <ul className="mt-5 space-y-4">
              {h.compare.left.map((item) => (
                <li key={item} className="flex gap-3 text-muted-foreground">
                  <X className="mt-1 size-4 shrink-0" aria-hidden />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="border-2 border-rule bg-card p-5 shadow-hard sm:p-7">
            <h3 className="label-caps">{h.compare.rightTitle}</h3>
            <ul className="mt-5 space-y-4">
              {h.compare.right.map((item) => (
                <li key={item} className="flex gap-3 font-medium">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center bg-hi text-hi-ink ring-1 ring-rule" aria-hidden>
                    <Check className="size-3.5" strokeWidth={3} />
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="border-y-2 border-rule bg-card">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 md:py-24">
          <h2 className="font-display text-4xl leading-none sm:text-5xl">{h.steps.title}</h2>
          <ol className="mt-10 grid gap-10 md:grid-cols-3 md:gap-6">
            {h.steps.items.map((step, i) => {
              const photo = photos[i]!
              return (
                <li key={step.title} className="flex flex-col">
                  <figure className="border-2 border-rule">
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <Image
                        src={photo.src}
                        alt={step.alt}
                        fill
                        sizes="(min-width: 768px) 33vw, 100vw"
                        className="object-cover"
                        placeholder="blur"
                      />
                    </div>
                    <figcaption className="label-caps flex items-center justify-between border-t-2 border-rule bg-background px-3 py-2 text-[10px]">
                      <span>{step.attachment}</span>
                      <span className="font-mono text-muted-foreground normal-case tracking-normal">© {photo.name}</span>
                    </figcaption>
                  </figure>
                  <p className="mt-5 font-mono text-sm font-bold text-muted-foreground">{String(i + 1).padStart(2, "0")}</p>
                  <h3 className="font-display mt-1 text-2xl leading-tight">{step.title}</h3>
                  <p className="mt-2 text-muted-foreground">{step.body}</p>
                </li>
              )
            })}
          </ol>
        </div>
      </section>

      {/* Breaks stay on the record */}
      <section className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-16 sm:px-6 md:py-24 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
        <div>
          <p className="label-caps text-muted-foreground">{h.breaks.eyebrow}</p>
          <h2 className="font-display mt-3 text-4xl leading-none sm:text-5xl">{h.breaks.title}</h2>
          <p className="mt-5 text-lg text-muted-foreground">{h.breaks.body}</p>
          <Button asChild variant="outline" className="mt-7">
            <Link href={href(locale, "/app/batch/NV-0417")}>
              {h.breaks.cta}
              <ArrowRight aria-hidden />
            </Link>
          </Button>
        </div>
        <figure className="min-w-0 border-2 border-rule bg-card p-3 sm:p-5">
          <TempChart
            sealed={vaccine.unsealed}
            cc={vaccine.coldChain!}
            locale={locale}
            labels={{
              chart: dict.app.readings.chart,
              outOfRange: dict.app.readings.outOfRange,
              unsealed: dict.app.readings.unsealed,
              range: t(dict.app.readings.range, { min: 2, max: 8 }),
            }}
          />
          <figcaption className="mt-2 font-mono text-xs text-muted-foreground">{h.breaks.chartCaption}</figcaption>
        </figure>
      </section>

      {/* Goods */}
      <section className="border-t-2 border-rule">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 md:py-24">
          <h2 className="font-display max-w-2xl text-4xl leading-none text-balance sm:text-5xl">{h.goods.title}</h2>
          <ul className="mt-10 border-t-2 border-rule">
            {h.goods.items.map((g) => {
              const Icon = industryIcon[g.industry as keyof typeof industryIcon]
              return (
                <li key={g.lot} className="grid gap-3 border-b border-border py-6 sm:grid-cols-[3rem_1fr_auto] sm:items-center sm:gap-6">
                  <span className="flex size-12 items-center justify-center border-2 border-rule bg-card" aria-hidden>
                    <Icon className="size-5" />
                  </span>
                  <div>
                    <h3 className="text-xl font-bold">{g.title}</h3>
                    <p className="text-muted-foreground">{g.body}</p>
                  </div>
                  <Link
                    href={href(locale, `/app/batch/${g.lot}`)}
                    className="inline-flex min-h-10 items-center gap-2 font-mono text-sm font-semibold underline decoration-hi decoration-2 underline-offset-4 hover:decoration-4"
                  >
                    {g.link}
                    <ArrowRight className="size-4" aria-hidden />
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t-2 border-rule bg-card">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-16 sm:px-6 md:grid-cols-[0.6fr_1.4fr] md:py-24">
          <h2 className="font-display text-4xl leading-none sm:text-5xl">{h.faq.title}</h2>
          <Accordion type="single" collapsible className="border-t-2 border-rule">
            {h.faq.items.map((item, i) => (
              <AccordionItem key={item.q} value={`q${i}`} className="border-border">
                <AccordionTrigger className="min-h-14 text-base font-semibold hover:no-underline">{item.q}</AccordionTrigger>
                <AccordionContent className="text-base text-muted-foreground">{item.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Closing */}
      <section className="border-t-2 border-rule bg-hi text-hi-ink">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-start gap-6 px-4 py-14 sm:px-6 md:flex-row md:items-end md:justify-between md:py-20">
          <div>
            <h2 className="font-display text-4xl leading-none sm:text-6xl">{h.closing.title}</h2>
            <p className="mt-3 text-lg font-medium">{h.closing.body}</p>
          </div>
          <Link
            href={href(locale, "/app")}
            className="inline-flex h-12 items-center gap-2 rounded-md bg-[#15171a] px-6 font-semibold text-[#f3f1ea] hover:bg-[#15171a]/88 focus-visible:outline-[#15171a]"
          >
            {h.closing.cta}
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      </section>
    </>
  )
}
