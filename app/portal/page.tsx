"use client"

import { useEffect, useState } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { SectionCards } from "@/components/section-cards"
import MediaViewsIndicator from "./dashboard/components/MediaViewsIndicator"
import SocialClicksIndicator from "./dashboard/components/SocialClicksIndicator"
import StoryViewsIndicator from "./dashboard/components/StoryViewsIndicator"
import VisitsByDayIndicator from "./dashboard/components/VisitsByDayIndicator"
import VisitsByStateIndicator from "./dashboard/components/VisitsByStateIndicator"

interface AnalyticsSummary {
  visitsToday: number
  visits7Days: number
  visits30Days: number
  visits12Months: number
  clicksByMethod: Record<string, number>
}

interface DashboardIndicators {
  mediaViews: any[]
  socialClicks: any[]
  storyViews: any[]
  visitsByDay: any[]
  visitsByState: any[]
  visibilityRank: any
  contactChannels: any[]
}

interface DashboardData extends AnalyticsSummary {
  indicators?: DashboardIndicators
}

export default function PortalPage() {
  const [analytics, setAnalytics] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    document.title = "Painel — Libertage";
  }, []);

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      const res = await fetch("/api/analytics/dashboard")
      if (res.ok) {
        const data = await res.json()
        setAnalytics(data)
      }
    } catch (error) {
      console.error("Error fetching analytics:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage>Painel</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              {/* Existing analytics cards */}
              <SectionCards analytics={analytics} loading={loading} />

              {/* New Dashboard Indicators */}
              {analytics?.indicators && (
                <div className="flex flex-col gap-4 px-4 lg:px-6">
                  {/* Row 1: Media, Social, Stories */}
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                    <MediaViewsIndicator 
                      data={analytics.indicators.mediaViews} 
                    />
                    <SocialClicksIndicator 
                      data={analytics.indicators.socialClicks} 
                    />
                    <StoryViewsIndicator 
                      data={analytics.indicators.storyViews} 
                    />
                  </div>

                  {/* Row 2: Visits by Day, Visits by State */}
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <VisitsByDayIndicator 
                      data={analytics.indicators.visitsByDay} 
                    />
                    <VisitsByStateIndicator 
                      data={analytics.indicators.visitsByState} 
                    />
                  </div>
                </div>
              )}
              
              {/* Chart - Moved to the end */}
              <div className="px-4 lg:px-6">
                <ChartAreaInteractive />
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
