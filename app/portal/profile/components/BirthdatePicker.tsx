"use client";

import { Label } from "@/components/ui/label";
import { useState, useEffect, useRef } from "react";

interface BirthdatePickerProps {
  value: string;
  onChange: (date: string) => void;
  required?: boolean;
}

export function BirthdatePicker({ value, onChange, required }: BirthdatePickerProps) {
  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [error, setError] = useState("");
  const isInitialMount = useRef(true);

  // Parse initial value only once
  useEffect(() => {
    if (value && isInitialMount.current) {
      const date = new Date(value + 'T00:00:00'); // Force local timezone
      if (!isNaN(date.getTime())) {
        setDay(String(date.getDate()).padStart(2, "0"));
        setMonth(String(date.getMonth() + 1).padStart(2, "0"));
        setYear(String(date.getFullYear()));
      }
      isInitialMount.current = false;
    }
  }, [value]);

  // Validate and update parent only when user changes values
  const handleDateChange = (newDay: string, newMonth: string, newYear: string) => {
    if (newDay && newMonth && newYear) {
      const dateStr = `${newYear}-${newMonth}-${newDay}`;
      const date = new Date(dateStr + 'T00:00:00'); // Force local timezone
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        setError("Data inválida");
        return;
      }

      // Calculate age
      const today = new Date();
      let age = today.getFullYear() - date.getFullYear();
      const monthDiff = today.getMonth() - date.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
        age--;
      }

      // Validate age range
      if (age < 18) {
        setError("Você deve ter pelo menos 18 anos");
        return;
      }
      
      if (age > 60) {
        setError("A idade máxima permitida é 60 anos");
        return;
      }

      // Check if date is in the future
      if (date > today) {
        setError("A data não pode ser no futuro");
        return;
      }

      setError("");
      onChange(dateStr);
    }
  };

  // Generate day options (1-31)
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  // Generate month options
  const months = [
    { value: "01", label: "Janeiro" },
    { value: "02", label: "Fevereiro" },
    { value: "03", label: "Março" },
    { value: "04", label: "Abril" },
    { value: "05", label: "Maio" },
    { value: "06", label: "Junho" },
    { value: "07", label: "Julho" },
    { value: "08", label: "Agosto" },
    { value: "09", label: "Setembro" },
    { value: "10", label: "Outubro" },
    { value: "11", label: "Novembro" },
    { value: "12", label: "Dezembro" },
  ];

  // Generate year options (current year - 60 to current year - 18)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 43 }, (_, i) => currentYear - 18 - i);

  return (
    <div>
      <Label htmlFor="birthdate">
        Data de Nascimento {required && "*"}
      </Label>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 1.5fr", gap: "0.5rem", marginTop: "0.5rem" }}>
        <select
          value={day}
          onChange={(e) => {
            setDay(e.target.value);
            handleDateChange(e.target.value, month, year);
          }}
          required={required}
          style={{
            width: "100%",
            padding: "0.5rem",
            borderRadius: "var(--radius)",
            border: "1px solid hsl(var(--input))",
            backgroundColor: "hsl(var(--background))",
            fontSize: "0.875rem",
          }}
        >
          <option value="">Dia</option>
          {days.map((d) => (
            <option key={d} value={String(d).padStart(2, "0")}>
              {d}
            </option>
          ))}
        </select>

        <select
          value={month}
          onChange={(e) => {
            setMonth(e.target.value);
            handleDateChange(day, e.target.value, year);
          }}
          required={required}
          style={{
            width: "100%",
            padding: "0.5rem",
            borderRadius: "var(--radius)",
            border: "1px solid hsl(var(--input))",
            backgroundColor: "hsl(var(--background))",
            fontSize: "0.875rem",
          }}
        >
          <option value="">Mês</option>
          {months.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>

        <select
          value={year}
          onChange={(e) => {
            setYear(e.target.value);
            handleDateChange(day, month, e.target.value);
          }}
          required={required}
          style={{
            width: "100%",
            padding: "0.5rem",
            borderRadius: "var(--radius)",
            border: "1px solid hsl(var(--input))",
            backgroundColor: "hsl(var(--background))",
            fontSize: "0.875rem",
          }}
        >
          <option value="">Ano</option>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>
      
      {error && (
        <p style={{ fontSize: "0.75rem", color: "hsl(var(--destructive))", marginTop: "0.25rem" }}>
          {error}
        </p>
      )}
      
      <p style={{ fontSize: "0.75rem", color: "hsl(var(--muted-foreground))", marginTop: "0.25rem" }}>
        Idade permitida: 18 a 60 anos
      </p>
    </div>
  );
}
