"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";

export default function Home() {
  const [boostedProfiles, setBoostedProfiles] = useState<any[]>([]);
  const [regularProfiles, setRegularProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isAdvancedFiltersOpen, setIsAdvancedFiltersOpen] = useState(false);
  const [isAgeWarningOpen, setIsAgeWarningOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [filters, setFilters] = useState({
    search: "",
    service: "",
    city: "",
    region: "",
  });
  const [advancedFilters, setAdvancedFilters] = useState({
    ageRange: [18, 57],
    priceRange: [18, 57],
    ageCategory: "",
    priceCategory: "",
    paymentMethods: [] as string[],
    locations: [] as string[],
    characteristics1: [] as string[],
    characteristics2: [] as string[],
    characteristics3: [] as string[],
    services: [] as string[],
  });
  const [availableFilters, setAvailableFilters] = useState({
    categories: [] as string[],
    cities: [] as string[],
    regions: [] as string[],
  });
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  // Gallery images from profile media
  const galleryImages = selectedProfile?.media?.map((m: any) => m.public_url) || [];

  const openGallery = (index: number) => {
    setCurrentImageIndex(index);
    setIsGalleryOpen(true);
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % galleryImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
  };

  // Track visit when modal opens with a profile
  useEffect(() => {
    if (isModalOpen && selectedProfile?.id) {
      trackVisit(selectedProfile.id);
    }
  }, [isModalOpen, selectedProfile?.id]);

  const trackVisit = async (profileId: string) => {
    try {
      // Detect device type
      const deviceType = typeof window !== "undefined" 
        ? (window.innerWidth < 768 ? "mobile" : window.innerWidth < 1024 ? "tablet" : "desktop")
        : "desktop";

      await fetch("/api/analytics/visit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile_id: profileId,
          device_type: deviceType,
        }),
      });
    } catch (err) {
      console.error("Error tracking visit:", err);
    }
  };

  const trackContactClick = async (profileId: string, method: string) => {
    try {
      await fetch("/api/analytics/contact-click", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile_id: profileId,
          contact_method: method,
        }),
      });
    } catch (err) {
      console.error("Error tracking contact click:", err);
    }
  };

  useEffect(() => {
    loadProfiles();
    
    // Check if age warning has been shown
    const hasSeenWarning = localStorage.getItem('age_warning_seen');
    if (!hasSeenWarning) {
      setIsAgeWarningOpen(true);
    }
  }, []);

  // Auto-apply filters when they change
  useEffect(() => {
    const applyFilters = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (filters.search) params.append("search", filters.search);
        if (filters.service) params.append("service", filters.service);
        if (filters.city) params.append("city", filters.city);
        if (filters.region) params.append("region", filters.region);

        const res = await fetch(`/api/catalog?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setBoostedProfiles(data.boostedProfiles || []);
          setRegularProfiles(data.regularProfiles || []);
        }
      } catch (error) {
        console.error("Error applying filters:", error);
      } finally {
        setLoading(false);
      }
    };

    // Only apply if at least one filter is set (to avoid double loading on mount)
    if (filters.service || filters.city || filters.region || filters.search) {
      applyFilters();
    }
  }, [filters.service, filters.city, filters.region]); // Don't include search to avoid triggering on every keystroke

  const loadProfiles = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/catalog");
      if (res.ok) {
        const data = await res.json();
        setBoostedProfiles(data.boostedProfiles || []);
        setRegularProfiles(data.regularProfiles || []);
        setAvailableFilters(data.filters || { categories: [], cities: [], regions: [] });
      }
    } catch (error) {
      console.error("Error loading profiles:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.search) params.append("search", filters.search);
      if (filters.service) params.append("service", filters.service);
      if (filters.city) params.append("city", filters.city);
      if (filters.region) params.append("region", filters.region);

      const res = await fetch(`/api/catalog?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setBoostedProfiles(data.boostedProfiles || []);
        setRegularProfiles(data.regularProfiles || []);
      }
    } catch (error) {
      console.error("Error searching profiles:", error);
    } finally {
      setLoading(false);
    }
  };

  const ProfileCard = ({ profile, isBoosted = false }: any) => {
    // Find cover photo or use first photo
    const coverPhoto = profile.media?.find((m: any) => m.is_cover && m.type === "photo");
    const displayPhoto = coverPhoto || profile.media?.find((m: any) => m.type === "photo");
    
    // Get services from selected_features
    const services = profile.selected_features?.filter((f: string) => 
      ["Massagem", "Acompanhante", "Chamada de vídeo"].includes(f)
    ) || [];
    
    return (
      <div onClick={() => {
        setSelectedProfile(profile);
        setIsModalOpen(true);
      }}>
        <Card style={{ cursor: "pointer", transition: "box-shadow 0.2s", height: "100%" }} className="hover:shadow-lg">
          {displayPhoto?.public_url && (
            <div style={{ width: "100%", height: "12rem", overflow: "hidden", borderTopLeftRadius: "var(--radius)", borderTopRightRadius: "var(--radius)" }}>
              <img
                src={displayPhoto.public_url}
                alt={profile.display_name}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
          )}
          <CardContent style={{ padding: "1rem" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "0.5rem" }}>
              <h3 style={{ fontSize: "1.125rem", fontWeight: "600" }}>
                {profile.display_name}
              </h3>
              {isBoosted && (
                <Badge style={{ backgroundColor: "hsl(45 93% 47%)", color: "hsl(26 90% 10%)" }}>
                  Destaque
                </Badge>
              )}
            </div>
            <p style={{ fontSize: "0.875rem", color: "hsl(var(--muted-foreground))", marginBottom: "0.5rem", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
              {profile.short_description}
            </p>
            <div style={{ display: "flex", alignItems: "center", fontSize: "0.875rem", color: "hsl(var(--muted-foreground))", gap: "0.5rem", marginBottom: "0.5rem" }}>
              <span>{profile.city}</span>
              {profile.region && (
                <>
                  <span>•</span>
                  <span>{profile.region}</span>
                </>
              )}
            </div>
            {services.length > 0 && (
              <Badge variant="secondary">{services.join(", ")}</Badge>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div style={{ minHeight: "100vh" }}>
      {/* New Header */}
      <header style={{ borderBottom: "1px solid hsl(var(--border))", backgroundColor: "hsl(var(--background))" }}>
        {/* Top Bar */}
        <div className="container-custom" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem" }}>
          {/* Logo */}
          <Link href="/">
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
              <Image src="/libertage-logo.svg" alt="Libertage" width={150} height={45} priority />
            </div>
          </Link>

          {/* Right Buttons */}
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <Link href="/login">
              <Button style={{ backgroundColor: "black", color: "white" }}>Acessar/Anunciar</Button>
            </Link>
          </div>
        </div>

        {/* Search Bar */}
        <div className="container-custom" style={{ padding: "0 1rem 1rem" }}>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
            {/* Tipo de Profissional */}
            <select
              value={filters.service}
              onChange={(e) => setFilters({ ...filters, service: e.target.value })}
              style={{ minWidth: "180px" }}
            >
              <option value="">Todas as Profissionais</option>
              <option value="Massagem">Massagem</option>
              <option value="Acompanhante">Acompanhante</option>
              <option value="Chamada de vídeo">Chamada de vídeo</option>
            </select>

            {/* Todos os estados */}
            <select
              value={filters.city}
              onChange={(e) => setFilters({ ...filters, city: e.target.value })}
              style={{ minWidth: "180px" }}
            >
              <option value="">Todos os estados</option>
              {availableFilters.cities.map((city: string) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>

            {/* Search Input */}
            <Input
              type="text"
              placeholder="Digite para buscar"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              style={{ flex: 1, minWidth: "200px" }}
            />

            {/* Buscar Button */}
            <Button onClick={handleSearch} style={{ backgroundColor: "black", color: "white" }}>
              BUSCAR
            </Button>

            {/* Filtros Avançados Button */}
            <Button
              variant="outline"
              onClick={() => setIsAdvancedFiltersOpen(true)}
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <span style={{ fontSize: "1.2rem" }}>⚙</span>
              FILTROS AVANÇADOS
            </Button>
          </div>
        </div>
      </header>

      {/* Catalog Content */}
      <div className="container-custom" style={{ padding: "2rem 1rem" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "3rem 0" }}>
            <p style={{ color: "hsl(var(--muted-foreground))" }}>Carregando...</p>
          </div>
        ) : (
          <>
            {/* Boosted Profiles Section */}
            {boostedProfiles.length > 0 && (
              <div style={{ marginBottom: "3rem" }}>
                <h2 style={{ fontSize: "1.5rem", fontWeight: "700", marginBottom: "1.5rem" }}>
                  Perfis em Destaque
                </h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.5rem" }}>
                  {boostedProfiles.map((profile) => (
                    <ProfileCard key={profile.id} profile={profile} isBoosted />
                  ))}
                </div>
              </div>
            )}

            {/* Regular Profiles Section */}
            <div>
              <h2 style={{ fontSize: "1.5rem", fontWeight: "700", marginBottom: "1.5rem" }}>
                {boostedProfiles.length > 0 ? "Todos os Perfis" : "Perfis"}
              </h2>
              {regularProfiles.length > 0 ? (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.5rem" }}>
                    {regularProfiles.map((profile) => (
                      <ProfileCard key={profile.id} profile={profile} />
                    ))}
                  </div>

                  {/* Pagination */}
                  {hasMore && (
                    <div style={{ marginTop: "2rem", textAlign: "center" }}>
                      <Button onClick={() => setPage(page + 1)}>
                        Carregar Mais
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <p style={{ textAlign: "center", color: "hsl(var(--muted-foreground))", padding: "3rem 0" }}>
                  Nenhum perfil encontrado com os filtros selecionados.
                </p>
              )}
            </div>
          </>
        )}
      </div>

      {/* Profile Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          {selectedProfile && (
            <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
              {/* Close Button */}
              <button
                onClick={() => setIsModalOpen(false)}
                style={{
                  position: "absolute",
                  right: "1rem",
                  top: "1rem",
                  fontSize: "1.5rem",
                  cursor: "pointer",
                  color: "hsl(var(--muted-foreground))",
                  zIndex: 10,
                  width: "2rem",
                  height: "2rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "0.25rem",
                  transition: "background-color 0.2s",
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "hsl(var(--accent))"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
              >
                ×
              </button>

              {/* Modal Content - 2 Column Layout */}
              <div 
                className="profile-modal-grid"
                style={{ 
                  display: "grid", 
                  gridTemplateColumns: "1fr",
                  gap: "1.5rem",
                  padding: "1.5rem",
                  overflowY: "auto",
                  maxHeight: "90vh"
                }}
              >
                {/* Left Column - Main Content */}
                <div>
                  {/* Profile Header */}
                  <div style={{ marginBottom: "1.5rem" }}>
                    <h2 style={{ fontSize: "1.875rem", fontWeight: "700", marginBottom: "0.5rem" }}>
                      {selectedProfile.display_name}
                    </h2>
                    <p style={{ color: "hsl(var(--muted-foreground))", marginBottom: "1rem" }}>
                      {selectedProfile.short_description}
                    </p>
                    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                      {selectedProfile.selected_features?.filter((f: string) => 
                        ["Massagem", "Acompanhante", "Chamada de vídeo"].includes(f)
                      ).map((service: string, i: number) => (
                        <Badge key={i}>{service}</Badge>
                      ))}
                      <Badge variant="secondary">{selectedProfile.city}</Badge>
                      {selectedProfile.region && (
                        <Badge variant="secondary">{selectedProfile.region}</Badge>
                      )}
                    </div>
                  </div>

                  {/* Photo Gallery */}
                  <div style={{ marginBottom: "1.5rem" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.5rem" }}>
                      {selectedProfile.media?.filter((m: any) => m.type === "photo").slice(0, 8).map((media: any, i: number) => (
                        <div
                          key={media.id}
                          onClick={() => openGallery(i)}
                          style={{
                            aspectRatio: "1",
                            borderRadius: "var(--radius)",
                            overflow: "hidden",
                            cursor: "pointer",
                            transition: "opacity 0.2s",
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.opacity = "0.8"}
                          onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
                        >
                          <img
                            src={media.public_url}
                            alt={`Foto ${i + 1}`}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        </div>
                      ))}
                    </div>
                    {/* Video Thumbnails */}
                    {selectedProfile.media?.filter((m: any) => m.type === "video").map((media: any, i: number) => (
                      <div 
                        key={media.id}
                        onClick={() => openGallery(selectedProfile.media.filter((m: any) => m.type === "photo").length + i)}
                        style={{ marginTop: "0.5rem", position: "relative", borderRadius: "var(--radius)", overflow: "hidden", cursor: "pointer" }}
                      >
                        <video
                          src={media.public_url}
                          style={{ width: "100%", height: "8rem", objectFit: "cover", filter: "brightness(0.7)" }}
                        />
                        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}>
                          <div style={{ 
                            width: "3rem", 
                            height: "3rem", 
                            borderRadius: "50%", 
                            backgroundColor: "rgba(255,255,255,0.9)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center"
                          }}>
                            ▶
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Medidas Físicas */}
                  {(selectedProfile.weight || selectedProfile.height || selectedProfile.shoe_size) && (
                    <div style={{ marginBottom: "1.5rem" }}>
                      <h3 style={{ fontSize: "1.125rem", fontWeight: "600", marginBottom: "0.75rem" }}>
                        Medidas Físicas
                      </h3>
                      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                        {selectedProfile.weight && (
                          <Badge variant="outline">Peso: {selectedProfile.weight}kg</Badge>
                        )}
                        {selectedProfile.height && (
                          <Badge variant="outline">Altura: {selectedProfile.height}cm</Badge>
                        )}
                        {selectedProfile.shoe_size && (
                          <Badge variant="outline">Calçado: {selectedProfile.shoe_size}</Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Descrição Longa */}
                  <div style={{ marginBottom: "1.5rem" }}>
                    <p style={{ color: "hsl(var(--muted-foreground))", lineHeight: "1.6", whiteSpace: "pre-wrap" }}>
                      {selectedProfile.long_description}
                    </p>
                  </div>

                  {/* Características e Serviços */}
                  {selectedProfile.selected_features && selectedProfile.selected_features.length > 0 && (
                    <div style={{ marginBottom: "1.5rem" }}>
                      <h3 style={{ fontSize: "1.125rem", fontWeight: "600", marginBottom: "0.75rem" }}>
                        Características e Serviços
                      </h3>
                      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                        {selectedProfile.selected_features.map((feature: string, i: number) => (
                          <Badge key={i} variant="outline">{feature}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column - Sidebar (will be below on mobile) */}
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {/* Contact Buttons */}
                  {selectedProfile.whatsapp_enabled && selectedProfile.whatsapp_number && (
                    <Button
                      onClick={() => {
                        trackContactClick(selectedProfile.id, "whatsapp");
                        window.open(`https://wa.me/55${selectedProfile.whatsapp_number}`, "_blank");
                      }}
                      style={{
                        backgroundColor: "#25D366",
                        color: "white"
                      }}
                      size="lg"
                    >
                      WHATSAPP
                    </Button>
                  )}
                  
                  {selectedProfile.telegram_enabled && selectedProfile.telegram_username && (
                    <Button
                      onClick={() => {
                        trackContactClick(selectedProfile.id, "telegram");
                        window.open(`https://t.me/${selectedProfile.telegram_username}`, "_blank");
                      }}
                      style={{
                        backgroundColor: "#0088cc",
                        color: "white"
                      }}
                      size="lg"
                    >
                      TELEGRAM
                    </Button>
                  )}

                  {/* Valores */}
                  {selectedProfile.pricing_packages && selectedProfile.pricing_packages.length > 0 && (
                    <Card>
                      <CardContent style={{ padding: "1rem" }}>
                        <h3 style={{ fontSize: "1rem", fontWeight: "600", marginBottom: "0.75rem" }}>
                          Valores
                        </h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                          {selectedProfile.pricing_packages.map((pkg: any, i: number) => (
                            <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem" }}>
                              <span>{pkg.label}</span>
                              <span style={{ fontWeight: "600" }}>{pkg.price}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Outros Links */}
                  {selectedProfile.external_links && selectedProfile.external_links.length > 0 && (
                    <Card>
                      <CardContent style={{ padding: "1rem" }}>
                        <h3 style={{ fontSize: "1rem", fontWeight: "600", marginBottom: "0.75rem" }}>
                          Outros Links
                        </h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                          {selectedProfile.external_links.map((link: any, i: number) => (
                            <div 
                              key={i} 
                              style={{ 
                                display: "flex", 
                                justifyContent: "space-between", 
                                alignItems: "center",
                                fontSize: "0.875rem",
                                padding: "0.5rem 0",
                                borderBottom: i < selectedProfile.external_links.length - 1 ? "1px solid hsl(var(--border))" : "none"
                              }}
                            >
                              <span style={{ color: "hsl(var(--muted-foreground))" }}>{link.label}</span>
                              <button
                                onClick={() => {
                                  trackContactClick(selectedProfile.id, link.label || "external_link");
                                  window.open(link.url, "_blank");
                                }}
                                style={{
                                  backgroundColor: "transparent",
                                  border: "none",
                                  color: "hsl(var(--primary))",
                                  cursor: "pointer",
                                  fontSize: "0.875rem",
                                  fontWeight: "500",
                                  textDecoration: "underline"
                                }}
                              >
                                Acessar
                              </button>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Denunciar Perfil */}
                  <Button variant="ghost" style={{ color: "hsl(var(--muted-foreground))", fontSize: "0.875rem" }}>
                    ⚠️ Denunciar Perfil
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Advanced Filters Modal */}
      <Dialog open={isAdvancedFiltersOpen} onOpenChange={setIsAdvancedFiltersOpen}>
        <DialogContent>
          <div style={{ padding: "1.5rem", maxHeight: "80vh", overflowY: "auto" }}>
            <h2 style={{ fontSize: "1.5rem", fontWeight: "700", marginBottom: "1.5rem" }}>
              Filtros Avançados
            </h2>

            {/* Idade */}
            <div style={{ marginBottom: "2rem" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: "600", marginBottom: "0.75rem" }}>
                Idade
              </h3>
              <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
                <Button
                  variant={advancedFilters.ageCategory === "novas" ? "default" : "outline"}
                  onClick={() => setAdvancedFilters({ ...advancedFilters, ageCategory: "novas" })}
                  size="sm"
                >
                  Novas
                </Button>
                <Button
                  variant={advancedFilters.ageCategory === "meia-idade" ? "default" : "outline"}
                  onClick={() => setAdvancedFilters({ ...advancedFilters, ageCategory: "meia-idade" })}
                  size="sm"
                >
                  Meia idade
                </Button>
                <Button
                  variant={advancedFilters.ageCategory === "mais-velhas" ? "default" : "outline"}
                  onClick={() => setAdvancedFilters({ ...advancedFilters, ageCategory: "mais-velhas" })}
                  size="sm"
                >
                  Mais velhas
                </Button>
              </div>
              <Slider
                min={18}
                max={57}
                value={advancedFilters.ageRange}
                onValueChange={(value) => setAdvancedFilters({ ...advancedFilters, ageRange: value })}
              />
            </div>

            {/* Preço */}
            <div style={{ marginBottom: "2rem" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: "600", marginBottom: "0.75rem" }}>
                Preço
              </h3>
              <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
                <Button
                  variant={advancedFilters.priceCategory === "economicas" ? "default" : "outline"}
                  onClick={() => setAdvancedFilters({ ...advancedFilters, priceCategory: "economicas" })}
                  size="sm"
                >
                  Econômicas
                </Button>
                <Button
                  variant={advancedFilters.priceCategory === "deluxe" ? "default" : "outline"}
                  onClick={() => setAdvancedFilters({ ...advancedFilters, priceCategory: "deluxe" })}
                  size="sm"
                >
                  Deluxe
                </Button>
              </div>
              <Slider
                min={18}
                max={57}
                value={advancedFilters.priceRange}
                onValueChange={(value) => setAdvancedFilters({ ...advancedFilters, priceRange: value })}
              />
            </div>

            {/* Forma de pagamento */}
            <div style={{ marginBottom: "2rem" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: "600", marginBottom: "0.75rem" }}>
                Forma de pagamento
              </h3>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                {["Pix", "Cartão de Crédito", "Dinheiro", "Cartão de Débito", "Transferência"].map((method) => (
                  <Button
                    key={method}
                    variant={advancedFilters.paymentMethods.includes(method) ? "default" : "outline"}
                    onClick={() => {
                      const methods = advancedFilters.paymentMethods.includes(method)
                        ? advancedFilters.paymentMethods.filter((m) => m !== method)
                        : [...advancedFilters.paymentMethods, method];
                      setAdvancedFilters({ ...advancedFilters, paymentMethods: methods });
                    }}
                    size="sm"
                  >
                    {method}
                  </Button>
                ))}
              </div>
            </div>

            {/* Local de atendimento */}
            <div style={{ marginBottom: "2rem" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: "600", marginBottom: "0.75rem" }}>
                Local de atendimento
              </h3>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                {["Local Próprio", "Local Externo", "Local Externo 02", "Domicílio"].map((location) => (
                  <Button
                    key={location}
                    variant={advancedFilters.locations.includes(location) ? "default" : "outline"}
                    onClick={() => {
                      const locs = advancedFilters.locations.includes(location)
                        ? advancedFilters.locations.filter((l) => l !== location)
                        : [...advancedFilters.locations, location];
                      setAdvancedFilters({ ...advancedFilters, locations: locs });
                    }}
                    size="sm"
                  >
                    {location}
                  </Button>
                ))}
              </div>
            </div>

            {/* Característica 01 */}
            <div style={{ marginBottom: "2rem" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: "600", marginBottom: "0.75rem" }}>
                Característica 01
              </h3>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                {["Lorem ipsum", "Lorem ipsum", "Lorem ipsum"].map((char, i) => (
                  <Badge key={i} variant="outline" style={{ cursor: "pointer" }}>
                    {char}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Característica 02 */}
            <div style={{ marginBottom: "2rem" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: "600", marginBottom: "0.75rem" }}>
                Característica 02
              </h3>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                {["Lorem ipsum", "Lorem ipsum", "Lorem ipsum"].map((char, i) => (
                  <Badge key={i} variant="outline" style={{ cursor: "pointer" }}>
                    {char}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Característica 03 */}
            <div style={{ marginBottom: "2rem" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: "600", marginBottom: "0.75rem" }}>
                Característica 03
              </h3>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                {["Lorem ipsum", "Lorem ipsum", "Lorem ipsum"].map((char, i) => (
                  <Badge key={i} variant="outline" style={{ cursor: "pointer" }}>
                    {char}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Serviços */}
            <div style={{ marginBottom: "2rem" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: "600", marginBottom: "0.75rem" }}>
                Serviços
              </h3>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                {["Lorem ipsum", "Lorem ipsum", "Lorem ipsum"].map((service, i) => (
                  <Badge key={i} variant="outline" style={{ cursor: "pointer" }}>
                    {service}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Buttons */}
            <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
              <Button variant="ghost" onClick={() => setIsAdvancedFiltersOpen(false)}>
                CANCELAR
              </Button>
              <Button
                style={{ backgroundColor: "black", color: "white" }}
                onClick={async () => {
                  setIsAdvancedFiltersOpen(false);
                  // Apply filters via API
                  try {
                    setLoading(true);
                    const params = new URLSearchParams();
                    if (filters.search) params.append("search", filters.search);
                    if (filters.service) params.append("service", filters.service);
                    if (filters.city) params.append("city", filters.city);
                    if (filters.region) params.append("region", filters.region);

                    const res = await fetch(`/api/catalog?${params.toString()}`);
                    if (res.ok) {
                      const data = await res.json();
                      setBoostedProfiles(data.boostedProfiles || []);
                      setRegularProfiles(data.regularProfiles || []);
                    }
                  } catch (error) {
                    console.error("Error applying filters:", error);
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                FILTRAR
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Gallery Modal */}
      {isGalleryOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 60,
            backgroundColor: "rgba(0, 0, 0, 0.95)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
          }}
          onClick={() => setIsGalleryOpen(false)}
        >
          {/* Close Button */}
          <button
            onClick={() => setIsGalleryOpen(false)}
            style={{
              position: "absolute",
              right: "2rem",
              top: "2rem",
              fontSize: "2.5rem",
              cursor: "pointer",
              color: "white",
              zIndex: 70,
              width: "3rem",
              height: "3rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "0.25rem",
              transition: "background-color 0.2s",
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)"}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
          >
            ×
          </button>

          {/* Main Image Container */}
          <div
            style={{
              position: "relative",
              maxWidth: "60rem",
              maxHeight: "70vh",
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Previous Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                prevImage();
              }}
              style={{
                position: "absolute",
                left: "-4rem",
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: "3rem",
                cursor: "pointer",
                color: "white",
                zIndex: 70,
                width: "3rem",
                height: "3rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "0.25rem",
                transition: "background-color 0.2s",
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)"}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
            >
              ‹
            </button>

            {/* Image */}
            <img
              src={galleryImages[currentImageIndex] || ""}
              alt={`Imagem ${currentImageIndex + 1}`}
              style={{
                maxWidth: "100%",
                maxHeight: "70vh",
                objectFit: "contain",
                borderRadius: "var(--radius)",
              }}
            />

            {/* Next Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                nextImage();
              }}
              style={{
                position: "absolute",
                right: "-4rem",
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: "3rem",
                cursor: "pointer",
                color: "white",
                zIndex: 70,
                width: "3rem",
                height: "3rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "0.25rem",
                transition: "background-color 0.2s",
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)"}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
            >
              ›
            </button>
          </div>

          {/* Thumbnails */}
          <div
            style={{
              marginTop: "2rem",
              display: "flex",
              gap: "0.5rem",
              maxWidth: "60rem",
              overflowX: "auto",
              padding: "0.5rem",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {galleryImages.map((img: string, index: number) => (
              <div
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                style={{
                  width: "5rem",
                  height: "5rem",
                  flexShrink: 0,
                  borderRadius: "0.25rem",
                  overflow: "hidden",
                  cursor: "pointer",
                  border: currentImageIndex === index ? "3px solid white" : "3px solid transparent",
                  opacity: currentImageIndex === index ? 1 : 0.6,
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  if (currentImageIndex !== index) {
                    e.currentTarget.style.opacity = "0.8";
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentImageIndex !== index) {
                    e.currentTarget.style.opacity = "0.6";
                  }
                }}
              >
                <img
                  src={img || ""}
                  alt={`Thumbnail ${index + 1}`}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Age Warning Modal */}
      <Dialog open={isAgeWarningOpen} onOpenChange={() => {}}>
        <DialogContent>
          <div 
            style={{ 
              maxWidth: "28rem",
              backgroundColor: "white",
              borderRadius: "1rem",
              padding: "2rem"
            }}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <div style={{ textAlign: "center" }}>
              <h2 style={{ fontSize: "1.5rem", fontWeight: "700", marginBottom: "1rem" }}>
                Atenção! Site com <span style={{ color: "#ef4444" }}>Conteúdo Adulto +18</span>.
              </h2>
              
              <div style={{ 
                textAlign: "left", 
                color: "hsl(var(--muted-foreground))", 
                marginBottom: "1.5rem",
                lineHeight: "1.6"
              }}>
                <p style={{ marginBottom: "1rem" }}>
                  Entendo que este site apresenta conteúdo explícito destinado a adultos.
                </p>
                <p style={{ marginBottom: "1rem" }}>
                  Autorizo o uso de cookies e tecnologias para melhorar a minha experiência no site.
                </p>
                <p>
                  A profissão de acompanhante é legalizada no Brasil e deve ser respeitada.
                </p>
              </div>

              <Button
                onClick={() => {
                  localStorage.setItem('age_warning_seen', 'true');
                  setIsAgeWarningOpen(false);
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
                Concordar e acessar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
