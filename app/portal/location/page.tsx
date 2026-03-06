"use client";

import { useEffect, useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Loader2, MapPin, Save } from "lucide-react";
import type { LocationData } from "@/types";

interface LocationFormState {
  hasNoLocation: boolean;
  cep: string;
  street: string;
  neighborhood: string;
  city: string;
  state: string;
  number: string;
  isLoadingCep: boolean;
  cepError: string | null;
}

export default function MyLocationPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formState, setFormState] = useState<LocationFormState>({
    hasNoLocation: false,
    cep: "",
    street: "",
    neighborhood: "",
    city: "",
    state: "",
    number: "",
    isLoadingCep: false,
    cepError: null,
  });

  // Load location data on mount
  useEffect(() => {
    loadLocationData();
  }, []);

  const loadLocationData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/location");
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("API Error:", errorData);
        throw new Error(errorData.error || "Erro ao carregar dados");
      }

      const data: LocationData = await response.json();
      
      // Apply mask to CEP if it exists
      let maskedCep = data.cep || "";
      if (maskedCep && maskedCep.length === 8) {
        maskedCep = `${maskedCep.slice(0, 5)}-${maskedCep.slice(5, 8)}`;
      }
      
      setFormState({
        hasNoLocation: data.hasNoLocation,
        cep: maskedCep,
        street: data.street || "",
        neighborhood: data.neighborhood || "",
        city: data.city || "",
        state: data.state || "",
        number: data.number || "",
        isLoadingCep: false,
        cepError: null,
      });
    } catch (error) {
      console.error("Error loading location data:", error);
      toast.error("Não foi possível carregar seus dados de localização.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleChange = (checked: boolean) => {
    setFormState(prev => ({
      ...prev,
      hasNoLocation: checked,
      // Clear address fields when toggling to "no location"
      ...(checked ? {
        cep: "",
        street: "",
        neighborhood: "",
        city: "",
        state: "",
        number: "",
        cepError: null,
      } : {}),
    }));
  };

  const handleCepChange = async (value: string) => {
    // Remove non-digits
    const cleanValue = value.replace(/\D/g, "");
    
    // Apply mask: 00000-000
    let maskedValue = cleanValue;
    if (cleanValue.length > 5) {
      maskedValue = `${cleanValue.slice(0, 5)}-${cleanValue.slice(5, 8)}`;
    }
    
    // Update CEP value with mask
    setFormState(prev => ({ ...prev, cep: maskedValue, cepError: null }));

    // Only fetch if CEP is complete (8 digits)
    if (cleanValue.length === 8) {
      await fetchAddressByCep(cleanValue);
    }
  };

  const fetchAddressByCep = async (cep: string) => {
    try {
      setFormState(prev => ({ ...prev, isLoadingCep: true, cepError: null }));

      const response = await fetch(`/api/location/cep/${cep}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details?.message || "Erro ao buscar CEP");
      }

      const data = await response.json();

      // Auto-populate fields
      setFormState(prev => ({
        ...prev,
        street: data.logradouro || prev.street,
        neighborhood: data.bairro || prev.neighborhood,
        city: data.localidade || prev.city,
        state: data.uf || prev.state,
        isLoadingCep: false,
        cepError: null,
      }));

      toast.success("CEP encontrado! Endereço preenchido automaticamente.");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro ao buscar CEP";
      setFormState(prev => ({
        ...prev,
        isLoadingCep: false,
        cepError: errorMessage,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation: if hasNoLocation is false, number is required
    if (!formState.hasNoLocation && !formState.number.trim()) {
      toast.error("O campo Número é obrigatório quando você possui local de atendimento.");
      return;
    }

    try {
      setIsSaving(true);

      // Remove mask from CEP before sending
      const cleanCep = formState.cep.replace(/\D/g, "");

      const locationData: LocationData = {
        hasNoLocation: formState.hasNoLocation,
        cep: cleanCep || null,
        street: formState.street || null,
        neighborhood: formState.neighborhood || null,
        city: formState.city || null,
        state: formState.state || null,
        number: formState.number || null,
      };

      const response = await fetch("/api/location", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(locationData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("API Error Response:", errorData);
        const errorMessage = errorData.error || errorData.details?.message || "Erro ao salvar localização";
        throw new Error(errorMessage);
      }

      toast.success("Localização salva com sucesso!");
    } catch (error) {
      console.error("Error saving location:", error);
      const errorMessage = error instanceof Error ? error.message : "Erro ao salvar localização";
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink href="/portal">Portal</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Meu Local</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div className="flex items-center justify-center min-h-[400px]">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/portal">Portal</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Meu Local</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div style={{ minHeight: "100vh", backgroundColor: "white" }}>
            <div style={{ maxWidth: "80rem", margin: "0 auto", padding: "2rem 1rem" }}>
              <div className="mb-6">
                <h1 className="text-3xl font-bold flex items-center gap-2">
                  <MapPin className="h-8 w-8" />
                  Meu Local
                </h1>
                <p className="text-muted-foreground mt-2">
                  Gerencie as informações de localização do seu perfil
                </p>
              </div>

              {/* Security Notice */}
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-blue-600 mt-0.5 shrink-0"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div>
                    <h3 className="font-semibold text-blue-900 text-sm">Privacidade e Segurança</h3>
                    <p className="text-blue-800 text-sm mt-1">
                      Por questões de segurança, sua localização exata não será exibida publicamente. Visitantes verão apenas uma área aproximada do bairro informado, protegendo sua privacidade.
                    </p>
                  </div>
                </div>
              </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Endereço de Atendimento</CardTitle>
            <CardDescription>
              Informe seu endereço completo para que visitantes possam encontrar você
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Toggle: Não possuo local de atendimento */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="hasNoLocation"
                checked={formState.hasNoLocation}
                onCheckedChange={handleToggleChange}
                className="h-5 w-5 min-w-[20px] min-h-[20px] max-w-[20px] max-h-[20px] shrink-0"
                style={{ aspectRatio: '1/1' }}
              />
              <Label
                htmlFor="hasNoLocation"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Não possuo local de atendimento
              </Label>
            </div>

            {/* Address fields - disabled when hasNoLocation is true */}
            <div className="space-y-4">
              {/* CEP */}
              <div className="space-y-2">
                <Label htmlFor="cep">CEP</Label>
                <div className="relative">
                  <Input
                    id="cep"
                    type="text"
                    placeholder="00000-000"
                    value={formState.cep}
                    onChange={(e) => handleCepChange(e.target.value)}
                    disabled={formState.hasNoLocation}
                    maxLength={9}
                  />
                  {formState.isLoadingCep && (
                    <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </div>
                {formState.cepError && (
                  <p className="text-sm text-destructive">{formState.cepError}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Digite o CEP para preencher automaticamente o endereço
                </p>
              </div>

              {/* Rua */}
              <div className="space-y-2">
                <Label htmlFor="street">Rua</Label>
                <Input
                  id="street"
                  type="text"
                  placeholder="Nome da rua"
                  value={formState.street}
                  onChange={(e) => setFormState(prev => ({ ...prev, street: e.target.value }))}
                  disabled={true}
                  className="bg-muted"
                />
              </div>

              {/* Número */}
              <div className="space-y-2">
                <Label htmlFor="number">
                  Número {!formState.hasNoLocation && <span className="text-destructive">*</span>}
                </Label>
                <Input
                  id="number"
                  type="text"
                  placeholder="123"
                  value={formState.number}
                  onChange={(e) => setFormState(prev => ({ ...prev, number: e.target.value }))}
                  disabled={formState.hasNoLocation}
                  required={!formState.hasNoLocation}
                />
              </div>

              {/* Bairro */}
              <div className="space-y-2">
                <Label htmlFor="neighborhood">Bairro</Label>
                <Input
                  id="neighborhood"
                  type="text"
                  placeholder="Nome do bairro"
                  value={formState.neighborhood}
                  onChange={(e) => setFormState(prev => ({ ...prev, neighborhood: e.target.value }))}
                  disabled={true}
                  className="bg-muted"
                />
              </div>

              {/* Cidade */}
              <div className="space-y-2">
                <Label htmlFor="city">Cidade</Label>
                <Input
                  id="city"
                  type="text"
                  placeholder="Nome da cidade"
                  value={formState.city}
                  onChange={(e) => setFormState(prev => ({ ...prev, city: e.target.value }))}
                  disabled={true}
                  className="bg-muted"
                />
              </div>

              {/* Estado */}
              <div className="space-y-2">
                <Label htmlFor="state">Estado</Label>
                <Input
                  id="state"
                  type="text"
                  placeholder="UF (ex: SP)"
                  value={formState.state}
                  onChange={(e) => setFormState(prev => ({ ...prev, state: e.target.value.toUpperCase() }))}
                  disabled={true}
                  className="bg-muted"
                  maxLength={2}
                />
              </div>
            </div>

            {/* Submit button */}
            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Localização
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
