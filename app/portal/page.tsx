"use client";

import { useEffect, useState } from "react";
import { TrendingUpIcon, Eye, Calendar, Rocket, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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

  if (loading) {
    return (
      <div className="flex-1 p-8">
        <div className="mx-auto max-w-7xl space-y-8">
          <div className="space-y-2">
            <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-96 animate-pulse rounded bg-gray-200" />
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 animate-pulse rounded-lg border bg-white" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Visão geral do seu perfil e desempenho
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Visits Today */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Visitas Hoje
              </CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.visitsToday || 0}</div>
              <p className="text-xs text-muted-foreground">
                {analytics?.visitsToday > 0 ? (
                  <span className="text-green-600">↑ +12.5% vs. ontem</span>
                ) : (
                  "Sem visitas hoje"
                )}
              </p>
            </CardContent>
          </Card>

          {/* Visits 7 Days */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Últimos 7 Dias
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.visits7Days || 0}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">↑ +8.2% vs. semana anterior</span>
              </p>
            </CardContent>
          </Card>

          {/* Visits 30 Days */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Últimos 30 Dias
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.visits30Days || 0}</div>
              <p className="text-xs text-muted-foreground">
                Total de visitas no mês
              </p>
            </CardContent>
          </Card>

          {/* Active Boosts */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Boosts Ativos
              </CardTitle>
              <Rocket className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeBoosts.length}</div>
              <p className="text-xs text-muted-foreground">
                {activeBoosts.length > 0 ? (
                  <span className="text-green-600">🚀 Promovendo seu perfil</span>
                ) : (
                  "Nenhum boost ativo"
                )}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
