import { intlLocale, type Locale } from "@/i18n/config"
import type { Dictionary } from "@/i18n"
import type { LText, Unit } from "@/lib/demo/types"

/** Resolve seed text that may carry both languages. */
export function lt(text: LText | undefined, locale: Locale): string {
  if (!text) return ""
  return typeof text === "string" ? text : text[locale]
}

export function num(n: number, locale: Locale): string {
  return new Intl.NumberFormat(intlLocale[locale]).format(n)
}

export function unitLabel(units: Dictionary["units"], unit: Unit, count: number, locale: Locale): string {
  const rule = new Intl.PluralRules(intlLocale[locale]).select(count)
  return rule === "one" ? units[unit].one : units[unit].other
}

export function qty(units: Dictionary["units"], unit: Unit, count: number, locale: Locale): string {
  return `${num(count, locale)} ${unitLabel(units, unit, count, locale)}`
}

export function temp(c: number, locale: Locale): string {
  return `${new Intl.NumberFormat(intlLocale[locale], { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(c)} °C`
}

const TZ = "America/Toronto"

export function dateShort(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(intlLocale[locale], { day: "numeric", month: "short", year: "numeric", timeZone: TZ }).format(new Date(iso))
}

export function dateTime(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(intlLocale[locale], {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TZ,
  }).format(new Date(iso))
}

export function timeOnly(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(intlLocale[locale], { hour: "2-digit", minute: "2-digit", timeZone: TZ }).format(new Date(iso))
}

/** Date-only strings ("2026-06-12") formatted without a timezone shift. */
export function dayOnly(ymd: string, locale: Locale): string {
  const [y, m, d] = ymd.split("-").map(Number)
  return new Intl.DateTimeFormat(intlLocale[locale], { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(
    new Date(Date.UTC(y ?? 2026, (m ?? 1) - 1, d ?? 1)),
  )
}

export function shortHash(hash: string, start = 6, end = 4): string {
  return hash.length > start + end + 2 ? `${hash.slice(0, start + 2)}…${hash.slice(-end)}` : hash
}

export function blockNum(n: number, locale: Locale): string {
  return num(n, locale)
}
