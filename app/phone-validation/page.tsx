"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PhoneInputForm } from "./components/PhoneInputForm";
import { OTPInputForm } from "./components/OTPInputForm";
import { ResendButton } from "./components/ResendButton";
import { ErrorMessage } from "./components/ErrorMessage";
import { LoadingIndicator } from "./components/LoadingIndicator";

interface ValidationState {
  phoneNumber: string;
  otpCode: string;
  isLoading: boolean;
  error: string | null;
  errorType: "validation" | "rate-limit" | "cooldown" | "service";
  otpSent: boolean;
  cooldownSeconds: number;
  attemptsRemaining: number;
  successMessage: string | null;
}

export default function PhoneValidationPage() {
  const router = useRouter();
  const [state, setState] = useState<ValidationState>({
    phoneNumber: "",
    otpCode: "",
    isLoading: false,
    error: null,
    errorType: "validation",
    otpSent: false,
    cooldownSeconds: 0,
    attemptsRemaining: 5,
    successMessage: null,
  });

  // Fetch validation status on mount
  useEffect(() => {
    fetchValidationStatus();
  }, []);

  const fetchValidationStatus = async () => {
    try {
      const response = await fetch("/api/phone-validation/status");
      const data = await response.json();

      if (data.phoneVerified) {
        // Already verified, check if onboarding is complete
        const userResponse = await fetch("/api/auth/me");
        const userData = await userResponse.json();
        
        if (userData.onboarding_completed) {
          router.push("/portal");
        } else {
          router.push("/onboarding");
        }
        return;
      }

      setState((prev) => ({
        ...prev,
        cooldownSeconds: data.cooldownSeconds || 0,
        attemptsRemaining: data.maxAttempts - data.attemptsToday,
      }));
    } catch (error) {
      console.error("Failed to fetch validation status:", error);
    }
  };

  const handleSendOTP = async (phoneNumber: string) => {
    setState((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
      phoneNumber,
    }));

    try {
      const response = await fetch("/api/phone-validation/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle error responses
        const errorType = response.status === 429 
          ? (data.cooldownSeconds ? "cooldown" : "rate-limit")
          : "service";

        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: data.error || "Erro ao enviar código",
          errorType,
          cooldownSeconds: data.cooldownSeconds || 0,
        }));
        return;
      }

      // Success
      setState((prev) => ({
        ...prev,
        isLoading: false,
        otpSent: true,
        cooldownSeconds: 60, // Start 60-second cooldown
        successMessage: `Código enviado para ${phoneNumber}`,
        error: null,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: "Erro ao enviar código. Tente novamente.",
        errorType: "service",
      }));
    }
  };

  const handleVerifyOTP = async (otpCode: string) => {
    setState((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
      otpCode,
    }));

    try {
      const response = await fetch("/api/phone-validation/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: state.phoneNumber,
          otpCode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle error responses
        const errorType = response.status === 429 ? "rate-limit" : "validation";

        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: data.error || "Código inválido",
          errorType,
          attemptsRemaining: prev.attemptsRemaining - 1,
        }));
        return;
      }

      // Success - redirect to onboarding (not portal)
      setState((prev) => ({
        ...prev,
        isLoading: false,
        successMessage: "Telefone validado com sucesso!",
        error: null,
      }));

      // Redirect after short delay to show success message
      setTimeout(() => {
        router.push("/onboarding");
      }, 1500);
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: "Erro ao verificar código. Tente novamente.",
        errorType: "service",
      }));
    }
  };

  const handleResend = async () => {
    await handleSendOTP(state.phoneNumber);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Validação de telefone</CardTitle>
          <CardDescription>
            {!state.otpSent
              ? "Informe seu número de telefone para receber um código de verificação"
              : "Digite o código de 6 dígitos enviado para seu telefone"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Error message */}
          {state.error && (
            <ErrorMessage message={state.error} type={state.errorType} />
          )}

          {/* Success message */}
          {state.successMessage && (
            <div
              role="status"
              aria-live="polite"
              className="flex items-center gap-2 rounded-md border border-green-500/50 bg-green-500/10 p-3 text-sm text-green-700 dark:text-green-400"
            >
              <p>{state.successMessage}</p>
            </div>
          )}

          {/* Phone input form (shown before OTP sent) */}
          {!state.otpSent && (
            <PhoneInputForm
              onSubmit={handleSendOTP}
              isLoading={state.isLoading}
              disabled={state.attemptsRemaining <= 0}
            />
          )}

          {/* OTP input form (shown after OTP sent) */}
          {state.otpSent && (
            <>
              <OTPInputForm
                onSubmit={handleVerifyOTP}
                isLoading={state.isLoading}
                disabled={state.attemptsRemaining <= 0}
                autoFocus={true}
              />

              {/* Resend button */}
              <ResendButton
                onResend={handleResend}
                cooldownSeconds={state.cooldownSeconds}
                disabled={state.attemptsRemaining <= 0}
              />
            </>
          )}

          {/* Attempts remaining indicator */}
          {state.attemptsRemaining < 5 && state.attemptsRemaining > 0 && (
            <p className="text-sm text-muted-foreground text-center">
              {state.attemptsRemaining} {state.attemptsRemaining === 1 ? "tentativa restante" : "tentativas restantes"}
            </p>
          )}

          {/* Rate limit message */}
          {state.attemptsRemaining <= 0 && (
            <p className="text-sm text-destructive text-center">
              Limite de tentativas atingido. Tente novamente amanhã.
            </p>
          )}

          {/* Loading indicator */}
          {state.isLoading && <LoadingIndicator />}
        </CardContent>
      </Card>
    </div>
  );
}
