"use client"

import { Check, ChevronDown, LogOut, RotateCcw, SlidersHorizontal } from "lucide-react"
import { createContext, useContext, useState } from "react"
import { toast } from "sonner"

import { useI18n } from "@/components/i18n-provider"
import { Button } from "@/components/ui/button"
import { ConnectWallet } from "@/components/ui/connect-wallet"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import { NetworkBadge } from "@/components/ui/network-badge"
import { Switch } from "@/components/ui/switch"
import { WalletAddress, WalletAvatar } from "@/components/ui/wallet"
import { t } from "@/i18n/t"
import { connectWallet, disconnectWallet, setFailNext } from "@/lib/demo/chain"
import { getOrg, ORGS, ROLE_ORDER } from "@/lib/demo/orgs"
import { isStorageBlocked, resetDemo, useDemo, useHydrated } from "@/lib/demo/store"
import type { DemoState } from "@/lib/demo/types"
import { cn } from "@/lib/utils"

type Ui = { openConnect: () => void; openControls: () => void; connectRejected: boolean; switchTo: (orgId: string) => void }
const UiContext = createContext<Ui | null>(null)

export function useDemoUi() {
  const ctx = useContext(UiContext)
  if (!ctx) throw new Error("useDemoUi must be used inside <DemoUiProvider>")
  return ctx
}

const SUGGESTED = "flv"

/** Batches waiting for this org's signature (for the "switched to X" toast). */
function inboxFor(s: DemoState, orgId: string) {
  return s.order.map((id) => s.batches[id]!).filter((b) => b.pending?.to === orgId)
}

export function DemoUiProvider({ children }: { children: React.ReactNode }) {
  const { dict } = useI18n()
  const g = dict.app.gate
  const c = dict.app.controls
  const [connectOpen, setConnectOpen] = useState(false)
  const [controlsOpen, setControlsOpen] = useState(false)
  const [rejected, setRejected] = useState(false)
  const [choice, setChoice] = useState(SUGGESTED)
  const [confirmReset, setConfirmReset] = useState(false)
  const failNext = useDemo((s) => s.failNext)
  const state = useDemo((s) => s)

  const announceInbox = (orgId: string) => {
    const org = getOrg(orgId)
    for (const b of inboxFor(state, orgId)) {
      toast(t(dict.app.toasts.handoffIn, { org: getOrg(b.pending!.from)?.name ?? "", lot: b.id }), { id: `inbox-${b.id}-${orgId}` })
    }
    return org
  }

  const ui: Ui = {
    openConnect: () => {
      setChoice(SUGGESTED)
      setConnectOpen(true)
    },
    openControls: () => {
      setConfirmReset(false)
      setControlsOpen(true)
    },
    connectRejected: rejected,
    switchTo: (orgId) => {
      connectWallet(orgId)
      announceInbox(orgId)
    },
  }

  return (
    <UiContext.Provider value={ui}>
      {children}

      <Dialog open={connectOpen} onOpenChange={(o) => {
        if (!o) setRejected(true)
        setConnectOpen(o)
      }}>
        <DialogContent closeLabel={dict.common.close} className="max-w-lg">
          <DialogHeader className="text-left">
            <DialogTitle className="text-lg font-bold">{g.promptTitle}</DialogTitle>
            <DialogDescription>{g.promptBody}</DialogDescription>
          </DialogHeader>
          <div role="radiogroup" aria-label={g.promptTitle} className="max-h-[50dvh] space-y-4 overflow-y-auto pr-1">
            {ROLE_ORDER.map((role) => (
              <fieldset key={role}>
                <legend className="label-caps mb-1.5 text-[10px] text-muted-foreground">{dict.roles[role]}</legend>
                <div className="grid gap-1.5">
                  {ORGS.filter((o) => o.role === role).map((o) => {
                    const on = choice === o.id
                    return (
                      <button
                        key={o.id}
                        type="button"
                        role="radio"
                        aria-checked={on}
                        onClick={() => setChoice(o.id)}
                        className={cn(
                          "flex min-h-12 items-center gap-3 rounded-md border px-3 py-2 text-left transition-colors",
                          on ? "border-2 border-rule bg-hi/20" : "border-border hover:bg-muted",
                        )}
                      >
                        <WalletAvatar address={o.address} size={24} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold">{o.name}</span>
                          <span className="block text-xs text-muted-foreground">
                            {o.city} · <WalletAddress address={o.address} />
                          </span>
                        </span>
                        {o.id === SUGGESTED && <span className="label-caps hidden text-[10px] text-muted-foreground sm:inline">{g.suggested}</span>}
                        {on && <Check className="size-4 shrink-0" aria-hidden />}
                      </button>
                    )
                  })}
                </div>
              </fieldset>
            ))}
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setRejected(true)
                setConnectOpen(false)
              }}
            >
              {g.reject}
            </Button>
            <Button
              onClick={() => {
                setRejected(false)
                setConnectOpen(false)
                connectWallet(choice)
                announceInbox(choice)
              }}
            >
              {g.connect}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={controlsOpen} onOpenChange={setControlsOpen}>
        <DialogContent closeLabel={dict.common.close} className="max-w-md">
          <DialogHeader className="text-left">
            <DialogTitle className="text-lg font-bold">{c.title}</DialogTitle>
            <DialogDescription>{c.body}</DialogDescription>
          </DialogHeader>
          <div className="flex items-start justify-between gap-4 border-y border-border py-4">
            <div>
              <Label htmlFor="fail-next" className="font-semibold">
                {c.failNext}
              </Label>
              <p className="mt-1 text-sm text-muted-foreground">{c.failNextHint}</p>
            </div>
            <Switch id="fail-next" checked={failNext} onCheckedChange={(v) => setFailNext(v)} aria-label={c.failNext} />
          </div>
          <div>
            <p className="font-semibold">{c.reset}</p>
            <p className="mt-1 text-sm text-muted-foreground">{c.resetHint}</p>
            {confirmReset ? (
              <Button
                variant="destructive"
                className="mt-3"
                onClick={() => {
                  resetDemo()
                  setControlsOpen(false)
                  toast(c.resetDone)
                }}
              >
                <RotateCcw aria-hidden />
                {c.resetConfirm}
              </Button>
            ) : (
              <Button variant="outline" className="mt-3" onClick={() => setConfirmReset(true)}>
                <RotateCcw aria-hidden />
                {c.reset}
              </Button>
            )}
          </div>
          {isStorageBlocked() && <p className="text-sm text-warning">{c.storage}</p>}
        </DialogContent>
      </Dialog>
    </UiContext.Provider>
  )
}

/** Header actions inside /app: the acting-as wallet (switch organization, controls, disconnect). */
export function WalletControls() {
  const { dict } = useI18n()
  const hydrated = useHydrated()
  const orgId = useDemo((s) => s.wallet.orgId)
  const ui = useDemoUi()
  const org = getOrg(orgId)
  const w = dict.app.wallet

  if (!hydrated) return <span className="h-10 w-10 rounded-md border border-border lg:w-44" aria-hidden />

  if (!org)
    return (
      <ConnectWallet status="disconnected" onConnect={ui.openConnect} connectLabel={w.connect} className="hidden sm:inline-flex" />
    )

  return (
    <div className="flex items-center gap-2">
      <NetworkBadge
        name={dict.app.network}
        variant="outline"
        className="hidden h-8 rounded-sm xl:inline-flex"
        icon={<span className="block size-full bg-hi" />}
      />
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="inline-flex h-10 max-w-[13rem] items-center gap-2 rounded-md border border-input bg-card pr-2 pl-1.5 text-left transition-colors hover:bg-muted"
            aria-label={`${w.actingAs} ${org.name}`}
          >
            <WalletAvatar address={org.address} size={26} />
            <span className="hidden min-w-0 leading-tight sm:block">
              <span className="block truncate text-[13px] font-semibold">{org.name}</span>
              <span className="block text-[11px] text-muted-foreground">{dict.roles[org.role]}</span>
            </span>
            <ChevronDown className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-72 max-w-[calc(100vw-1.5rem)]">
          <DropdownMenuLabel className="text-xs text-muted-foreground">{w.switchOrg}</DropdownMenuLabel>
          <div className="max-h-[50dvh] overflow-y-auto">
            {ROLE_ORDER.map((role) => (
              <DropdownMenuGroup key={role}>
                <DropdownMenuLabel className="label-caps pt-2 text-[10px] text-muted-foreground">{dict.roles[role]}</DropdownMenuLabel>
                {ORGS.filter((o) => o.role === role).map((o) => (
                  <DropdownMenuItem key={o.id} onSelect={() => ui.switchTo(o.id)} className="min-h-10 gap-2">
                    <WalletAvatar address={o.address} size={20} />
                    <span className="flex-1 truncate">{o.name}</span>
                    {o.id === org.id && <Check className="size-4" aria-hidden />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            ))}
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={ui.openControls} className="min-h-10 gap-2">
            <SlidersHorizontal className="size-4" aria-hidden />
            {dict.app.controls.title}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => disconnectWallet()} className="min-h-10 gap-2">
            <LogOut className="size-4" aria-hidden />
            {w.disconnect}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

/** Shows the connect gate until a demo wallet is connected. */
export function WalletGate({ children }: { children: React.ReactNode }) {
  const { dict } = useI18n()
  const hydrated = useHydrated()
  const orgId = useDemo((s) => s.wallet.orgId)
  const ui = useDemoUi()
  const g = dict.app.gate

  if (!hydrated)
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6" role="status">
        <p className="text-muted-foreground">{g.loading}</p>
      </div>
    )

  if (!orgId)
    return (
      <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-4 py-14 sm:px-6">
        <div className="border-2 border-rule bg-card p-6 shadow-hard sm:p-10">
          <p className="label-caps flex items-center gap-2 text-muted-foreground">
            <span className="inline-block size-2.5 bg-hi ring-1 ring-rule" aria-hidden />
            {g.eyebrow}
          </p>
          <h1 className="font-display mt-4 text-4xl leading-none sm:text-5xl">{g.title}</h1>
          <p className="mt-4 max-w-xl text-lg text-muted-foreground">{g.body}</p>
          {ui.connectRejected && (
            <p role="alert" className="mt-5 border-l-4 border-input bg-muted px-3 py-2 text-sm font-medium">
              {g.rejected}
            </p>
          )}
          <ConnectWallet
            status="disconnected"
            size="lg"
            className="mt-7 w-full sm:w-auto"
            onConnect={ui.openConnect}
            connectLabel={dict.app.wallet.connect}
          />
          <p className="mt-6 text-xs text-muted-foreground">{dict.common.demoNotice}</p>
        </div>
      </section>
    )

  return <>{children}</>
}
