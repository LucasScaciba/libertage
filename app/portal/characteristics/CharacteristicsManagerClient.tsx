"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CharacteristicsData {
  // Services
  payment_methods: string[];
  service_locations: string[];
  clientele: string[];
  languages: string[];
  
  // Physical
  height: number;
  weight: number;
  shoe_size: number;
  ethnicity: string;
  body_type: string;
  hair_color: string;
  eye_color: string;
  breast_type: string;
  breast_size: string;
  body_hair: string;
  buttocks_type: string;
  buttocks_size: string;
}

interface CharacteristicsManagerClientProps {
  profileId: string;
}

// Configuration for characteristics options
const CHARACTERISTICS_CONFIG = {
  payment_methods: ["Dinheiro", "PIX", "Cartão de Crédito", "Cartão de Débito"],
  service_locations: ["Meu Local", "Hotel", "Motel", "Residência do Cliente"],
  clientele: ["Homens", "Mulheres", "Casais"],
  languages: ["Português", "Inglês", "Espanhol", "Francês"],
  ethnicity: ["Branca", "Negra", "Parda", "Asiática", "Indígena"],
  body_type: ["Magra", "Atlética", "Curvilínea", "Plus Size"],
  hair_color: ["Loiro", "Moreno", "Ruivo", "Preto", "Grisalho"],
  eye_color: ["Castanhos", "Azuis", "Verdes", "Pretos"],
  breast_type: ["Natural", "Silicone"],
  breast_size: ["Pequeno", "Médio", "Grande"],
  body_hair: ["Depilada", "Aparada", "Natural"],
  buttocks_type: ["Natural", "Com Silicone"],
  buttocks_size: ["Pequeno", "Médio", "Grande"],
};

export default function CharacteristicsManagerClient({ profileId }: CharacteristicsManagerClientProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [characteristics, setCharacteristics] = useState<CharacteristicsData>({
    payment_methods: [],
    service_locations: [],
    clientele: [],
    languages: [],
    height: 165,
    weight: 60,
    shoe_size: 37,
    ethnicity: "",
    body_type: "",
    hair_color: "",
    eye_color: "",
    breast_type: "",
    breast_size: "",
    body_hair: "",
    buttocks_type: "",
    buttocks_size: "",
  });

  useEffect(() => {
    fetchCharacteristics();
  }, [profileId]);

  const fetchCharacteristics = async () => {
    try {
      const res = await fetch("/api/characteristics");
      const data = await res.json();
      
      if (data.characteristics) {
        setCharacteristics({
          ...characteristics,
          ...data.characteristics,
        });
      }
    } catch (err) {
      console.error("Error fetching characteristics:", err);
      setError("Erro ao carregar características");
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/characteristics", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(characteristics),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao salvar características");
      }

      setSuccess("Características salvas com sucesso!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message || "Erro ao salvar características");
    } finally {
      setLoading(false);
    }
  };

  const toggleMultiSelect = (field: keyof CharacteristicsData, value: string) => {
    const currentValues = characteristics[field] as string[];
    const updated = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];
    setCharacteristics({ ...characteristics, [field]: updated });
  };

  const setSingleSelect = (field: keyof CharacteristicsData, value: string) => {
    setCharacteristics({ ...characteristics, [field]: value });
  };

  const renderMultiSelect = (
    field: keyof CharacteristicsData,
    label: string,
    options: string[]
  ) => {
    const selectedValues = characteristics[field] as string[];
    
    return (
      <div style={{ marginBottom: "1.5rem" }}>
        <Label style={{ marginBottom: "0.75rem", display: "block" }}>{label}</Label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
          {options.map((option) => {
            const isSelected = selectedValues.includes(option);
            
            return (
              <label
                key={option}
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
                  onChange={() => toggleMultiSelect(field, option)}
                  style={{ 
                    position: "absolute",
                    opacity: 0,
                    width: 0,
                    height: 0,
                    cursor: "pointer"
                  }}
                />
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
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
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
                <span>{option}</span>
              </label>
            );
          })}
        </div>
      </div>
    );
  };

  const renderSingleSelect = (
    field: keyof CharacteristicsData,
    label: string,
    options: string[]
  ) => {
    const selectedValue = characteristics[field] as string;
    
    return (
      <div style={{ marginBottom: "1.5rem" }}>
        <Label style={{ marginBottom: "0.75rem", display: "block" }}>{label}</Label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
          {options.map((option) => {
            const isSelected = selectedValue === option;
            
            return (
              <label
                key={option}
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
                  type="radio"
                  name={field}
                  checked={isSelected}
                  onChange={() => setSingleSelect(field, option)}
                  style={{ 
                    position: "absolute",
                    opacity: 0,
                    width: 0,
                    height: 0,
                    cursor: "pointer"
                  }}
                />
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
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
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
                <span>{option}</span>
              </label>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "white" }}>
      <div style={{ maxWidth: "80rem", margin: "0 auto", padding: "2rem 1rem" }}>
        {/* Header */}
        <div style={{ marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "2rem", fontWeight: "700", marginBottom: "0.5rem" }}>
            Características e Serviços
          </h1>
          <p style={{ color: "hsl(var(--muted-foreground))" }}>
            Gerencie suas características físicas e detalhes de serviço
          </p>
        </div>

        {error && (
          <div style={{ 
            marginBottom: "1rem", 
            backgroundColor: "hsl(var(--destructive))", 
            color: "white", 
            padding: "1rem", 
            borderRadius: "var(--radius)" 
          }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{ 
            marginBottom: "1rem", 
            backgroundColor: "#10b981", 
            color: "white", 
            padding: "1rem", 
            borderRadius: "var(--radius)" 
          }}>
            {success}
          </div>
        )}

        {/* Services Section */}
        <Card style={{ marginBottom: "2rem" }}>
          <CardHeader>
            <CardTitle>Serviços</CardTitle>
          </CardHeader>
          <CardContent>
            {renderMultiSelect("payment_methods", "Formas de Pagamento", CHARACTERISTICS_CONFIG.payment_methods)}
            {renderMultiSelect("service_locations", "Local de Atendimento", CHARACTERISTICS_CONFIG.service_locations)}
            {renderMultiSelect("clientele", "Atendo", CHARACTERISTICS_CONFIG.clientele)}
            {renderMultiSelect("languages", "Idiomas", CHARACTERISTICS_CONFIG.languages)}
          </CardContent>
        </Card>

        {/* Characteristics Section */}
        <Card style={{ marginBottom: "2rem" }}>
          <CardHeader>
            <CardTitle>Características</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Physical Measurements */}
            <div style={{ 
              padding: "1.5rem", 
              backgroundColor: "hsl(var(--muted))", 
              borderRadius: "var(--radius)",
              marginBottom: "2rem"
            }}>
              <h3 style={{ fontSize: "1rem", fontWeight: "600", marginBottom: "1.5rem" }}>
                Medidas Físicas
              </h3>
              
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.5rem" }}>
                {/* Height */}
                <div>
                  <Label htmlFor="height">Altura: {characteristics.height} cm</Label>
                  <input
                    id="height"
                    type="range"
                    min="140"
                    max="200"
                    value={characteristics.height}
                    onChange={(e) => setCharacteristics({ ...characteristics, height: parseInt(e.target.value) })}
                    style={{ 
                      width: "100%", 
                      marginTop: "0.5rem",
                      accentColor: "hsl(var(--primary))"
                    }}
                  />
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "hsl(var(--muted-foreground))", marginTop: "0.25rem" }}>
                    <span>1.40m</span>
                    <span>2.00m</span>
                  </div>
                </div>

                {/* Weight */}
                <div>
                  <Label htmlFor="weight">Peso: {characteristics.weight} kg</Label>
                  <input
                    id="weight"
                    type="range"
                    min="40"
                    max="150"
                    value={characteristics.weight}
                    onChange={(e) => setCharacteristics({ ...characteristics, weight: parseInt(e.target.value) })}
                    style={{ 
                      width: "100%", 
                      marginTop: "0.5rem",
                      accentColor: "hsl(var(--primary))"
                    }}
                  />
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "hsl(var(--muted-foreground))", marginTop: "0.25rem" }}>
                    <span>40kg</span>
                    <span>150kg</span>
                  </div>
                </div>

                {/* Shoe Size */}
                <div>
                  <Label htmlFor="shoe_size">Tamanho do Pé</Label>
                  <Input
                    id="shoe_size"
                    type="number"
                    min="33"
                    max="44"
                    value={characteristics.shoe_size}
                    onChange={(e) => setCharacteristics({ ...characteristics, shoe_size: parseInt(e.target.value) || 33 })}
                    placeholder="37"
                  />
                  <p style={{ fontSize: "0.75rem", color: "hsl(var(--muted-foreground))", marginTop: "0.25rem" }}>
                    Tamanho entre 33 e 44
                  </p>
                </div>
              </div>
            </div>

            {/* Body Characteristics */}
            {renderSingleSelect("ethnicity", "Etnia", CHARACTERISTICS_CONFIG.ethnicity)}
            {renderSingleSelect("body_type", "Corpo", CHARACTERISTICS_CONFIG.body_type)}
            {renderSingleSelect("hair_color", "Cabelo", CHARACTERISTICS_CONFIG.hair_color)}
            {renderSingleSelect("eye_color", "Olhos", CHARACTERISTICS_CONFIG.eye_color)}
            {renderSingleSelect("breast_type", "Seios", CHARACTERISTICS_CONFIG.breast_type)}
            {renderSingleSelect("breast_size", "Tamanho dos Seios", CHARACTERISTICS_CONFIG.breast_size)}
            {renderSingleSelect("body_hair", "Pelos Corporais", CHARACTERISTICS_CONFIG.body_hair)}
            {renderSingleSelect("buttocks_type", "Bumbum", CHARACTERISTICS_CONFIG.buttocks_type)}
            {renderSingleSelect("buttocks_size", "Tamanho do Bumbum", CHARACTERISTICS_CONFIG.buttocks_size)}
          </CardContent>
        </Card>

        {/* Save Button */}
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <Button 
            onClick={handleSave}
            disabled={loading}
            size="lg"
          >
            {loading ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </div>
      </div>
    </div>
  );
}
