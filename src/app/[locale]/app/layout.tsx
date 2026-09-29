import { notFound } from "next/navigation"

import { SignProvider } from "@/components/demo/app-context"
import { DemoUiProvider, WalletControls } from "@/components/demo/app-shell"
import { DemoToaster } from "@/components/demo/toaster"
import { I18nProvider } from "@/components/i18n-provider"
import { SiteFooter } from "@/components/site/site-footer"
import { SiteHeader } from "@/components/site/site-header"
import { isLocale } from "@/i18n/config"
import { getDictionary } from "@/i18n"

export default async function AppLayout({ children, params }: LayoutProps<"/[locale]/app">) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const dict = getDictionary(locale)
  return (
    <I18nProvider locale={locale} dict={dict}>
      <SignProvider>
        <DemoUiProvider>
          <SiteHeader locale={locale} dict={dict} variant="app" actions={<WalletControls />} />
          <main id="main" tabIndex={-1} className="flex flex-1 flex-col outline-none">
            {children}
          </main>
          <SiteFooter locale={locale} dict={dict} />
          <DemoToaster />
        </DemoUiProvider>
      </SignProvider>
    </I18nProvider>
  )
}
