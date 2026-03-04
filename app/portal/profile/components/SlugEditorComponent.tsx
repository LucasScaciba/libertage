"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, XCircle, Loader2, ExternalLink } from "lucide-react";

interface SlugEditorProps {
  currentSlug: string;
  onChange?: (newSlug: string) => void;
  lastChangedAt: Date | null;
  profileExists: boolean;
}

interface ValidationState {
  isValidating: boolean;
  isValid: boolean | null;
  isAvailable: boolean | null;
  errors: string[];
}

export function SlugEditor({ currentSlug, onChange, lastChangedAt, profileExists }: SlugEditorProps) {
  const [inputValue, setInputValue] = useState(currentSlug);
  const [validation, setValidation] = useState<ValidationState>({
    isValidating: false,
    isValid: null,
    isAvailable: null,
    errors: [],
  });

  // Sync with parent when currentSlug changes
  useEffect(() => {
    setInputValue(currentSlug);
  }, [currentSlug]);

  // Debounced validation
  useEffect(() => {
    // Don't validate if input is empty or same as current
    if (!inputValue || inputValue === currentSlug) {
      setValidation({
        isValidating: false,
        isValid: null,
        isAvailable: null,
        errors: [],
      });
      return;
    }

    const timeoutId = setTimeout(() => {
      validateSlug(inputValue);
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [inputValue, currentSlug]);

  const validateSlug = async (slug: string) => {
    setValidation((prev) => ({ ...prev, isValidating: true }));

    try {
      const response = await fetch("/api/profiles/validate-slug", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });

      const data = await response.json();

      setValidation({
        isValidating: false,
        isValid: data.valid,
        isAvailable: data.available,
        errors: data.errors?.map((e: any) => e.message) || [],
      });
    } catch (error) {
      console.error("Error validating slug:", error);
      setValidation({
        isValidating: false,
        isValid: false,
        isAvailable: false,
        errors: ["Erro ao validar slug. Tente novamente."],
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "");
    setInputValue(value);
    
    // Update parent formData in real-time
    if (onChange) {
      onChange(value);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="slug">Slug do Perfil</Label>
        <div className="mt-2 space-y-2">
          <Input
            id="slug"
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            placeholder="seu-link-exclusivo"
          />

          {/* Validation Status */}
          {inputValue && inputValue !== currentSlug && (
            <div className="flex items-center gap-2 text-sm">
              {validation.isValidating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                  <span className="text-gray-600">Validando...</span>
                </>
              ) : validation.isValid && validation.isAvailable ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-green-600">Slug disponível</span>
                </>
              ) : validation.errors.length > 0 ? (
                <>
                  <XCircle className="h-4 w-4 text-red-600" />
                  <span className="text-red-600">{validation.errors[0]}</span>
                </>
              ) : null}
            </div>
          )}

          {/* Preview URL */}
          <div className="rounded-lg bg-gray-50 p-3 border border-gray-200">
            <p className="text-xs text-gray-600 mb-1">Preview da URL pública:</p>
            <div className="flex items-center gap-2">
              <code className="text-sm text-blue-600 break-all">
                /perfil/@{inputValue || "seu-slug"}
              </code>
              {validation.isValid && validation.isAvailable && inputValue && (
                <a
                  href={`/perfil/@${inputValue}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 flex-shrink-0"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>

          {/* Last Changed Info */}
          {lastChangedAt && (
            <p className="text-xs text-gray-500">
              Última alteração: {new Date(lastChangedAt).toLocaleDateString("pt-BR")}
            </p>
          )}

          {/* Help Text */}
          <p className="text-xs text-gray-500">
            O slug deve ter no mínimo 4 caracteres e conter apenas letras minúsculas, números e hífens.
            {profileExists && " Pode ser alterado apenas uma vez a cada 90 dias."}
          </p>
        </div>
      </div>
    </div>
  );
}
