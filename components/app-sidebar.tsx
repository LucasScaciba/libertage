"use client"

import * as React from "react"
import { useEffect, useState } from "react"
import Link from "next/link"
import {
  IconDashboard,
  IconRocket,
  IconSettings,
  IconUser,
} from "@tabler/icons-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [user, setUser] = useState<any>(null)
  const [subscription, setSubscription] = useState<any>(null)

  useEffect(() => {
    fetchUserData()
    fetchSubscription()
  }, [])

  const fetchUserData = async () => {
    try {
      const res = await fetch("/api/auth/me")
      if (res.ok) {
        const data = await res.json()
        setUser(data.user)
      }
    } catch (error) {
      console.error("Error fetching user:", error)
    }
  }

  const fetchSubscription = async () => {
    try {
      const res = await fetch("/api/subscriptions/plans")
      if (res.ok) {
        const data = await res.json()
        setSubscription(data.subscription)
      }
    } catch (error) {
      console.error("Error fetching subscription:", error)
    }
  }

  const navMain = [
    {
      title: "Painel",
      url: "/portal",
      icon: IconDashboard,
    },
    {
      title: "Meu Perfil",
      url: "/portal/profile",
      icon: IconUser,
    },
    {
      title: "Boosts",
      url: "/portal/boosts",
      icon: IconRocket,
    },
    {
      title: "Planos",
      url: "/portal/plans",
      icon: IconSettings,
    },
  ]

  const planName = subscription?.plan?.name || "Gratuito"

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/portal">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <IconDashboard className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Libertage</span>
                  <span className="truncate text-xs">Plano {planName}</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} subscription={subscription} />
      </SidebarFooter>
    </Sidebar>
  )
}
