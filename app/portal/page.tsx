"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

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
      // Load profile and subscription
      const profileRes = await fetch("/api/profiles/me");
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setProfile(profileData.profile);
        setSubscription(profileData.subscription);

        // Load analytics if profile exists
        if (profileData.profile) {
          const analyticsRes = await fetch(`/api/analytics/dashboard?profileId=${profileData.profile.id}`);
          if (analyticsRes.ok) {
            const analyticsData = await analyticsRes.json();
            setAnalytics(analyticsData);
          }

          // Load media count
          const mediaRes = await fetch(`/api/media?profileId=${profileData.profile.id}`);
          if (mediaRes.ok) {
            const mediaData = await mediaRes.json();
            const photos = mediaData.media?.filter((m: any) => m.type === "photo").length || 0;
            const videos = mediaData.media?.filter((m: any) => m.type === "video").length || 0;
            setMediaCount({ photos, videos });
          }
        }

        // Set media limits from subscription
        if (profileData.subscription?.plans) {
          setMediaLimits({
            maxPhotos: profileData.subscription.plans.max_photos || 6,
            maxVideos: profileData.subscription.plans.max_videos || 1,
          });
        }
      }

      // Load boosts
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
      <div style={{ padding: "2rem" }}>
        <div style={{ maxWidth: "80rem", margin: "0 auto" }}>
          <div style={{ marginBottom: "2rem" }}>
            <div style={{ width: "12rem", height: "2rem", backgroundColor: "#e5e7eb", borderRadius: "0.5rem", marginBottom: "0.5rem" }} />
            <div style={{ width: "20rem", height: "1rem", backgroundColor: "#e5e7eb", borderRadius: "0.5rem" }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1.5rem" }}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} style={{ height: "8rem", backgroundColor: "white", borderRadius: "0.5rem", border: "1px solid #e5e7eb" }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem", backgroundColor: "#f9fafb", minHeight: "100vh" }}>
      <div style={{ maxWidth: "80rem", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "1.875rem", fontWeight: "700", color: "#111827", marginBottom: "0.5rem" }}>
            Dashboard
          </h1>
          <p style={{ color: "#6b7280" }}>
            Visão geral do seu perfil e desempenho
          </p>
        </div>

        {/* Stats Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1.5rem", marginBottom: "2rem" }}>
          {/* Visits Today */}
          <Card>
            <CardHeader style={{ paddingBottom: "0.75rem" }}>
              <CardDescription style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                Visitas Hoje
              </CardDescription>
              <CardTitle style={{ fontSize: "2rem", fontWeight: "700", color: "#111827" }}>
                {analytics?.visitsToday || 0}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem" }}>
                <span style={{ color: analytics?.visitsToday > 0 ? "#10b981" : "#6b7280" }}>
                  {analytics?.visitsToday > 0 ? "↑" : "—"}
                </span>
                <span style={{ color: "#6b7280" }}>vs. ontem</span>
              </div>
            </CardContent>
          </Card>

          {/* Visits 7 Days */}
          <Card>
            <CardHeader style={{ paddingBottom: "0.75rem" }}>
              <CardDescription style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                Últimos 7 Dias
              </CardDescription>
              <CardTitle style={{ fontSize: "2rem", fontWeight: "700", color: "#111827" }}>
                {analytics?.visits7Days || 0}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem" }}>
                <span style={{ color: "#6b7280" }}>Total de visitas</span>
              </div>
            </CardContent>
          </Card>

          {/* Visits 30 Days */}
          <Card>
            <CardHeader style={{ paddingBottom: "0.75rem" }}>
              <CardDescription style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                Últimos 30 Dias
              </CardDescription>
              <CardTitle style={{ fontSize: "2rem", fontWeight: "700", color: "#111827" }}>
                {analytics?.visits30Days || 0}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem" }}>
                <span style={{ color: "#6b7280" }}>Total de visitas</span>
              </div>
            </CardContent>
          </Card>

          {/* Active Boosts */}
          <Card>
            <CardHeader style={{ paddingBottom: "0.75rem" }}>
              <CardDescription style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                Boosts Ativos
              </CardDescription>
              <CardTitle style={{ fontSize: "2rem", fontWeight: "700", color: "#111827" }}>
                {activeBoosts.length}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem" }}>
                <span style={{ color: activeBoosts.length > 0 ? "#10b981" : "#6b7280" }}>
                  {activeBoosts.length > 0 ? "🚀 Promovendo" : "Nenhum ativo"}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Two Column Layout */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1.5rem", marginBottom: "2rem" }}>
          {/* Contact Clicks */}
          {analytics && Object.keys(analytics.clicksByMethod || {}).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle style={{ fontSize: "1.125rem", fontWeight: "600" }}>
                  Cliques por Método de Contato
                </CardTitle>
                <CardDescription>
                  Como os visitantes estão entrando em contato
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {Object.entries(analytics.clicksByMethod).map(([method, count]: [string, any]) => (
                    <div key={method} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <div style={{
                          width: "2.5rem",
                          height: "2.5rem",
                          borderRadius: "0.5rem",
                          backgroundColor: "#f3f4f6",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "1.25rem"
                        }}>
                          {method === "whatsapp" ? "💬" : method === "telegram" ? "✈️" : "📧"}
                        </div>
                        <span style={{ fontSize: "0.875rem", fontWeight: "500", textTransform: "capitalize" }}>
                          {method}
                        </span>
                      </div>
                      <span style={{ fontSize: "1.25rem", fontWeight: "600", color: "#111827" }}>
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
              <CardTitle style={{ fontSize: "1.125rem", fontWeight: "600" }}>
                Plano Atual
              </CardTitle>
              <CardDescription>
                {planName}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {/* Photos */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                    <span style={{ fontSize: "0.875rem", color: "#6b7280" }}>Fotos</span>
                    <span style={{ fontSize: "0.875rem", fontWeight: "500" }}>
                      {mediaCount.photos} / {mediaLimits.maxPhotos}
                    </span>
                  </div>
                  <div style={{ width: "100%", height: "0.5rem", backgroundColor: "#e5e7eb", borderRadius: "9999px", overflow: "hidden" }}>
                    <div style={{
                      width: `${(mediaCount.photos / mediaLimits.maxPhotos) * 100}%`,
                      height: "100%",
                      backgroundColor: mediaCount.photos >= mediaLimits.maxPhotos ? "#ef4444" : "#10b981",
                      transition: "width 0.3s"
                    }} />
                  </div>
                </div>

                {/* Videos */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                    <span style={{ fontSize: "0.875rem", color: "#6b7280" }}>Vídeos</span>
                    <span style={{ fontSize: "0.875rem", fontWeight: "500" }}>
                      {mediaCount.videos} / {mediaLimits.maxVideos}
                    </span>
                  </div>
                  <div style={{ width: "100%", height: "0.5rem", backgroundColor: "#e5e7eb", borderRadius: "9999px", overflow: "hidden" }}>
                    <div style={{
                      width: `${(mediaCount.videos / mediaLimits.maxVideos) * 100}%`,
                      height: "100%",
                      backgroundColor: mediaCount.videos >= mediaLimits.maxVideos ? "#ef4444" : "#10b981",
                      transition: "width 0.3s"
                    }} />
                  </div>
                </div>

                <Link
                  href="/portal/plans"
                  style={{
                    display: "block",
                    textAlign: "center",
                    padding: "0.5rem",
                    backgroundColor: "#f3f4f6",
                    borderRadius: "0.5rem",
                    fontSize: "0.875rem",
                    fontWeight: "500",
                    color: "#111827",
                    textDecoration: "none",
                    marginTop: "0.5rem"
                  }}
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
            <CardTitle style={{ fontSize: "1.125rem", fontWeight: "600" }}>
              Ações Rápidas
            </CardTitle>
            <CardDescription>
              Acesso rápido às funcionalidades principais
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
              <Link
                href="/portal/profile"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  padding: "1rem",
                  backgroundColor: "#f9fafb",
                  borderRadius: "0.5rem",
                  border: "1px solid #e5e7eb",
                  textDecoration: "none",
                  transition: "all 0.2s"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#f3f4f6";
                  e.currentTarget.style.borderColor = "#d1d5db";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#f9fafb";
                  e.currentTarget.style.borderColor = "#e5e7eb";
                }}
              >
                <span style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>✏️</span>
                <span style={{ fontSize: "0.875rem", fontWeight: "500", color: "#111827" }}>Editar Perfil</span>
              </Link>

              <Link
                href="/portal/profile#media"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  padding: "1rem",
                  backgroundColor: "#f9fafb",
                  borderRadius: "0.5rem",
                  border: "1px solid #e5e7eb",
                  textDecoration: "none",
                  transition: "all 0.2s"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#f3f4f6";
                  e.currentTarget.style.borderColor = "#d1d5db";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#f9fafb";
                  e.currentTarget.style.borderColor = "#e5e7eb";
                }}
              >
                <span style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>📸</span>
                <span style={{ fontSize: "0.875rem", fontWeight: "500", color: "#111827" }}>Gerenciar Mídia</span>
              </Link>

              <Link
                href="/portal/boosts"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  padding: "1rem",
                  backgroundColor: "#f9fafb",
                  borderRadius: "0.5rem",
                  border: "1px solid #e5e7eb",
                  textDecoration: "none",
                  transition: "all 0.2s"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#f3f4f6";
                  e.currentTarget.style.borderColor = "#d1d5db";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#f9fafb";
                  e.currentTarget.style.borderColor = "#e5e7eb";
                }}
              >
                <span style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>🚀</span>
                <span style={{ fontSize: "0.875rem", fontWeight: "500", color: "#111827" }}>Comprar Boost</span>
              </Link>

              {profile && (
                <Link
                  href={`/profiles/${profile.slug}`}
                  target="_blank"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    padding: "1rem",
                    backgroundColor: "#f9fafb",
                    borderRadius: "0.5rem",
                    border: "1px solid #e5e7eb",
                    textDecoration: "none",
                    transition: "all 0.2s"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#f3f4f6";
                    e.currentTarget.style.borderColor = "#d1d5db";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#f9fafb";
                    e.currentTarget.style.borderColor = "#e5e7eb";
                  }}
                >
                  <span style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>👁️</span>
                  <span style={{ fontSize: "0.875rem", fontWeight: "500", color: "#111827" }}>Ver Perfil Público</span>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
