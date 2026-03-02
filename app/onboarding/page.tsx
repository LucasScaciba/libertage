"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "verify" | "terms">("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [code, setCode] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Format phone number as user types (11) 99999-9999
  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const numbers = value.replace(/\D/g, "");
    
    // Limit to 11 digits (DDD + 9 digits)
    const limited = numbers.slice(0, 11);
    
    // Apply mask
    if (limited.length <= 2) {
      return limited;
    } else if (limited.length <= 7) {
      return `(${limited.slice(0, 2)}) ${limited.slice(2)}`;
    } else {
      return `(${limited.slice(0, 2)}) ${limited.slice(2, 7)}-${limited.slice(7)}`;
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhoneNumber(formatted);
  };

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Remove formatting and add +55
      const cleanNumber = phoneNumber.replace(/\D/g, "");
      const fullNumber = `+55${cleanNumber}`;
      
      const res = await fetch("/api/onboarding/send-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: fullNumber }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to send code");
      }

      setStep("verify");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/onboarding/verify-phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to verify code");
      }

      setStep("terms");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

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

      router.push("/portal");
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
              {step === "phone" && "Precisamos verificar seu número de telefone"}
              {step === "verify" && "Digite o código enviado para seu telefone"}
              {step === "terms" && "Aceite os termos para continuar"}
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

            {step === "phone" && (
              <form onSubmit={handleSendCode} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <Label htmlFor="phone">Número de telefone</Label>
                  <div style={{ position: "relative" }}>
                    <span style={{
                      position: "absolute",
                      left: "0.75rem",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "hsl(var(--muted-foreground))",
                      fontSize: "0.875rem",
                      fontWeight: "500",
                      pointerEvents: "none"
                    }}>
                      +55
                    </span>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      required
                      value={phoneNumber}
                      onChange={handlePhoneChange}
                      placeholder="(11) 99999-9999"
                      style={{ paddingLeft: "3rem" }}
                    />
                  </div>
                  <p style={{ fontSize: "0.75rem", color: "hsl(var(--muted-foreground))" }}>
                    Digite seu número com DDD
                  </p>
                </div>
                <Button type="submit" disabled={loading} style={{ width: "100%" }}>
                  {loading ? "Enviando..." : "Enviar código"}
                </Button>
              </form>
            )}

            {step === "verify" && (
              <form onSubmit={handleVerifyCode} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <Label htmlFor="code">Código de verificação</Label>
                  <Input
                    id="code"
                    name="code"
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="000000"
                    maxLength={6}
                  />
                </div>
                <Button type="submit" disabled={loading} style={{ width: "100%" }}>
                  {loading ? "Verificando..." : "Verificar código"}
                </Button>
              </form>
            )}

            {step === "terms" && (
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
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
