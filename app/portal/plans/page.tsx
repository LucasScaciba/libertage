"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PricingCards } from "@/components/pricing-cards";

export default function PlansPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [plans, setPlans] = useState<any[]>([]);
  const [currentPlan, setCurrentPlan] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    document.title = "Meu Plano — Libertage";
  }, []);

  useEffect(() => {
    fetchPlans();
    
    // Check if coming back from successful payment
    const success = searchParams.get('success');
    const sessionId = searchParams.get('session_id');
    
    if (success === 'true' && sessionId) {
      verifyAndActivateSubscription(sessionId);
    }
  }, [searchParams, router]);

  const verifyAndActivateSubscription = async (sessionId: string) => {
    try {
      console.log("=== VERIFY SESSION START ===");
      console.log("Verificando sessão do Stripe...");
      console.log("Session ID:", sessionId);
      
      const res = await fetch("/api/subscriptions/verify-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });

      const data = await res.json();
      console.log("Verify session response:", data);
      console.log("Response status:", res.status);

      if (res.ok) {
        console.log("✅ Assinatura ativada com sucesso!");
        // Reload plans to show updated subscription
        console.log("Recarregando planos...");
        await fetchPlans();
        console.log("Planos recarregados");
        // Wait a moment then redirect
        setTimeout(() => {
          console.log("Redirecionando para perfil...");
          router.push('/portal/profile');
        }, 1000);
      } else {
        console.error("❌ Erro ao verificar sessão:", data.error);
        // Still redirect but show the error
        setError("Pagamento processado, mas houve um problema ao ativar a assinatura. Entre em contato com o suporte.");
      }
    } catch (err: any) {
      console.error("❌ Erro ao verificar sessão:", err);
      setError("Erro ao verificar pagamento. Por favor, recarregue a página.");
    }
  };

  const fetchPlans = async () => {
    try {
      console.log("=== FETCH PLANS START ===");
      const res = await fetch("/api/subscriptions/plans");
      const data = await res.json();
      
      console.log("Plans API response:", data);
      console.log("Current subscription:", data.subscription);
      console.log("Current plan:", data.subscription?.plan);
      console.log("Current plan code:", data.subscription?.plan?.code);
      
      // Transform plans to include features
      const transformedPlans = (data.plans || []).map((plan: any) => ({
        ...plan,
        features: {
          coverPhoto: true,
          externalLinks: plan.code !== "free",
          stories: plan.code === "black",
          boosts: plan.code === "black",
        },
      }));
      
      console.log("Transformed plans:", transformedPlans);
      console.log("Setting currentPlan to:", data.subscription?.plan);
      
      setPlans(transformedPlans);
      setCurrentPlan(data.subscription?.plan);
      
      console.log("=== FETCH PLANS END ===");
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

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Meu Plano</h1>
        <p className="mt-2 text-muted-foreground">
          Escolha o plano ideal para o seu negócio
        </p>
        
        {/* Debug info - temporary */}
        {currentPlan && (
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <p className="text-sm">
              <strong>Plano atual no banco:</strong> {currentPlan.name} ({currentPlan.code})
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Se você acabou de fazer um pagamento e o plano não atualizou, recarregue a página ou entre em contato com o suporte.
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
    </div>
  );
}
