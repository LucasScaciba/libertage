"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import featuresServicesConfig from "@/lib/config/features-services.json";

export default function ProfileEditPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [profile, setProfile] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [activeSection, setActiveSection] = useState("basic");
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState("");
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    display_name: "",
    slug: "",
    category: "",
    short_description: "",
    long_description: "",
    cep: "",
    street_number: "",
    city: "",
    region: "",
    latitude: 0,
    longitude: 0,
    age_attribute: "",
    weight: 60,
    height: 165,
    shoe_size: 37,
    pricing_packages: [] as any[],
    external_links: [] as any[],
    selected_features: [] as string[],
    availability: [
      { day: "Segunda-feira", enabled: true, start_time: "09:00", end_time: "18:00" },
      { day: "Terça-feira", enabled: true, start_time: "09:00", end_time: "18:00" },
      { day: "Quarta-feira", enabled: true, start_time: "09:00", end_time: "18:00" },
      { day: "Quinta-feira", enabled: true, start_time: "09:00", end_time: "18:00" },
      { day: "Sexta-feira", enabled: true, start_time: "09:00", end_time: "18:00" },
      { day: "Sábado", enabled: false, start_time: "09:00", end_time: "18:00" },
      { day: "Domingo", enabled: false, start_time: "09:00", end_time: "18:00" },
      { day: "Feriados", enabled: false, start_time: "09:00", end_time: "18:00" },
    ] as any[],
  });

  // Mock data for categories
  const categories = [
    "Fotografia",
    "Design",
    "Marketing",
    "Tecnologia",
    "Arquitetura",
    "Consultoria",
    "Educação",
    "Saúde",
  ];

  // Generate age options (18-60)
  const ageOptions = Array.from({ length: 43 }, (_, i) => i + 18);

  // Load features and services from config
  const featuresAndServices = featuresServicesConfig.categories.reduce((acc, category) => {
    acc[category.name] = category.options;
    return acc;
  }, {} as Record<string, string[]>);

  useEffect(() => {
    fetchProfile();
    fetchSubscription();
    fetchMedia();
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
          category: data.profile.category || "",
          short_description: data.profile.short_description || "",
          long_description: data.profile.long_description || "",
          cep: data.profile.cep || "",
          street_number: data.profile.street_number || "",
          city: data.profile.city || "",
          region: data.profile.region || "",
          latitude: data.profile.latitude || 0,
          longitude: data.profile.longitude || 0,
          age_attribute: data.profile.age_attribute || "",
          weight: data.profile.weight || 60,
          height: data.profile.height || 165,
          shoe_size: data.profile.shoe_size || 37,
          pricing_packages: data.profile.pricing_packages || [],
          external_links: data.profile.external_links || [],
          selected_features: data.profile.selected_features || [],
          availability: data.profile.availability || [
            { day: "Segunda-feira", enabled: true, start_time: "09:00", end_time: "18:00" },
            { day: "Terça-feira", enabled: true, start_time: "09:00", end_time: "18:00" },
            { day: "Quarta-feira", enabled: true, start_time: "09:00", end_time: "18:00" },
            { day: "Quinta-feira", enabled: true, start_time: "09:00", end_time: "18:00" },
            { day: "Sexta-feira", enabled: true, start_time: "09:00", end_time: "18:00" },
            { day: "Sábado", enabled: false, start_time: "09:00", end_time: "18:00" },
            { day: "Domingo", enabled: false, start_time: "09:00", end_time: "18:00" },
            { day: "Feriados", enabled: false, start_time: "09:00", end_time: "18:00" },
          ],
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

  const fetchMedia = async () => {
    try {
      const res = await fetch("/api/media");
      const data = await res.json();
      if (data.media) {
        setMediaFiles(data.media);
      }
    } catch (err) {
      console.error("Error fetching media:", err);
      // If fetch fails, keep existing mock media
    }
  };

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "photo" | "video") => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const currentCount = mediaFiles.filter(m => m.media_type === type).length;
    const maxAllowed = type === "photo" ? limits.photos : limits.videos;

    if (currentCount >= maxAllowed) {
      setError(`Você atingiu o limite de ${maxAllowed} ${type === "photo" ? "fotos" : "vídeos"} do seu plano.`);
      return;
    }

    setUploadingMedia(true);
    setError("");

    try {
      const file = files[0];
      
      // Create local URL for preview (mock upload)
      const localUrl = URL.createObjectURL(file);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Create mock media object
      const mockMedia = {
        id: `mock-${Date.now()}`,
        profile_id: profile?.id || "mock-profile",
        media_type: type,
        url: localUrl,
        filename: file.name,
        created_at: new Date().toISOString(),
      };

      // Add to local state
      setMediaFiles([...mediaFiles, mockMedia]);
      setSuccess(`${type === "photo" ? "Foto" : "Vídeo"} adicionado com sucesso!`);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message || "Erro ao fazer upload");
    } finally {
      setUploadingMedia(false);
      // Reset file input
      e.target.value = "";
    }
  };

  const handleDeleteMedia = async (mediaId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta mídia?")) return;

    try {
      // For mock media, just remove from state
      if (mediaId.startsWith("mock-")) {
        const mediaToDelete = mediaFiles.find(m => m.id === mediaId);
        if (mediaToDelete?.url.startsWith("blob:")) {
          URL.revokeObjectURL(mediaToDelete.url);
        }
        setMediaFiles(mediaFiles.filter(m => m.id !== mediaId));
        setSuccess("Mídia excluída com sucesso!");
        setTimeout(() => setSuccess(""), 3000);
        return;
      }

      // For real media, call API
      const res = await fetch(`/api/media/${mediaId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }

      setSuccess("Mídia excluída com sucesso!");
      await fetchMedia();
    } catch (err: any) {
      setError(err.message || "Erro ao excluir mídia");
    }
  };

  const fetchAddressByCep = async (cep: string) => {
    // Remove non-numeric characters
    const cleanCep = cep.replace(/\D/g, "");
    
    // Validate CEP format (8 digits)
    if (cleanCep.length !== 8) {
      setCepError("CEP deve ter 8 dígitos");
      return;
    }

    setCepLoading(true);
    setCepError("");

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();

      if (data.erro) {
        setCepError("CEP não encontrado");
        return;
      }

      // Update form with address data
      setFormData({
        ...formData,
        cep: cleanCep,
        city: data.localidade || "",
        region: data.uf || "",
      });
    } catch (err) {
      console.error("Error fetching CEP:", err);
      setCepError("Erro ao buscar CEP. Tente novamente.");
    } finally {
      setCepLoading(false);
    }
  };

  const handleCepChange = (value: string) => {
    const cleanValue = value.replace(/\D/g, "").slice(0, 8);
    setFormData({ ...formData, cep: cleanValue });
    setCepError("");

    // Auto-fetch when CEP is complete
    if (cleanValue.length === 8) {
      fetchAddressByCep(cleanValue);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const url = profile
        ? `/api/profiles/${profile.id}`
        : "/api/profiles";
      
      const method = profile ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          age_attribute: formData.age_attribute ? parseInt(formData.age_attribute) : null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to save profile");
      }

      setSuccess("Perfil salvo com sucesso!");
      if (!profile) {
        setProfile(data.profile);
      }
      
      // Refresh profile data
      await fetchProfile();
    } catch (err: any) {
      setError(err.message);
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

  const updatePricingPackage = (index: number, field: string, value: string) => {
    const updated = [...formData.pricing_packages];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, pricing_packages: updated });
  };

  const addExternalLink = () => {
    setFormData({
      ...formData,
      external_links: [
        ...formData.external_links,
        { label: "", url: "" }
      ]
    });
  };

  const removeExternalLink = (index: number) => {
    setFormData({
      ...formData,
      external_links: formData.external_links.filter((_, i) => i !== index)
    });
  };

  const updateExternalLink = (index: number, field: string, value: string) => {
    const updated = [...formData.external_links];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, external_links: updated });
  };

  const toggleFeature = (feature: string) => {
    const isSelected = formData.selected_features.includes(feature);
    const updated = isSelected
      ? formData.selected_features.filter(f => f !== feature)
      : [...formData.selected_features, feature];
    setFormData({ ...formData, selected_features: updated });
  };

  const toggleFeatureSingleSelect = (categoryId: string, feature: string) => {
    // Remove all features from this category first
    const categoryConfig = featuresServicesConfig.categories.find(c => c.id === categoryId);
    if (!categoryConfig) return;

    const categoryOptions = categoryConfig.options;
    const withoutCategory = formData.selected_features.filter(f => !categoryOptions.includes(f));
    
    // Add the new selection (or leave empty if deselecting)
    const isCurrentlySelected = formData.selected_features.includes(feature);
    const updated = isCurrentlySelected ? withoutCategory : [...withoutCategory, feature];
    
    setFormData({ ...formData, selected_features: updated });
  };

  const updateAvailability = (index: number, field: string, value: any) => {
    const updated = [...formData.availability];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, availability: updated });
  };

  const sections = [
    { id: "basic", label: "Informações Básicas" },
    { id: "description", label: "Descrições" },
    { id: "location", label: "Localização" },
    { id: "pricing", label: "Valores" },
    { id: "links", label: "Links Externos" },
    { id: "media", label: "Fotos e Vídeos" },
    { id: "features", label: "Características e Serviços" },
    { id: "availability", label: "Horários" },
  ];

  const getMediaLimits = () => {
    if (!subscription?.plan) return { photos: 6, videos: 1 }; // Free plan defaults
    return {
      photos: subscription.plan.max_photos || 6,
      videos: subscription.plan.max_videos || 1,
    };
  };

  const limits = getMediaLimits();

  const photoCount = mediaFiles.filter(m => m.media_type === "photo").length;
  const videoCount = mediaFiles.filter(m => m.media_type === "video").length;

  // Validation functions for each section
  const validateSection = (sectionId: string): boolean => {
    switch (sectionId) {
      case "basic":
        return !!(
          formData.display_name &&
          formData.slug &&
          formData.category &&
          formData.age_attribute
        );
      case "description":
        return !!(
          formData.short_description &&
          formData.long_description
        );
      case "location":
        return !!(
          formData.cep &&
          formData.street_number
        );
      case "pricing":
      case "links":
      case "media":
      case "features":
      case "availability":
        return true; // Optional sections
      default:
        return true;
    }
  };

  const isFormValid = (): boolean => {
    return validateSection("basic") && 
           validateSection("description") && 
           validateSection("location");
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
    <div style={{ minHeight: "100vh", backgroundColor: "hsl(var(--muted))" }}>
      <div style={{ maxWidth: "80rem", margin: "0 auto", padding: "2rem 1rem" }}>
        {/* Header */}
        <div style={{ marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "2rem", fontWeight: "700", marginBottom: "0.5rem" }}>
            {profile ? "Editar Perfil" : "Criar Perfil"}
          </h1>
          <p style={{ color: "hsl(var(--muted-foreground))" }}>
            Preencha as informações do seu perfil profissional
          </p>
          {subscription && (
            <div style={{ marginTop: "1rem" }}>
              <Badge>
                Plano {subscription.plan?.name} - {limits.photos} fotos e {limits.videos} vídeos
              </Badge>
            </div>
          )}
        </div>

        {error && (
          <div style={{ marginBottom: "1rem", backgroundColor: "hsl(var(--destructive))", color: "white", padding: "1rem", borderRadius: "var(--radius)" }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{ marginBottom: "1rem", backgroundColor: "#10b981", color: "white", padding: "1rem", borderRadius: "var(--radius)" }}>
            {success}
          </div>
        )}

        {/* Navigation Tabs */}
        <div style={{ marginBottom: "2rem", display: "flex", gap: "0.5rem", flexWrap: "wrap", backgroundColor: "white", padding: "1rem", borderRadius: "var(--radius)" }}>
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
                    <Label htmlFor="display_name">Nome de Exibição *</Label>
                    <Input
                      id="display_name"
                      required
                      value={formData.display_name}
                      onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                      placeholder="Seu nome profissional"
                    />
                  </div>

                  <div>
                    <Label htmlFor="slug">
                      URL Personalizada *
                      {profile?.slug_last_changed_at && (
                        <span style={{ fontSize: "0.75rem", color: "hsl(var(--muted-foreground))", marginLeft: "0.5rem" }}>
                          (pode mudar a cada 90 dias)
                        </span>
                      )}
                    </Label>
                    <Input
                      id="slug"
                      required
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })}
                      placeholder="seu-nome"
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1.5rem" }}>
                  <div>
                    <Label htmlFor="category">Categoria *</Label>
                    <select
                      id="category"
                      required
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      style={{ minWidth: "100%" }}
                    >
                      <option value="">Selecione uma categoria</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="age_attribute">Idade *</Label>
                    <select
                      id="age_attribute"
                      required
                      value={formData.age_attribute}
                      onChange={(e) => setFormData({ ...formData, age_attribute: e.target.value })}
                      style={{ minWidth: "100%" }}
                    >
                      <option value="">Selecione sua idade</option>
                      {ageOptions.map((age) => (
                        <option key={age} value={age}>
                          {age} anos
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Physical Measurements */}
                <div style={{ 
                  padding: "1.5rem", 
                  backgroundColor: "hsl(var(--muted))", 
                  borderRadius: "var(--radius)",
                  marginTop: "1rem"
                }}>
                  <h3 style={{ fontSize: "1rem", fontWeight: "600", marginBottom: "1.5rem" }}>
                    Medidas Físicas
                  </h3>
                  
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.5rem" }}>
                    {/* Weight */}
                    <div>
                      <Label htmlFor="weight">Peso: {formData.weight} kg</Label>
                      <input
                        id="weight"
                        type="range"
                        min="40"
                        max="150"
                        value={formData.weight}
                        onChange={(e) => setFormData({ ...formData, weight: parseInt(e.target.value) })}
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

                    {/* Height */}
                    <div>
                      <Label htmlFor="height">Altura: {formData.height} cm</Label>
                      <input
                        id="height"
                        type="range"
                        min="140"
                        max="200"
                        value={formData.height}
                        onChange={(e) => setFormData({ ...formData, height: parseInt(e.target.value) })}
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

                    {/* Shoe Size */}
                    <div>
                      <Label htmlFor="shoe_size">Tamanho do Pé</Label>
                      <Input
                        id="shoe_size"
                        type="number"
                        min="33"
                        max="44"
                        value={formData.shoe_size}
                        onChange={(e) => setFormData({ ...formData, shoe_size: parseInt(e.target.value) || 33 })}
                        placeholder="37"
                      />
                      <p style={{ fontSize: "0.75rem", color: "hsl(var(--muted-foreground))", marginTop: "0.25rem" }}>
                        Tamanho entre 33 e 44
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Descriptions */}
          {activeSection === "description" && (
            <Card style={{ marginBottom: "1.5rem" }}>
              <CardHeader>
                <CardTitle>Descrições</CardTitle>
              </CardHeader>
              <CardContent style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
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

          {/* Location */}
          {activeSection === "location" && (
            <Card style={{ marginBottom: "1.5rem" }}>
              <CardHeader>
                <CardTitle>Localização</CardTitle>
              </CardHeader>
              <CardContent style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                <div style={{ 
                  padding: "0.75rem 1rem", 
                  backgroundColor: "#dbeafe", 
                  borderLeft: "4px solid #3b82f6",
                  borderRadius: "var(--radius)",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "0.75rem"
                }}>
                  <span style={{ fontSize: "1.25rem", flexShrink: 0 }}>🔒</span>
                  <p style={{ fontSize: "0.875rem", color: "#1e40af", margin: 0, lineHeight: "1.5" }}>
                    <strong>Privacidade:</strong> Seu endereço exato não será exibido no perfil. Mostraremos apenas uma região aproximada para proteger sua privacidade.
                  </p>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1.5rem" }}>
                  <div>
                    <Label htmlFor="cep">CEP *</Label>
                    <Input
                      id="cep"
                      required
                      value={formData.cep}
                      onChange={(e) => handleCepChange(e.target.value)}
                      placeholder="00000-000"
                      maxLength={9}
                      disabled={cepLoading}
                    />
                    {cepLoading && (
                      <p style={{ fontSize: "0.75rem", color: "#3b82f6", marginTop: "0.25rem" }}>
                        Buscando endereço...
                      </p>
                    )}
                    {cepError && (
                      <p style={{ fontSize: "0.75rem", color: "#ef4444", marginTop: "0.25rem" }}>
                        {cepError}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="street_number">Número *</Label>
                    <Input
                      id="street_number"
                      required
                      value={formData.street_number}
                      onChange={(e) => setFormData({ ...formData, street_number: e.target.value })}
                      placeholder="123"
                    />
                  </div>
                </div>

                {formData.city && formData.region && (
                  <div style={{ padding: "1rem", backgroundColor: "hsl(var(--accent))", borderRadius: "var(--radius)" }}>
                    <p style={{ fontSize: "0.875rem", fontWeight: "600", marginBottom: "0.25rem" }}>
                      Endereço detectado:
                    </p>
                    <p style={{ fontSize: "0.875rem", color: "hsl(var(--muted-foreground))" }}>
                      {formData.city} - {formData.region}
                    </p>
                  </div>
                )}
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
                        <Input
                          value={pkg.price}
                          onChange={(e) => updatePricingPackage(index, "price", e.target.value)}
                          placeholder="R$ 300,00"
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
                    <div>
                      <Label>Descrição (opcional)</Label>
                      <Input
                        value={pkg.description || ""}
                        onChange={(e) => updatePricingPackage(index, "description", e.target.value)}
                        placeholder="Detalhes adicionais sobre este serviço"
                      />
                    </div>
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={addPricingPackage}>
                  + Adicionar Valor
                </Button>
              </CardContent>
            </Card>
          )}

          {/* External Links */}
          {activeSection === "links" && (
            <Card style={{ marginBottom: "1.5rem" }}>
              <CardHeader>
                <CardTitle>Links Externos</CardTitle>
              </CardHeader>
              <CardContent style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                {formData.external_links.map((link, index) => (
                  <div key={index} style={{ padding: "1rem", border: "1px solid hsl(var(--border))", borderRadius: "var(--radius)", display: "grid", gridTemplateColumns: "1fr 2fr auto", gap: "1rem", alignItems: "end" }}>
                    <div>
                      <Label>Nome do Link</Label>
                      <Input
                        value={link.label}
                        onChange={(e) => updateExternalLink(index, "label", e.target.value)}
                        placeholder="Ex: Instagram, Site"
                      />
                    </div>
                    <div>
                      <Label>URL</Label>
                      <Input
                        value={link.url}
                        onChange={(e) => updateExternalLink(index, "url", e.target.value)}
                        placeholder="https://..."
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => removeExternalLink(index)}
                      style={{ color: "hsl(var(--destructive))" }}
                    >
                      Remover
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={addExternalLink}>
                  + Adicionar Link
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Media */}
          {activeSection === "media" && (
            <Card style={{ marginBottom: "1.5rem" }}>
              <CardHeader>
                <CardTitle>Fotos e Vídeos</CardTitle>
              </CardHeader>
              <CardContent style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
                {/* Photos Section */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                    <h3 style={{ fontSize: "1rem", fontWeight: "600" }}>
                      Fotos ({photoCount}/{limits.photos})
                    </h3>
                    {photoCount < limits.photos && (
                      <label style={{ cursor: "pointer" }}>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleMediaUpload(e, "photo")}
                          style={{ display: "none" }}
                          disabled={uploadingMedia}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={uploadingMedia}
                          onClick={(e) => {
                            e.preventDefault();
                            (e.currentTarget.previousElementSibling as HTMLInputElement)?.click();
                          }}
                        >
                          + Adicionar Foto
                        </Button>
                      </label>
                    )}
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "1rem" }}>
                    {mediaFiles
                      .filter(m => m.media_type === "photo")
                      .map((media) => (
                        <div
                          key={media.id}
                          style={{
                            position: "relative",
                            aspectRatio: "9/16",
                            borderRadius: "var(--radius)",
                            overflow: "hidden",
                            border: "1px solid hsl(var(--border))",
                          }}
                        >
                          <img
                            src={media.url}
                            alt={media.filename}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                          {/* Watermark Pattern */}
                          <div
                            style={{
                              position: "absolute",
                              top: 0,
                              left: 0,
                              right: 0,
                              bottom: 0,
                              display: "grid",
                              gridTemplateColumns: "repeat(2, 1fr)",
                              gridTemplateRows: "repeat(4, 1fr)",
                              gap: "1rem",
                              padding: "1rem",
                              pointerEvents: "none",
                            }}
                          >
                            {Array.from({ length: 8 }).map((_, i) => (
                              <div
                                key={i}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                <div
                                  style={{
                                    fontSize: "0.75rem",
                                    fontWeight: "600",
                                    color: "rgba(255, 255, 255, 0.25)",
                                    textShadow: "1px 1px 2px rgba(0, 0, 0, 0.3)",
                                    transform: "rotate(-45deg)",
                                    userSelect: "none",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  Libertage
                                </div>
                              </div>
                            ))}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteMedia(media.id)}
                            style={{
                              position: "absolute",
                              top: "0.5rem",
                              right: "0.5rem",
                              backgroundColor: "rgba(0, 0, 0, 0.7)",
                              color: "white",
                              border: "none",
                              borderRadius: "50%",
                              width: "2rem",
                              height: "2rem",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "pointer",
                              fontSize: "1.25rem",
                              zIndex: 10,
                            }}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                  </div>

                  {photoCount === 0 && (
                    <div style={{ 
                      padding: "2rem", 
                      textAlign: "center", 
                      backgroundColor: "hsl(var(--muted))", 
                      borderRadius: "var(--radius)",
                      border: "2px dashed hsl(var(--border))"
                    }}>
                      <p style={{ color: "hsl(var(--muted-foreground))" }}>
                        Nenhuma foto adicionada ainda
                      </p>
                    </div>
                  )}
                </div>

                {/* Videos Section */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                    <h3 style={{ fontSize: "1rem", fontWeight: "600" }}>
                      Vídeos ({videoCount}/{limits.videos})
                    </h3>
                    {videoCount < limits.videos && (
                      <label style={{ cursor: "pointer" }}>
                        <input
                          type="file"
                          accept="video/*"
                          onChange={(e) => handleMediaUpload(e, "video")}
                          style={{ display: "none" }}
                          disabled={uploadingMedia}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={uploadingMedia}
                          onClick={(e) => {
                            e.preventDefault();
                            (e.currentTarget.previousElementSibling as HTMLInputElement)?.click();
                          }}
                        >
                          + Adicionar Vídeo
                        </Button>
                      </label>
                    )}
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "1rem" }}>
                    {mediaFiles
                      .filter(m => m.media_type === "video")
                      .map((media) => (
                        <div
                          key={media.id}
                          style={{
                            position: "relative",
                            aspectRatio: "9/16",
                            borderRadius: "var(--radius)",
                            overflow: "hidden",
                            border: "1px solid hsl(var(--border))",
                            backgroundColor: "#000",
                          }}
                        >
                          <video
                            src={media.url}
                            controls
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "contain",
                            }}
                          />
                          {/* Watermark Pattern */}
                          <div
                            style={{
                              position: "absolute",
                              top: 0,
                              left: 0,
                              right: 0,
                              bottom: 0,
                              display: "grid",
                              gridTemplateColumns: "repeat(2, 1fr)",
                              gridTemplateRows: "repeat(4, 1fr)",
                              gap: "1rem",
                              padding: "1rem",
                              pointerEvents: "none",
                            }}
                          >
                            {Array.from({ length: 8 }).map((_, i) => (
                              <div
                                key={i}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                <div
                                  style={{
                                    fontSize: "0.75rem",
                                    fontWeight: "600",
                                    color: "rgba(255, 255, 255, 0.25)",
                                    textShadow: "1px 1px 2px rgba(0, 0, 0, 0.3)",
                                    transform: "rotate(-45deg)",
                                    userSelect: "none",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  Libertage
                                </div>
                              </div>
                            ))}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteMedia(media.id)}
                            style={{
                              position: "absolute",
                              top: "0.5rem",
                              right: "0.5rem",
                              backgroundColor: "rgba(0, 0, 0, 0.7)",
                              color: "white",
                              border: "none",
                              borderRadius: "50%",
                              width: "2rem",
                              height: "2rem",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "pointer",
                              fontSize: "1.25rem",
                              zIndex: 10,
                            }}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                  </div>

                  {videoCount === 0 && (
                    <div style={{ 
                      padding: "2rem", 
                      textAlign: "center", 
                      backgroundColor: "hsl(var(--muted))", 
                      borderRadius: "var(--radius)",
                      border: "2px dashed hsl(var(--border))"
                    }}>
                      <p style={{ color: "hsl(var(--muted-foreground))" }}>
                        Nenhum vídeo adicionado ainda
                      </p>
                    </div>
                  )}
                </div>

                {/* Upgrade CTA */}
                <div style={{ 
                  padding: "1rem 1.5rem", 
                  backgroundColor: "#fef3c7", 
                  borderLeft: "4px solid #f59e0b",
                  borderRadius: "var(--radius)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "1rem",
                  flexWrap: "wrap"
                }}>
                  <div>
                    <p style={{ fontSize: "0.875rem", color: "#92400e", margin: 0, fontWeight: "600" }}>
                      Deseja ter mais fotos e vídeos no seu perfil?
                    </p>
                    <p style={{ fontSize: "0.875rem", color: "#92400e", margin: "0.25rem 0 0 0" }}>
                      Faça um upgrade de plano e destaque ainda mais seu trabalho!
                    </p>
                  </div>
                  <Button
                    type="button"
                    onClick={() => router.push("/portal/plans")}
                    style={{ backgroundColor: "#f59e0b", color: "white" }}
                  >
                    Ver Planos
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Features */}
          {activeSection === "features" && (
            <Card style={{ marginBottom: "1.5rem" }}>
              <CardHeader>
                <CardTitle>Características e Serviços</CardTitle>
              </CardHeader>
              <CardContent style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
                {featuresServicesConfig.categories.map((category) => (
                  <div key={category.id}>
                    <div style={{ marginBottom: "1rem" }}>
                      <h3 style={{ fontSize: "1rem", fontWeight: "600" }}>
                        {category.name}
                      </h3>
                      {!category.multiSelect && (
                        <p style={{ fontSize: "0.75rem", color: "hsl(var(--muted-foreground))", marginTop: "0.25rem" }}>
                          Selecione apenas uma opção
                        </p>
                      )}
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
                      {category.options.map((option) => {
                        const isSelected = formData.selected_features.includes(option);
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
                              type={category.multiSelect ? "checkbox" : "radio"}
                              name={category.multiSelect ? undefined : `category-${category.id}`}
                              checked={isSelected}
                              onChange={() => {
                                if (category.multiSelect) {
                                  toggleFeature(option);
                                } else {
                                  toggleFeatureSingleSelect(category.id, option);
                                }
                              }}
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
                            <span>{option}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
                
                <div style={{ 
                  padding: "1rem 1.5rem", 
                  backgroundColor: "#dbeafe", 
                  borderLeft: "4px solid #3b82f6",
                  borderRadius: "var(--radius)",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "0.75rem"
                }}>
                  <span style={{ fontSize: "1.25rem", flexShrink: 0 }}>💡</span>
                  <p style={{ fontSize: "0.875rem", color: "#1e40af", margin: 0, lineHeight: "1.5" }}>
                    <strong>Dica:</strong> Algumas categorias permitem múltiplas seleções, outras apenas uma opção. Clique nas opções para selecioná-las.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Availability */}
          {activeSection === "availability" && (
            <Card style={{ marginBottom: "1.5rem" }}>
              <CardHeader>
                <CardTitle>Horários de Atendimento</CardTitle>
              </CardHeader>
              <CardContent style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {formData.availability.map((schedule, index) => (
                  <div
                    key={schedule.day}
                    style={{
                      padding: "1rem",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)",
                      backgroundColor: schedule.enabled ? "transparent" : "hsl(var(--muted))",
                      opacity: schedule.enabled ? 1 : 0.6,
                    }}
                  >
                    <div style={{ display: "grid", gridTemplateColumns: "auto 1fr 1fr auto", gap: "1rem", alignItems: "center" }}>
                      {/* Checkbox */}
                      <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", minWidth: "150px" }}>
                        <input
                          type="checkbox"
                          checked={schedule.enabled}
                          onChange={(e) => updateAvailability(index, "enabled", e.target.checked)}
                          style={{ cursor: "pointer", width: "1.25rem", height: "1.25rem" }}
                        />
                        <span style={{ fontWeight: "600", fontSize: "0.875rem" }}>
                          {schedule.day}
                        </span>
                      </label>

                      {/* Start Time */}
                      <div>
                        <Label htmlFor={`start-${index}`} style={{ fontSize: "0.75rem", marginBottom: "0.25rem" }}>
                          Início
                        </Label>
                        <Input
                          id={`start-${index}`}
                          type="time"
                          value={schedule.start_time}
                          onChange={(e) => updateAvailability(index, "start_time", e.target.value)}
                          disabled={!schedule.enabled}
                          style={{ fontSize: "0.875rem" }}
                        />
                      </div>

                      {/* End Time */}
                      <div>
                        <Label htmlFor={`end-${index}`} style={{ fontSize: "0.75rem", marginBottom: "0.25rem" }}>
                          Término
                        </Label>
                        <Input
                          id={`end-${index}`}
                          type="time"
                          value={schedule.end_time}
                          onChange={(e) => updateAvailability(index, "end_time", e.target.value)}
                          disabled={!schedule.enabled}
                          style={{ fontSize: "0.875rem" }}
                        />
                      </div>

                      {/* Status Badge */}
                      <div style={{ minWidth: "100px", textAlign: "right" }}>
                        {schedule.enabled ? (
                          <Badge style={{ backgroundColor: "#10b981", color: "white" }}>
                            Disponível
                          </Badge>
                        ) : (
                          <Badge style={{ backgroundColor: "hsl(var(--muted-foreground))", color: "white" }}>
                            Indisponível
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                <div style={{ 
                  padding: "1rem 1.5rem", 
                  backgroundColor: "#dbeafe", 
                  borderLeft: "4px solid #3b82f6",
                  borderRadius: "var(--radius)",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "0.75rem",
                  marginTop: "1rem"
                }}>
                  <span style={{ fontSize: "1.25rem", flexShrink: 0 }}>💡</span>
                  <p style={{ fontSize: "0.875rem", color: "#1e40af", margin: 0, lineHeight: "1.5" }}>
                    <strong>Dica:</strong> Desmarque os dias em que você não trabalha. Os horários só serão exibidos para os dias marcados.
                  </p>
                </div>
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
      </div>
    </div>
  );
}
