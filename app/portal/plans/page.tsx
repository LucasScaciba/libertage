"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { PricingCards } from "@/components/pricing-cards";
import { BillingHistory } from "@/components/billing-history";
import { Button } from "@/components/ui/button";

function PlansContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [plans, setPlans] = useState<any[]>([]);
  const [currentPlan, setCurrentPlan] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    document.title = "Meu Plano — Libertage";
  }, []);

  useEffect(() => {
    fetchPlans();
    
    const success = searchParams.get('success');
    const sessionId = searchParams.get('session_id');
    
    if (success === 'true' && sessionId) {
      verifyAndActivateSubscription(sessionId);
    }
  }, [searchParams, router]);

  const verifyAndActivateSubscription = async (sessionId: string) => {
    try {
      const res = await fetch("/api/subscriptions/verify-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });

      const data = await res.json();

      if (res.ok) {
        await fetchPlans();
        setTimeout(() => {
          router.push('/portal/profile');
        }, 1000);
      } else {
        console.error("Erro ao verificar sessão:", data.error);
        setError("Pagamento processado, mas houve um problema ao ativar a assinatura. Entre em contato com o suporte.");
      }
    } catch (err: any) {
      console.error("Erro ao verificar sessão:", err);
      setError("Erro ao verificar pagamento. Por favor, recarregue a página.");
    }
  };

  const fetchPlans = async () => {
    try {
      const res = await fetch("/api/subscriptions/plans");
      const data = await res.json();
      
      const transformedPlans = (data.plans || []).map((plan: any) => ({
        ...plan,
        features: {
          coverPhoto: true,
          externalLinks: plan.code !== "free",
          stories: plan.code === "black",
          boosts: plan.code === "black",
        },
      }));
      
      setPlans(transformedPlans);
      setCurrentPlan(data.subscription?.plan);
    } catch (err) {
      console.error("Error fetching plans:", err);
    }
  };

  const handleSubscribe = async (planCode: string) => {
    if (planCode === "free") {
      alert("Você já está no plano gratuito!");
      return;
    }

    if (currentPlan?.code === planCode) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/subscriptions/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planCode }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create checkout");
      }

      window.location.href = data.url;
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleRefreshPlan = async () => {
    setSyncing(true);
    setError("");

    try {
      const res = await fetch("/api/subscriptions/sync", {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to sync subscription");
      }

      await fetchPlans();
      
      window.location.reload();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSyncing(false);
    }
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
                  <BreadcrumbPage>Meu Plano</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="container mx-auto py-8 px-4">
            <div className="mb-8">
              <h1 className="text-3xl font-bold">Meu Plano</h1>
              <p className="mt-2 text-muted-foreground">
                Escolha o plano ideal para o seu negócio
              </p>
              
              {currentPlan && currentPlan.code === "free" && (
                <div className="mt-4">
                  <Button
                    onClick={handleRefreshPlan}
                    disabled={syncing}
                    variant="outline"
                  >
                    {syncing ? "Atualizando..." : "Atualizar Plano do Stripe"}
                  </Button>
                  <p className="text-sm text-muted-foreground mt-2">
                    Se você acabou de fazer um pagamento, clique aqui para sincronizar com o Stripe
                  </p>
                </div>
              )}
            </div>

            {error && (
              <div className="mb-6 bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded">
                {error}
              </div>
            )}

            <PricingCards
              plans={plans}
              currentPlanCode={currentPlan?.code}
              onSelectPlan={handleSubscribe}
              loading={loading}
            />

            {/* Billing History Section */}
            <div className="mt-12">
              <BillingHistory />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default function PlansPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <PlansContent />
    </Suspense>
  );
}
