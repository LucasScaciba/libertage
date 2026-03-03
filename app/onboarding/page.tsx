"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PricingCards } from "@/components/pricing-cards";
import { Button } from "@/components/ui/button";
import { AuthService } from "@/lib/services/auth.service";

export default function OnboardingPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const res = await fetch("/api/subscriptions/plans");
      const data = await res.json();
      
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
      
      setPlans(transformedPlans);
    } catch (err) {
      console.error("Error fetching plans:", err);
    }
  };

  const handleSelectPlan = async (planCode: string) => {
    setLoading(true);
    setError("");

    try {
      // Complete onboarding first
      const onboardingRes = await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ termsAccepted: true }),
      });

      if (!onboardingRes.ok) {
        const data = await onboardingRes.json();
        throw new Error(data.error || "Failed to complete onboarding");
      }

      // If free plan, go directly to profile
      if (planCode === "free") {
        router.push("/portal/profile");
        return;
      }

      // For paid plans, go to checkout
      const checkoutRes = await fetch("/api/subscriptions/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planCode }),
      });

      const checkoutData = await checkoutRes.json();

      if (!checkoutRes.ok) {
        throw new Error(checkoutData.error || "Failed to create checkout");
      }

      // Redirect to Stripe Checkout
      window.location.href = checkoutData.url;
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await AuthService.signOut();
      router.push("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "hsl(var(--background))" }}>
      {/* Simple Header */}
      <header style={{ 
        borderBottom: "1px solid hsl(var(--border))", 
        padding: "1rem 2rem",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: "700" }}>Libertage</h1>
        <Button variant="ghost" onClick={handleLogout}>
          Sair
        </Button>
      </header>

      {/* Plans Selection */}
      <div style={{ maxWidth: "80rem", margin: "0 auto", padding: "3rem 1rem" }}>
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <h2 style={{ fontSize: "2rem", fontWeight: "700", marginBottom: "0.5rem" }}>
            Escolha seu plano
          </h2>
          <p style={{ color: "hsl(var(--muted-foreground))" }}>
            Selecione o plano ideal para começar
          </p>
        </div>

        {error && (
          <div style={{ 
            marginBottom: "2rem", 
            backgroundColor: "hsl(var(--destructive))/10", 
            border: "1px solid hsl(var(--destructive))", 
            color: "hsl(var(--destructive))", 
            padding: "1rem", 
            borderRadius: "var(--radius)",
            maxWidth: "48rem",
            margin: "0 auto 2rem"
          }}>
            {error}
          </div>
        )}

        <PricingCards
          plans={plans}
          onSelectPlan={handleSelectPlan}
          loading={loading}
        />
      </div>
    </div>
  );
}
