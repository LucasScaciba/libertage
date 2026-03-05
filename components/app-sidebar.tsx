"use client"

import * as React from "react"
import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  IconDashboard,
  IconRocket,
  IconSettings,
  IconUser,
  IconLink,
  IconPhoto,
  IconClock,
  IconList,
  IconChartBar,
  IconExternalLink,
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
import { Button } from "@/components/ui/button"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [user, setUser] = useState<any>(null)
  const [subscription, setSubscription] = useState<any>(null)
  const [profileSlug, setProfileSlug] = useState<string>("")

  useEffect(() => {
    fetchUserData()
    fetchSubscription()
    fetchProfileSlug()
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

  const fetchProfileSlug = async () => {
    try {
      const res = await fetch("/api/profiles/me")
      if (res.ok) {
        const data = await res.json()
        setProfileSlug(data.profile?.slug || "")
      }
    } catch (error) {
      console.error("Error fetching profile slug:", error)
    }
  }

  const navMain = [
    {
      title: "Painel",
      url: "/portal",
      icon: IconChartBar,
    },
    {
      title: "Meu Perfil",
      url: "/portal/profile",
      icon: IconUser,
    },
    {
      title: "Características e Serviços",
      url: "/portal/characteristics",
      icon: IconList,
    },
    {
      title: "Minha Mídia",
      url: "/portal/media",
      icon: IconPhoto,
    },
    {
      title: "Meus Links",
      url: "/portal/links",
      icon: IconLink,
    },
    {
      title: "Meus Horários",
      url: "/portal/availability",
      icon: IconClock,
    },
    {
      title: "Impulsionar Perfil",
      url: "/portal/boosts",
      icon: IconRocket,
    },
    {
      title: "Meu Plano",
      url: "/portal/plans",
      icon: IconSettings,
    },
  ]

  const planName = subscription?.plan?.name || "Gratuito"

  return (
    <Sidebar collapsible="icon" variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/portal">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Image 
                    src="/logo-icon.png" 
                    alt="Libertage" 
                    width={32} 
                    height={32}
                    className="size-8 rounded-[3px]"
                  />
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
        
        {/* Public Profile Button */}
        {profileSlug && (
          <div className="px-3 py-2">
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              asChild
            >
              <a
                href={`/perfil/${profileSlug}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <IconExternalLink className="h-4 w-4" />
                <span className="group-data-[collapsible=icon]:hidden">Ver perfil público</span>
              </a>
            </Button>
          </div>
        )}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} subscription={subscription} />
      </SidebarFooter>
    </Sidebar>
  )
}
