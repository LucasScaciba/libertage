"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Eye, MousePointerClick, TrendingUp } from "lucide-react";

interface AnalyticsSummary {
  visitsToday: number;
  visits7Days: number;
  visits30Days: number;
  visits12Months: number;
  clicksByMethod: Record<string, number>;
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Analytics — Libertage";
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await fetch("/api/analytics/dashboard");

      if (!res.ok) {
        if (res.status === 401) {
          setError("Você precisa estar autenticado");
        } else if (res.status === 404) {
          setError("Perfil não encontrado");
        } else {
          setError("Erro ao carregar analytics");
        }
        return;
      }

      const analyticsData = await res.json();
      setData(analyticsData);
    } catch (err) {
      console.error("Error fetching analytics:", err);
      setError("Erro ao carregar analytics");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-500">Carregando analytics...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-900 text-xl mb-4">{error}</p>
          <Link href="/portal">
            <Button>Voltar ao Portal</Button>
          </Link>
        </div>
      </div>
    );
  }

  const totalClicks = Object.values(data.clicksByMethod).reduce((sum, count) => sum + count, 0);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="mb-8">
            <Link href="/portal" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
              ← Voltar ao Portal
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics do Perfil</h1>
            <p className="text-gray-600">
              Acompanhe o desempenho e engajamento do seu perfil
            </p>
          </div>

          {/* Visitor Stats */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Eye className="mr-2 h-5 w-5" />
              Visualizações do Perfil
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Hoje</CardDescription>
                  <CardTitle className="text-3xl">{data.visitsToday}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-gray-500">Visitas nas últimas 24h</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>7 Dias</CardDescription>
                  <CardTitle className="text-3xl">{data.visits7Days}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-gray-500">Visitas na última semana</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>30 Dias</CardDescription>
                  <CardTitle className="text-3xl">{data.visits30Days}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-gray-500">Visitas no último mês</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>12 Meses</CardDescription>
                  <CardTitle className="text-3xl">{data.visits12Months}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-gray-500">Visitas no último ano</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Contact Clicks */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <MousePointerClick className="mr-2 h-5 w-5" />
              Cliques em Botões de Contato
            </h2>
            <Card>
              <CardHeader>
                <CardTitle>Total de Cliques: {totalClicks}</CardTitle>
                <CardDescription>Cliques por método de contato</CardDescription>
              </CardHeader>
              <CardContent>
                {Object.keys(data.clicksByMethod).length > 0 ? (
                  <div className="space-y-4">
                    {Object.entries(data.clicksByMethod)
                      .sort(([, a], [, b]) => b - a)
                      .map(([method, count]) => (
                        <div key={method} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-32 font-medium text-gray-900 capitalize">
                              {method}
                            </div>
                            <div className="flex-1">
                              <div className="bg-gray-200 rounded-full h-2 w-64">
                                <div
                                  className="bg-blue-600 h-2 rounded-full"
                                  style={{
                                    width: `${(count / totalClicks) * 100}%`,
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                          <div className="text-2xl font-bold text-gray-900 ml-4">{count}</div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    Nenhum clique registrado ainda
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Insights */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <TrendingUp className="mr-2 h-5 w-5" />
              Insights
            </h2>
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <Eye className="h-4 w-4 text-blue-600" />
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Taxa de Conversão</p>
                      <p className="text-sm text-gray-500">
                        {data.visits7Days > 0
                          ? `${((totalClicks / data.visits7Days) * 100).toFixed(1)}% dos visitantes clicaram em um botão de contato nos últimos 7 dias`
                          : "Aguardando mais dados para calcular"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Crescimento</p>
                      <p className="text-sm text-gray-500">
                        {data.visits7Days > 0 && data.visitsToday > 0
                          ? `Média de ${(data.visits7Days / 7).toFixed(1)} visitas por dia na última semana`
                          : "Continue promovendo seu perfil para aumentar as visitas"}
                      </p>
                    </div>
                  </div>

                  {Object.keys(data.clicksByMethod).length > 0 && (
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                          <MousePointerClick className="h-4 w-4 text-purple-600" />
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Método Mais Popular</p>
                        <p className="text-sm text-gray-500">
                          {Object.entries(data.clicksByMethod).sort(([, a], [, b]) => b - a)[0][0]}{" "}
                          é o método de contato mais clicado
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
