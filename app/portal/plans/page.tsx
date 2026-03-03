"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function PlansPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchPlans();
    
    // Check if coming back from successful payment
    const success = searchParams.get('success');
    if (success === 'true') {
      // Redirect to profile edit page
      router.push('/portal/profile');
    }
  }, [searchParams, router]);

  const fetchPlans = async () => {
    try {
      const res = await fetch("/api/subscriptions/plans");
      const data = await res.json();
      setPlans(data.plans || []);
    } catch (err) {
      console.error("Error fetching plans:", err);
    }
  };

  const handleSubscribe = async (planCode: string) => {
    if (planCode === "free") {
      alert("Você já está no plano gratuito!");
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

  const handleManageSubscription = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/subscriptions/portal");
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to get portal URL");
      }

      // Redirect to Stripe Customer Portal
      window.location.href = data.url;
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Planos e Assinaturas</h1>
          <p className="mt-2 text-sm text-gray-600">
            Escolha o plano ideal para o seu negócio
          </p>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`bg-white rounded-lg shadow-lg overflow-hidden ${
                plan.code === "black" ? "ring-2 ring-indigo-600" : ""
              }`}
            >
              <div className="p-6">
                <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
                <div className="mt-4 flex items-baseline">
                  <span className="text-4xl font-extrabold">
                    R$ {(plan.price / 100).toFixed(2)}
                  </span>
                  {plan.price > 0 && (
                    <span className="ml-2 text-gray-500">/mês</span>
                  )}
                </div>

                <ul className="mt-6 space-y-4">
                  <li className="flex items-start">
                    <svg
                      className="h-6 w-6 text-green-500 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="ml-3 text-gray-700">
                      {plan.max_photos} fotos
                    </span>
                  </li>
                  <li className="flex items-start">
                    <svg
                      className="h-6 w-6 text-green-500 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="ml-3 text-gray-700">
                      {plan.max_videos} vídeos
                    </span>
                  </li>
                  {plan.code === "black" && (
                    <>
                      <li className="flex items-start">
                        <svg
                          className="h-6 w-6 text-green-500 flex-shrink-0"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span className="ml-3 text-gray-700">
                          Créditos de boost
                        </span>
                      </li>
                      <li className="flex items-start">
                        <svg
                          className="h-6 w-6 text-green-500 flex-shrink-0"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span className="ml-3 text-gray-700">
                          Stories (em breve)
                        </span>
                      </li>
                    </>
                  )}
                </ul>

                <div className="mt-8">
                  <Button
                    className="w-full"
                    onClick={() => handleSubscribe(plan.code)}
                    disabled={loading}
                    variant={plan.code === "black" ? "default" : "outline"}
                  >
                    {loading ? "Processando..." : "Assinar"}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium mb-4">Gerenciar Assinatura</h2>
          <p className="text-gray-600 mb-4">
            Atualize seu método de pagamento, veja faturas ou cancele sua assinatura.
          </p>
          <Button onClick={handleManageSubscription} disabled={loading}>
            Abrir Portal de Assinatura
          </Button>
        </div>
      </div>
    </div>
  );
}
