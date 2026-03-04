"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface AvailabilitySchedule {
  day: string;
  enabled: boolean;
  start_time: string;
  end_time: string;
}

interface AvailabilityManagerClientProps {
  profileId: string;
}

export default function AvailabilityManagerClient({ profileId }: AvailabilityManagerClientProps) {
  const [loading, setLoading] = useState(false);
  const [availability, setAvailability] = useState<AvailabilitySchedule[]>([
    { day: "Segunda-feira", enabled: true, start_time: "09:00", end_time: "18:00" },
    { day: "Terça-feira", enabled: true, start_time: "09:00", end_time: "18:00" },
    { day: "Quarta-feira", enabled: true, start_time: "09:00", end_time: "18:00" },
    { day: "Quinta-feira", enabled: true, start_time: "09:00", end_time: "18:00" },
    { day: "Sexta-feira", enabled: true, start_time: "09:00", end_time: "18:00" },
    { day: "Sábado", enabled: false, start_time: "09:00", end_time: "18:00" },
    { day: "Domingo", enabled: false, start_time: "09:00", end_time: "18:00" },
  ]);

  useEffect(() => {
    fetchAvailability();
  }, [profileId]);

  const fetchAvailability = async () => {
    try {
      const res = await fetch(`/api/availability?profileId=${profileId}`);
      const data = await res.json();
      
      if (data.availability && data.availability.length > 0) {
        // Map database format to UI format
        const dayNames = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
        const mappedAvailability = dayNames.map((dayName, weekday) => {
          const dbSlot = data.availability.find((slot: any) => slot.weekday === weekday);
          return {
            day: dayName,
            enabled: dbSlot ? dbSlot.is_available : false,
            start_time: dbSlot ? dbSlot.start_time : "09:00",
            end_time: dbSlot ? dbSlot.end_time : "18:00",
          };
        });
        setAvailability(mappedAvailability);
      }
    } catch (err) {
      console.error("Error fetching availability:", err);
      toast.error("Erro ao carregar horários");
    }
  };

  const updateAvailability = (index: number, field: string, value: any) => {
    const updated = [...availability];
    updated[index] = { ...updated[index], [field]: value };
    setAvailability(updated);
  };

  const handleSave = async () => {
    setLoading(true);

    try {
      // Convert UI format to database format
      const dayNames = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
      const dbAvailability = availability
        .map((schedule, index) => {
          const weekday = dayNames.indexOf(schedule.day);
          
          // Only include enabled days with valid data
          if (!schedule.enabled || weekday === -1) return null;
          
          return {
            weekday: weekday,
            start_time: schedule.start_time,
            end_time: schedule.end_time,
            is_available: true,
          };
        })
        .filter(slot => slot !== null); // Remove null entries

      const res = await fetch("/api/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId,
          availability: dbAvailability,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao salvar horários");
      }

      toast.success("Horários salvos com sucesso!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar horários");
    } finally {
      setLoading(false);
    }
  };

  const applyToAll = (sourceIndex: number) => {
    const sourceSchedule = availability[sourceIndex];
    const updated = availability.map((schedule) => ({
      ...schedule,
      start_time: sourceSchedule.start_time,
      end_time: sourceSchedule.end_time,
    }));
    setAvailability(updated);
    toast.success("Horários aplicados a todos os dias!");
  };

  const enabledCount = availability.filter(s => s.enabled).length;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "white" }}>
      <div style={{ maxWidth: "80rem", margin: "0 auto", padding: "2rem 1rem" }}>
        {/* Header */}
        <div style={{ marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "2rem", fontWeight: "700", marginBottom: "0.5rem" }}>
            Meus Horários
          </h1>
          <p style={{ color: "hsl(var(--muted-foreground))" }}>
            Configure seus horários de atendimento para cada dia da semana
          </p>
        </div>

        {/* Status Badge */}
        <div style={{ marginBottom: "2rem" }}>
          <Badge style={{ fontSize: "0.875rem", padding: "0.5rem 1rem" }}>
            {enabledCount} {enabledCount === 1 ? "dia disponível" : "dias disponíveis"}
          </Badge>
        </div>

        {/* Availability Schedule */}
        <Card>
          <CardHeader>
            <CardTitle>Horários de Atendimento</CardTitle>
          </CardHeader>
          <CardContent style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {availability.map((schedule, index) => (
              <div
                key={schedule.day}
                style={{
                  padding: "1rem",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                  backgroundColor: schedule.enabled ? "transparent" : "hsl(var(--muted))",
                  opacity: schedule.enabled ? 1 : 0.6,
                }}
              >
                <div style={{ 
                  display: "grid", 
                  gridTemplateColumns: "auto 1fr 1fr auto auto", 
                  gap: "1rem", 
                  alignItems: "center" 
                }}>
                  {/* Checkbox */}
                  <label style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    gap: "0.5rem", 
                    cursor: "pointer", 
                    minWidth: "150px" 
                  }}>
                    <input
                      type="checkbox"
                      checked={schedule.enabled}
                      onChange={(e) => updateAvailability(index, "enabled", e.target.checked)}
                      style={{ cursor: "pointer", width: "1.25rem", height: "1.25rem" }}
                    />
                    <span style={{ fontWeight: "600", fontSize: "0.875rem" }}>
                      {schedule.day}
                    </span>
                  </label>

                  {/* Start Time */}
                  <div>
                    <Label htmlFor={`start-${index}`} style={{ fontSize: "0.75rem", marginBottom: "0.25rem" }}>
                      Início
                    </Label>
                    <Input
                      id={`start-${index}`}
                      type="time"
                      value={schedule.start_time}
                      onChange={(e) => updateAvailability(index, "start_time", e.target.value)}
                      disabled={!schedule.enabled}
                      style={{ fontSize: "0.875rem" }}
                    />
                  </div>

                  {/* End Time */}
                  <div>
                    <Label htmlFor={`end-${index}`} style={{ fontSize: "0.75rem", marginBottom: "0.25rem" }}>
                      Término
                    </Label>
                    <Input
                      id={`end-${index}`}
                      type="time"
                      value={schedule.end_time}
                      onChange={(e) => updateAvailability(index, "end_time", e.target.value)}
                      disabled={!schedule.enabled}
                      style={{ fontSize: "0.875rem" }}
                    />
                  </div>

                  {/* Apply to All Button */}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => applyToAll(index)}
                    disabled={!schedule.enabled}
                    style={{ whiteSpace: "nowrap" }}
                  >
                    Aplicar a todos
                  </Button>

                  {/* Status Badge */}
                  <div style={{ minWidth: "100px", textAlign: "right" }}>
                    {schedule.enabled ? (
                      <Badge style={{ backgroundColor: "#10b981", color: "white" }}>
                        Disponível
                      </Badge>
                    ) : (
                      <Badge style={{ backgroundColor: "hsl(var(--muted-foreground))", color: "white" }}>
                        Indisponível
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Info Box */}
            <div style={{ 
              padding: "1rem 1.5rem", 
              backgroundColor: "#dbeafe", 
              borderLeft: "4px solid #3b82f6",
              borderRadius: "var(--radius)",
              display: "flex",
              alignItems: "flex-start",
              gap: "0.75rem",
              marginTop: "1rem"
            }}>
              <span style={{ fontSize: "1.25rem", flexShrink: 0 }}>💡</span>
              <div>
                <p style={{ fontSize: "0.875rem", color: "#1e40af", margin: 0, lineHeight: "1.5" }}>
                  <strong>Dica:</strong> Desmarque os dias em que você não trabalha. Os horários só serão exibidos para os dias marcados.
                </p>
                <p style={{ fontSize: "0.875rem", color: "#1e40af", margin: "0.5rem 0 0 0", lineHeight: "1.5" }}>
                  Use o botão "Aplicar a todos" para copiar os horários de um dia para todos os outros dias.
                </p>
              </div>
            </div>

            {/* Save Button */}
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1rem" }}>
              <Button 
                onClick={handleSave}
                disabled={loading}
                size="lg"
              >
                {loading ? "Salvando..." : "Salvar Horários"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
