"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default function OnboardingPage() {
  const router = useRouter();
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ termsAccepted }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to complete onboarding");
      }

      // Redirect to plans page for new users
      router.push("/portal/plans");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "3rem 1rem" }}>
      <div style={{ width: "100%", maxWidth: "28rem" }}>
        <Card>
          <CardHeader style={{ textAlign: "center" }}>
            <CardTitle style={{ fontSize: "1.875rem", fontWeight: "700" }}>
              Complete seu cadastro
            </CardTitle>
            <CardDescription style={{ marginTop: "0.5rem" }}>
              Aceite os termos para continuar
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div style={{ 
                backgroundColor: "hsl(var(--destructive))", 
                color: "hsl(var(--destructive-foreground))", 
                padding: "0.75rem 1rem", 
                borderRadius: "var(--radius)",
                marginBottom: "1.5rem"
              }}>
                {error}
              </div>
            )}

            <form onSubmit={handleComplete} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
                <input
                  id="terms"
                  name="terms"
                  type="checkbox"
                  required
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  style={{ marginTop: "0.25rem" }}
                />
                <Label htmlFor="terms" style={{ fontWeight: "400", cursor: "pointer" }}>
                  Eu aceito os{" "}
                  <a href="/terms" style={{ color: "hsl(var(--primary))", textDecoration: "underline" }}>
                    termos e condições
                  </a>
                </Label>
              </div>
              <Button type="submit" disabled={loading || !termsAccepted} style={{ width: "100%" }}>
                {loading ? "Finalizando..." : "Completar cadastro"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
