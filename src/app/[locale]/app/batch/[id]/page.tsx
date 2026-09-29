import { notFound } from "next/navigation"

import { WalletGate } from "@/components/demo/app-shell"
import { BatchView } from "@/components/demo/batch-view"
import { isLocale, locales } from "@/i18n/config"
import { getDictionary } from "@/i18n"
import { seedState } from "@/lib/demo/seed"
import { lt } from "@/lib/format"
import { pageMetadata } from "@/lib/metadata"

const seeds = seedState()

/** Seed lots are prerendered; lots registered in the browser render on demand (client data). */
export function generateStaticParams() {
  return locales.flatMap((locale) => seeds.order.map((id) => ({ locale, id })))
}

export async function generateMetadata({ params }: PageProps<"/[locale]/app/batch/[id]">) {
  const { locale, id } = await params
  if (!isLocale(locale)) return {}
  const d = getDictionary(locale)
  const b = seeds.batches[id]
  return pageMetadata(locale, `/app/batch/${id}`, `${id}`, b ? lt(b.product, locale) : d.app.batch.notFoundBody)
}

export default async function BatchPage({ params }: PageProps<"/[locale]/app/batch/[id]">) {
  const { locale, id } = await params
  if (!isLocale(locale)) notFound()
  const code = decodeURIComponent(id).toUpperCase()
  return (
    <WalletGate>
      <BatchView id={code} />
    </WalletGate>
  )
}
