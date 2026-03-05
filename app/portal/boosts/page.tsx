"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Boost {
  id: string;
  start_time: string;
  end_time: string;
  status: string;
  amount_paid: number;
  profiles: {
    display_name: string;
    slug: string;
  };
}

export default function BoostsPage() {
  const searchParams = useSearchParams();
  const [profile, setProfile] = useState<any>(null);
  const [boosts, setBoosts] = useState<Boost[]>([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [availability, setAvailability] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    document.title = "Boosts — Libertage";
  }, []);

  useEffect(() => {
    // Check for success/cancel parameters
    const boostSuccess = searchParams.get("boost_success");
    const boostCanceled = searchParams.get("boost_canceled");

    if (boostSuccess === "true") {
      setSuccessMessage("Boost adquirido com sucesso! Seu perfil será promovido no horário agendado.");
      // Clean URL
      window.history.replaceState({}, "", "/portal/boosts");
      // Clear message after 5 seconds
      setTimeout(() => setSuccessMessage(""), 5000);
    } else if (boostCanceled === "true") {
      setError("A compra do boost foi cancelada.");
      // Clean URL
      window.history.replaceState({}, "", "/portal/boosts");
      // Clear message after 5 seconds
      setTimeout(() => setError(""), 5000);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchProfile();
    fetchBoosts();
    
    const today = new Date();
    setSelectedDate(today.toISOString().split("T")[0]);
    
    const nextHour = new Date(today.getTime() + 60 * 60 * 1000);
    setSelectedTime(
      `${String(nextHour.getHours()).padStart(2, "0")}:00`
    );
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/profiles/me");
      const data = await res.json();
      setProfile(data.profile);
    } catch (err) {
      console.error("Error fetching profile:", err);
    }
  };

  const fetchBoosts = async () => {
    try {
      const res = await fetch("/api/boosts/me");
      const data = await res.json();
      setBoosts(data.boosts || []);
    } catch (err) {
      console.error("Error fetching boosts:", err);
    }
  };

  const checkAvailability = async () => {
    if (!profile || !selectedDate || !selectedTime) {
      setError("Por favor, selecione data e hora");
      return;
    }

    setCheckingAvailability(true);
    setError("");
    setAvailability(null);

    try {
      const startTime = new Date(`${selectedDate}T${selectedTime}:00`);
      
      const res = await fetch(
        `/api/boosts/availability?profileId=${profile.id}&startTime=${startTime.toISOString()}`
      );
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao verificar disponibilidade");
      }

      setAvailability(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCheckingAvailability(false);
    }
  };

  const handlePurchaseBoost = async () => {
    if (!profile || !selectedDate || !selectedTime) {
      setError("Por favor, selecione data e hora");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const startTime = new Date(`${selectedDate}T${selectedTime}:00`);

      const res = await fetch("/api/boosts/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId: profile.id,
          startTime: startTime.toISOString(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao criar checkout");
      }

      window.location.href = data.url;
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { color: string; text: string }> = {
      scheduled: { color: "bg-blue-100 text-blue-800", text: "Agendado" },
      active: { color: "bg-green-100 text-green-800", text: "Ativo" },
      expired: { color: "bg-gray-100 text-gray-800", text: "Expirado" },
      canceled: { color: "bg-red-100 text-red-800", text: "Cancelado" },
    };

    const badge = badges[status] || badges.scheduled;

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color}`}
      >
        {badge.text}
      </span>
    );
  };

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
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/portal">Portal</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Boosts</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="min-h-screen bg-white">
            <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Boosts</h1>
                <p className="mt-2 text-sm text-gray-600">
                  Promova seu perfil no topo dos resultados por 2 horas
                </p>
              </div>

              {successMessage && (
                <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                  {successMessage}
                </div>
              )}

              {error && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              {/* Purchase Boost Section */}
              <div className="bg-white rounded-lg shadow p-6 mb-8">
                <h2 className="text-xl font-semibold mb-4">Comprar Boost</h2>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-5 w-5 text-blue-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-800">
                        Como funciona o Boost?
                      </h3>
                      <div className="mt-2 text-sm text-blue-700">
                        <ul className="list-disc list-inside space-y-1">
                          <li>Seu perfil aparece no topo dos resultados por 2 horas</li>
                          <li>Máximo de 15 perfis promovidos por região/categoria</li>
                          <li>Valor: R$ 50,00 por boost</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <Label htmlFor="date">Data</Label>
                    <Input
                      id="date"
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      min={new Date().toISOString().split("T")[0]}
                    />
                  </div>
                  <div>
                    <Label htmlFor="time">Hora de Início</Label>
                    <Input
                      id="time"
                      type="time"
                      value={selectedTime}
                      onChange={(e) => setSelectedTime(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex gap-2 mb-4">
                  <Button
                    onClick={checkAvailability}
                    disabled={checkingAvailability || !profile}
                    variant="outline"
                  >
                    {checkingAvailability
                      ? "Verificando..."
                      : "Verificar Disponibilidade"}
                  </Button>
                </div>

                {availability && (
                  <div className="mt-4">
                    {availability.available ? (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-start">
                          <svg
                            className="h-5 w-5 text-green-400 mt-0.5"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <div className="ml-3">
                            <h3 className="text-sm font-medium text-green-800">
                              Horário Disponível!
                            </h3>
                            <p className="mt-1 text-sm text-green-700">
                              {formatDateTime(availability.startTime)} até{" "}
                              {formatDateTime(availability.endTime)}
                            </p>
                            <div className="mt-4">
                              <Button
                                onClick={handlePurchaseBoost}
                                disabled={loading}
                              >
                                {loading ? "Processando..." : "Comprar Boost - R$ 50,00"}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-start">
                          <svg
                            className="h-5 w-5 text-yellow-400 mt-0.5"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <div className="ml-3">
                            <h3 className="text-sm font-medium text-yellow-800">
                              Horário Indisponível
                            </h3>
                            <p className="mt-1 text-sm text-yellow-700">
                              Capacidade máxima atingida. Próximos horários disponíveis:
                            </p>
                            <ul className="mt-2 space-y-1">
                              {availability.nextAvailableSlots?.map(
                                (slot: any, index: number) => (
                                  <li key={index} className="text-sm text-yellow-700">
                                    • {formatDateTime(slot.startTime)} até{" "}
                                    {formatDateTime(slot.endTime)}
                                  </li>
                                )
                              )}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Active and Scheduled Boosts */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Meus Boosts</h2>

                {boosts.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    Você ainda não possui boosts
                  </p>
                ) : (
                  <div className="space-y-4">
                    {boosts.map((boost) => (
                      <div
                        key={boost.id}
                        className="border border-gray-200 rounded-lg p-4"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-medium text-gray-900">
                                {boost.profiles.display_name}
                              </h3>
                              {getStatusBadge(boost.status)}
                            </div>
                            <div className="text-sm text-gray-600 space-y-1">
                              <p>
                                <span className="font-medium">Início:</span>{" "}
                                {formatDateTime(boost.start_time)}
                              </p>
                              <p>
                                <span className="font-medium">Fim:</span>{" "}
                                {formatDateTime(boost.end_time)}
                              </p>
                              <p>
                                <span className="font-medium">Valor:</span> R${" "}
                                {(boost.amount_paid / 100).toFixed(2)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
