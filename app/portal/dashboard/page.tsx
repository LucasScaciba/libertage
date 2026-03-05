"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { IconRefresh, IconAlertCircle } from "@tabler/icons-react";
import MediaViewsIndicator from "./components/MediaViewsIndicator";
import SocialClicksIndicator from "./components/SocialClicksIndicator";
import StoryViewsIndicator from "./components/StoryViewsIndicator";
import VisitsByDayIndicator from "./components/VisitsByDayIndicator";
import VisitsByStateIndicator from "./components/VisitsByStateIndicator";
import VisibilityRankIndicator from "./components/VisibilityRankIndicator";
import ContactChannelsIndicator from "./components/ContactChannelsIndicator";

interface DashboardData {
  mediaViews: MediaView[];
  socialClicks: SocialClick[];
  storyViews: StoryView[];
  visitsByDay: VisitByDay[];
  visitsByState: VisitByState[];
  visibilityRank: VisibilityRank;
  contactChannels: ContactChannel[];
}

interface MediaView {
  media_id: string;
  thumbnail_url: string;
  filename: string;
  media_type: "photo" | "video";
  view_count: number;
}

interface SocialClick {
  social_network: string;
  click_count: number;
}

interface StoryView {
  story_id: string;
  thumbnail_url: string;
  filename: string;
  view_count: number;
}

interface VisitByDay {
  day_of_week: number;
  visit_count: number;
}

interface VisitByState {
  state: string;
  visit_count: number;
}

interface VisibilityRank {
  percentile: number;
  category: "top_10" | "top_20" | "top_30" | "below_30";
  message: string;
}

interface ContactChannel {
  channel: "whatsapp" | "telegram";
  contact_count: number;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/analytics/dashboard");
      
      if (!response.ok) {
        throw new Error("Falha ao carregar dados do dashboard");
      }

      const dashboardData = await response.json();
      setData(dashboardData);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Dashboard Analytics</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(7)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-32 bg-gray-100 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Dashboard Analytics</h1>
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <IconAlertCircle className="h-5 w-5" />
              Erro ao Carregar Dashboard
            </CardTitle>
            <CardDescription className="text-red-600">{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={fetchDashboardData} variant="outline" className="gap-2">
              <IconRefresh className="h-4 w-4" />
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Dashboard Analytics</h1>
        <p className="text-muted-foreground mt-2">
          Acompanhe o desempenho e engajamento do seu perfil
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Visibility Rank - Full width on mobile, spans 2 cols on larger screens */}
        <div className="md:col-span-2 lg:col-span-3">
          <VisibilityRankIndicator data={data.visibilityRank} />
        </div>

        {/* Media Views */}
        <MediaViewsIndicator data={data.mediaViews} />

        {/* Story Views */}
        <StoryViewsIndicator data={data.storyViews} />

        {/* Social Clicks */}
        <SocialClicksIndicator data={data.socialClicks} />

        {/* Visits by Day - Spans 2 columns on larger screens */}
        <div className="md:col-span-2">
          <VisitsByDayIndicator data={data.visitsByDay} />
        </div>

        {/* Visits by State */}
        <VisitsByStateIndicator data={data.visitsByState} />

        {/* Contact Channels */}
        <ContactChannelsIndicator data={data.contactChannels} />
      </div>
    </div>
  );
}
