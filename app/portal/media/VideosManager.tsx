'use client';

/**
 * VideosManager Component
 * 
 * Manages video uploads for the profile.
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, Trash2, Play } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';

interface VideosManagerProps {
  profileId: string;
  planCode: string;
}

export function VideosManager({ profileId, planCode }: VideosManagerProps) {
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchVideos();
  }, [profileId]);

  const fetchVideos = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('media')
        .select('*')
        .eq('profile_id', profileId)
        .eq('type', 'video')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setVideos(data || []);
    } catch (error) {
      console.error('Error fetching videos:', error);
      toast.error('Erro ao carregar vídeos');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('video/')) {
      toast.error('Por favor, selecione um vídeo válido');
      return;
    }

    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      toast.error('O vídeo deve ter no máximo 50MB');
      return;
    }

    setUploading(true);

    try {
      const supabase = createClient();

      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${profileId}/${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('media')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(fileName);

      // Get next display order
      const maxOrder = videos.length > 0 
        ? Math.max(...videos.map(v => v.sort_order)) 
        : 0;

      // Insert into database
      const { error: dbError } = await supabase
        .from('media')
        .insert({
          profile_id: profileId,
          type: 'video',
          public_url: publicUrl,
          storage_path: fileName,
          sort_order: maxOrder + 1,
          file_size: file.size,
        });

      if (dbError) throw dbError;

      toast.success('Vídeo adicionado com sucesso!');
      await fetchVideos();
    } catch (error: any) {
      console.error('Error uploading video:', error);
      toast.error(error.message || 'Erro ao fazer upload do vídeo');
    } finally {
      setUploading(false);
      // Reset input
      event.target.value = '';
    }
  };

  const handleDelete = async (videoId: string, storagePath: string) => {
    if (!confirm('Tem certeza que deseja deletar este vídeo?')) {
      return;
    }

    try {
      const supabase = createClient();

      // Delete from storage
      await supabase.storage
        .from('media')
        .remove([storagePath]);

      // Delete from database
      const { error } = await supabase
        .from('media')
        .delete()
        .eq('id', videoId);

      if (error) throw error;

      toast.success('Vídeo deletado com sucesso!');
      await fetchVideos();
    } catch (error) {
      console.error('Error deleting video:', error);
      toast.error('Erro ao deletar vídeo');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-gray-500">Carregando vídeos...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Galeria de Vídeos</CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              {videos.length} vídeo{videos.length !== 1 ? 's' : ''} adicionado{videos.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div>
            <input
              type="file"
              accept="video/*"
              onChange={handleUpload}
              disabled={uploading}
              className="hidden"
              id="video-upload"
            />
            <label htmlFor="video-upload">
              <Button
                disabled={uploading}
                className="flex items-center gap-2"
                asChild
              >
                <span>
                  <Upload size={16} />
                  {uploading ? 'Enviando...' : 'Adicionar Vídeo'}
                </span>
              </Button>
            </label>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {videos.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>Nenhum vídeo adicionado ainda.</p>
            <p className="text-sm mt-1">Clique em "Adicionar Vídeo" para começar.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {videos.map((video) => (
              <div
                key={video.id}
                className="relative group aspect-video rounded-lg overflow-hidden border border-gray-200 bg-black"
              >
                <video
                  src={video.public_url}
                  className="w-full h-full object-contain"
                  controls
                />

                {/* Actions Overlay */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(video.id, video.storage_path)}
                    title="Deletar"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
