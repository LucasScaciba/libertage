"use client";

import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";

interface ProfileCompletenessAlertProps {
  profileId: string | null;
}

interface CompletenessData {
  isComplete: boolean;
  missingFields: string[];
  completionPercentage: number;
}

export function ProfileCompletenessAlert({ profileId }: ProfileCompletenessAlertProps) {
  const [completeness, setCompleteness] = useState<CompletenessData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profileId) {
      setLoading(false);
      return;
    }

    fetchCompleteness();
  }, [profileId]);

  const fetchCompleteness = async () => {
    if (!profileId) return;

    try {
      const res = await fetch(`/api/profiles/${profileId}/completeness`);
      const data = await res.json();
      
      if (data.completeness) {
        setCompleteness(data.completeness);
      }
    } catch (err) {
      console.error("Error fetching completeness:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !completeness) {
    return null;
  }

  if (completeness.isComplete) {
    return (
      <div
        style={{
          marginBottom: "1.5rem",
          padding: "1rem 1.5rem",
          backgroundColor: "#d1fae5",
          borderLeft: "4px solid #10b981",
          borderRadius: "var(--radius)",
          display: "flex",
          alignItems: "start",
          gap: "0.75rem",
        }}
      >
        <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
        <div>
          <p style={{ fontSize: "0.875rem", color: "#065f46", margin: 0, fontWeight: "600" }}>
            ✅ Seu perfil está completo e visível no catálogo!
          </p>
          <p style={{ fontSize: "0.875rem", color: "#065f46", margin: "0.25rem 0 0 0" }}>
            Seu perfil aparecerá nos resultados de busca do catálogo.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        marginBottom: "1.5rem",
        padding: "1rem 1.5rem",
        backgroundColor: "#fef3c7",
        borderLeft: "4px solid #f59e0b",
        borderRadius: "var(--radius)",
        display: "flex",
        alignItems: "start",
        gap: "0.75rem",
      }}
    >
      <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: "0.875rem", color: "#92400e", margin: 0, fontWeight: "600" }}>
          Seu perfil ainda não aparece no catálogo
        </p>
        <p style={{ fontSize: "0.875rem", color: "#92400e", margin: "0.5rem 0 0 0" }}>
          Complete as seguintes informações para seu perfil ser listado:
        </p>
        <ul style={{ fontSize: "0.875rem", color: "#92400e", margin: "0.5rem 0 0 0", paddingLeft: "1.25rem" }}>
          {completeness.missingFields.map((field, index) => (
            <li key={index}>{field}</li>
          ))}
        </ul>
        <div style={{ marginTop: "0.75rem" }}>
          <div style={{ 
            width: "100%", 
            height: "0.5rem", 
            backgroundColor: "#fde68a", 
            borderRadius: "9999px",
            overflow: "hidden"
          }}>
            <div
              style={{
                width: `${completeness.completionPercentage}%`,
                height: "100%",
                backgroundColor: "#f59e0b",
                transition: "width 0.3s ease",
              }}
            />
          </div>
          <p style={{ fontSize: "0.75rem", color: "#92400e", margin: "0.25rem 0 0 0", textAlign: "right" }}>
            {completeness.completionPercentage}% completo
          </p>
        </div>
      </div>
    </div>
  );
}
