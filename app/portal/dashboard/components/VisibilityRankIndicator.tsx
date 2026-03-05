import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { IconTrophy, IconTrendingUp, IconChartBar, IconSparkles } from "@tabler/icons-react";

interface VisibilityRank {
  percentile: number;
  category: "top_10" | "top_20" | "top_30" | "below_30";
  message: string;
}

interface VisibilityRankIndicatorProps {
  data: VisibilityRank;
}

const getCategoryConfig = (category: string) => {
  const configs = {
    top_10: {
      label: "Top 10%",
      icon: IconTrophy,
      badgeVariant: "default" as const,
      iconColor: "text-yellow-500",
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-200",
    },
    top_20: {
      label: "Top 20%",
      icon: IconSparkles,
      badgeVariant: "secondary" as const,
      iconColor: "text-blue-500",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
    },
    top_30: {
      label: "Top 30%",
      icon: IconChartBar,
      badgeVariant: "secondary" as const,
      iconColor: "text-green-500",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
    },
    below_30: {
      label: "Em Crescimento",
      icon: IconTrendingUp,
      badgeVariant: "outline" as const,
      iconColor: "text-gray-500",
      bgColor: "bg-gray-50",
      borderColor: "border-gray-200",
    },
  };

  return configs[category as keyof typeof configs] || configs.below_30;
};

export default function VisibilityRankIndicator({ data }: VisibilityRankIndicatorProps) {
  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Ranking de Visibilidade</CardTitle>
          <CardDescription>Sua posição relativa na plataforma</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            Nenhum dado disponível ainda.
          </p>
        </CardContent>
      </Card>
    );
  }

  const config = getCategoryConfig(data.category);
  const IconComponent = config.icon;

  return (
    <Card className={`${config.borderColor} border-2`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Ranking de Visibilidade</CardTitle>
            <CardDescription>Sua posição relativa na plataforma</CardDescription>
          </div>
          <Badge variant={config.badgeVariant} className="text-base px-4 py-2">
            {config.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className={`${config.bgColor} rounded-lg p-6 flex items-start gap-4`}>
          <div className={`flex-shrink-0 w-12 h-12 rounded-full bg-white flex items-center justify-center`}>
            <IconComponent className={`h-6 w-6 ${config.iconColor}`} />
          </div>
          <div className="flex-1">
            <p className="text-sm leading-relaxed text-gray-700">
              {data.message}
            </p>
          </div>
        </div>
        
        {/* Additional info */}
        <div className="mt-4 text-xs text-muted-foreground text-center">
          Baseado nas visitas dos últimos 30 dias
        </div>
      </CardContent>
    </Card>
  );
}
