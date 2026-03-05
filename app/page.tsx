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
import { calculateAge } from "@/lib/utils/age-calculator";
import { formatBRL } from "@/lib/utils/currency-formatter";
import { Calendar, Weight, Ruler, Footprints } from "lucide-react";
import { 
  IconBrandWhatsapp, 
  IconBrandTelegram,
  IconBrandInstagram,
  IconBrandTiktok,
  IconBrandYoutube,
  IconBrandFacebook,
  IconBrandOnlyfans,
  IconBrandPatreon,
  IconDiamond,
  IconHeart,
  IconMovie,
  IconLink
} from "@tabler/icons-react";
import { StoriesCarousel } from "@/app/components/stories/StoriesCarousel";
import { BoostedProfilesCarousel } from "@/app/components/boosted-profiles/BoostedProfilesCarousel";
import { trackMediaView } from "@/lib/utils/analytics-tracking";

export default function Home() {
  const [boostedProfiles, setBoostedProfiles] = useState<any[]>([]);
  const [boostedProfileIds, setBoostedProfileIds] = useState<string[]>([]);
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
    gender: "Mulher",
    service: "",
    city: "",
    region: "",
  });
  const [appliedFilters, setAppliedFilters] = useState({
    search: "",
    gender: "Mulher",
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

  // Map social network titles to Tabler icons
  const getSocialIcon = (title: string) => {
    const iconMap: Record<string, any> = {
      'Instagram': IconBrandInstagram,
      'Tiktok': IconBrandTiktok,
      'Youtube': IconBrandYoutube,
      'Facebook': IconBrandFacebook,
      'Onlyfans': IconBrandOnlyfans,
      'Patreon': IconBrandPatreon,
      'Privacy': IconDiamond,
      'Fansly': IconHeart,
      'Canal Adulto': IconMovie,
    };
    
    return iconMap[title] || IconLink;
  };

  // Gallery images from profile media
  const galleryImages = selectedProfile?.media?.map((m: any) => m.public_url) || [];

  const openGallery = (index: number) => {
    setCurrentImageIndex(index);
    setIsGalleryOpen(true);
    
    // Track media view
    const media = selectedProfile?.media?.[index];
    if (media?.id && selectedProfile?.id) {
      trackMediaView(media.id, selectedProfile.id);
    }
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
    loadBoostedProfileIds();
    
    // Check if age warning has been shown
    const hasSeenWarning = localStorage.getItem('age_warning_seen');
    if (!hasSeenWarning) {
      setIsAgeWarningOpen(true);
    }
  }, []);

  const loadBoostedProfileIds = async () => {
    try {
      const res = await fetch("/api/boosts/active");
      if (res.ok) {
        const data = await res.json();
        const ids = data.profiles?.map((p: any) => p.id) || [];
        setBoostedProfileIds(ids);
      }
    } catch (error) {
      console.error("Error loading boosted profile IDs:", error);
    }
  };

  // Auto-apply filters when they change - REMOVED
  // Filters are now only applied when clicking the "Buscar" button

  const loadProfiles = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      // Load with default gender filter
      if (filters.gender) params.append("gender", filters.gender);
      
      const res = await fetch(`/api/catalog?${params.toString()}`);
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
      if (filters.gender) params.append("gender", filters.gender);
      if (filters.service) params.append("service", filters.service);
      if (filters.city) params.append("city", filters.city);
      if (filters.region) params.append("region", filters.region);

      const res = await fetch(`/api/catalog?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setBoostedProfiles(data.boostedProfiles || []);
        setRegularProfiles(data.regularProfiles || []);
        setAvailableFilters(data.filters || { categories: [], cities: [], regions: [] });
        
        // Update applied filters to trigger stories reload
        setAppliedFilters({
          search: filters.search,
          gender: filters.gender,
          service: filters.service,
          city: filters.city,
          region: filters.region,
        });
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
    
    // Count photos and videos
    const photoCount = profile.media?.filter((m: any) => m.type === "photo").length || 0;
    const videoCount = profile.media?.filter((m: any) => m.type === "video").length || 0;
    
    return (
      <Card 
        className="cursor-pointer hover:shadow-xl transition-all duration-300 h-full"
        onClick={() => {
          setSelectedProfile(profile);
          setIsModalOpen(true);
        }}
      >
        {displayPhoto?.public_url && (
          <div className="relative w-full aspect-[3/4] overflow-hidden rounded-t-lg">
            <img
              src={displayPhoto.public_url}
              alt={profile.display_name}
              className="w-full h-full object-cover"
            />
            {/* Media Counter Overlay */}
            <div className="absolute bottom-2 left-2 flex gap-2">
              {photoCount > 0 && (
                <div className="bg-black bg-opacity-70 text-white px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                    <circle cx="12" cy="13" r="4"></circle>
                  </svg>
                  {photoCount}
                </div>
              )}
              {videoCount > 0 && (
                <div className="bg-black bg-opacity-70 text-white px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="23 7 16 12 23 17 23 7"></polygon>
                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
                  </svg>
                  {videoCount}
                </div>
              )}
            </div>
          </div>
        )}
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold text-lg">{profile.display_name}</h3>
            {/* Verification Badge */}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#10b981" stroke="white" strokeWidth="2">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          {profile.short_description && (
            <p className="text-sm text-gray-500 mb-2 line-clamp-2">
              {profile.short_description}
            </p>
          )}
          <p className="text-sm text-gray-600">
            {profile.age_attribute ? `${profile.age_attribute} anos • ` : ''}{profile.city}, {profile.region}
          </p>
        </CardContent>
      </Card>
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
              <Button style={{ backgroundColor: "#f92e54", color: "white" }}>Acessar/Anunciar</Button>
            </Link>
          </div>
        </div>

        {/* Search Bar */}
        <div className="container-custom" style={{ padding: "0 1rem 1rem" }}>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
            {/* Filtro de Gênero */}
            <select
              value={filters.gender}
              onChange={(e) => setFilters({ ...filters, gender: e.target.value })}
              style={{ minWidth: "150px" }}
            >
              <option value="">Ver tudo</option>
              <option value="Mulher">Mulheres</option>
              <option value="Homem">Homens</option>
              <option value="Trans">Trans</option>
              <option value="Casal">Casais</option>
            </select>

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
              placeholder="Busque por uma palavra específica"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              style={{ flex: 1, minWidth: "200px" }}
            />

            {/* Buscar Button */}
            <Button onClick={handleSearch} style={{ backgroundColor: "black", color: "white" }}>
              Buscar
            </Button>

            {/* Filtros Avançados Button */}
            {/* <Button
              variant="outline"
              onClick={() => setIsAdvancedFiltersOpen(true)}
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <span style={{ fontSize: "1.2rem" }}>⚙</span>
              FILTROS AVANÇADOS
            </Button> */}
          </div>
        </div>
      </header>

      {/* Boosted Profiles Carousel - Full Width */}
      <BoostedProfilesCarousel 
        filters={appliedFilters}
        onProfileClick={(profile) => {
          setSelectedProfile(profile);
          setIsModalOpen(true);
        }}
      />

      {/* Catalog Content */}
      <div className="container-custom" style={{ padding: "2rem 1rem" }}>
        {/* Stories Carousel */}
        <div style={{ marginBottom: "2rem" }}>
          <StoriesCarousel filters={appliedFilters} />
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "3rem 0" }}>
            <p style={{ color: "hsl(var(--muted-foreground))" }}>Carregando...</p>
          </div>
        ) : (
          <>
            {/* Regular Profiles Section */}
            <div>
              {regularProfiles.length > 0 ? (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.5rem" }}>
                    {regularProfiles
                      .filter((profile) => !boostedProfileIds.includes(profile.id))
                      .map((profile) => (
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
                  paddingBottom: "10rem",
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
                    
                    {/* Informações Físicas com Ícones */}
                    {(selectedProfile.birthdate || selectedProfile.weight || selectedProfile.height || selectedProfile.shoe_size) && (
                      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1rem" }}>
                        {selectedProfile.birthdate && (
                          <Badge variant="outline" style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                            <Calendar size={14} />
                            {calculateAge(selectedProfile.birthdate)} anos
                          </Badge>
                        )}
                        {selectedProfile.weight && (
                          <Badge variant="outline" style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                            <Weight size={14} />
                            {selectedProfile.weight}kg
                          </Badge>
                        )}
                        {selectedProfile.height && (
                          <Badge variant="outline" style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                            <Ruler size={14} />
                            {selectedProfile.height}cm
                          </Badge>
                        )}
                        {selectedProfile.shoe_size && (
                          <Badge variant="outline" style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                            <Footprints size={14} />
                            {selectedProfile.shoe_size}
                          </Badge>
                        )}
                      </div>
                    )}
                    
                    <p style={{ color: "hsl(var(--muted-foreground))", marginBottom: "1rem" }}>
                      {selectedProfile.short_description}
                    </p>
                    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                      {selectedProfile.service_categories?.map((service: string, i: number) => (
                        <Badge key={i}>{service}</Badge>
                      ))}
                      <Badge variant="secondary">{selectedProfile.city}</Badge>
                      {selectedProfile.region && (
                        <Badge variant="secondary">{selectedProfile.region}</Badge>
                      )}
                    </div>
                  </div>

                  {/* Photo and Video Gallery */}
                  <div style={{ marginBottom: "1.5rem" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.5rem" }}>
                      {/* Photos */}
                      {selectedProfile.media?.filter((m: any) => m.type === "photo").slice(0, 8).map((media: any, i: number) => (
                        <div
                          key={media.id}
                          onClick={() => openGallery(i)}
                          style={{
                            aspectRatio: "3/4",
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
                      
                      {/* Videos */}
                      {selectedProfile.media?.filter((m: any) => m.type === "video").map((media: any, i: number) => (
                        <div 
                          key={media.id}
                          onClick={() => openGallery(selectedProfile.media.filter((m: any) => m.type === "photo").length + i)}
                          style={{ 
                            position: "relative", 
                            borderRadius: "var(--radius)", 
                            overflow: "hidden", 
                            cursor: "pointer", 
                            aspectRatio: "3/4",
                            transition: "opacity 0.2s"
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.opacity = "0.8"}
                          onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
                        >
                          <video
                            src={media.public_url}
                            style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.7)" }}
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
                  </div>

                  {/* Descrição Longa */}
                  <div style={{ marginBottom: "1.5rem" }}>
                    <p style={{ color: "hsl(var(--muted-foreground))", lineHeight: "1.6", whiteSpace: "pre-wrap" }}>
                      {selectedProfile.long_description}
                    </p>
                  </div>

                  {/* Serviços */}
                  {selectedProfile.selected_features && selectedProfile.selected_features.length > 0 && (() => {
                    const serviceKeywords = ['dinheiro', 'pix', 'cartão', 'débito', 'crédito', 'local', 'hotel', 'motel', 'residência', 'homens', 'mulheres', 'casais', 'português', 'inglês', 'espanhol', 'francês'];
                    const services = selectedProfile.selected_features.filter((f: string) => 
                      serviceKeywords.some(keyword => f.toLowerCase().includes(keyword.toLowerCase()))
                    );
                    
                    return services.length > 0 ? (
                      <div style={{ marginBottom: "1.5rem" }}>
                        <h3 style={{ fontSize: "1.125rem", fontWeight: "600", marginBottom: "0.75rem" }}>
                          Serviços
                        </h3>
                        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                          {services.map((feature: string, i: number) => (
                            <Badge key={i} variant="outline">{feature}</Badge>
                          ))}
                        </div>
                      </div>
                    ) : null;
                  })()}

                  {/* Características */}
                  {selectedProfile.selected_features && selectedProfile.selected_features.length > 0 && (() => {
                    const serviceKeywords = ['dinheiro', 'pix', 'cartão', 'débito', 'crédito', 'local', 'hotel', 'motel', 'residência', 'homens', 'mulheres', 'casais', 'português', 'inglês', 'espanhol', 'francês'];
                    const characteristics = selectedProfile.selected_features.filter((f: string) => 
                      !serviceKeywords.some(keyword => f.toLowerCase().includes(keyword.toLowerCase()))
                    );
                    
                    return characteristics.length > 0 ? (
                      <div style={{ marginBottom: "1.5rem" }}>
                        <h3 style={{ fontSize: "1.125rem", fontWeight: "600", marginBottom: "0.75rem" }}>
                          Características
                        </h3>
                        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                          {characteristics.map((feature: string, i: number) => (
                            <Badge key={i} variant="outline">{feature}</Badge>
                          ))}
                        </div>
                      </div>
                    ) : null;
                  })()}
                </div>

                {/* Right Column - Sidebar (will be below on mobile) */}
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {/* Contact Buttons */}
                  {(selectedProfile.whatsapp_enabled || selectedProfile.telegram_enabled) && (
                    <div 
                      className="lg:relative fixed bottom-0 left-0 right-0 z-40 lg:z-auto bg-white p-4 lg:p-0 shadow-lg lg:shadow-none"
                      style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
                    >
                      {selectedProfile.whatsapp_enabled && selectedProfile.whatsapp_number && (
                        <Button
                          onClick={() => {
                            trackContactClick(selectedProfile.id, "whatsapp");
                            const message = `Olá ${selectedProfile.display_name}, encontrei seu perfil no site da Libertage e gostaria de obter mais informações sobre seus serviços`;
                            const encodedMessage = encodeURIComponent(message);
                            window.open(`https://wa.me/55${selectedProfile.whatsapp_number}?text=${encodedMessage}`, "_blank");
                          }}
                          style={{
                            backgroundColor: "#25D366",
                            color: "white",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem"
                          }}
                          size="lg"
                        >
                          <IconBrandWhatsapp size={20} />
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
                            color: "white",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem"
                          }}
                          size="lg"
                        >
                          <IconBrandTelegram size={20} />
                          TELEGRAM
                        </Button>
                      )}
                    </div>
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
                              <span style={{ fontWeight: "600" }}>
                                {typeof pkg.price === 'number' ? formatBRL(pkg.price) : pkg.price}
                              </span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Outros Links */}
                  {selectedProfile.external_links && selectedProfile.external_links.length > 0 && (
                    <div>
                      <h3 style={{ fontSize: "1rem", fontWeight: "600", marginBottom: "0.75rem" }}>
                        Minhas redes
                      </h3>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                        {selectedProfile.external_links.map((link: any) => {
                          const IconComponent = getSocialIcon(link.title);
                          
                          return (
                            <button
                              key={link.id}
                              onClick={() => {
                                trackContactClick(selectedProfile.id, link.title || "external_link");
                                window.open(link.url, "_blank");
                              }}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "1rem",
                                padding: "1rem",
                                backgroundColor: "white",
                                border: "1px solid hsl(var(--border))",
                                borderRadius: "0.5rem",
                                cursor: "pointer",
                                transition: "all 0.2s",
                                width: "100%",
                                textAlign: "left"
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = "hsl(var(--primary))";
                                e.currentTarget.style.backgroundColor = "hsl(var(--accent))";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = "hsl(var(--border))";
                                e.currentTarget.style.backgroundColor = "white";
                              }}
                            >
                              {/* Icon */}
                              <div style={{
                                flexShrink: 0,
                                width: "2.5rem",
                                height: "2.5rem",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                backgroundColor: "hsl(var(--accent))",
                                borderRadius: "50%"
                              }}>
                                <IconComponent size={20} className="text-gray-700" />
                              </div>
                              
                              {/* Title */}
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{
                                  fontSize: "0.9375rem",
                                  fontWeight: "500",
                                  color: "hsl(var(--foreground))",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap"
                                }}>
                                  {link.title}
                                </p>
                              </div>
                              
                              {/* Arrow */}
                              <div style={{ flexShrink: 0 }}>
                                <svg
                                  width="20"
                                  height="20"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  style={{ color: "hsl(var(--muted-foreground))" }}
                                >
                                  <path d="M9 5l7 7-7 7" />
                                </svg>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Horários de Disponibilidade */}
                  {selectedProfile.availability && selectedProfile.availability.length > 0 && (
                    <Card>
                      <CardContent style={{ padding: "1rem" }}>
                        <h3 style={{ fontSize: "1rem", fontWeight: "600", marginBottom: "0.75rem" }}>
                          Horários
                        </h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                          {["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"].map((dayName, dayIndex) => {
                            const daySlots = selectedProfile.availability.filter((slot: any) => slot.weekday === dayIndex && slot.is_available);
                            
                            if (daySlots.length === 0) return null;
                            
                            return (
                              <div key={dayIndex} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem", paddingBottom: "0.5rem", borderBottom: dayIndex < 6 ? "1px solid hsl(var(--border))" : "none" }}>
                                <span style={{ fontWeight: "500", color: "hsl(var(--muted-foreground))" }}>
                                  {dayName.substring(0, 3)}
                                </span>
                                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.25rem" }}>
                                  {daySlots.map((slot: any) => (
                                    <span key={slot.id} style={{ fontWeight: "600" }}>
                                      {slot.start_time} - {slot.end_time}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Denunciar Perfil */}
                  <Button variant="ghost" style={{ color: "hsl(var(--muted-foreground))", fontSize: "0.875rem" }}>
                    Denunciar Perfil
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

            {/* Image or Video */}
            {selectedProfile?.media?.[currentImageIndex]?.type === "video" ? (
              <video
                src={galleryImages[currentImageIndex] || ""}
                controls
                autoPlay
                style={{
                  maxWidth: "100%",
                  maxHeight: "70vh",
                  width: "auto",
                  height: "auto",
                  objectFit: "contain",
                  borderRadius: "var(--radius)",
                }}
              />
            ) : (
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
            )}

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
