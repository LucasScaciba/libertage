"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, X, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

/**
 * MediaUpload Component
 * 
 * Handles media file uploads with:
 * - Drag and drop support
 * - File type validation
 * - File size validation
 * - Upload progress
 * - Status polling
 * - Error handling
 */

interface MediaUploadProps {
  onUploadComplete?: (media: MediaRecord) => void;
  onUploadSuccess?: () => void;
  onUploadError?: (error: string) => void;
  acceptedTypes?: string[];
  maxSizeImage?: number; // in MB
  maxSizeVideo?: number; // in MB
  profileId?: string; // Profile ID to link media to
  className?: string;
}

interface MediaRecord {
  id: string;
  status: "queued" | "processing" | "ready" | "failed";
  type: "image" | "video";
  created_at: string;
  variants?: Record<string, any>;
  error_message?: string;
}

const DEFAULT_ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
  "video/mp4",
  "video/quicktime",
  "video/x-msvideo",
  "video/webm",
];

export function MediaUpload({
  onUploadComplete,
  onUploadSuccess,
  onUploadError,
  acceptedTypes = DEFAULT_ACCEPTED_TYPES,
  maxSizeImage = 10,
  maxSizeVideo = 80,
  profileId,
  className = "",
}: MediaUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingStatus, setProcessingStatus] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Convert HEIC/HEIF to JPEG in the browser
   */
  const convertHeicToJpeg = useCallback(async (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const img = new Image();
        
        img.onload = () => {
          // Create canvas
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          
          // Draw image
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }
          
          ctx.drawImage(img, 0, 0);
          
          // Convert to JPEG blob
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to convert image'));
                return;
              }
              
              // Create new File object
              const newFile = new File(
                [blob],
                file.name.replace(/\.heic$/i, '.jpg').replace(/\.heif$/i, '.jpg'),
                { type: 'image/jpeg' }
              );
              
              resolve(newFile);
            },
            'image/jpeg',
            0.92 // Quality
          );
        };
        
        img.onerror = () => {
          reject(new Error('Failed to load image'));
        };
        
        img.src = e.target?.result as string;
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsDataURL(file);
    });
  }, []);

  /**
   * Validate video duration (max 30 seconds)
   */
  const validateVideoDuration = useCallback(async (file: File): Promise<{ valid: boolean; error?: string; duration?: number }> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        const duration = video.duration;
        
        if (duration > 30) {
          resolve({
            valid: false,
            error: `Vídeo muito longo. Duração máxima: 30 segundos (seu vídeo tem ${Math.round(duration)}s)`,
            duration,
          });
        } else {
          resolve({ valid: true, duration });
        }
      };
      
      video.onerror = () => {
        resolve({
          valid: false,
          error: 'Não foi possível ler a duração do vídeo',
        });
      };
      
      video.src = URL.createObjectURL(file);
    });
  }, []);

  /**
   * Validate file type and size
   */
  const validateFile = useCallback(
    (file: File): { valid: boolean; error?: string } => {
      // Check file type
      if (!acceptedTypes.includes(file.type)) {
        return {
          valid: false,
          error: `Tipo de arquivo não suportado. Formatos aceitos: ${acceptedTypes.join(", ")}`,
        };
      }

      // Check file size
      const isImage = file.type.startsWith("image/");
      const isVideo = file.type.startsWith("video/");
      const maxSize = isImage ? maxSizeImage : maxSizeVideo;
      const fileSizeMB = file.size / (1024 * 1024);

      if (fileSizeMB > maxSize) {
        return {
          valid: false,
          error: `Arquivo muito grande. Tamanho máximo: ${maxSize}MB para ${isImage ? "imagens" : "vídeos"}`,
        };
      }

      // Check if file is empty
      if (file.size === 0) {
        return {
          valid: false,
          error: "Arquivo vazio",
        };
      }

      return { valid: true };
    },
    [acceptedTypes, maxSizeImage, maxSizeVideo]
  );

  /**
   * Poll media status until processing is complete
   */
  const pollMediaStatus = useCallback(
    async (mediaId: string): Promise<MediaRecord> => {
      const maxAttempts = 60; // 2 minutes with 2s interval
      let attempts = 0;

      while (attempts < maxAttempts) {
        try {
          const response = await fetch(`/api/media/${mediaId}`);

          if (!response.ok) {
            throw new Error("Failed to fetch media status");
          }

          const media: MediaRecord = await response.json();

          // Update status display
          setProcessingStatus(media.status);

          if (media.status === "ready") {
            return media;
          }

          if (media.status === "failed") {
            throw new Error(media.error_message || "Processing failed");
          }

          // Wait 2 seconds before next poll
          await new Promise((resolve) => setTimeout(resolve, 2000));
          attempts++;
        } catch (error) {
          console.error("Error polling media status:", error);
          throw error;
        }
      }

      throw new Error("Processing timeout");
    },
    []
  );

  /**
   * Upload file directly to Supabase Storage (client-side)
   * This bypasses Next.js body size limits
   */
  const uploadFile = useCallback(
    async (file: File) => {
      setIsUploading(true);
      setUploadProgress(0);
      setProcessingStatus("queued");

      try {
        // Validate video duration if it's a video
        if (file.type.startsWith('video/')) {
          toast.info('Validando duração do vídeo...');
          const durationValidation = await validateVideoDuration(file);
          if (!durationValidation.valid) {
            toast.error(durationValidation.error || 'Vídeo inválido');
            throw new Error(durationValidation.error);
          }
          toast.success(`Vídeo válido (${Math.round(durationValidation.duration || 0)}s)`);
        }

        // Convert HEIC/HEIF to JPEG if needed
        let fileToUpload = file;
        if (file.type === 'image/heic' || file.type === 'image/heif') {
          toast.info('Convertendo HEIC para JPEG...');
          try {
            fileToUpload = await convertHeicToJpeg(file);
            toast.success('Conversão concluída!');
          } catch (conversionError) {
            console.error('HEIC conversion failed:', conversionError);
            toast.error('Falha ao converter HEIC. Tente converter manualmente para JPEG.');
            throw conversionError;
          }
        }

        setUploadProgress(20);

        // Call API to initiate upload (creates database record and returns upload URL)
        const initiateResponse = await fetch("/api/media/upload/initiate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            filename: fileToUpload.name,
            content_type: fileToUpload.type,
            file_size: fileToUpload.size,
            profile_id: profileId,
          }),
        });

        if (!initiateResponse.ok) {
          const error = await initiateResponse.json();
          throw new Error(error.error || "Failed to initiate upload");
        }

        const { media_id, upload_path } = await initiateResponse.json();
        setUploadProgress(30);

        // Upload file directly to Supabase Storage using the Supabase client
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        
        console.log(`[MediaUpload] Uploading to storage: ${upload_path}`);
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("media")
          .upload(upload_path, fileToUpload, {
            contentType: fileToUpload.type,
            upsert: false,
          });

        if (uploadError) {
          console.error("[MediaUpload] Storage upload error:", uploadError);
          throw new Error(`Failed to upload file to storage: ${uploadError.message}`);
        }

        console.log("[MediaUpload] Upload successful:", uploadData);
        setUploadProgress(50);
        toast.success("Upload concluído! Processando mídia...");

        // Notify backend that upload is complete
        const completeResponse = await fetch("/api/media/upload/complete", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            media_id,
          }),
        });

        if (!completeResponse.ok) {
          throw new Error("Failed to complete upload");
        }

        // Poll for processing completion
        const processedMedia = await pollMediaStatus(media_id);
        setUploadProgress(100);

        toast.success("Mídia processada com sucesso!");

        // Call success callbacks
        if (onUploadComplete) {
          onUploadComplete(processedMedia);
        }
        
        if (onUploadSuccess) {
          onUploadSuccess();
        }

        // Reset state
        setSelectedFile(null);
        setProcessingStatus(null);
      } catch (error) {
        console.error("Upload error:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Erro ao fazer upload";
        toast.error(errorMessage);

        if (onUploadError) {
          onUploadError(errorMessage);
        }
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
      }
    },
    [onUploadComplete, onUploadSuccess, onUploadError, pollMediaStatus, profileId, convertHeicToJpeg, validateVideoDuration]
  );

  /**
   * Handle file selection
   */
  const handleFileSelect = useCallback(
    (file: File) => {
      const validation = validateFile(file);

      if (!validation.valid) {
        toast.error(validation.error);
        return;
      }

      setSelectedFile(file);
      uploadFile(file);
    },
    [validateFile, uploadFile]
  );

  /**
   * Handle file input change
   */
  const handleFileInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  /**
   * Handle drag events
   */
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const file = e.dataTransfer.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  /**
   * Open file picker
   */
  const openFilePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  /**
   * Cancel upload
   */
  const cancelUpload = useCallback(() => {
    setSelectedFile(null);
    setIsUploading(false);
    setUploadProgress(0);
    setProcessingStatus(null);
  }, []);

  /**
   * Get status icon
   */
  const getStatusIcon = () => {
    if (processingStatus === "ready") {
      return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    }
    if (processingStatus === "failed") {
      return <AlertCircle className="h-5 w-5 text-red-500" />;
    }
    if (processingStatus === "processing" || processingStatus === "queued") {
      return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
    }
    return null;
  };

  /**
   * Get status text
   */
  const getStatusText = () => {
    switch (processingStatus) {
      case "queued":
        return "Na fila...";
      case "processing":
        return "Processando...";
      case "ready":
        return "Concluído!";
      case "failed":
        return "Falhou";
      default:
        return "";
    }
  };

  return (
    <div className={className}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes.join(",")}
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Upload area */}
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`
          relative rounded-lg border-2 border-dashed p-8 text-center transition-colors
          ${isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25"}
          ${isUploading ? "pointer-events-none opacity-50" : "cursor-pointer hover:border-primary"}
        `}
        onClick={!isUploading ? openFilePicker : undefined}
      >
        {!isUploading ? (
          <>
            <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-sm font-medium">
              Arraste e solte ou clique para selecionar
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Imagens: JPEG, PNG, WebP, HEIC (até {maxSizeImage}MB)
              <br />
              Vídeos: MP4, MOV, AVI, WebM (até {maxSizeVideo}MB)
            </p>
          </>
        ) : (
          <>
            <div className="flex items-center justify-center gap-3">
              {getStatusIcon()}
              <p className="text-sm font-medium">{getStatusText()}</p>
            </div>

            {selectedFile && (
              <p className="mt-2 text-xs text-muted-foreground">
                {selectedFile.name}
              </p>
            )}

            {uploadProgress > 0 && (
              <div className="mt-4">
                <Progress value={uploadProgress} className="h-2" />
                <p className="mt-2 text-xs text-muted-foreground">
                  {uploadProgress}%
                </p>
              </div>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={cancelUpload}
              className="mt-4"
            >
              <X className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
