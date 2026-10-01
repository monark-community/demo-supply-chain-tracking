import type { Batch, LedgerEvent } from "./types"

export type LegState = "done" | "exception" | "refused" | "pending" | "future"

export interface Leg {
  from: string
  to: string
  state: LegState
  /** The receiver's signed answer, if any. */
  receipt?: LedgerEvent
}

/** Custody legs along the planned route, with the receiver's stamp when it exists. */
export function routeLegs(b: Batch): Leg[] {
  const legs: Leg[] = []
  for (let i = 0; i < b.route.length - 1; i++) {
    const from = b.route[i]!
    const to = b.route[i + 1]!
    const answers = b.events.filter(
      (e) =>
        e.actor === to &&
        e.counterparty === from &&
        (e.kind === "handoff-accepted" || e.kind === "handoff-exception" || e.kind === "handoff-refused"),
    )
    const accepted = answers.find((e) => e.kind !== "handoff-refused")
    const last = answers[answers.length - 1]
    let state: LegState = "future"
    let receipt: LedgerEvent | undefined
    if (accepted) {
      state = accepted.kind === "handoff-exception" ? "exception" : "done"
      receipt = accepted
    } else if (b.pending && b.pending.from === from && b.pending.to === to) {
      state = "pending"
    } else if (last) {
      state = "refused"
      receipt = last
    }
    legs.push({ from, to, state, receipt })
  }
  return legs
}

/** Index in the route of the current custodian. */
export function custodianIndex(b: Batch): number {
  return b.route.indexOf(b.custodian)
}
