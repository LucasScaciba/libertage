"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import featuresServicesConfig from "@/lib/config/features-services.json";
import { brazilianStates } from "@/lib/data/brazilian-states";
import { SlugEditor } from "./components/SlugEditorComponent";
import { ProfileCompletenessAlert } from "./components/ProfileCompletenessAlert";
import { BirthdatePicker } from "./components/BirthdatePicker";
import { CurrencyInput } from "./components/CurrencyInput";
import { ServiceCategoriesSelector } from "./components/ServiceCategoriesSelector";

export default function ProfileEditPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [activeSection, setActiveSection] = useState("basic");
  const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    display_name: "",
    slug: "",
    service_categories: [] as string[],
    short_description: "",
    long_description: "",
    city: "",
    region: "",
    latitude: 0,
    longitude: 0,
    birthdate: "",
    gender_identity: "Mulher",
    whatsapp_number: "",
    whatsapp_enabled: false,
    telegram_username: "",
    telegram_enabled: false,
    pricing_packages: [] as any[],
    external_links: [] as any[],
    selected_features: [] as string[],
  });

  const featuresAndServices = featuresServicesConfig.categories.reduce((acc, category) => {
    acc[category.name] = category.options;
    return acc;
  }, {} as Record<string, string[]>);

  useEffect(() => {
    fetchProfile();
    fetchSubscription();
    
    const hasSeenWelcome = localStorage.getItem('profile_welcome_seen');
    if (!hasSeenWelcome) {
      setIsWelcomeModalOpen(true);
    }
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/profiles/me");
      const data = await res.json();
      
      if (data.profile) {
        setProfile(data.profile);
        setFormData({
          display_name: data.profile.display_name || "",
          slug: data.profile.slug || "",
          service_categories: data.profile.service_categories || [],
          short_description: data.profile.short_description || "",
          long_description: data.profile.long_description || "",
          city: data.profile.city || "",
          region: data.profile.region || "",
          latitude: data.profile.latitude || 0,
          longitude: data.profile.longitude || 0,
          birthdate: data.profile.birthdate || "",
          gender_identity: data.profile.gender_identity || "Mulher",
          whatsapp_number: data.profile.whatsapp_number || "",
          whatsapp_enabled: data.profile.whatsapp_enabled || false,
          telegram_username: data.profile.telegram_username || "",
          telegram_enabled: data.profile.telegram_enabled || false,
          pricing_packages: data.profile.pricing_packages || [],
          external_links: data.profile.external_links || [],
          selected_features: data.profile.selected_features || [],
        });
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
    }
  };

  const fetchSubscription = async () => {
    try {
      const res = await fetch("/api/subscriptions/plans");
      const data = await res.json();
      if (data.subscription) {
        setSubscription(data.subscription);
      }
    } catch (err) {
      console.error("Error fetching subscription:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = profile
        ? `/api/profiles/${profile.id}`
        : "/api/profiles";
      
      const method = profile ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to save profile");
      }

      toast.success("Perfil salvo com sucesso!");
      if (!profile) {
        setProfile(data.profile);
      }
      
      await fetchProfile();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addPricingPackage = () => {
    setFormData({
      ...formData,
      pricing_packages: [
        ...formData.pricing_packages,
        { label: "", price: "", description: "" }
      ]
    });
  };

  const removePricingPackage = (index: number) => {
    setFormData({
      ...formData,
      pricing_packages: formData.pricing_packages.filter((_, i) => i !== index)
    });
  };

  const updatePricingPackage = (index: number, field: string, value: string | number) => {
    const updated = [...formData.pricing_packages];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, pricing_packages: updated });
  };

  const toggleFeature = (feature: string) => {
    const isSelected = formData.selected_features.includes(feature);
    const updated = isSelected
      ? formData.selected_features.filter(f => f !== feature)
      : [...formData.selected_features, feature];
    setFormData({ ...formData, selected_features: updated });
  };

  const toggleFeatureSingleSelect = (categoryId: string, feature: string) => {
    const categoryConfig = featuresServicesConfig.categories.find(c => c.id === categoryId);
    if (!categoryConfig) return;

    const categoryOptions = categoryConfig.options;
    const withoutCategory = formData.selected_features.filter(f => !categoryOptions.includes(f));
    
    const isCurrentlySelected = formData.selected_features.includes(feature);
    const updated = isCurrentlySelected ? withoutCategory : [...withoutCategory, feature];
    
    setFormData({ ...formData, selected_features: updated });
  };

  const handleSlugUpdate = async (newSlug: string) => {
    if (!profile) {
      setFormData({ ...formData, slug: newSlug });
      toast.success("Slug será salvo junto com o perfil");
      return;
    }

    try {
      const response = await fetch("/api/profiles/update-slug", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: newSlug }),
      });

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        throw new Error(`Erro ao processar resposta do servidor (${response.status})`);
      }

      if (!response.ok) {
        const errorMessage = data.error?.message || data.error || data.message || "Erro ao atualizar slug";
        throw new Error(errorMessage);
      }

      setFormData({ ...formData, slug: data.slug });
      toast.success("Slug atualizado com sucesso!");
      
      await fetchProfile();
    } catch (err: any) {
      toast.error(err.message);
      throw err;
    }
  };

  const sections = [
    { id: "basic", label: "Informações Básicas" },
    { id: "contact-description", label: "Contato e Descrição" },
    { id: "pricing", label: "Valores" },
  ];

  const validateSection = (sectionId: string): boolean => {
    switch (sectionId) {
      case "basic":
        return !!(
          formData.display_name &&
          formData.slug &&
          formData.gender_identity &&
          formData.service_categories.length > 0 &&
          formData.city &&
          formData.birthdate
        );
      case "contact-description":
        return !!(
          formData.short_description &&
          formData.long_description
        );
      case "pricing":
        return true;
      default:
        return true;
    }
  };

  const isFormValid = (): boolean => {
    return validateSection("basic") && 
           validateSection("contact-description");
  };

  const goToNextSection = () => {
    const currentIndex = sections.findIndex(s => s.id === activeSection);
    if (currentIndex < sections.length - 1) {
      setActiveSection(sections[currentIndex + 1].id);
    }
  };

  const goToPreviousSection = () => {
    const currentIndex = sections.findIndex(s => s.id === activeSection);
    if (currentIndex > 0) {
      setActiveSection(sections[currentIndex - 1].id);
    }
  };

  const currentSectionIndex = sections.findIndex(s => s.id === activeSection);
  const isFirstSection = currentSectionIndex === 0;
  const isLastSection = currentSectionIndex === sections.length - 1;

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
                  <BreadcrumbLink href="/portal">
                    Portal
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Meu Perfil</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div style={{ minHeight: "100vh", backgroundColor: "white" }}>
            <div style={{ maxWidth: "80rem", margin: "0 auto", padding: "2rem 1rem" }}>
              {/* Header */}
              <div style={{ marginBottom: "2rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "0.5rem" }}>
                  <div>
                    <h1 style={{ fontSize: "2rem", fontWeight: "700", marginBottom: "0.5rem" }}>
                      {profile ? "Editar Perfil" : "Criar Perfil"}
                    </h1>
                    <p style={{ color: "hsl(var(--muted-foreground))" }}>
                      Preencha as informações do seu perfil profissional
                    </p>
                  </div>
                  {profile?.slug && (
                    <Link href={`/perfil/@${profile.slug}`} target="_blank">
                      <Button variant="outline" className="flex items-center gap-2">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                          <polyline points="15 3 21 3 21 9" />
                          <line x1="10" y1="14" x2="21" y2="3" />
                        </svg>
                        Ver meu perfil público
                      </Button>
                    </Link>
                  )}
                </div>
                {subscription && (
                  <div style={{ marginTop: "1rem" }}>
                    <Badge>
                      Plano {subscription.plan?.name}
                    </Badge>
                  </div>
                )}
              </div>

              <ProfileCompletenessAlert profileId={profile?.id || null} />
              
              {/* Navigation Tabs */}
              <div style={{ marginBottom: "2rem", display: "flex", gap: "0.5rem", flexWrap: "wrap", backgroundColor: "hsl(var(--muted))", padding: "1rem", borderRadius: "var(--radius)" }}>
                {sections.map((section) => {
                  const isValid = validateSection(section.id);
                  const isActive = activeSection === section.id;
                  
                  return (
                    <Button
                      key={section.id}
                      variant={isActive ? "default" : "ghost"}
                      onClick={() => setActiveSection(section.id)}
                      size="sm"
                      style={{
                        position: "relative",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                      }}
                    >
                      {section.label}
                      {!isValid && (
                        <span style={{ 
                          color: "#f97316", 
                          fontSize: "1.125rem", 
                          fontWeight: "700",
                          marginLeft: "0.25rem"
                        }}>
                          *
                        </span>
                      )}
                    </Button>
                  );
                })}
              </div>

              <form onSubmit={handleSubmit}>
                {/* Basic Information */}
                {activeSection === "basic" && (
                  <Card style={{ marginBottom: "1.5rem" }}>
                    <CardHeader>
                      <CardTitle>Informações Básicas</CardTitle>
                    </CardHeader>
                    <CardContent style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1.5rem" }}>
                        <div>
                          <Label htmlFor="display_name">Nome de exibição no perfil *</Label>
                          <Input
                            id="display_name"
                            required
                            maxLength={21}
                            value={formData.display_name}
                            onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                            placeholder="Seu nome profissional"
                          />
                          <p style={{ fontSize: "0.75rem", color: "hsl(var(--muted-foreground))", marginTop: "0.25rem" }}>
                            {formData.display_name.length}/21
                          </p>
                        </div>
                        
                        <div>
                          <Label htmlFor="gender_identity">Eu me identifico como: *</Label>
                          <select
                            id="gender_identity"
                            required
                            value={formData.gender_identity}
                            onChange={(e) => setFormData({ ...formData, gender_identity: e.target.value })}
                            style={{ 
                              width: "100%",
                              padding: "0.5rem",
                              borderRadius: "var(--radius)",
                              border: "1px solid hsl(var(--input))",
                              backgroundColor: "hsl(var(--background))",
                              fontSize: "0.875rem"
                            }}
                          >
                            <option value="Mulher">Mulher</option>
                            <option value="Homem">Homem</option>
                            <option value="Trans">Trans</option>
                            <option value="Casal">Casal</option>
                          </select>
                        </div>
                      </div>

                      <SlugEditor
                        currentSlug={formData.slug}
                        onChange={(newSlug) => setFormData({ ...formData, slug: newSlug })}
                        lastChangedAt={profile?.slug_last_changed_at || null}
                        profileExists={!!profile}
                      />

                      <ServiceCategoriesSelector
                        value={formData.service_categories}
                        onChange={(categories) => setFormData({ ...formData, service_categories: categories })}
                        required
                      />

                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1.5rem" }}>
                        <div>
                          <Label htmlFor="city">Estado *</Label>
                          <select
                            id="city"
                            required
                            value={formData.city}
                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                            style={{ 
                              width: "100%",
                              padding: "0.5rem",
                              borderRadius: "var(--radius)",
                              border: "1px solid hsl(var(--input))",
                              backgroundColor: "hsl(var(--background))",
                              fontSize: "0.875rem"
                            }}
                          >
                            <option value="">Selecione um estado</option>
                            {brazilianStates.map((state) => (
                              <option key={state} value={state}>
                                {state}
                              </option>
                            ))}
                          </select>
                        </div>

                        <BirthdatePicker
                          value={formData.birthdate}
                          onChange={(date) => setFormData({ ...formData, birthdate: date })}
                          required
                        />
                      </div>

                    </CardContent>
                  </Card>
                )}

                {/* Contact and Description */}
                {activeSection === "contact-description" && (
                  <Card style={{ marginBottom: "1.5rem" }}>
                    <CardHeader>
                      <CardTitle>Contato e Descrição</CardTitle>
                    </CardHeader>
                    <CardContent style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                      <div style={{ 
                        padding: "1.5rem", 
                        backgroundColor: "hsl(var(--muted))", 
                        borderRadius: "var(--radius)"
                      }}>
                        <h3 style={{ fontSize: "1rem", fontWeight: "600", marginBottom: "1.5rem" }}>
                          Informações de Contato
                        </h3>
                        
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1.5rem" }}>
                          <div>
                            <Label htmlFor="whatsapp_number">WhatsApp (+55)</Label>
                            <Input
                              id="whatsapp_number"
                              type="tel"
                              value={formData.whatsapp_number}
                              onChange={(e) => {
                                const numericValue = e.target.value.replace(/\D/g, '');
                                setFormData({ ...formData, whatsapp_number: numericValue });
                              }}
                              placeholder="11987654321"
                            />
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.5rem" }}>
                              <input
                                type="checkbox"
                                id="whatsapp_enabled"
                                checked={formData.whatsapp_enabled}
                                onChange={(e) => setFormData({ ...formData, whatsapp_enabled: e.target.checked })}
                                style={{ width: "1rem", height: "1rem", cursor: "pointer" }}
                              />
                              <Label htmlFor="whatsapp_enabled" style={{ cursor: "pointer", fontWeight: "normal" }}>
                                Exibir botão de WhatsApp no perfil
                              </Label>
                            </div>
                          </div>

                          <div>
                            <Label htmlFor="telegram_username">Telegram</Label>
                            <Input
                              id="telegram_username"
                              type="text"
                              value={formData.telegram_username}
                              onChange={(e) => {
                                const cleanValue = e.target.value.replace(/@/g, '');
                                setFormData({ ...formData, telegram_username: cleanValue });
                              }}
                              placeholder="username"
                            />
                            <p style={{ fontSize: "0.75rem", color: "hsl(var(--muted-foreground))", marginTop: "0.25rem" }}>
                              Sem o símbolo @
                            </p>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.5rem" }}>
                              <input
                                type="checkbox"
                                id="telegram_enabled"
                                checked={formData.telegram_enabled}
                                onChange={(e) => setFormData({ ...formData, telegram_enabled: e.target.checked })}
                                style={{ width: "1rem", height: "1rem", cursor: "pointer" }}
                              />
                              <Label htmlFor="telegram_enabled" style={{ cursor: "pointer", fontWeight: "normal" }}>
                                Exibir botão de Telegram no perfil
                              </Label>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="short_description">
                          Descrição Curta * (máx. 160 caracteres)
                        </Label>
                        <Input
                          id="short_description"
                          required
                          maxLength={160}
                          value={formData.short_description}
                          onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                          placeholder="Uma breve descrição dos seus serviços"
                        />
                        <p style={{ fontSize: "0.75rem", color: "hsl(var(--muted-foreground))", marginTop: "0.25rem" }}>
                          {formData.short_description.length}/160
                        </p>
                      </div>

                      <div>
                        <Label htmlFor="long_description">Descrição Completa *</Label>
                        <Textarea
                          id="long_description"
                          required
                          rows={10}
                          value={formData.long_description}
                          onChange={(e) => setFormData({ ...formData, long_description: e.target.value })}
                          placeholder="Descreva seus serviços em detalhes. Esta descrição aparecerá no modal do seu perfil."
                        />
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Pricing */}
                {activeSection === "pricing" && (
                  <Card style={{ marginBottom: "1.5rem" }}>
                    <CardHeader>
                      <CardTitle>Tabela de Valores</CardTitle>
                    </CardHeader>
                    <CardContent style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                      {formData.pricing_packages.map((pkg, index) => (
                        <div key={index} style={{ padding: "1rem", border: "1px solid hsl(var(--border))", borderRadius: "var(--radius)", display: "flex", flexDirection: "column", gap: "1rem" }}>
                          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr auto", gap: "1rem", alignItems: "end" }}>
                            <div>
                              <Label>Serviço</Label>
                              <Input
                                value={pkg.label}
                                onChange={(e) => updatePricingPackage(index, "label", e.target.value)}
                                placeholder="Ex: 1h, 2h, Pernoite"
                              />
                            </div>
                            <div>
                              <Label>Valor</Label>
                              <CurrencyInput
                                value={pkg.price}
                                onChange={(value) => updatePricingPackage(index, "price", value)}
                                placeholder="300"
                              />
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={() => removePricingPackage(index)}
                              style={{ color: "hsl(var(--destructive))" }}
                            >
                              Remover
                            </Button>
                          </div>
                        </div>
                      ))}
                      <Button type="button" variant="outline" onClick={addPricingPackage}>
                        + Adicionar Valor
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* Action Buttons */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", marginTop: "2rem" }}>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push("/portal")}
                  >
                    Cancelar
                  </Button>
                  
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={goToPreviousSection}
                      disabled={isFirstSection}
                    >
                      ← Anterior
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={goToNextSection}
                      disabled={isLastSection}
                    >
                      Próximo →
                    </Button>
                  </div>

                  <Button 
                    type="submit" 
                    disabled={loading || !isFormValid()}
                    style={{
                      opacity: !isFormValid() ? 0.5 : 1,
                      cursor: !isFormValid() ? "not-allowed" : "pointer",
                    }}
                  >
                    {loading ? "Salvando..." : "Salvar Alterações"}
                  </Button>
                </div>
              </form>

              {/* Welcome Modal */}
              <Dialog open={isWelcomeModalOpen} onOpenChange={() => {}}>
                <DialogContent>
                  <div style={{ textAlign: "center", padding: "1rem" }}>
                    <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🎉</div>
                    
                    <h2 style={{ fontSize: "1.75rem", fontWeight: "700", marginBottom: "1rem" }}>
                      Boas vindas!
                    </h2>
                    
                    <p style={{ 
                      color: "hsl(var(--muted-foreground))", 
                      marginBottom: "2rem",
                      lineHeight: "1.6",
                      fontSize: "1rem"
                    }}>
                      É mais do que um prazer ter você aqui conosco! Agora é hora de customizar o seu anúncio personalizado com todo carinho!
                    </p>

                    <Button
                      onClick={() => {
                        localStorage.setItem('profile_welcome_seen', 'true');
                        setIsWelcomeModalOpen(false);
                      }}
                      style={{
                        width: "100%",
                        backgroundColor: "black",
                        color: "white",
                        padding: "1rem",
                        fontSize: "1rem",
                        fontWeight: "600"
                      }}
                      size="lg"
                    >
                      Vamos começar!
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
