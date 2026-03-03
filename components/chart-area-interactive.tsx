"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import { useIsMobile } from "@/hooks/use-mobile"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

export const description = "Gráfico interativo de visitantes"

const chartConfig = {
  visitors: {
    label: "Visitantes",
  },
  desktop: {
    label: "Desktop",
    color: "var(--primary)",
  },
  mobile: {
    label: "Mobile",
    color: "var(--primary)",
  },
  tablet: {
    label: "Tablet",
    color: "hsl(var(--muted-foreground))",
  },
} satisfies ChartConfig

export function ChartAreaInteractive() {
  const isMobile = useIsMobile()
  const [chartData, setChartData] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const fetchChartData = async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/analytics/chart?days=7`)
        const data = await res.json()
        
        if (data.chartData) {
          setChartData(data.chartData)
        }
      } catch (error) {
        console.error("Error fetching chart data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchChartData()
  }, [])

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Total de Visitantes</CardTitle>
        <CardDescription>Últimos 7 dias</CardDescription>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        {loading ? (
          <div className="flex h-[250px] items-center justify-center">
            <p className="text-muted-foreground">Carregando dados...</p>
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex h-[250px] items-center justify-center">
            <p className="text-muted-foreground">Nenhum dado disponível</p>
          </div>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[250px] w-full"
          >
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="fillDesktop" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-desktop)"
                    stopOpacity={1.0}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-desktop)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
                <linearGradient id="fillMobile" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-mobile)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-mobile)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
                <linearGradient id="fillTablet" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-tablet)"
                    stopOpacity={0.6}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-tablet)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value) => {
                  const date = new Date(value)
                  return date.toLocaleDateString("pt-BR", {
                    month: "short",
                    day: "numeric",
                  })
                }}
              />
              <ChartTooltip
                cursor={false}
                defaultIndex={isMobile ? -1 : 10}
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => {
                      return new Date(value).toLocaleDateString("pt-BR", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    }}
                    indicator="dot"
                  />
                }
              />
              <Area
                dataKey="tablet"
                type="natural"
                fill="url(#fillTablet)"
                stroke="var(--color-tablet)"
                stackId="a"
              />
              <Area
                dataKey="mobile"
                type="natural"
                fill="url(#fillMobile)"
                stroke="var(--color-mobile)"
                stackId="a"
              />
              <Area
                dataKey="desktop"
                type="natural"
                fill="url(#fillDesktop)"
                stroke="var(--color-desktop)"
                stackId="a"
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
