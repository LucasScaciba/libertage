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
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [filters, setFilters] = useState({
    search: "",
    category: "",
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

  // Mock gallery images (usando a mesma imagem 6 vezes para demonstração)
  const galleryImages = selectedProfile ? [
    selectedProfile.media?.[0]?.public_url,
    selectedProfile.media?.[0]?.public_url,
    selectedProfile.media?.[0]?.public_url,
    selectedProfile.media?.[0]?.public_url,
    selectedProfile.media?.[0]?.public_url,
    selectedProfile.media?.[0]?.public_url,
  ] : [];

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

  useEffect(() => {
    loadProfiles();
  }, []);

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
      if (filters.category) params.append("category", filters.category);
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

  const ProfileCard = ({ profile, isBoosted = false }: any) => (
    <div onClick={() => {
      setSelectedProfile(profile);
      setIsModalOpen(true);
    }}>
      <Card style={{ cursor: "pointer", transition: "box-shadow 0.2s", height: "100%" }} className="hover:shadow-lg">
        {profile.media?.[0]?.public_url && (
          <div style={{ width: "100%", height: "12rem", overflow: "hidden", borderTopLeftRadius: "var(--radius)", borderTopRightRadius: "var(--radius)" }}>
            <img
              src={profile.media[0].public_url}
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
            <span>•</span>
            <span>{profile.region}</span>
          </div>
          <Badge variant="secondary">{profile.category}</Badge>
        </CardContent>
      </Card>
    </div>
  );

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
              <Button variant="ghost">Minha Conta</Button>
            </Link>
            <Link href="/login">
              <Button variant="outline">Quero Anunciar</Button>
            </Link>
          </div>
        </div>

        {/* Search Bar */}
        <div className="container-custom" style={{ padding: "0 1rem 1rem" }}>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
            {/* Tipo de Profissional */}
            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              style={{ minWidth: "180px" }}
            >
              <option value="">Tipo de Profissional</option>
              {availableFilters.categories.map((cat: string) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            {/* Todas as cidades */}
            <select
              value={filters.city}
              onChange={(e) => setFilters({ ...filters, city: e.target.value })}
              style={{ minWidth: "180px" }}
            >
              <option value="">Todas as cidades</option>
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
                      <Badge>{selectedProfile.category}</Badge>
                      <Badge variant="secondary">{selectedProfile.city}</Badge>
                      <Badge variant="secondary">{selectedProfile.region}</Badge>
                      <Badge variant="secondary">R$ 300/h</Badge>
                    </div>
                  </div>

                  {/* Photo Gallery */}
                  <div style={{ marginBottom: "1.5rem" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.5rem" }}>
                      {[0, 1, 2, 3].map((i) => (
                        <div
                          key={i}
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
                            src={selectedProfile.media?.[0]?.public_url || ""}
                            alt={`Foto ${i + 1}`}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        </div>
                      ))}
                    </div>
                    {/* Video Thumbnail */}
                    <div 
                      onClick={() => openGallery(4)}
                      style={{ marginTop: "0.5rem", position: "relative", borderRadius: "var(--radius)", overflow: "hidden", cursor: "pointer" }}
                    >
                      <img
                        src={selectedProfile.media?.[0]?.public_url || ""}
                        alt="Video"
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
                  </div>

                  {/* Características */}
                  <div style={{ marginBottom: "1.5rem" }}>
                    <h3 style={{ fontSize: "1.125rem", fontWeight: "600", marginBottom: "0.75rem" }}>
                      Características
                    </h3>
                    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                      {["Tag Característica", "Tag Característica", "Tag Característica", "Tag Característica", "Tag Característica", "Tag Característica", "Tag Característica", "Tag Característica", "Tag Característica", "Tag Característica", "Tag Característica", "Tag Característica"].map((tag, i) => (
                        <Badge key={i} variant="outline">{tag}</Badge>
                      ))}
                    </div>
                  </div>

                  {/* Descrição Longa */}
                  <div style={{ marginBottom: "1.5rem" }}>
                    <p style={{ color: "hsl(var(--muted-foreground))", lineHeight: "1.6", marginBottom: "1rem" }}>
                      Descrição longa Maecenas non sem tempus, vulputate sapien ac, semper nulla. Duis sit amet faucibus odio. Mauris venenatis urna urna, sed urna metus. Proin consequat iaculis lorem, a finibus. Etiam vel sapien sed risus sollicitudin eleifend eu ac mollis est sit amet odio rutrum, quis ultrices elit vestibulum.
                    </p>
                    <p style={{ color: "hsl(var(--muted-foreground))", lineHeight: "1.6", marginBottom: "1rem" }}>
                      Aliquam mattis, felis sit amet interdum orci, vel auctor enim nisi a velit. Suspendisse at ligula eleifend, pretium mi et, porta ipsum. Nunc mollis velit sem, id sollicitudin massa malesuada sed.
                    </p>
                    <p style={{ color: "hsl(var(--muted-foreground))", lineHeight: "1.6", marginBottom: "1rem" }}>
                      Phasellus dapibus consequat neque sed accumsan. Aliquam faucibus ornare semper. Donec nec porta odio, at aliquet lacus. Orci varius natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Sed est tellus. Phasellus nec metus finibus, scelerisque tortor eget, auctor felis.
                    </p>
                    <p style={{ color: "hsl(var(--muted-foreground))", lineHeight: "1.6" }}>
                      Donec ac finibus tellus. Pellentesque eros tellus, varius id turpis ac, molestie feugiat mauris. Nunc dui turpis, euismod ut elit eu, bibendum justo. Suspendisse a lectus eget mauris porttitor imperdiet.
                    </p>
                  </div>

                  {/* Serviços */}
                  <div style={{ marginBottom: "1.5rem" }}>
                    <h3 style={{ fontSize: "1.125rem", fontWeight: "600", marginBottom: "0.75rem" }}>
                      Serviços
                    </h3>
                    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                      {["Tag serviço", "Tag serviço", "Tag serviço", "Tag serviço", "Tag serviço", "Tag serviço", "Tag serviço", "Tag serviço", "Tag serviço", "Tag serviço"].map((tag, i) => (
                        <Badge key={i} variant="outline">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Column - Sidebar (will be below on mobile) */}
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {/* Contact Buttons */}
                  <Button style={{ backgroundColor: "#25D366", color: "white" }} size="lg">
                    WHATSAPP
                  </Button>
                  <Button style={{ backgroundColor: "#0088cc", color: "white" }} size="lg">
                    TELEGRAM
                  </Button>

                  {/* Valores */}
                  <Card>
                    <CardContent style={{ padding: "1rem" }}>
                      <h3 style={{ fontSize: "1rem", fontWeight: "600", marginBottom: "0.75rem" }}>
                        Valores
                      </h3>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        {[
                          { label: "1h", value: "R$ 300,00" },
                          { label: "2h", value: "R$ 380,00" },
                          { label: "3h", value: "R$ 500,00" },
                          { label: "Pernoite", value: "R$ 2300,00" },
                          { label: "Serviço Custom", value: "R$ 90,00" },
                        ].map((item, i) => (
                          <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem" }}>
                            <span>{item.label}</span>
                            <span style={{ fontWeight: "600" }}>{item.value}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Horários */}
                  <Card>
                    <CardContent style={{ padding: "1rem" }}>
                      <h3 style={{ fontSize: "1rem", fontWeight: "600", marginBottom: "0.75rem" }}>
                        Horários
                      </h3>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        {["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo", "Feriados"].map((day, i) => (
                          <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem" }}>
                            <span>{day}</span>
                            <span>9h - 18h</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Local */}
                  <Card>
                    <CardContent style={{ padding: "1rem" }}>
                      <h3 style={{ fontSize: "1rem", fontWeight: "600", marginBottom: "0.75rem" }}>
                        Local
                      </h3>
                      <div style={{ width: "100%", height: "12rem", backgroundColor: "hsl(var(--muted))", borderRadius: "var(--radius)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ color: "hsl(var(--muted-foreground))" }}>Mapa</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Dados do Perfil */}
                  <Card>
                    <CardContent style={{ padding: "1rem" }}>
                      <h3 style={{ fontSize: "1rem", fontWeight: "600", marginBottom: "0.75rem" }}>
                        Dados do Perfil
                      </h3>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.875rem" }}>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span>N. de visitas hoje</span>
                          <span style={{ fontWeight: "600" }}>49.859.503</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span>Desde</span>
                          <span style={{ fontWeight: "600" }}>21/01/2023</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span>Verificado em</span>
                          <span style={{ fontWeight: "600" }}>27/01/2024</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Outros Links */}
                  <Card>
                    <CardContent style={{ padding: "1rem" }}>
                      <h3 style={{ fontSize: "1rem", fontWeight: "600", marginBottom: "0.75rem" }}>
                        Outros Links
                      </h3>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        {["Link custom 01", "Link custom 02", "Link custom 03", "Link custom 04"].map((link, i) => (
                          <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem" }}>
                            <span>{link}</span>
                            <a href="#" style={{ color: "hsl(var(--primary))", textDecoration: "none" }}>Acessar</a>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

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
                    if (filters.category) params.append("category", filters.category);
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
            {galleryImages.map((img, index) => (
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
    </div>
  );
}
