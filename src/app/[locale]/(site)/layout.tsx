import { notFound } from "next/navigation"

import { SiteFooter } from "@/components/site/site-footer"
import { SiteHeader } from "@/components/site/site-header"
import { isLocale } from "@/i18n/config"
import { getDictionary } from "@/i18n"

export default async function SiteLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const dict = getDictionary(locale)
  return (
    <>
      <SiteHeader locale={locale} dict={dict} />
      <main id="main" tabIndex={-1} className="flex flex-1 flex-col outline-none">
        {children}
      </main>
      <SiteFooter locale={locale} dict={dict} />
    </>
  )
}
