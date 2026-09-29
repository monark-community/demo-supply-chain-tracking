import { GENESIS, readingsRoot, recordHash } from "./hash"
import { org } from "./orgs"
import { findExcursion, makeReadings } from "./readings"
import type { Batch, BatchStatus, ColdChain, DemoState, EventData, EventKind, Hex, Industry, LText, LedgerEvent, Unit } from "./types"

/* ------------------------------------------------------------------ derived */

export function batchStatus(b: Batch): BatchStatus {
  if (b.pending) return "handoff"
  if (b.custodian === b.route[b.route.length - 1]) return "delivered"
  if (b.custodian === b.route[0]) return "origin"
  return "moving"
}

export function nextOnRoute(b: Batch): string | undefined {
  const i = b.route.indexOf(b.custodian)
  return i >= 0 ? b.route[i + 1] : undefined
}

export function excursions(b: Batch): LedgerEvent[] {
  return b.events.filter((e) => e.kind === "excursion")
}

export function lastEvent(b: Batch): LedgerEvent | undefined {
  return b.events[b.events.length - 1]
}

export function lastCount(b: Batch): number {
  for (let i = b.events.length - 1; i >= 0; i--) {
    const e = b.events[i]!
    if ((e.kind === "handoff-accepted" || e.kind === "handoff-exception" || e.kind === "registered") && typeof e.data.count === "number") {
      return e.data.count
    }
  }
  return b.quantity
}

/* ------------------------------------------------------------------ records */

export interface DraftEvent {
  kind: EventKind
  actor: string
  counterparty?: string
  at: string
  place: LText
  data: EventData
}

/** Compute the record that would be appended (used for the signature preview and the commit). */
export function draftRecord(b: Pick<Batch, "id" | "events">, d: DraftEvent): Omit<LedgerEvent, "txHash" | "block"> {
  const prev = b.events[b.events.length - 1]
  const prevHash = prev ? prev.hash : GENESIS
  const seq = b.events.length + 1
  const hash = recordHash(prevHash, { batchId: b.id, seq, ...d })
  return { id: `${b.id}-${seq}`, seq, prevHash, hash, ...d }
}

function append(b: Batch, d: DraftEvent, tx: { txHash: Hex; block: number }): { batch: Batch; event: LedgerEvent } {
  const r = draftRecord(b, d)
  const event: LedgerEvent = { ...r, txHash: tx.txHash, block: tx.block }
  return { batch: { ...b, events: [...b.events, event] }, event }
}

function put(s: DemoState, b: Batch): DemoState {
  const order = s.order.includes(b.id) ? s.order : [b.id, ...s.order]
  return { ...s, batches: { ...s.batches, [b.id]: b }, order }
}

const cityOf = (orgId: string): string => org(orgId).city

/* ------------------------------------------------------------------ register */

export interface RegisterInput {
  id: string
  industry: Industry
  product: string
  quantity: number
  unit: Unit
  unitSize?: string
  origin: string
  producedOn: string
  certifications: string[]
  route: string[]
  coldChain?: ColdChain
  note?: string
}

export function registerDraft(input: RegisterInput, actor: string, at: string) {
  const data: EventData = { count: input.quantity }
  if (input.coldChain) {
    data.min = input.coldChain.min
    data.max = input.coldChain.max
    data.loggerId = input.coldChain.loggerId
  }
  if (input.note) data.note = input.note
  return draftRecord({ id: input.id, events: [] }, { kind: "registered", actor, at, place: input.origin, data })
}

export function applyRegister(s: DemoState, input: RegisterInput, actor: string, at: string, tx: { txHash: Hex; block: number }): DemoState {
  const base: Batch = {
    id: input.id,
    industry: input.industry,
    product: input.product,
    quantity: input.quantity,
    unit: input.unit,
    unitSize: input.unitSize,
    origin: input.origin,
    producedOn: input.producedOn,
    certifications: input.certifications,
    route: [actor, ...input.route],
    custodian: actor,
    coldChain: input.coldChain,
    unsealed: input.coldChain
      ? makeReadings({ start: new Date(Date.parse(at) - 4 * 3600_000).toISOString(), count: 24, base: (input.coldChain.min + input.coldChain.max) / 2, seed: Math.floor(Math.random() * 1e6) })
      : [],
    sealed: [],
    events: [],
    createdAt: at,
  }
  const d = registerDraft(input, actor, at)
  const { batch } = append(base, { kind: d.kind, actor: d.actor, at: d.at, place: d.place, data: d.data }, tx)
  return put(s, batch)
}

/** A lot code that is not on the ledger yet, e.g. "HU-2716". */
export function newLotCode(s: DemoState, prefix: string): string {
  for (let i = 0; i < 50; i++) {
    const n = 2000 + Math.floor(Math.random() * 7999)
    const id = `${prefix}-${n}`
    if (!s.batches[id]) return id
  }
  return `${prefix}-${Date.now() % 10000}`
}

/* ------------------------------------------------------------------ handoff */

export interface HandoffInput {
  to: string
  count: number
  seal: string
  note?: string
}

export function handoffDraft(b: Batch, actor: string, input: HandoffInput, at: string): DraftEvent {
  return {
    kind: "handoff-sent",
    actor,
    counterparty: input.to,
    at,
    place: cityOf(actor),
    data: { count: input.count, seal: input.seal, ...(input.note ? { note: input.note } : {}) },
  }
}

export function applyHandoff(s: DemoState, id: string, d: DraftEvent, tx: { txHash: Hex; block: number }): DemoState {
  const b = s.batches[id]
  if (!b) return s
  const { batch, event } = append(b, d, tx)
  return put(s, {
    ...batch,
    pending: {
      from: d.actor,
      to: d.counterparty!,
      count: d.data.count ?? 0,
      seal: d.data.seal ?? "",
      note: typeof d.data.note === "string" ? d.data.note : undefined,
      sentAt: d.at,
      eventId: event.id,
    },
  })
}

export function cancelDraft(b: Batch, actor: string, at: string): DraftEvent {
  return { kind: "handoff-cancelled", actor, counterparty: b.pending?.to, at, place: cityOf(actor), data: {} }
}

export function applyCancel(s: DemoState, id: string, d: DraftEvent, tx: { txHash: Hex; block: number }): DemoState {
  const b = s.batches[id]
  if (!b) return s
  const { batch } = append(b, d, tx)
  return put(s, { ...batch, pending: undefined })
}

export type ReviewDecision = "accept" | "exception" | "refuse"

export interface ReviewInput {
  decision: ReviewDecision
  count: number
  sealOk: boolean
  note?: string
}

export function reviewDraft(b: Batch, actor: string, input: ReviewInput, at: string): DraftEvent {
  const kind: EventKind =
    input.decision === "refuse" ? "handoff-refused" : input.decision === "exception" ? "handoff-exception" : "handoff-accepted"
  return {
    kind,
    actor,
    counterparty: b.pending?.from,
    at,
    place: cityOf(actor),
    data: {
      count: input.count,
      declaredCount: b.pending?.count,
      seal: b.pending?.seal,
      sealOk: input.sealOk,
      ...(input.note ? { note: input.note } : {}),
    },
  }
}

export function applyReview(s: DemoState, id: string, d: DraftEvent, tx: { txHash: Hex; block: number }): DemoState {
  const b = s.batches[id]
  if (!b || !b.pending) return s
  const { batch } = append(b, d, tx)
  if (d.kind === "handoff-refused") return put(s, { ...batch, pending: undefined })
  const receiver = d.actor
  let unsealed = batch.unsealed
  if (batch.coldChain && org(receiver).role === "carrier") {
    const cc = batch.coldChain
    unsealed = makeReadings({
      start: d.at,
      count: 24,
      base: (cc.min + cc.max) / 2 - 0.4,
      seed: Math.floor(Math.random() * 1e6),
    }).map((r) => ({ ...r, t: new Date(Date.parse(r.t) - 24 * 10 * 60_000).toISOString() }))
  }
  return put(s, { ...batch, pending: undefined, custodian: receiver, unsealed })
}

/* ------------------------------------------------------------------ readings */

export function sealDrafts(b: Batch, actor: string, at: string): DraftEvent[] {
  const cc = b.coldChain
  if (!cc || b.unsealed.length === 0) return []
  const first: DraftEvent = {
    kind: "readings-sealed",
    actor,
    at,
    place: cityOf(actor),
    data: { loggerId: cc.loggerId, readings: b.unsealed.length, root: readingsRoot(b.unsealed), min: cc.min, max: cc.max },
  }
  const ex = findExcursion(b.unsealed, cc)
  if (!ex) return [first]
  return [
    first,
    {
      kind: "excursion",
      actor,
      at,
      place: cityOf(actor),
      data: { loggerId: cc.loggerId, peak: ex.peak, minutes: ex.minutes, min: cc.min, max: cc.max },
    },
  ]
}

export function applySeal(s: DemoState, id: string, drafts: DraftEvent[], tx: { txHash: Hex; block: number }): DemoState {
  let b = s.batches[id]
  if (!b) return s
  for (const d of drafts) b = append(b, d, tx).batch
  return put(s, { ...b, sealed: [...b.sealed, ...b.unsealed], unsealed: [] })
}

/* ------------------------------------------------------------------ checkpoint */

export function checkpointDraft(actor: string, note: string, place: string, at: string): DraftEvent {
  return { kind: "checkpoint", actor, at, place: place || cityOf(actor), data: { note } }
}

export function applyCheckpoint(s: DemoState, id: string, d: DraftEvent, tx: { txHash: Hex; block: number }): DemoState {
  const b = s.batches[id]
  if (!b) return s
  return put(s, append(b, d, tx).batch)
}

/* ------------------------------------------------------------------ verify */

export interface RecordCheck {
  seq: number
  ok: boolean
  expected: Hex
  computed: Hex
}

/** Re-compute every record hash from its content and the previous (re-computed) hash. */
export function verifyRecords(batchId: string, events: LedgerEvent[], anchored: LedgerEvent[]): RecordCheck[] {
  let prev: Hex = GENESIS
  return events.map((e, i) => {
    const computed = recordHash(prev, {
      batchId,
      seq: e.seq,
      kind: e.kind,
      actor: e.actor,
      counterparty: e.counterparty,
      at: e.at,
      place: e.place,
      data: e.data,
    })
    prev = computed
    const expected = anchored[i]?.hash ?? e.hash
    return { seq: e.seq, ok: computed === expected, expected, computed }
  })
}

/** A local copy of the records with one field quietly changed (for the tamper simulation). */
export function tamperedCopy(events: LedgerEvent[]): { events: LedgerEvent[]; index: number } {
  const index = events.findIndex((e, i) => i > 0 && typeof e.data.count === "number" && e.kind !== "handoff-sent")
  const at = index >= 0 ? index : Math.min(1, events.length - 1)
  const copy = events.map((e, i) =>
    i === at ? { ...e, data: { ...e.data, count: typeof e.data.count === "number" ? e.data.count - 2 : 1 } } : e,
  )
  return { events: copy, index: at }
}

export const LOT_CODE_RE = /^[A-Z]{2}-\d{4}$/
export function normalizeLotCode(input: string): string {
  return input.trim().toUpperCase().replace(/\s+/g, "").replace(/^([A-Z]{2})(\d{4})$/, "$1-$2")
}
