import { encode } from "uqr"

import { cn } from "@/lib/utils"

/** Real, scannable QR code drawn as one SVG path (dark modules in currentColor). */
export function QrCode({ value, label, className }: { value: string; label: string; className?: string }) {
  const { data, size } = encode(value, { ecc: "M", border: 2 })
  let d = ""
  data.forEach((row, y) =>
    row.forEach((on, x) => {
      if (on) d += `M${x},${y}h1v1h-1z`
    }),
  )
  return (
    <svg viewBox={`0 0 ${size} ${size}`} className={cn("block bg-white text-[#15171a]", className)} role="img" aria-label={label} shapeRendering="crispEdges">
      <path d={d} fill="currentColor" />
    </svg>
  )
}
