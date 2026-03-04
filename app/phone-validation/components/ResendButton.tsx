"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface ResendButtonProps {
  onResend: () => Promise<void>;
  cooldownSeconds: number;
  disabled?: boolean;
}

export function ResendButton({ onResend, cooldownSeconds, disabled }: ResendButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(cooldownSeconds);

  // Update remaining seconds when cooldownSeconds prop changes
  useEffect(() => {
    setRemainingSeconds(cooldownSeconds);
  }, [cooldownSeconds]);

  // Countdown timer
  useEffect(() => {
    if (remainingSeconds <= 0) return;

    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [remainingSeconds]);

  const handleResend = async () => {
    if (remainingSeconds > 0 || disabled) return;

    setIsLoading(true);
    try {
      await onResend();
    } finally {
      setIsLoading(false);
    }
  };

  const isCooldownActive = remainingSeconds > 0;
  const isDisabled = isCooldownActive || isLoading || disabled;

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleResend}
      disabled={isDisabled}
      className="w-full"
    >
      {isLoading
        ? "Reenviando..."
        : isCooldownActive
        ? `Aguarde ${remainingSeconds} segundos`
        : "Reenviar código"}
    </Button>
  );
}
