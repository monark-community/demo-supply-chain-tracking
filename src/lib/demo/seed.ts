import { digest, GENESIS, recordHash } from "./hash"
import { makeReadings } from "./readings"
import type { Batch, DemoState, EventData, EventKind, LText, LedgerEvent } from "./types"

/** Simulated chain: 12-second blocks counted from 1 Jan 2026. */
const EPOCH = Date.parse("2026-01-01T00:00:00Z")
export function blockAt(iso: string): number {
  return 3_100_000 + Math.floor((Date.parse(iso) - EPOCH) / 12_000)
}

type SeedEvent = {
  kind: EventKind
  actor: string
  counterparty?: string
  at: string
  place: LText
  data?: EventData
}

function chain(batchId: string, seeds: SeedEvent[]): LedgerEvent[] {
  let prev = GENESIS
  return seeds.map((s, i) => {
    const seq = i + 1
    const data = s.data ?? {}
    const hash = recordHash(prev, { batchId, seq, kind: s.kind, actor: s.actor, counterparty: s.counterparty, at: s.at, place: s.place, data })
    const ev: LedgerEvent = {
      id: `${batchId}-${seq}`,
      seq,
      kind: s.kind,
      actor: s.actor,
      counterparty: s.counterparty,
      at: s.at,
      place: s.place,
      data,
      prevHash: prev,
      hash,
      txHash: digest(`tx:${batchId}:${seq}`),
      block: blockAt(s.at),
    }
    prev = hash
    return ev
  })
}

const PITALITO: LText = { en: "Pitalito, Huila, Colombia", fr: "Pitalito, Huila, Colombie" }
const CARTAGENA: LText = { en: "Port of Cartagena, Colombia", fr: "Port de Carthagène, Colombie" }
const MONTREAL_PORT: LText = { en: "Port of Montréal, QC", fr: "Port de Montréal, QC" }
const MONTREAL_WH: LText = { en: "Fleuve warehouse, Montréal, QC", fr: "Entrepôt Fleuve, Montréal, QC" }
const ROASTERY: LText = { en: "Roastery, Hochelaga-Maisonneuve, Montréal", fr: "Brûlerie, Hochelaga-Maisonneuve, Montréal" }

const COFFEE_PRODUCT: LText = {
  en: "Green coffee, Huila washed Caturra",
  fr: "Café vert, Caturra lavé du Huila",
}

function hu2584(): Batch {
  const id = "HU-2584"
  const events = chain(id, [
    {
      kind: "registered",
      actor: "ccs",
      at: "2026-06-18T14:20:00-05:00",
      place: PITALITO,
      data: { count: 60, note: { en: "Harvest May–June 2026, 1,650 m. Cupping score 86.", fr: "Récolte mai–juin 2026, 1 650 m. Note de dégustation 86." } },
    },
    { kind: "handoff-sent", actor: "ccs", counterparty: "trc", at: "2026-07-02T08:10:00-05:00", place: PITALITO, data: { count: 60, seal: "CO-448213" } },
    { kind: "handoff-accepted", actor: "trc", counterparty: "ccs", at: "2026-07-02T09:05:00-05:00", place: PITALITO, data: { count: 60, seal: "CO-448213", sealOk: true } },
    {
      kind: "checkpoint",
      actor: "trc",
      at: "2026-07-14T16:40:00-05:00",
      place: CARTAGENA,
      data: { note: { en: "Export customs cleared. Loaded in container MSKU 718204-3.", fr: "Dédouanement à l'export. Chargé dans le conteneur MSKU 718204-3." } },
    },
    { kind: "handoff-sent", actor: "trc", counterparty: "flv", at: "2026-08-19T10:30:00-04:00", place: MONTREAL_PORT, data: { count: 60, seal: "MSKU-5531907" } },
    { kind: "handoff-accepted", actor: "flv", counterparty: "trc", at: "2026-08-19T11:15:00-04:00", place: MONTREAL_PORT, data: { count: 60, seal: "MSKU-5531907", sealOk: true } },
    { kind: "handoff-sent", actor: "flv", counterparty: "tmv", at: "2026-08-27T07:45:00-04:00", place: MONTREAL_WH, data: { count: 60, seal: "FLV-20931" } },
    { kind: "handoff-accepted", actor: "tmv", counterparty: "flv", at: "2026-08-28T09:20:00-04:00", place: ROASTERY, data: { count: 60, seal: "FLV-20931", sealOk: true } },
  ])
  return {
    id,
    industry: "coffee",
    product: COFFEE_PRODUCT,
    quantity: 60,
    unit: "bags",
    unitSize: "70 kg",
    origin: PITALITO,
    producedOn: "2026-06-12",
    certifications: ["Fairtrade", "Organic (COR)"],
    route: ["ccs", "trc", "flv", "tmv"],
    custodian: "tmv",
    unsealed: [],
    sealed: [],
    events,
    createdAt: events[0]!.at,
  }
}

function hu2611(): Batch {
  const id = "HU-2611"
  const events = chain(id, [
    {
      kind: "registered",
      actor: "ccs",
      at: "2026-08-05T15:00:00-05:00",
      place: PITALITO,
      data: { count: 275, note: { en: "Harvest July 2026, 1,700 m. Cupping score 85.", fr: "Récolte juillet 2026, 1 700 m. Note de dégustation 85." } },
    },
    { kind: "handoff-sent", actor: "ccs", counterparty: "trc", at: "2026-08-11T07:30:00-05:00", place: PITALITO, data: { count: 275, seal: "CO-451077" } },
    { kind: "handoff-accepted", actor: "trc", counterparty: "ccs", at: "2026-08-11T08:40:00-05:00", place: PITALITO, data: { count: 275, seal: "CO-451077", sealOk: true } },
    {
      kind: "checkpoint",
      actor: "trc",
      at: "2026-08-22T13:10:00-05:00",
      place: CARTAGENA,
      data: { note: { en: "Export customs cleared. Loaded in container TGHU 402119-6.", fr: "Dédouanement à l'export. Chargé dans le conteneur TGHU 402119-6." } },
    },
    { kind: "handoff-sent", actor: "trc", counterparty: "flv", at: "2026-09-24T09:50:00-04:00", place: MONTREAL_PORT, data: { count: 275, seal: "TGHU-6620418" } },
    { kind: "handoff-accepted", actor: "flv", counterparty: "trc", at: "2026-09-24T10:35:00-04:00", place: MONTREAL_PORT, data: { count: 275, seal: "TGHU-6620418", sealOk: true } },
  ])
  return {
    id,
    industry: "coffee",
    product: COFFEE_PRODUCT,
    quantity: 275,
    unit: "bags",
    unitSize: "70 kg",
    origin: PITALITO,
    producedOn: "2026-07-30",
    certifications: ["Fairtrade"],
    route: ["ccs", "trc", "flv", "tmv"],
    custodian: "flv",
    unsealed: [],
    sealed: [],
    events,
    createdAt: events[0]!.at,
  }
}

const LAVAL_PLANT: LText = { en: "Norvia fill-finish plant, Laval, QC", fr: "Usine de remplissage Norvia, Laval, QC" }

function nv0417(): Batch {
  const id = "NV-0417"
  const events = chain(id, [
    {
      kind: "registered",
      actor: "nvb",
      at: "2026-09-22T11:00:00-04:00",
      place: LAVAL_PLANT,
      data: { count: 120, min: 2, max: 8, loggerId: "LG-2207" },
    },
    {
      kind: "checkpoint",
      actor: "nvb",
      at: "2026-09-28T16:30:00-04:00",
      place: LAVAL_PLANT,
      data: { note: { en: "Quality assurance lot release signed.", fr: "Libération du lot signée par l'assurance qualité." } },
    },
    { kind: "handoff-sent", actor: "nvb", counterparty: "fnt", at: "2026-09-29T06:30:00-04:00", place: LAVAL_PLANT, data: { count: 120, seal: "NV-TMP-88410" } },
    { kind: "handoff-accepted", actor: "fnt", counterparty: "nvb", at: "2026-09-29T06:40:00-04:00", place: LAVAL_PLANT, data: { count: 120, seal: "NV-TMP-88410", sealOk: true } },
  ])
  return {
    id,
    industry: "vaccine",
    product: { en: "Influenza vaccine, quadrivalent, 2026–27", fr: "Vaccin antigrippal quadrivalent, 2026-2027" },
    quantity: 120,
    unit: "cases",
    unitSize: { en: "100 doses", fr: "100 doses" },
    origin: LAVAL_PLANT,
    producedOn: "2026-09-18",
    certifications: ["GMP lot release"],
    route: ["nvb", "fnt", "pdp"],
    custodian: "fnt",
    coldChain: { min: 2, max: 8, loggerId: "LG-2207" },
    unsealed: makeReadings({
      start: "2026-09-29T06:50:00-04:00",
      count: 36,
      base: 4.8,
      seed: 417,
      excursion: { at: 22, peak: 9.4, width: 3.4 },
    }),
    sealed: [],
    events,
    createdAt: events[0]!.at,
  }
}

const SAGUENAY_MILL: LText = { en: "Scierie Boréale glulam plant, Saguenay, QC", fr: "Usine de lamellé-collé Scierie Boréale, Saguenay, QC" }

function sb0932(): Batch {
  const id = "SB-0932"
  const events = chain(id, [
    {
      kind: "registered",
      actor: "sbr",
      at: "2026-09-15T13:30:00-04:00",
      place: SAGUENAY_MILL,
      data: { count: 38, note: { en: "Mill certificate SB-MC-2291 attached (grade 24f-EX).", fr: "Certificat d'usine SB-MC-2291 joint (classe 24f-EX)." } },
    },
    { kind: "handoff-sent", actor: "sbr", counterparty: "tlj", at: "2026-09-28T06:15:00-04:00", place: SAGUENAY_MILL, data: { count: 38, seal: "LT-5520" } },
    { kind: "handoff-accepted", actor: "tlj", counterparty: "sbr", at: "2026-09-28T06:50:00-04:00", place: SAGUENAY_MILL, data: { count: 38, seal: "LT-5520", sealOk: true } },
    {
      kind: "handoff-sent",
      actor: "tlj",
      counterparty: "chw",
      at: "2026-09-29T07:55:00-04:00",
      place: { en: "Wellington St. site gate, Montréal", fr: "Barrière du chantier, rue Wellington, Montréal" },
      data: { count: 38, seal: "LT-5520" },
    },
  ])
  return {
    id,
    industry: "timber",
    product: { en: "Glulam beams, spruce-pine, 24f-EX", fr: "Poutres lamellées-collées, épinette-pin, 24f-EX" },
    quantity: 38,
    unit: "beams",
    unitSize: "12.2 m",
    origin: SAGUENAY_MILL,
    producedOn: "2026-09-11",
    certifications: ["CSA O122", "FSC Chain of Custody"],
    route: ["sbr", "tlj", "chw"],
    custodian: "tlj",
    pending: { from: "tlj", to: "chw", count: 38, seal: "LT-5520", sentAt: events[3]!.at, eventId: events[3]!.id },
    unsealed: [],
    sealed: [],
    events,
    createdAt: events[0]!.at,
  }
}

export function seedState(): DemoState {
  const batches = [hu2611(), nv0417(), sb0932(), hu2584()]
  return {
    v: 1,
    batches: Object.fromEntries(batches.map((b) => [b.id, b])),
    order: batches.map((b) => b.id),
    block: blockAt("2026-09-29T13:00:00-04:00"),
    wallet: { orgId: null },
    failNext: false,
  }
}

/** Lot codes printed on the sample "shelf" of the verify page; the last one is not on the ledger. */
export const SAMPLE_CODES = ["HU-2584", "NV-0417", "SB-0932", "HU-2590"] as const
