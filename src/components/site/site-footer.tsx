import Link from "next/link"

import { href, MONARK_URL, PROJECT_DOC_URL, PROJECT_DOC_URL_FR, REPO_URL, type Locale } from "@/i18n/config"
import type { Dictionary } from "@/i18n"

import { ChainProofWordmark } from "./brand"

function MonarkMonoMark() {
  // Monark mono standalone mark (brand-refs logo-mono-*-standalone.svg, main silhouette), for the
  // "Built with Monark" credit only (guidelines §12). Uses currentColor so it follows muted-foreground.
  return (
    <svg viewBox="50 88 205 128" className="h-3.5 w-[22px]" aria-hidden fill="currentColor">
      <path d="M193.494 111.998C168.369 133.089 152.29 161.711 152.29 161.711C152.29 161.711 136.21 133.089 111.085 111.998C85.9606 90.9074 54.3037 93.9204 54.3037 93.9204C54.3424 94.2577 54.3836 94.5922 54.4268 94.924C59.9934 137.569 102.543 135.097 102.543 135.097C61.3386 115.011 66.8662 103.461 66.8662 103.461C66.8662 103.461 115.105 104.968 122.14 141.625C131.509 190.446 86.9657 199.875 86.9657 199.875C90.4832 168.741 110.583 162.715 110.583 162.715C72.3933 159.201 75.9107 208.412 75.9107 208.412C75.9107 208.412 86.9657 213.433 108.573 197.866C137.753 176.844 133.195 148.153 133.195 148.153L152.29 170.174L171.384 148.153C171.384 148.153 166.826 176.844 196.006 197.866C217.614 213.433 228.669 208.412 228.669 208.412C228.669 208.412 232.186 159.201 193.997 162.715C193.997 162.715 214.096 168.741 217.614 199.875C217.614 199.875 173.07 190.446 182.439 141.625C189.474 104.968 237.714 103.461 237.714 103.461C237.714 103.461 243.241 115.011 202.036 135.097C202.036 135.097 244.586 137.569 250.153 94.924C250.196 94.5922 250.237 94.2577 250.276 93.9204C250.276 93.9204 248.711 93.7715 246.005 93.7715C236.529 93.7712 213.037 95.593 193.494 111.998Z" />
    </svg>
  )
}

export function SiteFooter({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const productLinks = [
    { href: href(locale, "/how-it-works"), label: dict.nav.howItWorks },
    { href: href(locale, "/verify"), label: dict.nav.verify },
    { href: href(locale, "/app"), label: dict.nav.openDemo },
    { href: href(locale, "/credits"), label: dict.nav.credits },
  ]
  const projectLinks = [
    { href: locale === "fr" ? PROJECT_DOC_URL_FR : PROJECT_DOC_URL, label: dict.footer.docs },
    { href: REPO_URL, label: dict.footer.source },
  ]
  return (
    <footer className="mt-auto border-t-2 border-rule bg-background">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="space-y-3">
          <ChainProofWordmark />
          <p className="max-w-xs text-sm text-muted-foreground">{dict.footer.tagline}</p>
        </div>
        <nav aria-label={dict.footer.product}>
          <h2 className="label-caps mb-3 text-muted-foreground">{dict.footer.product}</h2>
          <ul className="space-y-1">
            {productLinks.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="inline-flex min-h-9 items-center text-sm font-medium hover:underline">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label={dict.footer.project}>
          <h2 className="label-caps mb-3 text-muted-foreground">{dict.footer.project}</h2>
          <ul className="space-y-1">
            {projectLinks.map((l) => (
              <li key={l.href}>
                <a href={l.href} className="inline-flex min-h-9 items-center text-sm font-medium hover:underline" rel="noopener noreferrer">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-5 text-[13px] text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="flex items-center gap-2">
            <span className="inline-block size-2 bg-hi ring-1 ring-rule" aria-hidden />
            {dict.common.demoBadge}
          </p>
          <a href={MONARK_URL} className="inline-flex items-center gap-1.5 hover:text-foreground" rel="noopener noreferrer">
            <MonarkMonoMark />
            {dict.footer.builtWith}
          </a>
        </div>
      </div>
    </footer>
  )
}
