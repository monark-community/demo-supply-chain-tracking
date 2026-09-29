"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"

export interface NavItem {
  href: string
  label: string
  /** Match nested paths too (e.g. /app/batch/… for /app). */
  prefix?: boolean
}

export function NavLinks({ items, label, className, vertical = false, onNavigate }: { items: NavItem[]; label: string; className?: string; vertical?: boolean; onNavigate?: () => void }) {
  const pathname = usePathname() ?? ""
  return (
    <nav aria-label={label} className={className}>
      <ul className={cn("flex", vertical ? "flex-col gap-1" : "items-center gap-1")}>
        {items.map((item) => {
          const active = item.prefix ? pathname === item.href || pathname.startsWith(`${item.href}/`) : pathname === item.href
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative inline-flex items-center rounded-md font-semibold transition-colors",
                  vertical ? "h-12 w-full px-3 text-lg" : "h-10 px-3 text-sm",
                  active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                  active &&
                    (vertical
                      ? "bg-muted"
                      : "after:absolute after:inset-x-3 after:-bottom-[13px] after:h-1 after:bg-hi"),
                )}
              >
                {item.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
