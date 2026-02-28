"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function MediaPage() {
  const [profile, setProfile] = useState<any>(null);
  const [media, setMedia] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [limits, setLimits] = useState({ photos: 0, videos: 0, maxPhotos: 0, maxVideos: 0 });

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    if (profile) {
      fetchMedia();
      fetchLimits();
    }
  }, [profile]);

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/profiles/me");
      const data = await res.json();
      if (data.profile) {
        setProfile(data.profile);
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
    }
  };

  const fetchMedia = async () => {
    try {
      const res = await fetch(`/api/media?profileId=${profile.id}`);
      const data = await res.json();
      setMedia(data.media || []);
    } catch (err) {
      console.error("Error fetching media:", err);
    }
  };

  const fetchLimits = async () => {
    // Count current media
    const photos = media.filter((m) => m.type === "photo").length;
    const videos = media.filter((m) => m.type === "video").length;

    // Get plan limits (hardcoded for now, should come from subscription)
    setLimits({
      photos,
      videos,
      maxPhotos: 3, // Free plan default
      maxVideos: 0,
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");

    try {
      // Get upload URL
      const urlRes = await fetch("/api/media/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId: profile.id,
          fileType: file.type,
          fileSize: file.size,
        }),
      });

      if (!urlRes.ok) {
        const data = await urlRes.json();
        throw new Error(data.error || "Failed to get upload URL");
      }

      const { uploadUrl, path } = await urlRes.json();

      // Upload file to Supabase Storage
      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      if (!uploadRes.ok) {
        throw new Error("Failed to upload file");
      }

      // Create media record
      const type = file.type.startsWith("image/") ? "photo" : "video";
      const mediaRes = await fetch("/api/media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId: profile.id,
          type,
          storage_path: path,
          file_size: file.size,
          is_cover: media.length === 0, // First photo is cover
          sort_order: media.length,
        }),
      });

      if (!mediaRes.ok) {
        const data = await mediaRes.json();
        throw new Error(data.error || "Failed to create media record");
      }

      // Refresh media list
      await fetchMedia();
      e.target.value = ""; // Reset input
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSetCover = async (mediaId: string) => {
    try {
      const res = await fetch(`/api/media/${mediaId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_cover: true }),
      });

      if (!res.ok) {
        throw new Error("Failed to set cover");
      }

      await fetchMedia();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (mediaId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta mídia?")) return;

    try {
      const res = await fetch(`/api/media/${mediaId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete media");
      }

      await fetchMedia();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p>Carregando...</p>
      </div>
    );
  }

  const photos = media.filter((m) => m.type === "photo");
  const videos = media.filter((m) => m.type === "video");

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Gerenciar Mídia</h1>
          <p className="mt-2 text-sm text-gray-600">
            Fotos: {photos.length}/{limits.maxPhotos} | Vídeos: {videos.length}/{limits.maxVideos}
          </p>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-lg font-medium mb-4">Upload de Mídia</h2>
          <div className="flex items-center gap-4">
            <Input
              type="file"
              accept="image/*,video/*"
              onChange={handleFileSelect}
              disabled={uploading}
            />
            {uploading && <span className="text-sm text-gray-500">Enviando...</span>}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium mb-4">Fotos</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {photos.map((item) => (
              <div key={item.id} className="relative group">
                <img
                  src={item.public_url}
                  alt=""
                  className="w-full h-48 object-cover rounded-lg"
                />
                {item.is_cover && (
                  <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                    Capa
                  </div>
                )}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity rounded-lg flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                  {!item.is_cover && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleSetCover(item.id)}
                    >
                      Definir Capa
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(item.id)}
                  >
                    Excluir
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {photos.length === 0 && (
            <p className="text-gray-500 text-center py-8">Nenhuma foto enviada</p>
          )}
        </div>

        {videos.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow mt-6">
            <h2 className="text-lg font-medium mb-4">Vídeos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {videos.map((item) => (
                <div key={item.id} className="relative group">
                  <video
                    src={item.public_url}
                    controls
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <div className="absolute top-2 right-2">
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(item.id)}
                    >
                      Excluir
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
