import Link from "next/link"
import { locale as rootLocale } from "next/root-params"

import { SiteFooter } from "@/components/site/site-footer"
import { SiteHeader } from "@/components/site/site-header"
import { Button } from "@/components/ui/button"
import { href, isLocale, type Locale } from "@/i18n/config"
import { getDictionary } from "@/i18n"

async function currentLocale(): Promise<Locale> {
  const value = await rootLocale()
  return value && isLocale(value) ? value : "en"
}

export default async function NotFound() {
  const locale = await currentLocale()
  const dict = getDictionary(locale)
  const c = dict.notFound
  return (
    <>
      <SiteHeader locale={locale} dict={dict} />
      <main id="main" tabIndex={-1} className="flex flex-1 flex-col outline-none">
        <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-start justify-center px-4 py-20 sm:px-6">
          <div className="w-full border-2 border-rule bg-card p-6 shadow-hard sm:p-10">
            <p className="font-mono text-sm text-muted-foreground">
              ERR {c.code} · <span className="rounded-sm bg-hi px-1 text-hi-ink">NO RECORD</span>
            </p>
            <h1 className="font-display mt-4 text-4xl leading-none sm:text-6xl">{c.title}</h1>
            <p className="mt-4 max-w-lg text-lg text-muted-foreground">{c.body}</p>
            <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <Button asChild size="lg">
                <Link href={href(locale)}>{c.home}</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href={href(locale, "/app")}>{c.demo}</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter locale={locale} dict={dict} />
    </>
  )
}
