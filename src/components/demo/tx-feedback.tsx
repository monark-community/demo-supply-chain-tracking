"use client"

import { CircleX, Loader2, PenLine } from "lucide-react"

import { useI18n } from "@/components/i18n-provider"
import { TxStatus } from "@/components/ui/tx-status"
import { t } from "@/i18n/t"
import { num } from "@/lib/format"
import { cn } from "@/lib/utils"

import type { ActionState } from "./app-context"

/** Inline, in-place feedback for a signed action (pending / confirmed / failed / rejected). */
export function TxFeedback({ state, className, onRetry }: { state: ActionState; className?: string; onRetry?: () => void }) {
  const { dict, locale } = useI18n()
  const tx = dict.app.tx
  if (state.phase === "idle") return <div aria-live="polite" className="sr-only" />

  if (state.phase === "signing")
    return (
      <p role="status" className={cn("flex items-center gap-2 text-sm text-muted-foreground", className)}>
        <PenLine className="size-4" aria-hidden />
        {tx.signing}
      </p>
    )

  if (state.phase === "rejected")
    return (
      <p role="alert" className={cn("flex items-start gap-2 border-l-4 border-input bg-muted px-3 py-2 text-sm", className)}>
        <CircleX className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
        {tx.rejected}
      </p>
    )

  if (state.phase === "failed")
    return (
      <div role="alert" className={cn("space-y-2 border-l-4 border-destructive bg-danger-soft px-3 py-2.5 text-sm", className)}>
        {state.txHash && <TxStatus status="failed" hash={state.txHash} label={tx.failedShort} className="bg-card" />}
        <p className="font-medium text-destructive">{tx.failed}</p>
        {onRetry && (
          <button type="button" onClick={onRetry} className="font-semibold underline underline-offset-4">
            {tx.retry}
          </button>
        )}
      </div>
    )

  if (state.phase === "pending")
    return (
      <div role="status" className={cn("flex flex-wrap items-center gap-2 text-sm", className)}>
        {state.txHash ? (
          <TxStatus status="pending" hash={state.txHash} label={tx.pendingShort} />
        ) : (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        )}
        <span className="font-medium">{tx.pending}</span>
      </div>
    )

  return (
    <div role="status" className={cn("flex flex-wrap items-center gap-2 text-sm", className)}>
      {state.txHash && <TxStatus status="confirmed" hash={state.txHash} label={tx.confirmedShort} />}
      <span className="font-medium text-success">{t(tx.confirmed, { block: num(state.block ?? 0, locale) })}</span>
    </div>
  )
}
