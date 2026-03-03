"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { TrendingUp, Eye, Calendar, Rocket, Edit, Image as ImageIcon, Zap, ExternalLink } from "lucide-react";

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

  if (loading) {
    return (
      <div className="p-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 space-y-2">
            <div className="h-8 w-48 animate-pulse rounded-lg bg-gray-200" />
            <div className="h-4 w-80 animate-pulse rounded-lg bg-gray-200" />
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 animate-pulse rounded-lg border bg-white" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Visão geral do seu perfil e desempenho</p>
        </div>

        {/* Stats Grid */}
        <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* Visits Today */}
          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2 text-sm text-gray-600">
                <Eye className="h-4 w-4" />
                Visitas Hoje
              </CardDescription>
              <CardTitle className="text-3xl font-bold text-gray-900">
                {analytics?.visitsToday || 0}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm">
                <span className={analytics?.visitsToday > 0 ? "text-green-600" : "text-gray-500"}>
                  {analytics?.visitsToday > 0 ? <TrendingUp className="h-4 w-4" /> : "—"}
                </span>
                <span className="text-gray-600">vs. ontem</span>
              </div>
            </CardContent>
          </Card>

          {/* Visits 7 Days */}
          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="h-4 w-4" />
                Últimos 7 Dias
              </CardDescription>
              <CardTitle className="text-3xl font-bold text-gray-900">
                {analytics?.visits7Days || 0}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-600">Total de visitas</span>
              </div>
            </CardContent>
          </Card>

          {/* Visits 30 Days */}
          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="h-4 w-4" />
                Últimos 30 Dias
              </CardDescription>
              <CardTitle className="text-3xl font-bold text-gray-900">
                {analytics?.visits30Days || 0}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-600">Total de visitas</span>
              </div>
            </CardContent>
          </Card>

          {/* Active Boosts */}
          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2 text-sm text-gray-600">
                <Rocket className="h-4 w-4" />
                Boosts Ativos
              </CardDescription>
              <CardTitle className="text-3xl font-bold text-gray-900">
                {activeBoosts.length}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm">
                <span className={activeBoosts.length > 0 ? "text-green-600" : "text-gray-600"}>
                  {activeBoosts.length > 0 ? "🚀 Promovendo" : "Nenhum ativo"}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Two Column Layout */}
        <div className="mb-8 grid gap-6 lg:grid-cols-3">
          {/* Contact Clicks */}
          {analytics && Object.keys(analytics.clicksByMethod || {}).length > 0 && (
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">
                  Cliques por Método de Contato
                </CardTitle>
                <CardDescription>
                  Como os visitantes estão entrando em contato
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(analytics.clicksByMethod).map(([method, count]: [string, any]) => (
                    <div key={method} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-xl">
                          {method === "whatsapp" ? "💬" : method === "telegram" ? "✈️" : "📧"}
                        </div>
                        <span className="text-sm font-medium capitalize">
                          {method}
                        </span>
                      </div>
                      <span className="text-xl font-semibold text-gray-900">
                        {count}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Plan & Limits */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">
                Plano Atual
              </CardTitle>
              <CardDescription>
                {planName}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Photos */}
                <div>
                  <div className="mb-2 flex justify-between">
                    <span className="text-sm text-gray-600">Fotos</span>
                    <span className="text-sm font-medium">
                      {mediaCount.photos} / {mediaLimits.maxPhotos}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                    <div
                      className={`h-full transition-all ${
                        mediaCount.photos >= mediaLimits.maxPhotos ? "bg-red-500" : "bg-green-500"
                      }`}
                      style={{ width: `${(mediaCount.photos / mediaLimits.maxPhotos) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Videos */}
                <div>
                  <div className="mb-2 flex justify-between">
                    <span className="text-sm text-gray-600">Vídeos</span>
                    <span className="text-sm font-medium">
                      {mediaCount.videos} / {mediaLimits.maxVideos}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                    <div
                      className={`h-full transition-all ${
                        mediaCount.videos >= mediaLimits.maxVideos ? "bg-red-500" : "bg-green-500"
                      }`}
                      style={{ width: `${(mediaCount.videos / mediaLimits.maxVideos) * 100}%` }}
                    />
                  </div>
                </div>

                <Link
                  href="/portal/plans"
                  className="mt-2 block rounded-lg bg-gray-100 px-4 py-2 text-center text-sm font-medium text-gray-900 transition-colors hover:bg-gray-200"
                >
                  Gerenciar Plano
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              Ações Rápidas
            </CardTitle>
            <CardDescription>
              Acesso rápido às funcionalidades principais
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Link
                href="/portal/profile"
                className="group flex flex-col rounded-lg border bg-gray-50 p-4 transition-all hover:border-gray-300 hover:bg-gray-100"
              >
                <Edit className="mb-2 h-6 w-6 text-gray-600 transition-colors group-hover:text-gray-900" />
                <span className="text-sm font-medium text-gray-900">Editar Perfil</span>
              </Link>

              <Link
                href="/portal/profile#media"
                className="group flex flex-col rounded-lg border bg-gray-50 p-4 transition-all hover:border-gray-300 hover:bg-gray-100"
              >
                <ImageIcon className="mb-2 h-6 w-6 text-gray-600 transition-colors group-hover:text-gray-900" />
                <span className="text-sm font-medium text-gray-900">Gerenciar Mídia</span>
              </Link>

              <Link
                href="/portal/boosts"
                className="group flex flex-col rounded-lg border bg-gray-50 p-4 transition-all hover:border-gray-300 hover:bg-gray-100"
              >
                <Zap className="mb-2 h-6 w-6 text-gray-600 transition-colors group-hover:text-gray-900" />
                <span className="text-sm font-medium text-gray-900">Comprar Boost</span>
              </Link>

              {profile && (
                <Link
                  href={`/profiles/${profile.slug}`}
                  target="_blank"
                  className="group flex flex-col rounded-lg border bg-gray-50 p-4 transition-all hover:border-gray-300 hover:bg-gray-100"
                >
                  <ExternalLink className="mb-2 h-6 w-6 text-gray-600 transition-colors group-hover:text-gray-900" />
                  <span className="text-sm font-medium text-gray-900">Ver Perfil Público</span>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
