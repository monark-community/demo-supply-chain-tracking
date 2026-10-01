import { ImageResponse } from "next/og"

import { isLocale, locales } from "@/i18n/config"
import { getDictionary } from "@/i18n"

export const alt = "ChainProof"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

const PAPER = "#f3f1ea"
const INK = "#15171a"
const HI = "#f5c400"
const OK = "#1d6a41"
const MUTED = "#595c62"

export default async function OpenGraphImage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params
  const locale = isLocale(raw) ? raw : "en"
  const d = getDictionary(locale)
  const nodes = ["CCS", "TRC", "FLV", "TMV"]

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: PAPER, color: INK, padding: 64 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <svg width="52" height="52" viewBox="0 0 32 32">
            <g fill="none" stroke={INK} strokeWidth="3">
              <path d="M3 10V3h7" />
              <path d="M22 3h7v7" />
              <path d="M29 22v7h-7" />
              <path d="M10 29H3v-7" />
            </g>
            <rect x="10" y="10" width="12" height="12" fill={HI} stroke={INK} strokeWidth="1.5" />
          </svg>
          <span style={{ fontSize: 44, fontWeight: 800 }}>ChainProof</span>
        </div>
        <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1, letterSpacing: -2, marginTop: 40, maxWidth: 980 }}>{d.home.title}</div>
        <div style={{ display: "flex", alignItems: "center", marginTop: 56 }}>
          {nodes.map((n, i) => (
            <div key={n} style={{ display: "flex", alignItems: "center" }}>
              <div
                style={{
                  width: 88,
                  height: 88,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: `4px solid ${INK}`,
                  background: i === nodes.length - 1 ? HI : "#fbfaf6",
                  fontSize: 26,
                  fontWeight: 700,
                  fontFamily: "monospace",
                }}
              >
                {n}
              </div>
              {i < nodes.length - 1 && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 150 }}>
                  <div
                    style={{
                      display: "flex",
                      border: `3px solid ${OK}`,
                      color: OK,
                      fontSize: 16,
                      fontWeight: 700,
                      padding: "4px 8px",
                      transform: "rotate(-4deg)",
                      marginBottom: 8,
                    }}
                  >
                    {d.stamp.accepted.toUpperCase()}
                  </div>
                  <div style={{ width: 150, height: 5, background: INK }} />
                </div>
              )}
            </div>
          ))}
        </div>
        <div style={{ display: "flex", marginTop: "auto", fontSize: 22, color: MUTED }}>{d.common.demoBadge}</div>
      </div>
    ),
    size,
  )
}
