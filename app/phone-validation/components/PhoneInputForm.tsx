"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { validateE164Format } from "@/lib/utils/phone-validation";

interface PhoneInputFormProps {
  onSubmit: (phoneNumber: string) => Promise<void>;
  isLoading: boolean;
  disabled?: boolean;
}

export function PhoneInputForm({ onSubmit, isLoading, disabled }: PhoneInputFormProps) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPhoneNumber(value);
    
    // Clear error when user starts typing
    if (error) {
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate phone format
    if (!validateE164Format(phoneNumber)) {
      setError("Formato de telefone inválido. Use o formato internacional (+55...)");
      return;
    }
    
    try {
      await onSubmit(phoneNumber);
    } catch (err) {
      // Error handling is done by parent component
    }
  };

  const isValid = validateE164Format(phoneNumber);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="phone-input" className="text-sm font-medium">
          Número de telefone
        </label>
        <Input
          id="phone-input"
          type="tel"
          value={phoneNumber}
          onChange={handleChange}
          placeholder="+5511999999999"
          aria-label="Número de telefone"
          aria-invalid={!!error}
          aria-describedby={error ? "phone-error" : undefined}
          disabled={isLoading || disabled}
          className="text-base"
        />
        {error && (
          <p id="phone-error" className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
      </div>
      
      <Button
        type="submit"
        disabled={!isValid || isLoading || disabled}
        className="w-full"
      >
        {isLoading ? "Enviando..." : "Enviar código"}
      </Button>
    </form>
  );
}
