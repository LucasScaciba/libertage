"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TimeSlot {
  id?: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

interface AvailabilityEditorProps {
  profileId: string;
  initialAvailability?: any[];
}

const WEEKDAYS = [
  { value: 0, label: "Domingo" },
  { value: 1, label: "Segunda" },
  { value: 2, label: "Terça" },
  { value: 3, label: "Quarta" },
  { value: 4, label: "Quinta" },
  { value: 5, label: "Sexta" },
  { value: 6, label: "Sábado" },
];

export function AvailabilityEditor({ profileId, initialAvailability = [] }: AvailabilityEditorProps) {
  const [availability, setAvailability] = useState<Record<number, TimeSlot[]>>(() => {
    const grouped: Record<number, TimeSlot[]> = {};
    initialAvailability.forEach((slot) => {
      if (!grouped[slot.weekday]) {
        grouped[slot.weekday] = [];
      }
      grouped[slot.weekday].push(slot);
    });
    return grouped;
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const addTimeSlot = (weekday: number) => {
    setAvailability((prev) => ({
      ...prev,
      [weekday]: [
        ...(prev[weekday] || []),
        { start_time: "09:00", end_time: "18:00", is_available: true },
      ],
    }));
  };

  const removeTimeSlot = (weekday: number, index: number) => {
    setAvailability((prev) => ({
      ...prev,
      [weekday]: prev[weekday].filter((_, i) => i !== index),
    }));
  };

  const updateTimeSlot = (weekday: number, index: number, field: string, value: any) => {
    setAvailability((prev) => ({
      ...prev,
      [weekday]: prev[weekday].map((slot, i) =>
        i === index ? { ...slot, [field]: value } : slot
      ),
    }));
  };

  const toggleUnavailable = (weekday: number) => {
    if (availability[weekday]?.length > 0) {
      setAvailability((prev) => ({
        ...prev,
        [weekday]: [],
      }));
    } else {
      addTimeSlot(weekday);
    }
  };

  const validateTimeSlot = (slot: TimeSlot): boolean => {
    if (!slot.start_time || !slot.end_time) return false;
    return slot.start_time < slot.end_time;
  };

  const handleSave = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // Validate all slots
      for (const weekday in availability) {
        for (const slot of availability[weekday]) {
          if (!validateTimeSlot(slot)) {
            throw new Error("Horário de início deve ser antes do horário de término");
          }
        }
      }

      // Delete all existing availability
      await fetch(`/api/availability/${profileId}`, {
        method: "DELETE",
      });

      // Create new availability slots
      for (const weekday in availability) {
        for (const slot of availability[weekday]) {
          await fetch("/api/availability", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              profile_id: profileId,
              weekday: parseInt(weekday),
              ...slot,
            }),
          });
        }
      }

      setSuccess("Disponibilidade salva com sucesso!");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          {success}
        </div>
      )}

      {WEEKDAYS.map((day) => (
        <div key={day.value} className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium">{day.label}</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => toggleUnavailable(day.value)}
            >
              {availability[day.value]?.length > 0 ? "Marcar Indisponível" : "Adicionar Horário"}
            </Button>
          </div>

          {availability[day.value]?.length > 0 ? (
            <div className="space-y-3">
              {availability[day.value].map((slot, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="flex-1">
                    <Label className="text-xs">Início</Label>
                    <Input
                      type="time"
                      value={slot.start_time}
                      onChange={(e) =>
                        updateTimeSlot(day.value, index, "start_time", e.target.value)
                      }
                    />
                  </div>
                  <div className="flex-1">
                    <Label className="text-xs">Término</Label>
                    <Input
                      type="time"
                      value={slot.end_time}
                      onChange={(e) =>
                        updateTimeSlot(day.value, index, "end_time", e.target.value)
                      }
                    />
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => removeTimeSlot(day.value, index)}
                    className="mt-5"
                  >
                    Remover
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addTimeSlot(day.value)}
              >
                + Adicionar Horário
              </Button>
            </div>
          ) : (
            <p className="text-sm text-gray-500">Indisponível</p>
          )}
        </div>
      ))}

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={loading}>
          {loading ? "Salvando..." : "Salvar Disponibilidade"}
        </Button>
      </div>
    </div>
  );
}
