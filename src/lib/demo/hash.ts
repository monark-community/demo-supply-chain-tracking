import type { EventData, EventKind, Hex, LText } from "./types"

/**
 * Deterministic 256-bit-looking digest for the demo (NOT cryptographic).
 * Eight independently seeded 32-bit FNV-1a/murmur-style lanes, concatenated.
 * A real deployment would use keccak256 over the ABI-encoded record.
 */
export function digest(input: string): Hex {
  let out = ""
  for (let lane = 0; lane < 8; lane++) {
    let h = (0x811c9dc5 ^ Math.imul(lane + 1, 0x9e3779b1)) >>> 0
    for (let i = 0; i < input.length; i++) {
      h ^= input.charCodeAt(i)
      h = Math.imul(h, 0x01000193) >>> 0
    }
    h ^= h >>> 16
    h = Math.imul(h, 0x85ebca6b) >>> 0
    h ^= h >>> 13
    h = Math.imul(h, 0xc2b2ae35) >>> 0
    h ^= h >>> 16
    out += h.toString(16).padStart(8, "0")
  }
  return `0x${out}`
}

export const GENESIS: Hex = `0x${"0".repeat(64)}`

function canonical(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : 1))
  return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonical(v)}`).join(",")}}`
}

export interface HashableRecord {
  batchId: string
  seq: number
  kind: EventKind
  actor: string
  counterparty?: string
  at: string
  place: LText
  data: EventData
}

/** Hash of a record, chained to the previous record's hash. */
export function recordHash(prevHash: Hex, r: HashableRecord): Hex {
  return digest(`${prevHash}|${canonical(r)}`)
}

/** Random-looking hex of a given byte length (ids, tx hashes). Math.random only: works on plain http. */
export function randomHex(bytes: number): Hex {
  let s = ""
  for (let i = 0; i < bytes * 2; i++) s += Math.floor(Math.random() * 16).toString(16)
  return `0x${s}`
}

/** Short root for a batch of readings. */
export function readingsRoot(readings: { t: string; c: number }[]): Hex {
  return digest(readings.map((r) => `${r.t}:${r.c.toFixed(1)}`).join(";"))
}
