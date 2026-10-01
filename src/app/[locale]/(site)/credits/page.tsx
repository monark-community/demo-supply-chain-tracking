import Image from "next/image"
import { notFound } from "next/navigation"

import { isLocale } from "@/i18n/config"
import { getDictionary, t } from "@/i18n"
import { pageMetadata } from "@/lib/metadata"
import { PHOTOS } from "@/lib/photos"

export async function generateMetadata({ params }: PageProps<"/[locale]/credits">) {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  const d = getDictionary(locale)
  return pageMetadata(locale, "/credits", d.credits.title, d.credits.intro)
}

export default async function Credits({ params }: PageProps<"/[locale]/credits">) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const dict = getDictionary(locale)
  const c = dict.credits
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 md:py-16">
      <h1 className="font-display text-5xl leading-none">{c.title}</h1>
      <p className="mt-4 max-w-2xl text-lg text-muted-foreground">{c.intro}</p>
      <ul className="mt-10 divide-y divide-border border-y-2 border-rule">
        {Object.values(PHOTOS).map((p) => (
          <li key={p.page} className="grid gap-4 py-5 sm:grid-cols-[10rem_1fr] sm:items-center">
            <div className="relative aspect-[4/3] w-40 overflow-hidden border-2 border-rule">
              <Image src={p.src} alt="" fill sizes="160px" className="object-cover" />
            </div>
            <div>
              <p className="font-semibold">
                <a href={p.page} className="underline decoration-hi decoration-2 underline-offset-4" rel="noopener noreferrer">
                  {t(c.by, { name: p.name })}
                </a>
              </p>
              <p className="text-sm text-muted-foreground">
                <a href={p.profile} className="hover:underline" rel="noopener noreferrer">
                  {p.profile.replace("https://", "")}
                </a>
              </p>
              <p className="mt-1 text-sm">{t(c.usedOn, { where: p.where[locale] })}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
