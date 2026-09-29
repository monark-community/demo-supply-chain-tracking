import type { ColdChain, Reading } from "./types"

/** Small deterministic PRNG so seeded logger data is identical on server and client. */
function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const round1 = (n: number) => Math.round(n * 10) / 10

/**
 * Logger trace: `count` readings every `stepMin` minutes starting at `start`.
 * If `excursion` is given, a smooth bump peaking at `peak` is centred on reading `at`.
 */
export function makeReadings(opts: {
  start: string
  count: number
  stepMin?: number
  base: number
  seed: number
  excursion?: { at: number; peak: number; width: number }
}): Reading[] {
  const { start, count, stepMin = 10, base, seed, excursion } = opts
  const rnd = mulberry32(seed)
  const t0 = new Date(start).getTime()
  const out: Reading[] = []
  let drift = 0
  for (let i = 0; i < count; i++) {
    drift = drift * 0.7 + (rnd() - 0.5) * 0.5
    let c = base + drift + Math.sin(i / 4) * 0.35
    if (excursion) {
      const d = (i - excursion.at) / excursion.width
      c += (excursion.peak - base) * Math.exp(-d * d)
    }
    out.push({ t: new Date(t0 + i * stepMin * 60_000).toISOString(), c: round1(c) })
  }
  return out
}

export interface ExcursionSummary {
  peak: number
  minutes: number
  from: string
  to: string
  low: boolean
}

/** Longest continuous stretch outside [min, max], if any. */
export function findExcursion(readings: Reading[], cc: ColdChain): ExcursionSummary | null {
  if (readings.length < 2) return null
  const step = new Date(readings[1]!.t).getTime() - new Date(readings[0]!.t).getTime()
  let best: ExcursionSummary | null = null
  let runStart = -1
  const close = (endIdx: number) => {
    if (runStart < 0) return
    const run = readings.slice(runStart, endIdx)
    const high = run.some((r) => r.c > cc.max)
    const peak = high ? Math.max(...run.map((r) => r.c)) : Math.min(...run.map((r) => r.c))
    const minutes = Math.round((run.length * step) / 60_000)
    if (!best || minutes > best.minutes) {
      best = { peak, minutes, from: run[0]!.t, to: run[run.length - 1]!.t, low: !high }
    }
    runStart = -1
  }
  readings.forEach((r, i) => {
    const out = r.c > cc.max || r.c < cc.min
    if (out && runStart < 0) runStart = i
    if (!out) close(i)
  })
  close(readings.length)
  return best
}
