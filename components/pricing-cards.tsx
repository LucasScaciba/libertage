"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { IconCheck, IconX } from "@tabler/icons-react";

interface PricingPlan {
  id: string;
  name: string;
  code: string;
  price: number;
  max_photos: number;
  max_videos: number;
  features: {
    coverPhoto: boolean;
    externalLinks: boolean;
    stories: boolean;
    boosts: boolean;
  };
}

interface PricingCardsProps {
  plans: PricingPlan[];
  currentPlanCode?: string;
  onSelectPlan: (planCode: string) => void;
  loading?: boolean;
}

export function PricingCards({ plans, currentPlanCode, onSelectPlan, loading }: PricingCardsProps) {
  console.log("PricingCards - currentPlanCode:", currentPlanCode);
  console.log("PricingCards - plans:", plans);
  
  const getFeatureValue = (plan: PricingPlan, feature: keyof PricingPlan["features"]) => {
    return plan.features[feature];
  };

  const isCurrentPlan = (planCode: string) => {
    const result = currentPlanCode === planCode;
    console.log(`isCurrentPlan(${planCode}): ${result} (currentPlanCode: ${currentPlanCode})`);
    return result;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {plans.map((plan) => {
        const isCurrent = isCurrentPlan(plan.code);
        const isBlack = plan.code === "black";
        
        return (
          <Card 
            key={plan.id} 
            className={`relative ${isBlack ? "border-2 border-primary" : ""}`}
          >
            <CardHeader className="space-y-4">
              <h3 className="text-2xl font-bold">{plan.name}</h3>
              
              {/* Cover Photo */}
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Foto de Destaque</p>
                <p className="text-base font-medium">Sim</p>
              </div>

              {/* Photos */}
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Quantidade de fotos no perfil</p>
                <p className="text-base font-medium">{plan.max_photos}</p>
              </div>

              {/* Videos */}
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Quantidade de vídeos no perfil</p>
                <p className="text-base font-medium">{plan.max_videos}</p>
              </div>

              {/* External Links */}
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Links para sites externos</p>
                <p className="text-base font-medium">
                  {plan.code === "free" ? "Não" : "Sim"}
                </p>
              </div>

              {/* Stories */}
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Stories</p>
                <p className="text-base font-medium">
                  {isBlack ? "Sim" : "Não"}
                </p>
              </div>

              {/* Boosts */}
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Impulsionamentos</p>
                <p className="text-base font-medium">
                  {isBlack ? "Sim" : "Não"}
                </p>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Price */}
              <div className="text-center py-4">
                <p className="text-3xl font-bold">
                  R$ {(plan.price / 100).toFixed(2)}
                  {plan.price > 0 && <span className="text-base font-normal">/mês</span>}
                </p>
                {plan.price === 0 && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Não requer cartão de crédito
                  </p>
                )}
                {plan.price > 0 && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Assinatura Recorrente igual netflix
                  </p>
                )}
              </div>
            </CardContent>

            <CardFooter>
              {isCurrent ? (
                <Button
                  className="w-full"
                  variant="ghost"
                  disabled
                  style={{
                    backgroundColor: "hsl(var(--muted))",
                    color: "hsl(var(--muted-foreground))",
                    cursor: "not-allowed",
                  }}
                >
                  Plano Atual
                </Button>
              ) : (
                <Button
                  className="w-full"
                  onClick={() => onSelectPlan(plan.code)}
                  disabled={loading}
                  style={{
                    backgroundColor: "black",
                    color: "white",
                  }}
                >
                  Quero este plano
                </Button>
              )}
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
