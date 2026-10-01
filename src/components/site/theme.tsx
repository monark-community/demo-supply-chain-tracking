"use client"

import { Moon, Sun } from "lucide-react"
import { ThemeProvider as NextThemes, useTheme } from "next-themes"

import { cn } from "@/lib/utils"

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemes attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange storageKey="theme">
      {children}
    </NextThemes>
  )
}

/** Icon button that flips between light and dark. Shows a moon in light mode and a sun in dark mode. */
export function ThemeToggle({ label, className }: { label: string; className?: string }) {
  const { resolvedTheme, setTheme } = useTheme()
  return (
    <button
      type="button"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className={cn(
        "inline-flex size-10 items-center justify-center rounded-md border border-transparent text-foreground transition-colors hover:border-border hover:bg-muted",
        className,
      )}
      aria-label={label}
      title={label}
    >
      <Moon className="size-[18px] dark:hidden" aria-hidden />
      <Sun className="hidden size-[18px] dark:block" aria-hidden />
    </button>
  )
}
