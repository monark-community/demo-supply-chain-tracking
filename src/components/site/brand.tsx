import { cn } from "@/lib/utils"

/**
 * ChainProof mark: four scan-frame corners around a solid safety-yellow square
 * (the sealed lot, framed by a scanner). Corners use currentColor so they follow the theme.
 */
export function ChainProofMark({ className, title }: { className?: string; title?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={cn("size-7 shrink-0", className)}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <g fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="square">
        <path d="M3 10V3h7" />
        <path d="M22 3h7v7" />
        <path d="M29 22v7h-7" />
        <path d="M10 29H3v-7" />
      </g>
      <rect x="10" y="10" width="12" height="12" fill="#F5C400" />
      <rect x="10" y="10" width="12" height="12" fill="none" stroke="#15171A" strokeWidth="1.5" />
    </svg>
  )
}

export function ChainProofWordmark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 text-foreground", className)}>
      <ChainProofMark />
      <span className="font-display text-[1.35rem] leading-none tracking-tight">
        Chain<span className="font-medium">Proof</span>
      </span>
    </span>
  )
}
