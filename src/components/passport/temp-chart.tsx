"use client"

import { useEffect, useMemo, useRef, useState } from "react"

import type { Locale } from "@/i18n/config"
import type { ColdChain, Reading } from "@/lib/demo/types"
import { temp, timeOnly } from "@/lib/format"
import { cn } from "@/lib/utils"

/**
 * Temperature trace against the allowed band (signature moment #3). Single series, so no legend:
 * the band and the out-of-range stretch are labelled directly. Crosshair + tooltip on hover/focus.
 * Drawn in pixel space (ResizeObserver) so text stays legible at phone widths.
 */
export function TempChart({
  sealed,
  unsealed = [],
  cc,
  locale,
  labels,
  height = 220,
  className,
}: {
  sealed: Reading[]
  unsealed?: Reading[]
  cc: ColdChain
  locale: Locale
  labels: { chart: string; outOfRange: string; unsealed: string; range: string }
  height?: number
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(640)
  const [hover, setHover] = useState<number | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      if (entry) setWidth(Math.max(280, Math.round(entry.contentRect.width)))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const all = useMemo(() => [...sealed, ...unsealed], [sealed, unsealed])
  const pad = { l: 44, r: 12, t: 16, b: 28 }
  const w = width
  const h = height
  const iw = w - pad.l - pad.r
  const ih = h - pad.t - pad.b
  const values = all.map((r) => r.c)
  const yMin = Math.floor(Math.min(cc.min - 2, ...values))
  const yMax = Math.ceil(Math.max(cc.max + 2, ...values))
  const x = (i: number) => pad.l + (all.length <= 1 ? iw / 2 : (i / (all.length - 1)) * iw)
  const y = (c: number) => pad.t + ((yMax - c) / (yMax - yMin)) * ih
  const out = (c: number) => c > cc.max || c < cc.min

  if (all.length === 0) return null

  const path = (from: number, to: number) =>
    all
      .slice(from, to)
      .map((r, k) => `${k === 0 ? "M" : "L"}${x(from + k).toFixed(1)},${y(r.c).toFixed(1)}`)
      .join(" ")

  // Out-of-range runs, shaded and drawn in the critical colour.
  const runs: [number, number][] = []
  let s = -1
  all.forEach((r, i) => {
    if (out(r.c) && s < 0) s = i
    if (!out(r.c) && s >= 0) {
      runs.push([s, i - 1])
      s = -1
    }
  })
  if (s >= 0) runs.push([s, all.length - 1])

  const last = all.length - 1
  const ticks = iw < 420 ? [0, Math.floor(last / 2), last] : [0, Math.floor(last / 3), Math.floor((last * 2) / 3), last]
  const yTicks = Array.from(new Set([yMin, cc.min, cc.max, yMax]))
  const split = sealed.length
  const hv = hover !== null ? all[hover] : undefined

  const onMove = (clientX: number) => {
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) return
    const px = clientX - rect.left
    const i = Math.round(((px - pad.l) / iw) * (all.length - 1))
    setHover(Math.min(all.length - 1, Math.max(0, i)))
  }

  return (
    <div ref={ref} className={cn("relative w-full overflow-hidden select-none", className)}>
      <svg
        width={w}
        height={h}
        role="img"
        aria-label={labels.chart}
        className="block max-w-full touch-pan-y"
        onPointerMove={(e) => onMove(e.clientX)}
        onPointerLeave={() => setHover(null)}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") setHover((v) => Math.min(all.length - 1, (v ?? -1) + 1))
          if (e.key === "ArrowLeft") setHover((v) => Math.max(0, (v ?? all.length) - 1))
          if (e.key === "Escape") setHover(null)
        }}
        onBlur={() => setHover(null)}
      >
        {/* allowed band */}
        <rect x={pad.l} width={iw} y={y(cc.max)} height={y(cc.min) - y(cc.max)} className="fill-success-soft" />
        {[cc.min, cc.max].map((v) => (
          <line key={v} x1={pad.l} x2={pad.l + iw} y1={y(v)} y2={y(v)} className="stroke-success" strokeDasharray="4 3" strokeWidth={1} />
        ))}
        {/* y axis labels */}
        {yTicks.map((v) => (
          <text key={v} x={pad.l - 8} y={y(v) + 4} textAnchor="end" className="fill-muted-foreground font-mono text-[11px]">
            {v}°
          </text>
        ))}
        <line x1={pad.l} x2={pad.l + iw} y1={pad.t + ih} y2={pad.t + ih} className="stroke-border" />
        {/* x axis labels */}
        {ticks.map((i, k) => (
          <text
            key={`${i}-${k}`}
            x={x(i)}
            y={h - 8}
            textAnchor={k === 0 ? "start" : k === ticks.length - 1 ? "end" : "middle"}
            className="fill-muted-foreground font-mono text-[11px]"
          >
            {timeOnly(all[i]!.t, locale)}
          </text>
        ))}
        {/* out-of-range shading */}
        {runs.map(([a, b]) => (
          <rect key={a} x={x(a) - 3} width={Math.max(6, x(b) - x(a) + 6)} y={pad.t} height={ih} className="fill-danger-soft" opacity={0.9} />
        ))}
        {/* trace */}
        {split > 0 && <path d={path(0, split)} fill="none" className="stroke-foreground" strokeWidth={2} strokeLinejoin="round" />}
        {unsealed.length > 0 && (
          <path
            d={path(Math.max(0, split - 1), all.length)}
            fill="none"
            className="stroke-foreground"
            strokeWidth={2}
            strokeDasharray="5 4"
            strokeLinejoin="round"
          />
        )}
        {runs.map(([a, b]) => (
          <path key={`r${a}`} d={path(a, b + 1)} fill="none" className="stroke-destructive" strokeWidth={3} strokeLinecap="round" />
        ))}
        {/* direct labels */}
        {runs[0] && (
          <text
            x={x(runs[0][1]) + 110 < pad.l + iw ? x(runs[0][1]) + 8 : x(runs[0][0]) - 8}
            textAnchor={x(runs[0][1]) + 110 < pad.l + iw ? "start" : "end"}
            y={pad.t + 12}
            className="fill-destructive text-[11px] font-semibold"
          >
            {labels.outOfRange}
          </text>
        )}
        <text x={pad.l + 6} y={y(cc.max) + 14} className="fill-success text-[11px] font-semibold">
          {labels.range}
        </text>
        {/* hover */}
        {hv && hover !== null && (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={pad.t + ih} className="stroke-foreground" strokeWidth={1} opacity={0.4} />
            <circle cx={x(hover)} cy={y(hv.c)} r={5} className={out(hv.c) ? "fill-destructive stroke-card" : "fill-foreground stroke-card"} strokeWidth={2} />
          </g>
        )}
      </svg>
      {hv && hover !== null && (
        <div
          className="pointer-events-none absolute top-1 z-10 rounded-sm border-2 border-rule bg-card px-2 py-1 font-mono text-xs shadow-hard"
          style={{ left: Math.min(Math.max(0, x(hover) - 50), w - 110) }}
          role="status"
        >
          <div className="font-bold">{temp(hv.c, locale)}</div>
          <div className="text-muted-foreground">
            {timeOnly(hv.t, locale)}
            {hover >= split && unsealed.length > 0 ? ` · ${labels.unsealed}` : ""}
          </div>
        </div>
      )}
    </div>
  )
}
