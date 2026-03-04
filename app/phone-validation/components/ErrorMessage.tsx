"use client";

import { AlertCircle } from "lucide-react";

interface ErrorMessageProps {
  message: string | null;
  type?: "validation" | "rate-limit" | "cooldown" | "service";
}

export function ErrorMessage({ message, type = "validation" }: ErrorMessageProps) {
  if (!message) return null;

  // Determine ARIA live region priority based on error type
  const ariaLive = type === "service" || type === "rate-limit" ? "assertive" : "polite";

  return (
    <div
      role="alert"
      aria-live={ariaLive}
      aria-atomic="true"
      className="flex items-start gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive"
    >
      <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" aria-hidden="true" />
      <p className="flex-1">{message}</p>
    </div>
  );
}
