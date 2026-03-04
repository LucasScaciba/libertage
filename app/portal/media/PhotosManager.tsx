'use client';

/**
 * PhotosManager Component
 * 
 * Manages photo uploads and gallery for the profile.
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, Trash2, Star } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';

interface PhotosManagerProps {
  profileId: string;
  planCode: string;
}

export function PhotosManager({ profileId, planCode }: PhotosManagerProps) {
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchPhotos();
  }, [profileId]);

  const fetchPhotos = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('media')
        .select('*')
        .eq('profile_id', profileId)
        .eq('type', 'photo')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setPhotos(data || []);
    } catch (error) {
      console.error('Error fetching photos:', error);
      toast.error('Erro ao carregar fotos');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem válida');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 5MB');
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
      const maxOrder = photos.length > 0 
        ? Math.max(...photos.map(p => p.sort_order)) 
        : 0;

      // Insert into database
      const { error: dbError } = await supabase
        .from('media')
        .insert({
          profile_id: profileId,
          type: 'photo',
          public_url: publicUrl,
          storage_path: fileName,
          sort_order: maxOrder + 1,
          is_cover: photos.length === 0, // First photo is cover
          file_size: file.size,
        });

      if (dbError) throw dbError;

      toast.success('Foto adicionada com sucesso!');
      await fetchPhotos();
    } catch (error: any) {
      console.error('Error uploading photo:', error);
      toast.error(error.message || 'Erro ao fazer upload da foto');
    } finally {
      setUploading(false);
      // Reset input
      event.target.value = '';
    }
  };

  const handleSetCover = async (photoId: string) => {
    try {
      const supabase = createClient();

      // Remove cover from all photos
      await supabase
        .from('media')
        .update({ is_cover: false })
        .eq('profile_id', profileId)
        .eq('type', 'photo');

      // Set new cover
      const { error } = await supabase
        .from('media')
        .update({ is_cover: true })
        .eq('id', photoId);

      if (error) throw error;

      toast.success('Foto de capa atualizada!');
      await fetchPhotos();
    } catch (error) {
      console.error('Error setting cover:', error);
      toast.error('Erro ao definir foto de capa');
    }
  };

  const handleDelete = async (photoId: string, storagePath: string) => {
    if (!confirm('Tem certeza que deseja deletar esta foto?')) {
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
        .eq('id', photoId);

      if (error) throw error;

      toast.success('Foto deletada com sucesso!');
      await fetchPhotos();
    } catch (error) {
      console.error('Error deleting photo:', error);
      toast.error('Erro ao deletar foto');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-gray-500">Carregando fotos...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Galeria de Fotos</CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              {photos.length} foto{photos.length !== 1 ? 's' : ''} adicionada{photos.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div>
            <input
              type="file"
              accept="image/*"
              onChange={handleUpload}
              disabled={uploading}
              className="hidden"
              id="photo-upload"
            />
            <label htmlFor="photo-upload">
              <Button
                disabled={uploading}
                className="flex items-center gap-2"
                asChild
              >
                <span>
                  <Upload size={16} />
                  {uploading ? 'Enviando...' : 'Adicionar Foto'}
                </span>
              </Button>
            </label>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {photos.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>Nenhuma foto adicionada ainda.</p>
            <p className="text-sm mt-1">Clique em "Adicionar Foto" para começar.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {photos.map((photo) => (
              <div key={photo.id} className="flex flex-col gap-2">
                {/* Image Container */}
                <div className="relative aspect-square rounded-lg overflow-hidden border border-gray-200">
                  <img
                    src={photo.public_url}
                    alt="Foto do perfil"
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  
                  {/* Cover Badge */}
                  {photo.is_cover && (
                    <div className="absolute top-2 left-2 bg-yellow-400 text-yellow-900 px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
                      <Star size={12} fill="currentColor" />
                      Capa
                    </div>
                  )}
                </div>

                {/* Actions Below */}
                <div className="flex items-center justify-between gap-2">
                  {!photo.is_cover ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSetCover(photo.id)}
                      className="flex-1 text-xs"
                    >
                      <Star size={14} className="mr-1" />
                      Definir como capa
                    </Button>
                  ) : (
                    <div className="flex-1 text-xs text-gray-500 flex items-center">
                      <Star size={14} className="mr-1 text-yellow-500" fill="currentColor" />
                      Foto de capa
                    </div>
                  )}
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(photo.id, photo.storage_path)}
                    className="px-3"
                  >
                    <Trash2 size={14} />
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
