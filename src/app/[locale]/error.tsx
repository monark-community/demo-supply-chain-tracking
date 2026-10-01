"use client"

import { usePathname } from "next/navigation"

import { Button } from "@/components/ui/button"
import { errorCopy } from "@/i18n/dictionaries/errors"

export default function ErrorBoundary({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const pathname = usePathname() ?? ""
  const fr_ = pathname.startsWith("/fr")
  const copy = fr_ ? errorCopy.fr : errorCopy.en
  return (
    <main id="main" className="flex flex-1 flex-col">
      <section role="alert" className="mx-auto flex w-full max-w-xl flex-1 flex-col items-start justify-center px-4 py-20 sm:px-6">
        <h1 className="font-display text-4xl leading-none sm:text-5xl">{copy.title}</h1>
        <p className="mt-4 text-muted-foreground">{copy.body}</p>
        <div className="mt-8 flex gap-3">
          <Button size="lg" onClick={reset}>
            {copy.retry}
          </Button>
          <Button size="lg" variant="outline" asChild>
            <a href={fr_ ? "/fr" : "/en"}>{copy.home}</a>
          </Button>
        </div>
      </section>
    </main>
  )
}
