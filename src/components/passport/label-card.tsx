import type { Dictionary } from "@/i18n"
import { SITE_URL, type Locale } from "@/i18n/config"
import { t } from "@/i18n/t"
import { org } from "@/lib/demo/orgs"
import type { Batch } from "@/lib/demo/types"
import { lt, qty } from "@/lib/format"
import { cn } from "@/lib/utils"

import { ChainProofMark } from "../site/brand"
import { QrCode } from "./qr-code"

/** Printable batch label: lot code in stencil type, QR to the public passport. Always ink on white. */
export function LabelCard({ batch, dict, locale, className }: { batch: Batch; dict: Dictionary; locale: Locale; className?: string }) {
  const l = dict.app.label
  const url = `${SITE_URL}/${locale}/verify?code=${batch.id}`
  return (
    <div
      className={cn("print-label w-full max-w-sm border-[3px] border-[#15171a] bg-white p-4 text-[#15171a]", className)}
      style={{ colorScheme: "light" }}
    >
      <div className="flex items-center justify-between border-b-2 border-[#15171a] pb-2">
        <span className="flex items-center gap-1.5 text-sm font-bold">
          <ChainProofMark className="size-5" />
          ChainProof
        </span>
        <span className="font-mono text-[10px] font-semibold tracking-widest uppercase">{l.scan}</span>
      </div>
      <div className="mt-3 grid grid-cols-[1fr_7.5rem] gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold tracking-widest uppercase">{l.lot}</p>
          <p className="font-mono text-3xl leading-none font-bold tracking-tight">{batch.id}</p>
          <p className="mt-2 text-sm leading-snug font-semibold">{lt(batch.product, locale)}</p>
          <dl className="mt-2 space-y-0.5 text-xs">
            <div className="flex gap-1">
              <dt className="font-semibold">{l.qty}</dt>
              <dd>{qty(dict.units, batch.unit, batch.quantity, locale)}</dd>
            </div>
            <div className="flex gap-1">
              <dt className="font-semibold">{l.producer}</dt>
              <dd className="truncate">{org(batch.route[0] ?? "").name}</dd>
            </div>
          </dl>
        </div>
        <QrCode value={url} label={t(l.qrAlt, { lot: batch.id })} className="size-[7.5rem]" />
      </div>
      <p className="mt-3 border-t-2 border-[#15171a] pt-1.5 font-mono text-[9px] break-all">{url}</p>
    </div>
  )
}
