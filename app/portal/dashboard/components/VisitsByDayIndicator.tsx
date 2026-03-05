"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface VisitByDay {
  day_of_week: number;
  visit_count: number;
}

interface VisitsByDayIndicatorProps {
  data: VisitByDay[];
}

// Map day of week numbers to Portuguese names
const getDayName = (dayOfWeek: number): string => {
  const dayNames: Record<number, string> = {
    0: "Domingo",
    1: "Segunda",
    2: "Terça",
    3: "Quarta",
    4: "Quinta",
    5: "Sexta",
    6: "Sábado",
  };
  return dayNames[dayOfWeek] || "";
};

export default function VisitsByDayIndicator({ data }: VisitsByDayIndicatorProps) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Visitas por Dia da Semana</CardTitle>
          <CardDescription>Distribuição de visitas nos últimos 90 dias</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            Nenhum dado disponível ainda.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Transform data and ensure correct order: Segunda (1) to Domingo (0)
  const chartData = [1, 2, 3, 4, 5, 6, 0].map((dayNum) => {
    const dayData = data.find((d) => d.day_of_week === dayNum);
    return {
      day: getDayName(dayNum),
      visits: dayData?.visit_count || 0,
    };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Visitas por Dia da Semana</CardTitle>
        <CardDescription>Distribuição de visitas nos últimos 90 dias</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="day" 
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis />
            <Tooltip 
              formatter={(value) => [`${value} visitas`, "Visitas"]}
              labelStyle={{ color: "#000" }}
            />
            <Bar 
              dataKey="visits" 
              fill="hsl(var(--primary))" 
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
