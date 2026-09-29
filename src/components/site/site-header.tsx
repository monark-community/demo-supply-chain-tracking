import Link from "next/link"

import { Button } from "@/components/ui/button"
import { href, type Locale } from "@/i18n/config"
import type { Dictionary } from "@/i18n"
import { cn } from "@/lib/utils"

import { ChainProofWordmark } from "./brand"
import { LocaleSwitch } from "./locale-switch"
import { MobileMenu } from "./mobile-menu"
import { NavLinks, type NavItem } from "./nav-links"
import { ThemeToggle } from "./theme"

/**
 * Site header. `variant="app"` swaps the primary CTA for the wallet controls passed in `actions`
 * and shows the demo sections instead of the marketing links.
 */
export function SiteHeader({
  locale,
  dict,
  variant = "site",
  actions,
}: {
  locale: Locale
  dict: Dictionary
  variant?: "site" | "app"
  actions?: React.ReactNode
}) {
  const items: NavItem[] =
    variant === "app"
      ? [
          { href: href(locale, "/app"), label: dict.app.nav.ledger, prefix: false },
          { href: href(locale, "/app/register"), label: dict.app.nav.register },
          { href: href(locale, "/verify"), label: dict.app.nav.verify },
        ]
      : [
          { href: href(locale, "/how-it-works"), label: dict.nav.howItWorks },
          { href: href(locale, "/verify"), label: dict.nav.verify },
        ]
  const cta = variant === "site" ? { href: href(locale, "/app"), label: dict.nav.openDemo } : undefined
  const mobileItems: NavItem[] =
    variant === "app" ? [...items, { href: href(locale, "/how-it-works"), label: dict.nav.howItWorks }] : items

  return (
    <header className="sticky top-0 z-40 border-b-2 border-rule bg-background">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6 lg:gap-6">
        <Link href={href(locale)} aria-label={dict.nav.home} className="shrink-0 rounded-md">
          <ChainProofWordmark />
        </Link>
        <NavLinks items={items} label={dict.nav.main} className="hidden lg:block" />
        <div className="ml-auto flex items-center gap-2">
          <div className="hidden items-center gap-2 lg:flex">
            <span
              className="label-caps inline-flex h-7 items-center gap-1.5 rounded-sm border border-rule bg-hi/30 px-2 text-[10px]"
              title={dict.common.demoBadge}
            >
              <span className="size-1.5 bg-rule" aria-hidden />
              {dict.common.demoChip}
            </span>
            <LocaleSwitch locale={locale} label={dict.common.language} names={dict.common.languageNames} />
            <ThemeToggle label={dict.common.theme} />
          </div>
          {actions}
          {cta && (
            <Button asChild className={cn("hidden lg:inline-flex")}>
              <Link href={cta.href}>{cta.label}</Link>
            </Button>
          )}
          <MobileMenu
            locale={locale}
            items={mobileItems}
            cta={cta}
            labels={{
              open: dict.common.openMenu,
              title: dict.common.menuTitle,
              close: dict.common.close,
              nav: dict.nav.main,
              theme: dict.common.theme,
              language: dict.common.language,
              names: dict.common.languageNames,
              demo: dict.common.demoBadge,
            }}
          />
        </div>
      </div>
    </header>
  )
}
