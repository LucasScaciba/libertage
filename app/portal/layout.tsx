import type { Metadata } from "next"
import { ThemeConfigProvider } from "@/components/active-theme"
import { Toaster } from "@/components/ui/sonner"
import "./theme.css"

export const metadata: Metadata = {
  title: "Portal — Libertage",
  description: "Gerencie seu perfil, visualize estatísticas e configure seus serviços na plataforma Libertage.",
  robots: "noindex, nofollow",
};

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ThemeConfigProvider defaultTheme="default">
      {children}
      <Toaster />
    </ThemeConfigProvider>
  )
}
