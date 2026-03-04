'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { VideoUploadService } from '@/lib/services/video-upload.service';
import { Plus, Upload, X } from 'lucide-react';
import { toast } from 'sonner';

interface StoryUploadButtonProps {
  userId: string;
  userPlan: 'free' | 'premium' | 'black';
  activeStoriesCount: number;
  onUploadSuccess?: () => void;
}

export function StoryUploadButton({
  userId,
  userPlan,
  activeStoriesCount,
  onUploadSuccess
}: StoryUploadButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const planLimits = {
    free: 0,
    premium: 1,
    black: 5
  };

  const limit = planLimits[userPlan];

  const handleOpenModal = () => {
    if (userPlan === 'free') {
      toast.error('Upgrade para Premium ou Black para publicar stories');
      return;
    }

    if (activeStoriesCount >= limit) {
      toast.error('Limite de stories atingido para seu plano');
      return;
    }

    setIsOpen(true);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    const validation = await VideoUploadService.validateVideo(file);
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      // Upload video
      const uploadResult = await VideoUploadService.uploadVideo(selectedFile, userId);

      clearInterval(progressInterval);
      setUploadProgress(95);

      // Publish story
      const response = await fetch('/api/stories/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(uploadResult)
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error);
      }

      setUploadProgress(100);
      toast.success('Story publicado com sucesso!');
      
      // Reset state
      setIsOpen(false);
      setSelectedFile(null);
      setPreviewUrl(null);
      setUploadProgress(0);

      // Callback
      onUploadSuccess?.();

    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Erro ao publicar story');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setIsOpen(false);
    setSelectedFile(null);
    setPreviewUrl(null);
    setUploadProgress(0);
  };

  return (
    <>
      <Button onClick={handleOpenModal} size="sm">
        <Plus className="w-4 h-4 mr-2" />
        Novo Story
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent style={{ maxWidth: '28rem', maxHeight: '85vh', overflowY: 'auto' }}>
          <DialogHeader>
            <DialogTitle>Publicar Story</DialogTitle>
          </DialogHeader>

          <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {!selectedFile ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition"
              >
                <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-sm text-gray-600 mb-2">
                  Clique para selecionar um vídeo
                </p>
                <p className="text-xs text-gray-500">
                  MP4, MOV ou AVI • Máx 18 MB • Até 60 segundos
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/mp4,video/quicktime,video/x-msvideo"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="relative w-full max-w-[200px] mx-auto">
                  <div className="w-full bg-black rounded-lg overflow-hidden">
                    <video
                      src={previewUrl || ''}
                      controls
                      className="w-full object-contain"
                      style={{ maxHeight: '300px', display: 'block' }}
                    />
                  </div>
                  <button
                    onClick={() => {
                      if (previewUrl) URL.revokeObjectURL(previewUrl);
                      setSelectedFile(null);
                      setPreviewUrl(null);
                    }}
                    className="absolute top-2 right-2 p-2 bg-black/50 rounded-full hover:bg-black/70 transition"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>

                {isUploading && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <Progress value={uploadProgress} />
                    <p className="text-sm text-center text-gray-600">
                      Publicando... {uploadProgress}%
                    </p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={handleCancel}
                    variant="outline"
                    className="flex-1"
                    disabled={isUploading}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleUpload}
                    className="flex-1"
                    disabled={isUploading}
                  >
                    {isUploading ? 'Publicando...' : 'Publicar'}
                  </Button>
                </div>
              </div>
            )}

            <div className="text-xs text-gray-500 text-center">
              {activeStoriesCount} de {limit} stories ativos
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
