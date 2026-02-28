"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "verify" | "terms">("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [code, setCode] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/onboarding/send-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber }),
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Complete seu cadastro
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {step === "phone" && "Precisamos verificar seu número de telefone"}
            {step === "verify" && "Digite o código enviado para seu telefone"}
            {step === "terms" && "Aceite os termos para continuar"}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {step === "phone" && (
          <form onSubmit={handleSendCode} className="mt-8 space-y-6">
            <div>
              <label htmlFor="phone" className="sr-only">
                Telefone
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                required
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="(00) 00000-0000"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? "Enviando..." : "Enviar código"}
            </button>
          </form>
        )}

        {step === "verify" && (
          <form onSubmit={handleVerifyCode} className="mt-8 space-y-6">
            <div>
              <label htmlFor="code" className="sr-only">
                Código de verificação
              </label>
              <input
                id="code"
                name="code"
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="000000"
                maxLength={6}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? "Verificando..." : "Verificar código"}
            </button>
          </form>
        )}

        {step === "terms" && (
          <form onSubmit={handleComplete} className="mt-8 space-y-6">
            <div className="flex items-start">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                required
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="terms" className="ml-2 block text-sm text-gray-900">
                Eu aceito os{" "}
                <a href="/terms" className="text-indigo-600 hover:text-indigo-500">
                  termos e condições
                </a>
              </label>
            </div>
            <button
              type="submit"
              disabled={loading || !termsAccepted}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? "Finalizando..." : "Completar cadastro"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
