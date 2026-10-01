import { notFound } from "next/navigation"

import { WalletGate } from "@/components/demo/app-shell"
import { Overview } from "@/components/demo/overview"
import { isLocale } from "@/i18n/config"
import { getDictionary } from "@/i18n"
import { pageMetadata } from "@/lib/metadata"

export async function generateMetadata({ params }: PageProps<"/[locale]/app">) {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  const d = getDictionary(locale)
  return pageMetadata(locale, "/app", d.app.overview.title, d.app.gate.body)
}

export default async function AppPage({ params }: PageProps<"/[locale]/app">) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  return (
    <WalletGate>
      <Overview />
    </WalletGate>
  )
}
