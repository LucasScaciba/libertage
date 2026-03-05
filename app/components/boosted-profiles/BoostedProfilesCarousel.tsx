"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { calculateAge } from "@/lib/utils/age-calculator";
import { formatBRL } from "@/lib/utils/currency-formatter";

interface BoostedProfilesCarouselProps {
  onProfileClick: (profile: any) => void;
}

export function BoostedProfilesCarousel({ onProfileClick }: BoostedProfilesCarouselProps) {
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
  }, []);

  const loadBoostedProfiles = async () => {
    try {
      const res = await fetch("/api/boosts/active");
      if (res.ok) {
        const data = await res.json();
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

  if (loading || profiles.length === 0) {
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
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            ⭐ Perfis em Destaque
          </h2>
          
          {profiles.length > (isMobile ? 1 : 4) && (
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
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {visibleProfiles.map((profile) => {
            const coverPhoto = profile.media?.find((m: any) => m.is_cover && m.type === "photo");
            const displayPhoto = coverPhoto || profile.media?.find((m: any) => m.type === "photo");
            const age = calculateAge(profile.age);

            return (
              <Card
                key={profile.id}
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
                  </div>
                )}
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg mb-1">{profile.display_name}</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    {age} anos • {profile.city}, {profile.region}
                  </p>
                  <p className="text-sm font-medium text-purple-600">
                    {profile.category}
                  </p>
                  {profile.hourly_rate && (
                    <p className="text-lg font-bold text-gray-900 mt-2">
                      {formatBRL(profile.hourly_rate)}/h
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
