import { notFound } from "next/navigation"

import { WalletGate } from "@/components/demo/app-shell"
import { RegisterScreen } from "@/components/demo/register-form"
import { isLocale } from "@/i18n/config"
import { getDictionary } from "@/i18n"
import { pageMetadata } from "@/lib/metadata"

export async function generateMetadata({ params }: PageProps<"/[locale]/app/register">) {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  const d = getDictionary(locale)
  return pageMetadata(locale, "/app/register", d.app.register.title, d.app.register.intro)
}

export default async function RegisterPage({ params }: PageProps<"/[locale]/app/register">) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  return (
    <WalletGate>
      <RegisterScreen />
    </WalletGate>
  )
}
