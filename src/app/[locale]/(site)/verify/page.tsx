import { notFound } from "next/navigation"
import { Suspense } from "react"

import { VerifyView } from "@/components/demo/verify-view"
import { I18nProvider } from "@/components/i18n-provider"
import { isLocale } from "@/i18n/config"
import { getDictionary } from "@/i18n"
import { pageMetadata } from "@/lib/metadata"

export async function generateMetadata({ params }: PageProps<"/[locale]/verify">) {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  const d = getDictionary(locale)
  return pageMetadata(locale, "/verify", d.verify.title, d.verify.intro)
}

export default async function VerifyPage({ params }: PageProps<"/[locale]/verify">) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const dict = getDictionary(locale)
  return (
    <I18nProvider locale={locale} dict={dict}>
      <Suspense
        fallback={
          <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
            <h1 className="font-display text-4xl leading-none sm:text-6xl">{dict.verify.title}</h1>
          </div>
        }
      >
        <VerifyView />
      </Suspense>
    </I18nProvider>
  )
}
