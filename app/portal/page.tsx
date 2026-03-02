import { AuthServerService } from "@/lib/services/auth-server.service";
import { ProfileService } from "@/lib/services/profile.service";
import { AnalyticsService } from "@/lib/services/analytics.service";
import { SubscriptionService } from "@/lib/services/subscription.service";
import { BoostService } from "@/lib/services/boost.service";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function PortalPage() {
  const user = await AuthServerService.getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // Get user's profile
  const { data: profile } = await (await import("@/lib/supabase/server"))
    .createClient()
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  // Get analytics summary
  let analytics = null;
  if (profile) {
    try {
      analytics = await AnalyticsService.getAnalyticsSummary(profile.id);
    } catch (error) {
      console.error("Error loading analytics:", error);
    }
  }

  // Get subscription and limits
  let subscription = null;
  let mediaLimits = { maxPhotos: 3, maxVideos: 0 };
  try {
    subscription = await SubscriptionService.getCurrentSubscription(user.id);
    mediaLimits = await SubscriptionService.getMediaLimits(user.id);
  } catch (error) {
    console.error("Error loading subscription:", error);
  }

  // Get boosts
  let boosts: any[] = [];
  try {
    boosts = (await BoostService.getUserBoosts(user.id)) || [];
  } catch (error) {
    console.error("Error loading boosts:", error);
  }

  // Filter active and scheduled boosts
  const activeBoosts = boosts.filter((b) => b.status === "active");
  const scheduledBoosts = boosts.filter((b) => b.status === "scheduled");

  // Get current media count
  let mediaCount = { photos: 0, videos: 0 };
  if (profile) {
    const supabase = await (await import("@/lib/supabase/server")).createClient();
    const { count: photoCount } = await supabase
      .from("media")
      .select("*", { count: "exact", head: true })
      .eq("profile_id", profile.id)
      .eq("type", "photo");
    const { count: videoCount } = await supabase
      .from("media")
      .select("*", { count: "exact", head: true })
      .eq("profile_id", profile.id)
      .eq("type", "video");
    mediaCount = { photos: photoCount || 0, videos: videoCount || 0 };
  }

  const planName = subscription?.plans
    ? (subscription.plans as any).name
    : "Free";

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Portal do Provedor
          </h1>
          <p className="text-gray-600 mb-8">Bem-vindo, {user.name}!</p>

          {/* Analytics Summary */}
          {profile && analytics && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Estatísticas do Perfil
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardDescription>Visitas Hoje</CardDescription>
                    <CardTitle className="text-3xl">
                      {analytics.visitsToday}
                    </CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardDescription>Últimos 7 Dias</CardDescription>
                    <CardTitle className="text-3xl">
                      {analytics.visits7Days}
                    </CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardDescription>Últimos 30 Dias</CardDescription>
                    <CardTitle className="text-3xl">
                      {analytics.visits30Days}
                    </CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardDescription>Últimos 12 Meses</CardDescription>
                    <CardTitle className="text-3xl">
                      {analytics.visits12Months}
                    </CardTitle>
                  </CardHeader>
                </Card>
              </div>

              {/* Clicks by method */}
              {Object.keys(analytics.clicksByMethod).length > 0 && (
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle>Cliques por Método de Contato</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Object.entries(analytics.clicksByMethod).map(
                        ([method, count]) => (
                          <div
                            key={method}
                            className="flex justify-between items-center"
                          >
                            <span className="text-sm font-medium capitalize">
                              {method}
                            </span>
                            <span className="text-sm text-gray-600">
                              {count} cliques
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Subscription & Media Limits */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Plano e Limites
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Plano Atual</CardTitle>
                  <CardDescription>
                    Você está no plano {planName}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Fotos</span>
                      <span className="text-sm font-medium">
                        {mediaCount.photos} / {mediaLimits.maxPhotos}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Vídeos</span>
                      <span className="text-sm font-medium">
                        {mediaCount.videos} / {mediaLimits.maxVideos}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Boost Credits</CardTitle>
                  <CardDescription>
                    Promova seu perfil no catálogo
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Boosts Ativos</span>
                      <span className="text-sm font-medium">
                        {activeBoosts.length}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Boosts Agendados</span>
                      <span className="text-sm font-medium">
                        {scheduledBoosts.length}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Active and Scheduled Boosts */}
          {(activeBoosts.length > 0 || scheduledBoosts.length > 0) && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Seus Boosts
              </h2>
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    {activeBoosts.map((boost) => (
                      <div
                        key={boost.id}
                        className="flex justify-between items-center p-3 bg-green-50 rounded-lg"
                      >
                        <div>
                          <span className="text-sm font-medium text-green-900">
                            Ativo Agora
                          </span>
                          <p className="text-xs text-green-700">
                            Termina em{" "}
                            {new Date(boost.end_time).toLocaleString("pt-BR")}
                          </p>
                        </div>
                        <span className="px-2 py-1 text-xs font-medium text-green-800 bg-green-200 rounded">
                          ATIVO
                        </span>
                      </div>
                    ))}
                    {scheduledBoosts.map((boost) => (
                      <div
                        key={boost.id}
                        className="flex justify-between items-center p-3 bg-blue-50 rounded-lg"
                      >
                        <div>
                          <span className="text-sm font-medium text-blue-900">
                            Agendado
                          </span>
                          <p className="text-xs text-blue-700">
                            Inicia em{" "}
                            {new Date(boost.start_time).toLocaleString("pt-BR")}
                          </p>
                        </div>
                        <span className="px-2 py-1 text-xs font-medium text-blue-800 bg-blue-200 rounded">
                          AGENDADO
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Quick Actions */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Ações Rápidas
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Link
                href="/portal/profile"
                className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="p-5">
                  <h3 className="text-lg font-medium text-gray-900">
                    Editar Perfil
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Atualize suas informações e disponibilidade
                  </p>
                </div>
              </Link>

              <Link
                href="/portal/media"
                className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="p-5">
                  <h3 className="text-lg font-medium text-gray-900">
                    Upload de Mídia
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Adicione fotos e vídeos ao seu perfil
                  </p>
                </div>
              </Link>

              <Link
                href="/portal/boosts"
                className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="p-5">
                  <h3 className="text-lg font-medium text-gray-900">
                    Comprar Boost
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Promova seu perfil por 2 horas
                  </p>
                </div>
              </Link>

              <Link
                href="/portal/plans"
                className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="p-5">
                  <h3 className="text-lg font-medium text-gray-900">
                    Gerenciar Plano
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Upgrade ou gerencie sua assinatura
                  </p>
                </div>
              </Link>

              <Link
                href="/portal/analytics"
                className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="p-5">
                  <h3 className="text-lg font-medium text-gray-900">
                    Ver Analytics Completo
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Análise detalhada de desempenho
                  </p>
                </div>
              </Link>

              {profile && (
                <Link
                  href={`/profiles/${profile.slug}`}
                  target="_blank"
                  className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="p-5">
                    <h3 className="text-lg font-medium text-gray-900">
                      Ver Perfil Público
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Veja como visitantes veem seu perfil
                    </p>
                  </div>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
