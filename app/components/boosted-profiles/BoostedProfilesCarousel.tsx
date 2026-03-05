"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatBRL } from "@/lib/utils/currency-formatter";

interface BoostedProfilesCarouselProps {
  onProfileClick: (profile: any) => void;
  filters?: {
    gender?: string;
    service?: string;
    city?: string;
    search?: string;
  };
}

export function BoostedProfilesCarousel({ onProfileClick, filters }: BoostedProfilesCarouselProps) {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener("resize", checkMobile);
    
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    loadBoostedProfiles();
  }, [filters?.gender, filters?.service, filters?.city, filters?.search]);

  const loadBoostedProfiles = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters?.gender) params.append('gender', filters.gender);
      if (filters?.service) params.append('service', filters.service);
      if (filters?.city) params.append('city', filters.city);
      if (filters?.search) params.append('search', filters.search);

      const res = await fetch(`/api/boosts/active?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        console.log("Boosted profiles loaded:", data.profiles);
        setProfiles(data.profiles || []);
      }
    } catch (error) {
      console.error("Error loading boosted profiles:", error);
    } finally {
      setLoading(false);
    }
  };

  const nextSlide = () => {
    if (isMobile) {
      setCurrentIndex((prev) => (prev + 1) % profiles.length);
    } else {
      setCurrentIndex((prev) => Math.min(prev + 1, profiles.length - 4));
    }
  };

  const prevSlide = () => {
    if (isMobile) {
      setCurrentIndex((prev) => (prev - 1 + profiles.length) % profiles.length);
    } else {
      setCurrentIndex((prev) => Math.max(prev - 1, 0));
    }
  };

  if (loading) {
    return (
      <div className="w-full bg-gradient-to-r from-purple-50 to-pink-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-600">Carregando perfis em destaque...</p>
        </div>
      </div>
    );
  }

  if (profiles.length === 0) {
    return null;
  }

  const visibleProfiles = isMobile 
    ? [profiles[currentIndex]]
    : profiles.slice(currentIndex, currentIndex + 4);

  const canGoPrev = isMobile ? true : currentIndex > 0;
  const canGoNext = isMobile ? true : currentIndex < profiles.length - 4;

  return (
    <div className="w-full bg-gradient-to-r from-purple-50 to-pink-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {profiles.length > (isMobile ? 1 : 4) && (
          <div className="flex items-center justify-end mb-6">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={prevSlide}
                disabled={!canGoPrev}
                className="h-8 w-8"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={nextSlide}
                disabled={!canGoNext}
                className="h-8 w-8"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {visibleProfiles.map((profile) => {
            const coverPhoto = profile.media?.find((m: any) => m.is_cover && m.type === "photo");
            const displayPhoto = coverPhoto || profile.media?.find((m: any) => m.type === "photo");
            
            // Count photos and videos
            const photoCount = profile.media?.filter((m: any) => m.type === "photo").length || 0;
            const videoCount = profile.media?.filter((m: any) => m.type === "video").length || 0;

            return (
              <Card
                key={profile.boost_id || profile.id}
                className="cursor-pointer hover:shadow-xl transition-all duration-300 border-2 border-purple-200"
                onClick={() => onProfileClick(profile)}
              >
                {displayPhoto?.public_url && (
                  <div className="relative w-full aspect-[3/4] overflow-hidden rounded-t-lg">
                    <img
                      src={displayPhoto.public_url}
                      alt={profile.display_name}
                      className="w-full h-full object-cover"
                    />
                    {/* Boost Badge */}
                    <div className="absolute top-2 right-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                      ⭐ DESTAQUE
                    </div>
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
          })}
        </div>
      </div>
    </div>
  );
}
