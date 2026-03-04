"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { maskCurrency, unmaskCurrency } from "@/lib/utils/currency-formatter";
import { useState, useEffect } from "react";

interface CurrencyInputProps {
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  error?: string;
  label?: string;
  required?: boolean;
}

export function CurrencyInput({ 
  value, 
  onChange, 
  placeholder = "R$ 0,00", 
  error,
  label,
  required = false
}: CurrencyInputProps) {
  const [displayValue, setDisplayValue] = useState<string>("");
  
  // Initialize display value from numeric value
  useEffect(() => {
    if (value > 0) {
      // Convert value to cents string for masking
      const cents = Math.round(value * 100).toString();
      setDisplayValue(maskCurrency(cents));
    } else {
      setDisplayValue("");
    }
  }, [value]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    
    // Remove all non-numeric characters
    const numbers = input.replace(/\D/g, '');
    
    // Apply mask
    const masked = maskCurrency(numbers);
    setDisplayValue(masked);
    
    // Extract numeric value and call onChange
    const numericValue = unmaskCurrency(masked);
    onChange(numericValue);
  };
  
  const handleBlur = () => {
    // Ensure proper formatting on blur
    if (displayValue && value > 0) {
      const cents = Math.round(value * 100).toString();
      setDisplayValue(maskCurrency(cents));
    }
  };
  
  return (
    <div>
      {label && (
        <Label htmlFor="currency-input">
          {label} {required && "*"}
        </Label>
      )}
      <Input
        id="currency-input"
        type="text"
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        required={required}
        style={{
          borderColor: error ? "hsl(var(--destructive))" : undefined
        }}
      />
      {error && (
        <p style={{ 
          fontSize: "0.75rem", 
          color: "hsl(var(--destructive))", 
          marginTop: "0.25rem" 
        }}>
          {error}
        </p>
      )}
      <p style={{ 
        fontSize: "0.75rem", 
        color: "hsl(var(--muted-foreground))", 
        marginTop: "0.25rem" 
      }}>
        Informe apenas números
      </p>
    </div>
  );
}
