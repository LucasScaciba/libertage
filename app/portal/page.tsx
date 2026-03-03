"use client";

import { useEffect, useState } from "react";
import { TrendingUpIcon, TrendingDownIcon, Eye, Calendar, Rocket, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { SiteHeader } from "@/components/site-header";

export default function DashboardPage() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [mediaCount, setMediaCount] = useState({ photos: 0, videos: 0 });
  const [mediaLimits, setMediaLimits] = useState({ maxPhotos: 6, maxVideos: 1 });
  const [boosts, setBoosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const profileRes = await fetch("/api/profiles/me");
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setProfile(profileData.profile);
        setSubscription(profileData.subscription);

        if (profileData.profile) {
          const analyticsRes = await fetch(`/api/analytics/dashboard?profileId=${profileData.profile.id}`);
          if (analyticsRes.ok) {
            const analyticsData = await analyticsRes.json();
            setAnalytics(analyticsData);
          }

          const mediaRes = await fetch(`/api/media?profileId=${profileData.profile.id}`);
          if (mediaRes.ok) {
            const mediaData = await mediaRes.json();
            const photos = mediaData.media?.filter((m: any) => m.type === "photo").length || 0;
            const videos = mediaData.media?.filter((m: any) => m.type === "video").length || 0;
            setMediaCount({ photos, videos });
          }
        }

        if (profileData.subscription?.plans) {
          setMediaLimits({
            maxPhotos: profileData.subscription.plans.max_photos || 6,
            maxVideos: profileData.subscription.plans.max_videos || 1,
          });
        }
      }

      const boostsRes = await fetch("/api/boosts/me");
      if (boostsRes.ok) {
        const boostsData = await boostsRes.json();
        setBoosts(boostsData.boosts || []);
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const activeBoosts = boosts.filter((b) => b.status === "active");
  const todayChange = analytics?.visitsToday > 0 ? "+12.5%" : "0%";
  const weekChange = "+8.2%";

  if (loading) {
    return (
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div className="*:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4 grid grid-cols-1 gap-4 px-4 lg:px-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-40 animate-pulse rounded-xl border bg-white" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          {/* Stats Cards */}
          <div className="*:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4 grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card lg:px-6">
            {/* Visits Today */}
            <Card className="@container/card" data-slot="card">
              <CardHeader className="relative">
                <CardDescription className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Visitas Hoje
                </CardDescription>
                <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
                  {analytics?.visitsToday || 0}
                </CardTitle>
                <div className="absolute right-4 top-4">
                  <Badge variant="outline" className="flex gap-1 rounded-lg text-xs">
                    {analytics?.visitsToday > 0 ? (
                      <>
                        <TrendingUpIcon className="size-3" />
                        {todayChange}
                      </>
                    ) : (
                      "0%"
                    )}
                  </Badge>
                </div>
              </CardHeader>
              <CardFooter className="flex-col items-start gap-1 text-sm">
                <div className="line-clamp-1 flex gap-2 font-medium">
                  {analytics?.visitsToday > 0 ? (
                    <>
                      Crescendo este mês <TrendingUpIcon className="size-4" />
                    </>
                  ) : (
                    "Sem visitas hoje"
                  )}
                </div>
                <div className="text-muted-foreground">
                  Comparado com ontem
                </div>
              </CardFooter>
            </Card>

            {/* Visits 7 Days */}
            <Card className="@container/card" data-slot="card">
              <CardHeader className="relative">
                <CardDescription className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Últimos 7 Dias
                </CardDescription>
                <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
                  {analytics?.visits7Days || 0}
                </CardTitle>
                <div className="absolute right-4 top-4">
                  <Badge variant="outline" className="flex gap-1 rounded-lg text-xs">
                    <TrendingUpIcon className="size-3" />
                    {weekChange}
                  </Badge>
                </div>
              </CardHeader>
              <CardFooter className="flex-col items-start gap-1 text-sm">
                <div className="line-clamp-1 flex gap-2 font-medium">
                  Crescimento semanal <TrendingUpIcon className="size-4" />
                </div>
                <div className="text-muted-foreground">
                  vs. semana anterior
                </div>
              </CardFooter>
            </Card>

            {/* Visits 30 Days */}
            <Card className="@container/card" data-slot="card">
              <CardHeader className="relative">
                <CardDescription className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Últimos 30 Dias
                </CardDescription>
                <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
                  {analytics?.visits30Days || 0}
                </CardTitle>
                <div className="absolute right-4 top-4">
                  <Badge variant="outline" className="flex gap-1 rounded-lg text-xs">
                    <TrendingUpIcon className="size-3" />
                    +5.2%
                  </Badge>
                </div>
              </CardHeader>
              <CardFooter className="flex-col items-start gap-1 text-sm">
                <div className="line-clamp-1 flex gap-2 font-medium">
                  Desempenho estável <TrendingUpIcon className="size-4" />
                </div>
                <div className="text-muted-foreground">
                  Total de visitas no mês
                </div>
              </CardFooter>
            </Card>

            {/* Active Boosts */}
            <Card className="@container/card" data-slot="card">
              <CardHeader className="relative">
                <CardDescription className="flex items-center gap-2">
                  <Rocket className="h-4 w-4" />
                  Boosts Ativos
                </CardDescription>
                <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
                  {activeBoosts.length}
                </CardTitle>
                <div className="absolute right-4 top-4">
                  <Badge variant="outline" className="flex gap-1 rounded-lg text-xs">
                    {activeBoosts.length > 0 ? (
                      <>
                        <TrendingUpIcon className="size-3" />
                        Ativo
                      </>
                    ) : (
                      "Inativo"
                    )}
                  </Badge>
                </div>
              </CardHeader>
              <CardFooter className="flex-col items-start gap-1 text-sm">
                <div className="line-clamp-1 flex gap-2 font-medium">
                  {activeBoosts.length > 0 ? (
                    <>
                      Promovendo seu perfil <Rocket className="size-4" />
                    </>
                  ) : (
                    "Nenhum boost ativo"
                  )}
                </div>
                <div className="text-muted-foreground">
                  {activeBoosts.length > 0 ? "Destaque garantido" : "Ative para mais visibilidade"}
                </div>
              </CardFooter>
            </Card>
          </div>

          {/* Chart */}
          <div className="px-4 lg:px-6">
            <ChartAreaInteractive />
          </div>
        </div>
      </div>
    </div>
  );
}
