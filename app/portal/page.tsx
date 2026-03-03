"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { 
  TrendingUp, 
  Eye, 
  Calendar, 
  Rocket, 
  Edit, 
  Image as ImageIcon, 
  Zap, 
  ExternalLink,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";

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
  const planName = subscription?.plans?.name || "Free";

  // Calculate percentage change (mock data for now)
  const todayChange = analytics?.visitsToday > 0 ? "+12.5%" : "0%";
  const weekChange = "+8.2%";

  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
        <div className="flex items-center justify-between space-y-2">
          <div className="space-y-2">
            <div className="h-8 w-64 animate-pulse rounded-lg bg-gray-200" />
            <div className="h-4 w-96 animate-pulse rounded-lg bg-gray-200" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl border bg-white" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Visão geral do seu perfil e desempenho
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {profile && (
            <Button asChild>
              <Link href={`/profiles/${profile.slug}`} target="_blank">
                <ExternalLink className="mr-2 h-4 w-4" />
                Ver Perfil Público
              </Link>
            </Button>
          )}
        </div>
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
              <span className={`inline-flex items-center ${analytics?.visitsToday > 0 ? 'text-green-600' : 'text-gray-500'}`}>
                {analytics?.visitsToday > 0 ? (
                  <>
                    <ArrowUpRight className="mr-1 h-3 w-3" />
                    {todayChange}
                  </>
                ) : (
                  "Sem mudanças"
                )}
              </span>
              {" "}vs. ontem
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
              <span className="inline-flex items-center text-green-600">
                <ArrowUpRight className="mr-1 h-3 w-3" />
                {weekChange}
              </span>
              {" "}vs. semana anterior
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

      {/* Two Column Layout */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Contact Clicks */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Cliques por Método de Contato</CardTitle>
            <CardDescription>
              Como os visitantes estão entrando em contato com você
            </CardDescription>
          </CardHeader>
          <CardContent>
            {analytics && Object.keys(analytics.clicksByMethod || {}).length > 0 ? (
              <div className="space-y-8">
                {Object.entries(analytics.clicksByMethod).map(([method, count]: [string, any]) => {
                  const total = Object.values(analytics.clicksByMethod).reduce((a: any, b: any) => a + b, 0) as number;
                  const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
                  
                  return (
                    <div key={method} className="flex items-center">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-lg">
                        {method === "whatsapp" ? "💬" : method === "telegram" ? "✈️" : "📧"}
                      </div>
                      <div className="ml-4 space-y-1 flex-1">
                        <p className="text-sm font-medium leading-none capitalize">
                          {method}
                        </p>
                        <div className="flex items-center gap-2">
                          <div className="h-2 flex-1 rounded-full bg-muted overflow-hidden">
                            <div 
                              className="h-full bg-primary transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {percentage}%
                          </p>
                        </div>
                      </div>
                      <div className="ml-auto font-medium">
                        {count}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
                Nenhum clique registrado ainda
              </div>
            )}
          </CardContent>
        </Card>

        {/* Plan & Limits */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Plano Atual</CardTitle>
            <CardDescription>
              {planName}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Photos */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Fotos</span>
                  </div>
                  <span className="text-muted-foreground">
                    {mediaCount.photos} / {mediaLimits.maxPhotos}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full transition-all ${
                      mediaCount.photos >= mediaLimits.maxPhotos 
                        ? "bg-destructive" 
                        : "bg-primary"
                    }`}
                    style={{ width: `${Math.min((mediaCount.photos / mediaLimits.maxPhotos) * 100, 100)}%` }}
                  />
                </div>
              </div>

              {/* Videos */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Vídeos</span>
                  </div>
                  <span className="text-muted-foreground">
                    {mediaCount.videos} / {mediaLimits.maxVideos}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full transition-all ${
                      mediaCount.videos >= mediaLimits.maxVideos 
                        ? "bg-destructive" 
                        : "bg-primary"
                    }`}
                    style={{ width: `${Math.min((mediaCount.videos / mediaLimits.maxVideos) * 100, 100)}%` }}
                  />
                </div>
              </div>

              <Button asChild className="w-full" variant="outline">
                <Link href="/portal/plans">
                  Gerenciar Plano
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
          <CardDescription>
            Acesso rápido às funcionalidades principais
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Button asChild variant="outline" className="h-auto flex-col items-start p-4">
              <Link href="/portal/profile">
                <Edit className="mb-2 h-5 w-5" />
                <div className="space-y-1 text-left">
                  <p className="font-medium">Editar Perfil</p>
                  <p className="text-xs text-muted-foreground">
                    Atualize suas informações
                  </p>
                </div>
              </Link>
            </Button>

            <Button asChild variant="outline" className="h-auto flex-col items-start p-4">
              <Link href="/portal/profile#media">
                <ImageIcon className="mb-2 h-5 w-5" />
                <div className="space-y-1 text-left">
                  <p className="font-medium">Gerenciar Mídia</p>
                  <p className="text-xs text-muted-foreground">
                    Adicione fotos e vídeos
                  </p>
                </div>
              </Link>
            </Button>

            <Button asChild variant="outline" className="h-auto flex-col items-start p-4">
              <Link href="/portal/boosts">
                <Zap className="mb-2 h-5 w-5" />
                <div className="space-y-1 text-left">
                  <p className="font-medium">Comprar Boost</p>
                  <p className="text-xs text-muted-foreground">
                    Destaque seu perfil
                  </p>
                </div>
              </Link>
            </Button>

            <Button asChild variant="outline" className="h-auto flex-col items-start p-4">
              <Link href="/portal/analytics">
                <Activity className="mb-2 h-5 w-5" />
                <div className="space-y-1 text-left">
                  <p className="font-medium">Ver Analytics</p>
                  <p className="text-xs text-muted-foreground">
                    Análise detalhada
                  </p>
                </div>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
