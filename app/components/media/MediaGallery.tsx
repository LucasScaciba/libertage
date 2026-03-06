"use client";

import { useState, useEffect } from "react";
import { MediaDisplay } from "./MediaDisplay";
import { Loader2, Image as ImageIcon, Star, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface MediaRecord {
  id: string;
  type: "image" | "video";
  status: "queued" | "processing" | "ready" | "failed";
  created_at: string;
  variants?: Record<string, any>;
  error_message?: string;
  is_cover?: boolean;
  profile_id?: string;
}

interface MediaGalleryProps {
  onMediaClick?: (mediaId: string) => void;
  onRefresh?: () => void;
  fixedTypeFilter?: "image" | "video" | "all"; // Fixed type filter (hides type selector)
  profileId?: string; // Profile ID to filter media and enable cover functionality
  showCoverAction?: boolean; // Show "Set as cover" action
  planLimit?: number; // Plan limit for this media type
  galleryTitle?: string; // Title for the gallery (e.g., "Galeria de Fotos")
}

export function MediaGallery({ onMediaClick, onRefresh, fixedTypeFilter, profileId, showCoverAction = false, planLimit, galleryTitle }: MediaGalleryProps) {
  const [media, setMedia] = useState<MediaRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>(fixedTypeFilter || "all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [mediaToDelete, setMediaToDelete] = useState<string | null>(null);
  const [videoDialogOpen, setVideoDialogOpen] = useState(false);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);

  // Update typeFilter when fixedTypeFilter changes
  useEffect(() => {
    if (fixedTypeFilter) {
      setTypeFilter(fixedTypeFilter);
    }
  }, [fixedTypeFilter]);

  /**
   * Fetch media list
   */
  const fetchMedia = async () => {
    try {
      setIsLoading(true);

      const params = new URLSearchParams({
        type: typeFilter,
        status: "ready", // Only fetch ready media
        limit: "50",
      });
      
      // Add profile_id filter if provided
      if (profileId) {
        params.append("profile_id", profileId);
      }

      const response = await fetch(`/api/media/list?${params}`);

      if (!response.ok) {
        throw new Error("Failed to fetch media");
      }

      const data = await response.json();
      setMedia(data.media || []);
    } catch (error) {
      console.error("Failed to fetch media:", error);
      toast.error("Erro ao carregar mídias");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Set media as cover
   */
  const handleSetCover = async (mediaId: string) => {
    try {
      const response = await fetch(`/api/media/${mediaId}/set-cover`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to set cover");
      }

      toast.success("Foto/vídeo de capa atualizado!");
      fetchMedia();
      
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error("Failed to set cover:", error);
      toast.error("Erro ao definir como capa");
    }
  };

  /**
   * Delete media
   */
  const handleDelete = async (mediaId: string) => {
    try {
      const response = await fetch(`/api/media/${mediaId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete media");
      }

      toast.success("Mídia excluída com sucesso");
      fetchMedia();
      
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error("Failed to delete media:", error);
      toast.error("Erro ao excluir mídia");
    }
  };

  /**
   * Confirm delete
   */
  const confirmDelete = (mediaId: string) => {
    setMediaToDelete(mediaId);
    setDeleteDialogOpen(true);
  };

  /**
   * Initial load and filter changes
   */
  useEffect(() => {
    fetchMedia();
  }, [typeFilter]);

  // Calculate ready media count
  const readyCount = media.filter(item => item.status === "ready").length;

  return (
    <div className="space-y-6">
      {/* Title with count */}
      {galleryTitle && planLimit !== undefined && (
        <h2 className="text-xl font-semibold">
          {galleryTitle} - {readyCount}/{planLimit}
        </h2>
      )}

      {/* Filters - only show type filter if not fixed */}
      {!fixedTypeFilter && (
        <div className="flex flex-col sm:flex-row gap-4">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              <SelectItem value="image">Imagens</SelectItem>
              <SelectItem value="video">Vídeos</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && media.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhuma mídia encontrada</h3>
          <p className="text-sm text-muted-foreground">
            Faça upload de imagens ou vídeos para começar
          </p>
        </div>
      )}

      {/* Media grid */}
      {!isLoading && media.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {media.map((item) => (
            <div key={item.id} className="flex flex-col gap-2">
              {/* Image Container with 3:4 aspect ratio */}
              <div
                className="relative rounded-lg overflow-hidden border bg-muted"
                style={{ aspectRatio: "3/4" }}
              >
                {/* Media display - videos show thumbnail with play button, images are clickable */}
                {item.type === "video" ? (
                  <div 
                    className="w-full h-full cursor-pointer"
                    onClick={() => {
                      setSelectedVideoId(item.id);
                      setVideoDialogOpen(true);
                    }}
                  >
                    <MediaDisplay
                      mediaId={item.id}
                      context="grid"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div
                    className="w-full h-full cursor-pointer"
                    onClick={() => onMediaClick && onMediaClick(item.id)}
                  >
                    <MediaDisplay
                      mediaId={item.id}
                      context="grid"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Cover badge - only show if showCoverAction is enabled */}
                {showCoverAction && item.is_cover && (
                  <div className="absolute top-2 left-2">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-yellow-400 text-yellow-900 text-xs font-medium">
                      <Star className="h-3 w-3" fill="currentColor" />
                      Capa
                    </span>
                  </div>
                )}
              </div>

              {/* Actions Below */}
              <div className="flex items-center justify-between gap-2">
                {showCoverAction && !item.is_cover ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSetCover(item.id)}
                    className="flex-1 text-xs"
                  >
                    <Star size={14} className="mr-1" />
                    Definir como capa
                  </Button>
                ) : showCoverAction && item.is_cover ? (
                  <div className="flex-1 text-xs text-gray-500 flex items-center">
                    <Star size={14} className="mr-1 text-yellow-500" fill="currentColor" />
                    Foto de capa
                  </div>
                ) : (
                  <div className="flex-1"></div>
                )}
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => confirmDelete(item.id)}
                  className="px-3"
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir mídia?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A mídia e todas as suas variantes
              serão permanentemente excluídas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (mediaToDelete) {
                  handleDelete(mediaToDelete);
                  setMediaToDelete(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Video player dialog */}
      <Dialog open={videoDialogOpen} onOpenChange={setVideoDialogOpen}>
        <DialogContent className="max-w-4xl p-0 bg-black border-0">
          <button
            onClick={() => setVideoDialogOpen(false)}
            className="absolute top-4 right-4 z-50 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
          {selectedVideoId && (
            <div className="w-full aspect-video">
              <MediaDisplay
                mediaId={selectedVideoId}
                context="modal"
                className="w-full h-full"
                autoPlay
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
