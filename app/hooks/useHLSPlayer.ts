"use client";

import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";

/**
 * useHLSPlayer Hook
 * 
 * Custom hook to manage HLS video playback using hls.js
 * 
 * Features:
 * - Automatic HLS.js initialization
 * - Native HLS support detection (Safari)
 * - Error handling
 * - Cleanup on unmount
 */

interface UseHLSPlayerOptions {
  src: string;
  autoPlay?: boolean;
  onError?: (error: string) => void;
  onReady?: () => void;
}

interface UseHLSPlayerReturn {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isLoading: boolean;
  error: string | null;
  isHLSSupported: boolean;
}

export function useHLSPlayer({
  src,
  autoPlay = false,
  onError,
  onReady,
}: UseHLSPlayerOptions): UseHLSPlayerReturn {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isHLSSupported] = useState(() => {
    // Check if HLS is supported (hls.js or native)
    return (
      Hls.isSupported() ||
      (typeof document !== "undefined" &&
        document.createElement("video").canPlayType("application/vnd.apple.mpegurl") !== "")
    );
  });

  useEffect(() => {
    if (!videoRef.current || !src) {
      return;
    }

    setIsLoading(true);
    setError(null);

    // Check if HLS.js is supported
    if (Hls.isSupported()) {
      // Use hls.js for browsers that don't have native HLS support
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        backBufferLength: 90,
      });

      hls.loadSource(src);
      hls.attachMedia(videoRef.current);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsLoading(false);

        if (onReady) {
          onReady();
        }

        if (autoPlay && videoRef.current) {
          videoRef.current.play().catch((err) => {
            console.warn("Autoplay failed:", err);
          });
        }
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error("HLS error:", data);

        if (data.fatal) {
          const errorMessage = `HLS error: ${data.type} - ${data.details}`;
          setError(errorMessage);
          setIsLoading(false);

          if (onError) {
            onError(errorMessage);
          }

          // Try to recover from errors
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.log("Network error, trying to recover...");
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.log("Media error, trying to recover...");
              hls.recoverMediaError();
              break;
            default:
              console.error("Fatal error, cannot recover");
              hls.destroy();
              break;
          }
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
      videoRef.current.src = src;

      const handleCanPlay = () => {
        setIsLoading(false);

        if (onReady) {
          onReady();
        }

        if (autoPlay && videoRef.current) {
          videoRef.current.play().catch((err) => {
            console.warn("Autoplay failed:", err);
          });
        }
      };

      const handleError = () => {
        const errorMessage = "Failed to load video";
        setError(errorMessage);
        setIsLoading(false);

        if (onError) {
          onError(errorMessage);
        }
      };

      videoRef.current.addEventListener("canplay", handleCanPlay);
      videoRef.current.addEventListener("error", handleError);

      return () => {
        if (videoRef.current) {
          videoRef.current.removeEventListener("canplay", handleCanPlay);
          videoRef.current.removeEventListener("error", handleError);
        }
      };
    } else {
      // HLS not supported
      const errorMessage = "HLS not supported in this browser";
      setError(errorMessage);
      setIsLoading(false);

      if (onError) {
        onError(errorMessage);
      }
    }
  }, [src, autoPlay, onError, onReady]);

  return {
    videoRef,
    isLoading,
    error,
    isHLSSupported,
  };
}
