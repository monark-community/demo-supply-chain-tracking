"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { Suspense } from "react"

import { locales, switchLocalePath, type Locale } from "@/i18n/config"
import { cn } from "@/lib/utils"

function Inner({ locale, label, names }: { locale: Locale; label: string; names: Record<Locale, string> }) {
  const pathname = usePathname() ?? `/${locale}`
  const search = useSearchParams()
  const qs = search?.toString()
  return (
    <nav aria-label={label} className="inline-flex h-8 items-stretch overflow-hidden rounded-md border border-input text-xs font-semibold">
      {locales.map((l) => {
        const active = l === locale
        return (
          <Link
            key={l}
            href={`${switchLocalePath(pathname, l)}${qs ? `?${qs}` : ""}`}
            hrefLang={l}
            lang={l}
            aria-current={active ? "true" : undefined}
            aria-label={names[l]}
            className={cn(
              "flex min-w-9 items-center justify-center px-2 uppercase tracking-wider transition-colors",
              active ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {l}
          </Link>
        )
      })}
    </nav>
  )
}

/** Compact EN/FR switch that keeps the current page (and its query string). */
export function LocaleSwitch(props: { locale: Locale; label: string; names: Record<Locale, string> }) {
  return (
    <Suspense
      fallback={
        <span className="inline-flex h-8 w-[74px] rounded-md border border-input" aria-hidden />
      }
    >
      <Inner {...props} />
    </Suspense>
  )
}
