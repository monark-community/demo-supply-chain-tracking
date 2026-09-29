"use client"

import { Menu } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import type { Locale } from "@/i18n/config"

import { LocaleSwitch } from "./locale-switch"
import { NavLinks, type NavItem } from "./nav-links"
import { ThemeToggle } from "./theme"

export function MobileMenu({
  locale,
  items,
  labels,
  cta,
}: {
  locale: Locale
  items: NavItem[]
  labels: { open: string; title: string; close: string; nav: string; theme: string; language: string; names: Record<Locale, string>; demo: string }
  cta?: { href: string; label: string }
}) {
  const [open, setOpen] = useState(false)
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={labels.open} className="lg:hidden">
          <Menu className="size-5" aria-hidden />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" aria-describedby={undefined} closeLabel={labels.close} className="flex w-full max-w-sm flex-col gap-6 border-l-2 border-rule pt-5">
        <SheetTitle className="label-caps text-muted-foreground">{labels.title}</SheetTitle>
        <NavLinks items={items} label={labels.nav} vertical onNavigate={() => setOpen(false)} />
        <div className="flex items-center gap-3 border-t border-border pt-5">
          <LocaleSwitch locale={locale} label={labels.language} names={labels.names} />
          <ThemeToggle label={labels.theme} />
        </div>
        {cta && (
          <Button asChild size="lg" className="w-full">
            <Link href={cta.href} onClick={() => setOpen(false)}>
              {cta.label}
            </Link>
          </Button>
        )}
        <p className="mt-auto text-xs text-muted-foreground">{labels.demo}</p>
      </SheetContent>
    </Sheet>
  )
}
