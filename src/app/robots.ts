import type { MetadataRoute } from "next"

import { SITE_URL } from "@/i18n/config"

export default function robots(): MetadataRoute.Robots {
  return {
    // /pricing is kept out of search by its own `noindex` metadata, not listed here.
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
