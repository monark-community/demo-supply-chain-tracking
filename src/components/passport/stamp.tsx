import { Check, Clock, TriangleAlert, X } from "lucide-react"

import { cn } from "@/lib/utils"

export type StampTone = "ok" | "exception" | "refused" | "awaiting" | "origin"

const tones: Record<StampTone, string> = {
  ok: "text-success border-success",
  exception: "text-warning border-warning",
  refused: "text-destructive border-destructive",
  awaiting: "text-foreground border-dashed border-rule bg-hi/25",
  origin: "text-foreground border-rule",
}

const icons = { ok: Check, exception: TriangleAlert, refused: X, awaiting: Clock, origin: Check }

/**
 * Rubber-stamp mark for a signed custody answer. Lands with a small rotation (signature moment #1).
 * `animate` plays the stamp animation, optionally delayed (ms) so a row of stamps lands in sequence.
 */
export function Stamp({
  tone,
  label,
  codes,
  block,
  animate = false,
  delay = 0,
  compact = false,
  className,
}: {
  tone: StampTone
  label: string
  codes?: string
  block?: string
  animate?: boolean
  delay?: number
  compact?: boolean
  className?: string
}) {
  const Icon = icons[tone]
  return (
    <span
      className={cn(
        "inline-flex -rotate-[4deg] flex-col items-center justify-center border-2 bg-card/60 font-mono leading-none uppercase",
        compact ? "gap-0.5 rounded-sm px-1 py-0.5" : "gap-1 rounded-sm px-2 py-1.5",
        tones[tone],
        animate && "animate-stamp",
        className,
      )}
      style={animate && delay ? { animationDelay: `${delay}ms` } : undefined}
      title={[label, codes, block].filter(Boolean).join(" · ")}
    >
      <span className={cn("flex items-center gap-1 font-bold tracking-wider", compact ? "text-[9px]" : "text-[11px]")}>
        <Icon className={compact ? "size-2.5" : "size-3"} aria-hidden strokeWidth={3} />
        {label}
      </span>
      {!compact && codes && <span className="text-[10px] font-semibold tracking-wide">{codes}</span>}
      {!compact && block && <span className="text-[9px] opacity-80">{block}</span>}
    </span>
  )
}
