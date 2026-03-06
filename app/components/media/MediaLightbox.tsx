"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { MediaDisplay } from "./MediaDisplay";

interface MediaItem {
  id: string;
  type: "image" | "video" | "photo";
  status?: "queued" | "processing" | "ready" | "failed";
  variants?: {
    original?: { url: string };
    thumb_240?: { url: string };
  };
  public_url?: string;
}

// Helper to normalize media type for MediaDisplay
const normalizeMediaType = (type: "image" | "video" | "photo"): "image" | "video" => {
  return type === "photo" ? "image" : type;
}

interface MediaLightboxProps {
  media: MediaItem[];
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onMediaView?: (mediaId: string, profileId?: string) => void;
  profileId?: string;
}

export function MediaLightbox({
  media,
  initialIndex,
  isOpen,
  onClose,
  onMediaView,
  profileId,
}: MediaLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  // Update current index when initialIndex changes
  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  // Track media view when index changes
  useEffect(() => {
    if (isOpen && media[currentIndex] && onMediaView) {
      onMediaView(media[currentIndex].id, profileId);
    }
  }, [currentIndex, isOpen]);

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % media.length);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + media.length) % media.length);
  };

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prevImage();
      if (e.key === "ArrowRight") nextImage();
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, currentIndex]);

  if (!isOpen || media.length === 0) return null;

  const currentMedia = media[currentIndex];

  return (
    <div
      className="fixed inset-0 z-50 bg-black bg-opacity-95 flex flex-col items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute right-4 top-4 sm:right-8 sm:top-8 z-50 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
        aria-label="Fechar"
      >
        <X className="w-6 h-6 text-white" />
      </button>

      {/* Main Media Container */}
      <div
        className="relative w-full max-w-6xl max-h-[80vh] flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Previous Button */}
        {media.length > 1 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              prevImage();
            }}
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 text-white text-4xl sm:text-5xl w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded hover:bg-white hover:bg-opacity-10 transition-colors z-10"
            aria-label="Anterior"
          >
            ‹
          </button>
        )}

        {/* Media Display */}
        <div className="w-full h-full flex items-center justify-center">
          {currentMedia ? (
            <MediaDisplay
              mediaId={currentMedia.id}
              context="modal"
              className="max-w-full max-h-[80vh] w-full h-full object-contain rounded"
              mediaData={{
                ...currentMedia,
                type: normalizeMediaType(currentMedia.type),
                status: currentMedia.status || "ready",
              }}
              autoPlay={currentMedia.type === "video"}
              controls={false}
            />
          ) : (
            <div className="flex items-center justify-center bg-gray-900 text-white p-8 rounded">
              <p>Mídia não disponível</p>
            </div>
          )}
        </div>

        {/* Next Button */}
        {media.length > 1 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              nextImage();
            }}
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 text-white text-4xl sm:text-5xl w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded hover:bg-white hover:bg-opacity-10 transition-colors z-10"
            aria-label="Próxima"
          >
            ›
          </button>
        )}
      </div>

      {/* Counter */}
      {media.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm bg-black/50 px-4 py-2 rounded-full">
          {currentIndex + 1} / {media.length}
        </div>
      )}
    </div>
  );
}
