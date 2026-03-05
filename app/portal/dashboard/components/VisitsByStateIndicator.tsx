import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import BrazilMap from "./BrazilMap";

interface VisitByState {
  state: string;
  visit_count: number;
}

interface VisitsByStateIndicatorProps {
  data: VisitByState[];
}

export default function VisitsByStateIndicator({ data }: VisitsByStateIndicatorProps) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Visitas por Estado</CardTitle>
          <CardDescription>Distribuição geográfica nos últimos 90 dias</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            Nenhum dado disponível ainda.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Convert array to object for BrazilMap component
  const visitsByState: Record<string, number> = {};
  data.forEach((item) => {
    // Only include valid Brazilian state codes (2 letters)
    if (item.state && item.state.length === 2) {
      visitsByState[item.state] = item.visit_count;
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Visitas por Estado</CardTitle>
        <CardDescription>Distribuição geográfica nos últimos 90 dias</CardDescription>
      </CardHeader>
      <CardContent>
        <BrazilMap visitsByState={visitsByState} />
        
        {/* Legend */}
        <div className="mt-4 flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-100 border border-gray-300 rounded"></div>
            <span>Sem visitas</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-400 border border-gray-300 rounded"></div>
            <span>Poucas visitas</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-700 border border-gray-300 rounded"></div>
            <span>Muitas visitas</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
