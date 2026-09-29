import type { Metadata, Viewport } from "next"
import { Archivo, JetBrains_Mono } from "next/font/google"
import { notFound } from "next/navigation"

import "../globals.css"

import { ThemeProvider } from "@/components/site/theme"
import { isLocale, locales, SITE_URL } from "@/i18n/config"
import { getDictionary } from "@/i18n"

const archivo = Archivo({
  subsets: ["latin", "latin-ext"],
  axes: ["wdth"],
  variable: "--font-archivo",
  display: "swap",
})

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
})

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export async function generateMetadata({ params }: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  const d = getDictionary(locale).meta
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: d.title, template: d.titleTemplate },
    description: d.description,
    applicationName: "ChainProof",
    openGraph: {
      type: "website",
      siteName: "ChainProof",
      title: d.title,
      description: d.description,
      locale: locale === "fr" ? "fr_CA" : "en_CA",
      url: `/${locale}`,
    },
    twitter: { card: "summary_large_image", title: d.title, description: d.description },
  }
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f3f1ea" },
    { media: "(prefers-color-scheme: dark)", color: "#111214" },
  ],
  width: "device-width",
  initialScale: 1,
}

export default async function LocaleLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const dict = getDictionary(locale)

  return (
    <html lang={locale} className={`${archivo.variable} ${jetbrains.variable}`} suppressHydrationWarning>
      <body className="flex min-h-dvh flex-col">
        <ThemeProvider>
          <a
            href="#main"
            className="sr-only z-[60] rounded-md bg-primary px-4 py-2 font-semibold text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
          >
            {dict.common.skip}
          </a>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
