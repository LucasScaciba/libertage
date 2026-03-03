import { cookies } from "next/headers"
import type { Metadata } from "next"

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { ThemeConfigProvider } from "@/components/active-theme"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

import "./theme.css"

export const metadata: Metadata = {
  title: "Portal — Libertage",
  description: "Gerencie seu perfil, visualize estatísticas e configure seus serviços na plataforma Libertage.",
  robots: "noindex, nofollow",
};

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const defaultOpen = cookieStore.get("sidebar:state")?.value === "true"

  return (
    <ThemeConfigProvider defaultTheme="default">
      <SidebarProvider defaultOpen={defaultOpen}>
        <AppSidebar />
        <SidebarInset>
          <SiteHeader />
          <main className="@container/main flex flex-1 flex-col">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </ThemeConfigProvider>
  )
}
