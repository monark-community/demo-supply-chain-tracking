/**
 * ChainProof demo domain types. Everything the UI knows about the (simulated) ledger goes
 * through these shapes, so a real contract client (wagmi/viem) could replace src/lib/demo/*
 * without touching components.
 */

export type Hex = `0x${string}`

/** Text that seed data carries in both languages; user-entered text is a plain string. */
export type LText = string | { en: string; fr: string }

export type Role = "producer" | "carrier" | "distributor" | "retailer" | "site"

export interface Org {
  id: string
  /** Three-letter code printed on stamps. */
  code: string
  name: string
  role: Role
  city: string
  country: string
  address: Hex
  /** Lot-code prefix for producers (e.g. "HU"). */
  lotPrefix?: string
}

export type Industry = "coffee" | "vaccine" | "timber" | "other"

export type Unit = "bags" | "cases" | "beams" | "pallets" | "crates"

export type EventKind =
  | "registered"
  | "handoff-sent"
  | "handoff-accepted"
  | "handoff-exception"
  | "handoff-refused"
  | "handoff-cancelled"
  | "readings-sealed"
  | "excursion"
  | "checkpoint"

/** The payload a party signs. Canonicalised and hashed with the previous record's hash. */
export interface EventData {
  count?: number
  declaredCount?: number
  seal?: string
  sealOk?: boolean
  note?: LText
  loggerId?: string
  readings?: number
  root?: string
  peak?: number
  minutes?: number
  min?: number
  max?: number
}

export interface LedgerEvent {
  id: string
  /** 1-based position in the batch's record chain. */
  seq: number
  kind: EventKind
  actor: string
  counterparty?: string
  at: string
  place: LText
  data: EventData
  prevHash: Hex
  hash: Hex
  txHash: Hex
  block: number
}

export interface Reading {
  /** ISO timestamp */
  t: string
  /** °C */
  c: number
}

export interface PendingHandoff {
  from: string
  to: string
  count: number
  seal: string
  note?: string
  sentAt: string
  eventId: string
}

export interface ColdChain {
  min: number
  max: number
  loggerId: string
}

export interface Batch {
  id: string
  industry: Industry
  product: LText
  quantity: number
  unit: Unit
  /** Free text such as "70 kg" or "100 doses". */
  unitSize?: LText
  origin: LText
  producedOn: string
  certifications: string[]
  /** Planned custody route, producer first. */
  route: string[]
  custodian: string
  pending?: PendingHandoff
  coldChain?: ColdChain
  /** Readings recorded by the current leg's logger, not yet sealed. */
  unsealed: Reading[]
  /** Readings already anchored (their root hash is on-chain). */
  sealed: Reading[]
  events: LedgerEvent[]
  createdAt: string
}

export interface DemoState {
  v: 1
  batches: Record<string, Batch>
  order: string[]
  block: number
  wallet: { orgId: string | null }
  failNext: boolean
}

export type BatchStatus = "origin" | "moving" | "handoff" | "delivered"

export type TxResult = { ok: true; txHash: Hex; block: number } | { ok: false; txHash: Hex }
