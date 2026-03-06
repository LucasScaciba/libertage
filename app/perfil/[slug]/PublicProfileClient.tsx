"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Weight, Ruler, Footprints, X } from "lucide-react";
import { IconBrandWhatsapp, IconBrandTelegram } from "@tabler/icons-react";
import Link from "next/link";
import { StoryIndicator } from "@/app/components/stories/StoryIndicator";
import { StoryViewer } from "@/app/components/stories/StoryViewer";
import { VerificationBadge } from "@/app/components/verification/VerificationBadge";
import { ExternalLinksDisplay } from "@/app/components/external-links/ExternalLinksDisplay";
import { MediaDisplay } from "@/app/components/media/MediaDisplay";
import { MediaLightbox } from "@/app/components/media/MediaLightbox";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { calculateAge } from "@/lib/utils/age-calculator";
import { formatBRL } from "@/lib/utils/currency-formatter";
import { trackMediaView } from "@/lib/utils/analytics-tracking";
import { LocationService } from "@/lib/services/location.service";
import { ApproximateLocationMap } from "@/app/components/location/ApproximateLocationMap";
import type { LocationData } from "@/types";

interface ProfileData {
  profile: any;
  media: any[];
  availability: any[];
  features: any[];
  pricing_packages: any[];
  external_links: any[];
}

interface PublicProfileClientProps {
  slug: string;
}

export default function PublicProfileClient({ slug }: PublicProfileClientProps) {
  const router = useRouter();
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [stories, setStories] = useState<any[]>([]);
  const [storyViewerOpen, setStoryViewerOpen] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [slug]);

  // Track visit when profile loads
  useEffect(() => {
    if (data?.profile?.id) {
      trackVisit();
      fetchStories(data.profile.user_id);
    }
  }, [data?.profile?.id]);

  const trackVisit = async () => {
    try {
      const deviceType = typeof window !== "undefined" 
        ? (window.innerWidth < 768 ? "mobile" : window.innerWidth < 1024 ? "tablet" : "desktop")
        : "desktop";

      await fetch("/api/analytics/visit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile_id: data?.profile?.id,
          device_type: deviceType,
        }),
      });
    } catch (err) {
      console.error("Error tracking visit:", err);
    }
  };

  const fetchProfile = async () => {
    try {
      const res = await fetch(`/api/profiles/by-slug/${slug}`);
      
      if (!res.ok) {
        if (res.status === 404) {
          setError("Perfil não encontrado");
        } else {
          setError("Erro ao carregar perfil");
        }
        return;
      }

      const profileData = await res.json();
      setData(profileData);
    } catch (err) {
      console.error("Error fetching profile:", err);
      setError("Erro ao carregar perfil");
    } finally {
      setLoading(false);
    }
  };

  const fetchStories = async (userId: string) => {
    try {
      const res = await fetch(`/api/stories/user/${userId}`);
      const data = await res.json();
      if (data.success) {
        setStories(data.stories || []);
      }
    } catch (err) {
      console.error("Error fetching stories:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Carregando...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-900 text-xl mb-4">{error}</p>
          <Link href="/">
            <Button>Voltar ao Catálogo</Button>
          </Link>
        </div>
      </div>
    );
  }

  const { profile, media, availability, features, pricing_packages, external_links } = data;

  // Media is already processed with variants - no need for additional processing
  // Get cover image or first media
  const coverMedia = media.find((m: any) => m.is_cover) || media[0];
  
  // Sort media: videos first, then photos
  const displayMedia = (() => {
    if (media.length === 0) return [];
    const videos = media.filter((m: any) => m.type === "video");
    const photos = media.filter((m: any) => m.type === "photo" || m.type === "image");
    return [...videos, ...photos];
  })();

  // Group features by group_name
  const groupedFeatures = features.reduce((acc: any, feature: any) => {
    if (!acc[feature.group_name]) {
      acc[feature.group_name] = [];
    }
    acc[feature.group_name].push(feature);
    return acc;
  }, {});

  // Group availability by weekday
  const weekdayNames = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
  const availabilityByDay = availability.reduce((acc: any, slot: any) => {
    if (!acc[slot.weekday]) {
      acc[slot.weekday] = [];
    }
    acc[slot.weekday].push(slot);
    return acc;
  }, {});

  const handleContactClick = async (method: string) => {
    try {
      await fetch("/api/analytics/contact-click", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile_id: profile.id,
          contact_method: method,
        }),
      });
    } catch (err) {
      console.error("Error tracking contact click:", err);
    }
  };

  const openGallery = (index: number) => {
    setSelectedMediaIndex(index);
    setIsGalleryOpen(true);
    
    // Track media view
    const media = displayMedia[index];
    if (media?.id && profile?.id) {
      trackMediaView(media.id, profile.id);
    }
  };

  const nextImage = () => {
    setSelectedMediaIndex((prev) => (prev + 1) % displayMedia.length);
  };

  const prevImage = () => {
    setSelectedMediaIndex((prev) => (prev - 1 + displayMedia.length) % displayMedia.length);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="text-blue-600 hover:text-blue-800">
            ← Voltar ao Catálogo
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 pb-32 lg:pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Header */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                {profile.display_name}
              </h2>
              
              {/* Informações Físicas com Ícones */}
              {(profile.birthdate || profile.weight || profile.height || profile.shoe_size) && (
                <div className="flex gap-2 flex-wrap mb-4">
                  {profile.birthdate && (
                    <Badge variant="outline" className="flex items-center gap-1.5">
                      <Calendar size={14} />
                      {calculateAge(profile.birthdate)} anos
                    </Badge>
                  )}
                  {profile.weight && (
                    <Badge variant="outline" className="flex items-center gap-1.5">
                      <Weight size={14} />
                      {profile.weight}kg
                    </Badge>
                  )}
                  {profile.height && (
                    <Badge variant="outline" className="flex items-center gap-1.5">
                      <Ruler size={14} />
                      {profile.height}cm
                    </Badge>
                  )}
                  {profile.shoe_size && (
                    <Badge variant="outline" className="flex items-center gap-1.5">
                      <Footprints size={14} />
                      {profile.shoe_size}
                    </Badge>
                  )}
                </div>
              )}
              
              <p className="text-gray-600 mb-4">{profile.short_description}</p>
              
              <div className="flex gap-2 flex-wrap mb-4">
                {profile.service_categories?.map((service: string, i: number) => (
                  <Badge key={i}>{service}</Badge>
                ))}
                {/* Show address location if available, otherwise show base location */}
                <Badge variant="secondary">
                  {profile.address_city || profile.city}
                </Badge>
                {(profile.address_state || profile.region) && (
                  <Badge variant="secondary">
                    {profile.address_state || profile.region}
                  </Badge>
                )}
              </div>
            </div>

            {/* Photo Gallery */}
            {displayMedia.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                  {displayMedia.map((mediaItem, index) => {
                    const isVideo = mediaItem.type === "video";
                    
                    return (
                      <div
                        key={mediaItem.id}
                        onClick={() => openGallery(index)}
                        className="rounded overflow-hidden cursor-pointer hover:opacity-80 transition-opacity relative"
                        style={{ aspectRatio: "3/4" }}
                      >
                        <MediaDisplay
                          mediaId={mediaItem.id}
                          context="grid"
                          className="w-full h-full object-cover"
                          mediaData={mediaItem}
                        />
                        {isVideo && (
                          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                            <div className="w-12 h-12 rounded-full bg-white bg-opacity-90 flex items-center justify-center">
                              ▶
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Descrição Longa */}
            {profile.long_description && (
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                  {profile.long_description}
                </p>
              </div>
            )}

            {/* Serviços */}
            {profile.selected_features && profile.selected_features.length > 0 && (() => {
              const serviceKeywords = ['dinheiro', 'pix', 'cartão', 'débito', 'crédito', 'local', 'hotel', 'motel', 'residência', 'homens', 'mulheres', 'casais', 'português', 'inglês', 'espanhol', 'francês'];
              const services = profile.selected_features.filter((f: string) => 
                serviceKeywords.some(keyword => f.toLowerCase().includes(keyword.toLowerCase()))
              );
              
              return services.length > 0 ? (
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-base font-semibold text-gray-900 mb-3">
                    Serviços
                  </h3>
                  <div className="flex gap-2 flex-wrap">
                    {services.map((feature: string, i: number) => (
                      <Badge key={i} variant="outline">{feature}</Badge>
                    ))}
                  </div>
                </div>
              ) : null;
            })()}

            {/* Características */}
            {profile.selected_features && profile.selected_features.length > 0 && (() => {
              const serviceKeywords = ['dinheiro', 'pix', 'cartão', 'débito', 'crédito', 'local', 'hotel', 'motel', 'residência', 'homens', 'mulheres', 'casais', 'português', 'inglês', 'espanhol', 'francês'];
              const characteristics = profile.selected_features.filter((f: string) => 
                !serviceKeywords.some(keyword => f.toLowerCase().includes(keyword.toLowerCase()))
              );
              
              return characteristics.length > 0 ? (
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-base font-semibold text-gray-900 mb-3">
                    Características
                  </h3>
                  <div className="flex gap-2 flex-wrap">
                    {characteristics.map((feature: string, i: number) => (
                      <Badge key={i} variant="outline">{feature}</Badge>
                    ))}
                  </div>
                </div>
              ) : null;
            })()}
          </div>

          {/* Sidebar - Right Column */}
          <div className="lg:col-span-1 space-y-6">
            {/* WhatsApp and Telegram Buttons */}
            {(profile.whatsapp_enabled || profile.telegram_enabled) && (
              <div className="bg-white rounded-lg shadow p-6 lg:sticky lg:top-4 fixed bottom-0 left-0 right-0 lg:relative z-40 lg:z-auto">
                <div className="space-y-3">
                  {profile.whatsapp_enabled && profile.whatsapp_number && (
                    <Button
                      onClick={() => {
                        handleContactClick("whatsapp");
                        const message = `Olá ${profile.display_name}, encontrei seu perfil no site da Libertage e gostaria de obter mais informações sobre seus serviços`;
                        const encodedMessage = encodeURIComponent(message);
                        window.open(`https://wa.me/55${profile.whatsapp_number}?text=${encodedMessage}`, "_blank");
                      }}
                      className="w-full"
                      style={{
                        backgroundColor: "#25D366",
                        color: "white",
                      }}
                      size="lg"
                    >
                      <IconBrandWhatsapp size={20} className="mr-2" />
                      WHATSAPP
                    </Button>
                  )}
                  
                  {profile.telegram_enabled && profile.telegram_username && (
                    <Button
                      onClick={() => {
                        handleContactClick("telegram");
                        window.open(`https://t.me/${profile.telegram_username}`, "_blank");
                      }}
                      className="w-full"
                      style={{
                        backgroundColor: "#0088cc",
                        color: "white",
                      }}
                      size="lg"
                    >
                      <IconBrandTelegram size={20} className="mr-2" />
                      TELEGRAM
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Contact Buttons */}
            {external_links.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6 sticky top-4">
                <h3 className="text-base font-semibold text-gray-900 mb-3">Contato</h3>
                <div className="space-y-3">
                  {external_links.map((link: any, index: number) => (
                    <a
                      key={index}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => handleContactClick(link.type)}
                      className="block"
                    >
                      <Button className="w-full" variant="default">
                        {link.label || link.type}
                      </Button>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Stories Section */}
            {stories.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-base font-semibold text-gray-900 mb-3">Stories</h3>
                <div className="flex justify-center">
                  <StoryIndicator
                    user={{
                      name: profile.display_name,
                      profile_photo_url: coverMedia?.variants?.thumb_240?.url || null,
                      slug: profile.slug
                    }}
                    hasActiveStory={true}
                    onClick={() => setStoryViewerOpen(true)}
                    showName={false}
                  />
                </div>
              </div>
            )}

            {/* External Links */}
            <ExternalLinksDisplay profileId={profile.id} />

            {/* Pricing Packages */}
            {pricing_packages.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-base font-semibold text-gray-900 mb-3">Valores</h3>
                <div className="flex flex-col gap-2">
                  {pricing_packages.map((pkg: any, index: number) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-gray-700">{pkg.label}</span>
                      <span className="font-semibold text-gray-900">
                        {typeof pkg.price === 'number' ? formatBRL(pkg.price) : pkg.price}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Availability Schedule */}
            {availability.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-base font-semibold text-gray-900 mb-3">Disponibilidade</h3>
                <div className="space-y-2">
                  {weekdayNames.map((dayName, dayIndex) => {
                    const slots = availabilityByDay[dayIndex] || [];
                    const availableSlots = slots.filter((s: any) => s.is_available);
                    
                    return (
                      <div key={dayIndex} className="flex items-start justify-between py-2 border-b border-gray-100 last:border-0">
                        <span className="font-medium text-gray-900 text-sm">{dayName}</span>
                        <div className="text-right">
                          {availableSlots.length > 0 ? (
                            <div className="space-y-1">
                              {availableSlots.map((slot: any) => (
                                <span key={slot.id} className="text-sm text-gray-700 block">
                                  {slot.start_time} - {slot.end_time}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">Indisponível</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Location / Address */}
            {(() => {
              const locationData: LocationData = {
                hasNoLocation: profile.has_no_location || false,
                cep: profile.address_cep,
                street: profile.address_street,
                neighborhood: profile.address_neighborhood,
                city: profile.address_city,
                state: profile.address_state,
                number: profile.address_number,
              };
              const formattedAddress = LocationService.formatApproximateLocation(locationData);
              
              return (
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
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
                      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    Localização
                  </h3>
                  <div className="space-y-2">
                    {formattedAddress && locationData.neighborhood && locationData.city && locationData.state ? (
                      <>
                        {/* Map */}
                        <ApproximateLocationMap
                          cep={locationData.cep}
                          street={locationData.street}
                          neighborhood={locationData.neighborhood}
                          city={locationData.city}
                          state={locationData.state}
                          radiusMeters={500}
                        />
                        
                        <p className="text-sm text-gray-700">{formattedAddress}</p>
                        <p className="text-xs text-gray-500 italic">
                          Por segurança, exibimos apenas a região aproximada (raio de 500m)
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-gray-700">
                          <strong>Região:</strong> {profile.city}, {profile.region}
                        </p>
                        <p className="text-sm text-gray-500">
                          Localização aproximada de atendimento
                        </p>
                      </>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Report Button */}
            <div className="bg-white rounded-lg shadow p-6">
              <button
                onClick={() => {
                  alert("Funcionalidade de denúncia será implementada em breve");
                }}
                className="text-sm text-red-600 hover:text-red-800 w-full text-center"
              >
                Denunciar este perfil
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Gallery Lightbox */}
      <MediaLightbox
        media={displayMedia}
        initialIndex={selectedMediaIndex}
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        onMediaView={trackMediaView}
        profileId={profile?.id}
      />

      {/* Story Viewer */}
      {storyViewerOpen && stories.length > 0 && (
        <StoryViewer
          stories={stories.map(story => ({
            ...story,
            user: {
              id: profile.user_id,
              name: profile.display_name,
              slug: profile.slug,
              profile_photo_url: coverMedia?.variants?.thumb_240?.url || null
            }
          }))}
          initialStoryId={stories[0].id}
          onClose={() => setStoryViewerOpen(false)}
        />
      )}
    </div>
  );
}
