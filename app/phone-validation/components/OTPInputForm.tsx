"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface OTPInputFormProps {
  onSubmit: (otpCode: string) => Promise<void>;
  isLoading: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
}

export function OTPInputForm({ onSubmit, isLoading, disabled, autoFocus }: OTPInputFormProps) {
  const [otpCode, setOtpCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus when component mounts or autoFocus prop changes
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ""); // Only digits
    
    if (value.length <= 6) {
      setOtpCode(value);
      
      // Clear error when user starts typing
      if (error) {
        setError(null);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate OTP format
    if (otpCode.length !== 6) {
      setError("O código deve ter 6 dígitos");
      return;
    }
    
    try {
      await onSubmit(otpCode);
    } catch (err) {
      // Error handling is done by parent component
    }
  };

  const isValid = otpCode.length === 6;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="otp-input" className="text-sm font-medium">
          Código de verificação
        </label>
        <Input
          ref={inputRef}
          id="otp-input"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={otpCode}
          onChange={handleChange}
          placeholder="000000"
          aria-label="Código de verificação"
          aria-invalid={!!error}
          aria-describedby={error ? "otp-error" : undefined}
          disabled={isLoading || disabled}
          className="text-base text-center tracking-widest"
          maxLength={6}
        />
        {error && (
          <p id="otp-error" className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
      </div>
      
      <Button
        type="submit"
        disabled={!isValid || isLoading || disabled}
        className="w-full"
      >
        {isLoading ? "Verificando..." : "Verificar"}
      </Button>
    </form>
  );
}
