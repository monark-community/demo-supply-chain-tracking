import { Fragment } from "react"

import type { Dictionary } from "@/i18n"
import type { Locale } from "@/i18n/config"
import { org } from "@/lib/demo/orgs"
import type { Batch } from "@/lib/demo/types"
import { routeLegs, type LegState } from "@/lib/demo/view"
import { num } from "@/lib/format"
import { cn } from "@/lib/utils"

import { Stamp, type StampTone } from "./stamp"

const legTone: Partial<Record<LegState, StampTone>> = { done: "ok", exception: "exception", refused: "refused", pending: "awaiting" }

/**
 * Schematic custody route: organization nodes joined by legs. The current custodian is the
 * yellow node; each signed leg carries the receiver's stamp.
 */
export function RouteRail({
  batch,
  dict,
  locale,
  animate = false,
  className,
}: {
  batch: Batch
  dict: Dictionary
  locale: Locale
  animate?: boolean
  className?: string
}) {
  const legs = routeLegs(batch)
  const ci = batch.route.indexOf(batch.custodian)
  const cols = batch.route.map(() => "minmax(2.5rem,auto)").join(" minmax(1.5rem,1fr) ")
  const stampLabel = (s: LegState) =>
    s === "done" ? dict.stamp.accepted : s === "exception" ? dict.stamp.exception : s === "refused" ? dict.stamp.refused : dict.stamp.awaiting

  return (
    <div className={cn("w-full", className)}>
      <ol className="grid items-center gap-y-2" style={{ gridTemplateColumns: cols }} aria-label={dict.passport.route}>
        {batch.route.map((id, i) => {
          const o = org(id)
          const leg = legs[i]
          const isCustodian = i === ci
          const reached = i <= ci
          const tone = leg ? legTone[leg.state] : undefined
          return (
            <Fragment key={id}>
              <li
                className="col-span-1 row-start-2 flex justify-center"
                style={{ gridColumnStart: i * 2 + 1 }}
                aria-current={isCustodian ? "step" : undefined}
              >
                <span
                  className={cn(
                    "flex size-10 items-center justify-center rounded-sm border-2 font-mono text-[11px] font-bold sm:size-12 sm:text-xs",
                    isCustodian
                      ? "border-rule bg-hi text-hi-ink shadow-hard"
                      : reached
                        ? "border-rule bg-card text-foreground"
                        : "border-dashed border-input bg-transparent text-muted-foreground",
                  )}
                  title={`${o.name} · ${dict.roles[o.role]}`}
                >
                  {o.code}
                  <span className="sr-only">
                    {" "}
                    {o.name}, {dict.roles[o.role]}
                    {isCustodian ? `, ${dict.passport.holder}` : ""}
                  </span>
                </span>
              </li>
              <li
                aria-hidden
                className="row-start-3 truncate px-0.5 text-center text-[10px] leading-tight text-muted-foreground sm:text-[11px]"
                style={{ gridColumnStart: i * 2 + 1 }}
              >
                {dict.roles[o.role]}
              </li>
              {leg && (
                <>
                  <li aria-hidden className="row-start-2 flex h-10 items-center sm:h-12" style={{ gridColumnStart: i * 2 + 2 }}>
                    <span
                      className={cn(
                        "block h-0 w-full origin-left",
                        leg.state === "done" || leg.state === "exception"
                          ? "border-t-[3px] border-rule"
                          : leg.state === "pending"
                            ? "border-t-[3px] border-dashed border-hi"
                            : leg.state === "refused"
                              ? "border-t-[3px] border-dashed border-destructive"
                              : "border-t-2 border-dotted border-input",
                        animate && (leg.state === "done" || leg.state === "exception") && "animate-draw",
                      )}
                      style={animate ? { animationDelay: `${150 + i * 260}ms` } : undefined}
                    />
                  </li>
                  <li
                    className="row-start-1 flex min-h-7 items-end justify-center"
                    style={{ gridColumnStart: i * 2 + 2 }}
                  >
                    {tone && (
                      <>
                        <Stamp
                          tone={tone}
                          label={stampLabel(leg.state)}
                          compact
                          animate={animate}
                          delay={animate ? 380 + i * 260 : 0}
                          block={leg.receipt ? `#${num(leg.receipt.block, locale)}` : undefined}
                        />
                        <span className="sr-only">
                          {org(leg.from).code} → {org(leg.to).code}: {stampLabel(leg.state)}
                        </span>
                      </>
                    )}
                  </li>
                </>
              )}
            </Fragment>
          )
        })}
      </ol>
    </div>
  )
}
