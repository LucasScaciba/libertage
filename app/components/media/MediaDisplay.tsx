"use client";

import { useState, useEffect, useRef } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import Hls from "hls.js";

/**
 * MediaDisplay Component
 * 
 * Displays media with appropriate variant selection:
 * - Grid/Catalog: thumb_240 (no watermark)
 * - Modal/Public Profile: lightbox_600_watermarked (with watermark)
 * - Private Content: non-watermarked variants with signed URLs
 * 
 * For videos:
 * - Uses hls.js for HLS streaming
 * - Supports fallback for browsers without HLS support
 */

interface MediaDisplayProps {
  mediaId: string;
  context: "grid" | "modal" | "public" | "private";
  className?: string;
  alt?: string;
  autoPlay?: boolean;
  controls?: boolean;
  onLoad?: () => void;
  onError?: (error: string) => void;
  mediaData?: MediaRecord; // Optional: pass media data directly to skip API fetch
}

interface MediaRecord {
  id: string;
  status: "queued" | "processing" | "ready" | "failed";
  type: "image" | "video";
  variants?: Record<string, any>;
  error_message?: string;
}

export function MediaDisplay({
  mediaId,
  context,
  className = "",
  alt = "",
  autoPlay = false,
  controls = true,
  onLoad,
  onError,
  mediaData,
}: MediaDisplayProps) {
  const [media, setMedia] = useState<MediaRecord | null>(mediaData || null);
  const [isLoading, setIsLoading] = useState(!mediaData);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  /**
   * Fetch media metadata (only if not provided via props)
   */
  useEffect(() => {
    // Skip fetch if media data was provided
    if (mediaData) {
      setMedia(mediaData);
      setIsLoading(false);
      if (onLoad) {
        onLoad();
      }
      return;
    }

    const fetchMedia = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/media/${mediaId}`);

        if (!response.ok) {
          throw new Error("Failed to fetch media");
        }

        const data: MediaRecord = await response.json();
        setMedia(data);

        if (data.status === "failed") {
          throw new Error(data.error_message || "Media processing failed");
        }

        if (onLoad) {
          onLoad();
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to load media";
        setError(errorMessage);

        if (onError) {
          onError(errorMessage);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchMedia();
  }, [mediaId, mediaData, onLoad, onError]);

  /**
   * Setup HLS player for video
   */
  useEffect(() => {
    if (!media || media.type !== "video" || !videoRef.current) {
      return;
    }

    if (media.status !== "ready" || !media.variants) {
      return;
    }

    // Skip HLS setup for grid context (we show thumbnail instead)
    if (context === "grid") {
      return;
    }

    // Get appropriate HLS URL based on context
    const hlsUrl = getVideoUrl(media, context);

    if (!hlsUrl) {
      setError("Video URL not available");
      return;
    }

    // Check if HLS is supported
    if (Hls.isSupported()) {
      // Use hls.js
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
      });

      hls.loadSource(hlsUrl);
      hls.attachMedia(videoRef.current);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (autoPlay && videoRef.current) {
          videoRef.current.play().catch((err) => {
            console.warn("Autoplay failed:", err);
          });
        }
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          console.error("HLS fatal error:", data);
          setError("Failed to load video");
        }
      });

      hlsRef.current = hls;

      return () => {
        hls.destroy();
        hlsRef.current = null;
      };
    } else if (
      videoRef.current.canPlayType("application/vnd.apple.mpegurl")
    ) {
      // Native HLS support (Safari)
      videoRef.current.src = hlsUrl;

      if (autoPlay) {
        videoRef.current.play().catch((err) => {
          console.warn("Autoplay failed:", err);
        });
      }
    } else {
      setError("HLS not supported in this browser");
    }
  }, [media, context, autoPlay]);

  /**
   * Get image URL based on context (now returns signed URL from API)
   */
  const getImageUrl = (media: MediaRecord, context: string): string | null => {
    if (!media.variants) return null;

    switch (context) {
      case "grid":
        return media.variants.thumb_240?.url || null;
      case "modal":
      case "public":
        return media.variants.lightbox_600_watermarked?.url || null;
      case "private":
        return media.variants.lightbox_600?.url || null;
      default:
        return media.variants.thumb_240?.url || null;
    }
  };

  /**
   * Get video URL based on context
   */
  const getVideoUrl = (media: MediaRecord, context: string): string | null => {
    if (!media.variants) return null;

    switch (context) {
      case "public":
      case "modal":
        return media.variants.hls_master_watermarked?.url || null;
      case "private":
        return media.variants.hls_master?.url || null;
      case "grid":
        // For grid, we show thumbnail with play button, not video
        return null;
      default:
        return media.variants.hls_master_watermarked?.url || null;
    }
  };

  /**
   * Render loading state
   */
  if (isLoading) {
    return (
      <div
        className={`flex items-center justify-center bg-muted ${className}`}
      >
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  /**
   * Render error state
   */
  if (error || !media) {
    return (
      <div
        className={`flex flex-col items-center justify-center gap-2 bg-muted p-4 ${className}`}
      >
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="text-sm text-muted-foreground">
          {error || "Failed to load media"}
        </p>
      </div>
    );
  }

  /**
   * Render processing state
   */
  if (media.status === "processing" || media.status === "queued") {
    return (
      <div
        className={`flex flex-col items-center justify-center gap-2 bg-muted p-4 ${className}`}
      >
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">
          {media.status === "queued" ? "Na fila..." : "Processando..."}
        </p>
      </div>
    );
  }

  /**
   * Render failed state
   */
  if (media.status === "failed") {
    return (
      <div
        className={`flex flex-col items-center justify-center gap-2 bg-muted p-4 ${className}`}
      >
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="text-sm text-muted-foreground">
          {media.error_message || "Processing failed"}
        </p>
      </div>
    );
  }

  /**
   * Render image
   */
  if (media.type === "image") {
    const imageUrl = getImageUrl(media, context);

    if (!imageUrl) {
      return (
        <div
          className={`flex items-center justify-center bg-muted ${className}`}
        >
          <p className="text-sm text-muted-foreground">Image not available</p>
        </div>
      );
    }

    return (
      <img
        src={imageUrl}
        alt={alt}
        className={className}
        onLoad={onLoad}
        onError={() => {
          const errorMsg = "Failed to load image";
          setError(errorMsg);
          if (onError) onError(errorMsg);
        }}
      />
    );
  }

  /**
   * Render video
   */
  if (media.type === "video") {
    // For grid context, show thumbnail image (HLS doesn't work well in small thumbnails)
    if (context === "grid") {
      const thumbnailUrl = media.variants?.thumb_240?.url;

      if (!thumbnailUrl) {
        return (
          <div
            className={`flex items-center justify-center bg-muted ${className}`}
          >
            <p className="text-sm text-muted-foreground">
              Thumbnail not available
            </p>
          </div>
        );
      }

      return (
        <div className="relative w-full h-full group">
          <img
            src={thumbnailUrl}
            alt={alt}
            className={className}
            onLoad={onLoad}
            onError={() => {
              const errorMsg = "Failed to load thumbnail";
              setError(errorMsg);
              if (onError) onError(errorMsg);
            }}
          />
          {/* Play button overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
            <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-gray-900 ml-1"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        </div>
      );
    }

    // For other contexts (modal, public profile), show video player with HLS
    return (
      <video
        ref={videoRef}
        className={className}
        controls={controls}
        autoPlay={autoPlay}
        playsInline
        onError={() => {
          const errorMsg = "Failed to load video";
          setError(errorMsg);
          if (onError) onError(errorMsg);
        }}
      >
        Your browser does not support the video tag.
      </video>
    );
  }

  return null;
}
