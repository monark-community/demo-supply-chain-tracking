"use client"

import { PenLine } from "lucide-react"
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react"

import { useI18n } from "@/components/i18n-provider"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { NetworkBadge } from "@/components/ui/network-badge"
import { WalletAddress, WalletAvatar } from "@/components/ui/wallet"
import { submitTx } from "@/lib/demo/chain"
import { getOrg } from "@/lib/demo/orgs"
import { useDemo } from "@/lib/demo/store"
import type { Hex, TxResult } from "@/lib/demo/types"

export interface SignRequest {
  action: string
  batchId?: string
  recordHash: Hex
}

type Pending = { req: SignRequest; resolve: (ok: boolean) => void }

const SignContext = createContext<((req: SignRequest) => Promise<boolean>) | null>(null)

/** Radix can leave `pointer-events: none` on <body> when modal layers hand over quickly. */
function releaseBody() {
  if (typeof document !== "undefined" && document.body.style.pointerEvents === "none") document.body.style.pointerEvents = ""
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** Provides the simulated wallet's signature prompt to the whole demo. */
export function SignProvider({ children }: { children: React.ReactNode }) {
  const { dict } = useI18n()
  const s = dict.app.sign
  const [pending, setPending] = useState<Pending | null>(null)
  const [open, setOpen] = useState(false)
  const pendingRef = useRef<Pending | null>(null)

  const request = useCallback(async (req: SignRequest) => {
    // Let any form dialog finish closing before the wallet prompt opens.
    await wait(220)
    releaseBody()
    return new Promise<boolean>((resolve) => {
      const p = { req, resolve }
      pendingRef.current = p
      setPending(p)
      setOpen(true)
    })
  }, [])

  const settle = (ok: boolean) => {
    const p = pendingRef.current
    pendingRef.current = null
    setOpen(false)
    window.setTimeout(releaseBody, 250)
    p?.resolve(ok)
  }

  const orgId = useDemo((st) => st.wallet.orgId)
  const signer = getOrg(orgId)

  return (
    <SignContext.Provider value={request}>
      {children}
      <Dialog open={open} onOpenChange={(o) => !o && settle(false)}>
        <DialogContent closeLabel={dict.common.close} className="max-w-md">
          <DialogHeader className="text-left">
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <PenLine className="size-5" aria-hidden />
              {s.title}
            </DialogTitle>
            <DialogDescription>{s.free}</DialogDescription>
          </DialogHeader>
          {pending && (
            <dl className="divide-y divide-border border-y border-border text-sm">
              {signer && (
                <div className="flex items-center justify-between gap-3 py-2.5">
                  <dt className="text-muted-foreground">{s.signingAs}</dt>
                  <dd className="flex min-w-0 items-center gap-2">
                    <WalletAvatar address={signer.address} size={22} />
                    <span className="min-w-0 text-right">
                      <span className="block truncate font-semibold">{signer.name}</span>
                      <WalletAddress address={signer.address} className="text-xs text-muted-foreground" />
                    </span>
                  </dd>
                </div>
              )}
              <div className="grid gap-1 py-2.5">
                <dt className="text-muted-foreground">{s.action}</dt>
                <dd className="font-semibold">{pending.req.action}</dd>
              </div>
              {pending.req.batchId && (
                <div className="flex justify-between gap-3 py-2.5">
                  <dt className="text-muted-foreground">{s.batch}</dt>
                  <dd className="font-mono font-semibold">{pending.req.batchId}</dd>
                </div>
              )}
              <div className="grid gap-1 py-2.5">
                <dt className="text-muted-foreground">{s.record}</dt>
                <dd className="font-mono text-xs break-all">{pending.req.recordHash}</dd>
              </div>
              <div className="flex items-center justify-between gap-3 py-2.5">
                <dt className="text-muted-foreground">{s.network}</dt>
                <dd>
                  <NetworkBadge name={dict.app.network} variant="outline" icon={<span className="block size-full bg-hi" />} />
                </dd>
              </div>
            </dl>
          )}
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => settle(false)}>
              {s.reject}
            </Button>
            <Button onClick={() => settle(true)} autoFocus>
              {s.confirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SignContext.Provider>
  )
}

export function useSign() {
  const ctx = useContext(SignContext)
  if (!ctx) throw new Error("useSign must be used inside <SignProvider>")
  return ctx
}

export type Phase = "idle" | "signing" | "rejected" | "pending" | "confirmed" | "failed"
export interface ActionState {
  phase: Phase
  txHash?: Hex
  block?: number
}

/**
 * One signed ledger action: signature prompt -> broadcast -> mined (or reverted).
 * `commit` runs only when the (simulated) transaction is confirmed.
 */
export function useLedgerAction() {
  const sign = useSign()
  const [state, setState] = useState<ActionState>({ phase: "idle" })
  const mounted = useRef(true)
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])
  const safeSet = (s: ActionState) => {
    if (mounted.current) setState(s)
  }

  const run = useCallback(
    async (req: SignRequest | (() => SignRequest), commit: (tx: Extract<TxResult, { ok: true }>) => void): Promise<boolean> => {
      safeSet({ phase: "signing" })
      const ok = await sign(typeof req === "function" ? req() : req)
      if (!ok) {
        safeSet({ phase: "rejected" })
        return false
      }
      safeSet({ phase: "pending" })
      const res = await submitTx((h) => safeSet({ phase: "pending", txHash: h }))
      if (!res.ok) {
        safeSet({ phase: "failed", txHash: res.txHash })
        return false
      }
      commit(res)
      safeSet({ phase: "confirmed", txHash: res.txHash, block: res.block })
      return true
    },
    [sign],
  )

  const reset = useCallback(() => setState({ phase: "idle" }), [])
  return { state, run, reset, busy: state.phase === "signing" || state.phase === "pending" }
}
