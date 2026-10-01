import type { Org, Role } from "./types"

/** The ten demo organizations. Each one is a separate signing key (a "wallet account"). */
export const ORGS: Org[] = [
  {
    id: "ccs",
    code: "CCS",
    name: "Cooperativa Cafetera del Sur",
    role: "producer",
    city: "Pitalito, Huila",
    country: "CO",
    address: "0x4b1e9a07c35d2f86e0a1b7c4d9f3e2a85c6b7d10",
    lotPrefix: "HU",
  },
  {
    id: "trc",
    code: "TRC",
    name: "Transandina Cargo",
    role: "carrier",
    city: "Cartagena",
    country: "CO",
    address: "0x9d27c1f4a8e03b65d2c9f1a7e4b80c3d6a5f2e19",
  },
  {
    id: "flv",
    code: "FLV",
    name: "Fleuve Logistique",
    role: "distributor",
    city: "Montréal, QC",
    country: "CA",
    address: "0x2f6ad83b19c4e7a05d1b9e2c8f7a4d3065b1c9e8",
  },
  {
    id: "tmv",
    code: "TMV",
    name: "Torréfaction Maisonneuve",
    role: "retailer",
    city: "Montréal, QC",
    country: "CA",
    address: "0x7c03e5b9a2d1f84c6e9b0a3d5f2c7e1b48a6d0f3",
  },
  {
    id: "nvb",
    code: "NVB",
    name: "Norvia Biologics",
    role: "producer",
    city: "Laval, QC",
    country: "CA",
    address: "0xa15d7e2c9b04f38e1d6a9c2b7f5e03d84c1a6b92",
    lotPrefix: "NV",
  },
  {
    id: "fnt",
    code: "FNT",
    name: "Froid Nord Transport",
    role: "carrier",
    city: "Laval, QC",
    country: "CA",
    address: "0x3e8b0d6f1a9c27e5b4d0f8a3c6e1b95d27f4a0c6",
  },
  {
    id: "pdp",
    code: "PDP",
    name: "Pharmacie du Plateau",
    role: "retailer",
    city: "Montréal, QC",
    country: "CA",
    address: "0xd62f9a1e7c3b05d8a4e2f6c9b1d73e0a5f8c2b47",
  },
  {
    id: "sbr",
    code: "SBR",
    name: "Scierie Boréale",
    role: "producer",
    city: "Saguenay, QC",
    country: "CA",
    address: "0x58c4a2e0f9d17b3c6a8e5d2f0b94c1e7a3d6f8b5",
    lotPrefix: "SB",
  },
  {
    id: "tlj",
    code: "TLJ",
    name: "Transport Lac-Saint-Jean",
    role: "carrier",
    city: "Alma, QC",
    country: "CA",
    address: "0xb7e1c5a3d9f20e8b4c6a1d7f3e05b92c8d4a6f1e",
  },
  {
    id: "chw",
    code: "CHW",
    name: "Chantier Wellington",
    role: "site",
    city: "Montréal, QC",
    country: "CA",
    address: "0x0e9f3b7d5a1c48e2f6b0d9a7c3e15f8b2d6a4c90",
  },
]

const byId = new Map(ORGS.map((o) => [o.id, o]))

export function getOrg(id: string | null | undefined): Org | undefined {
  return id ? byId.get(id) : undefined
}

/** Org lookup that never fails (falls back to a neutral placeholder for unknown ids). */
export function org(id: string): Org {
  return (
    byId.get(id) ?? {
      id,
      code: "???",
      name: id,
      role: "carrier",
      city: "",
      country: "",
      address: "0x0000000000000000000000000000000000000000",
    }
  )
}

export const ROLE_ORDER: Role[] = ["producer", "carrier", "distributor", "retailer", "site"]

export function orgsByRole(role: Role): Org[] {
  return ORGS.filter((o) => o.role === role)
}
