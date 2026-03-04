"use client";

import { Label } from "@/components/ui/label";

interface ServiceCategoriesSelectorProps {
  value: string[];
  onChange: (categories: string[]) => void;
  error?: string;
  required?: boolean;
}

const SERVICE_CATEGORIES = [
  "Massagem",
  "Acompanhante",
  "Chamada de vídeo"
];

export function ServiceCategoriesSelector({ 
  value, 
  onChange, 
  error,
  required = false 
}: ServiceCategoriesSelectorProps) {
  
  const toggleCategory = (category: string) => {
    const isSelected = value.includes(category);
    const updated = isSelected
      ? value.filter(c => c !== category)
      : [...value, category];
    onChange(updated);
  };
  
  return (
    <div>
      <Label>
        Categorias Atendidas {required && "*"}
      </Label>
      <div style={{ 
        display: "flex", 
        flexWrap: "wrap", 
        gap: "0.75rem",
        marginTop: "0.5rem"
      }}>
        {SERVICE_CATEGORIES.map((category) => {
          const isSelected = value.includes(category);
          
          return (
            <label
              key={category}
              style={{
                position: "relative",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.625rem",
                padding: "0.75rem 1.25rem",
                border: "2px solid #e5e7eb",
                borderRadius: "9999px",
                cursor: "pointer",
                backgroundColor: isSelected ? "#f3f4f6" : "white",
                transition: "all 0.2s ease",
                fontSize: "0.9375rem",
                fontWeight: "500",
                color: "#1f2937",
                userSelect: "none",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#f9fafb";
                e.currentTarget.style.borderColor = "#d1d5db";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = isSelected ? "#f3f4f6" : "white";
                e.currentTarget.style.borderColor = "#e5e7eb";
              }}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => toggleCategory(category)}
                style={{ 
                  position: "absolute",
                  opacity: 0,
                  width: 0,
                  height: 0,
                  cursor: "pointer"
                }}
              />
              {/* Check icon circle */}
              <div
                style={{
                  width: "1.5rem",
                  height: "1.5rem",
                  borderRadius: "50%",
                  backgroundColor: isSelected ? "#1f2937" : "transparent",
                  border: isSelected ? "none" : "2px solid #d1d5db",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  transition: "all 0.2s ease",
                }}
              >
                {isSelected && (
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M11.6666 3.5L5.24992 9.91667L2.33325 7"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>
              <span>{category}</span>
            </label>
          );
        })}
      </div>
      {error && (
        <p style={{ 
          fontSize: "0.75rem", 
          color: "hsl(var(--destructive))", 
          marginTop: "0.5rem" 
        }}>
          {error}
        </p>
      )}
      <p style={{ 
        fontSize: "0.75rem", 
        color: "hsl(var(--muted-foreground))", 
        marginTop: "0.5rem" 
      }}>
        Selecione pelo menos uma categoria
      </p>
    </div>
  );
}
