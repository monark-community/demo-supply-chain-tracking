"use client"

import { randomHex } from "./hash"
import { getState, setState } from "./store"
import type { TxResult } from "./types"

/** Simulated network name, shown in the network badge. */
export const NETWORK_NAME = "ChainProof Testnet"

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

/**
 * Broadcast a (simulated) transaction and wait for it to be mined.
 * Latency is 1.2–2.6 s. If "fail the next transaction" is on, the transaction reverts once.
 * `onBroadcast` fires as soon as the hash exists, so the UI can show it while pending.
 */
export async function submitTx(onBroadcast?: (txHash: `0x${string}`) => void): Promise<TxResult> {
  const txHash = randomHex(32)
  onBroadcast?.(txHash)
  await wait(1200 + Math.random() * 1400)
  const fail = getState().failNext
  if (fail) {
    setState((s) => ({ ...s, failNext: false }))
    return { ok: false, txHash }
  }
  const block = getState().block + 1 + Math.floor(Math.random() * 3)
  setState((s) => ({ ...s, block }))
  return { ok: true, txHash, block }
}

export function setFailNext(on: boolean) {
  setState((s) => ({ ...s, failNext: on }))
}

export function connectWallet(orgId: string) {
  setState((s) => ({ ...s, wallet: { orgId } }))
}

export function disconnectWallet() {
  setState((s) => ({ ...s, wallet: { orgId: null } }))
}
