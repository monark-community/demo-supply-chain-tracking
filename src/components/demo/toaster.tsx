"use client"

import { Toaster } from "@/components/ui/sonner"

/**
 * Toasts sit top-right under the sticky header on desktop, and along the top edge (under the header)
 * on phones, where the action panels live mid-page: they never cover the inline status they echo.
 */
export function DemoToaster() {
  return <Toaster position="top-right" offset={{ top: 76, right: 16 }} mobileOffset={{ top: 72, left: 12, right: 12 }} duration={4500} />
}
