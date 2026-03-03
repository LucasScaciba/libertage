"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface ProfileData {
  profile: any;
  media: any[];
  availability: any[];
  features: any[];
  pricing_packages: any[];
  external_links: any[];
}

export default function PublicProfilePage() {
  const params = useParams();
  const slug = params.slug as string;
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);

  useEffect(() => {
    if (data?.profile?.display_name) {
      document.title = `${data.profile.display_name} — Libertage`;
    }
  }, [data?.profile?.display_name]);

  useEffect(() => {
    fetchProfile();
  }, [slug]);

  // Track visit when profile loads
  useEffect(() => {
    if (data?.profile?.id) {
      trackVisit();
    }
  }, [data?.profile?.id]);

  const trackVisit = async () => {
    try {
      // Detect device type
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
          <Link href="/catalog">
            <Button>Voltar ao Catálogo</Button>
          </Link>
        </div>
      </div>
    );
  }

  const { profile, media, availability, features, pricing_packages, external_links } = data;

  // Get cover image or first media
  const coverMedia = media.find((m) => m.is_cover) || media[0];
  const displayMedia = media.length > 0 ? media : [];

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
    // Track analytics
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <Link href="/catalog" className="text-blue-600 hover:text-blue-800">
            ← Voltar ao Catálogo
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Header */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {profile.display_name}
                  </h1>
                  <div className="flex items-center text-gray-600 space-x-2">
                    <span>{profile.city}</span>
                    <span>•</span>
                    <span>{profile.region}</span>
                  </div>
                </div>
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                  {profile.category}
                </span>
              </div>
              
              {profile.age_attribute && (
                <p className="text-gray-600 mb-4">Idade: {profile.age_attribute}</p>
              )}

              <p className="text-gray-700 mb-4">{profile.short_description}</p>
              
              <div className="prose max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap">{profile.long_description}</p>
              </div>
            </div>

            {/* Media Gallery */}
            {displayMedia.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Galeria</h2>
                
                {/* Main Image */}
                <div className="mb-4">
                  <img
                    src={displayMedia[selectedMediaIndex]?.public_url}
                    alt={`Mídia ${selectedMediaIndex + 1}`}
                    className="w-full h-96 object-cover rounded-lg"
                  />
                </div>

                {/* Thumbnails */}
                {displayMedia.length > 1 && (
                  <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                    {displayMedia.map((item, index) => (
                      <button
                        key={item.id}
                        onClick={() => setSelectedMediaIndex(index)}
                        className={`relative aspect-square rounded overflow-hidden ${
                          selectedMediaIndex === index
                            ? "ring-2 ring-blue-500"
                            : "hover:opacity-75"
                        }`}
                      >
                        <img
                          src={item.public_url}
                          alt={`Thumbnail ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {item.is_cover && (
                          <span className="absolute top-1 right-1 bg-yellow-400 text-xs px-1 rounded">
                            Capa
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Features */}
            {Object.keys(groupedFeatures).length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Características</h2>
                {Object.entries(groupedFeatures).map(([groupName, featureList]: [string, any]) => (
                  <div key={groupName} className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">{groupName}</h3>
                    <div className="flex flex-wrap gap-2">
                      {featureList.map((feature: any) => (
                        <span
                          key={feature.id}
                          className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
                        >
                          {feature.feature_name}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pricing Packages */}
            {pricing_packages.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Pacotes e Preços</h2>
                <div className="space-y-4">
                  {pricing_packages.map((pkg: any, index: number) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{pkg.name}</h3>
                        <span className="text-xl font-bold text-blue-600">
                          {pkg.currency} {pkg.price.toFixed(2)}
                        </span>
                      </div>
                      <p className="text-gray-600">{pkg.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Availability Schedule */}
            {availability.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Disponibilidade</h2>
                <div className="space-y-2">
                  {weekdayNames.map((dayName, dayIndex) => {
                    const slots = availabilityByDay[dayIndex] || [];
                    const availableSlots = slots.filter((s: any) => s.is_available);
                    
                    return (
                      <div key={dayIndex} className="flex items-start py-2 border-b border-gray-100">
                        <span className="font-medium text-gray-900 w-24">{dayName}</span>
                        <div className="flex-1">
                          {availableSlots.length > 0 ? (
                            <div className="space-y-1">
                              {availableSlots.map((slot: any) => (
                                <span key={slot.id} className="text-gray-700 block">
                                  {slot.start_time} - {slot.end_time}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-400">Indisponível</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Approximate Location Map */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Localização Aproximada</h2>
              <div className="bg-gray-100 rounded-lg p-4">
                <p className="text-gray-700 mb-2">
                  <strong>Região:</strong> {profile.city}, {profile.region}
                </p>
                <p className="text-sm text-gray-500">
                  A localização exata é mantida privada. Esta é uma área aproximada de atendimento.
                </p>
                {/* Simple map placeholder - in production, integrate with a map library */}
                <div className="mt-4 bg-gray-200 rounded h-64 flex items-center justify-center">
                  <p className="text-gray-500">Mapa da região (área aproximada)</p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Contact Buttons */}
            {external_links.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6 sticky top-4">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Contato</h2>
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

                {/* Report Button */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => {
                      // TODO: Implement report modal
                      alert("Funcionalidade de denúncia será implementada em breve");
                    }}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    Denunciar este perfil
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
