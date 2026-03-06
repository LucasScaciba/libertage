'use client';

/**
 * MediaManagerClient
 * 
 * Client component for managing media (photos, videos, and stories).
 * Unified upload component with separate galleries for photos and videos, plus stories section.
 */

import { useState } from 'react';
import { MediaUpload } from '@/app/components/media/MediaUpload';
import { MediaGallery } from '@/app/components/media/MediaGallery';
import { StoriesManager } from './StoriesManager';
import { Separator } from '@/components/ui/separator';
import { AlertCircle } from 'lucide-react';

interface MediaManagerClientProps {
  userId: string;
  profileId: string;
  planCode: string;
}

// Plan limits
const PLAN_LIMITS = {
  free: { photos: 4, videos: 0, stories: 0 },
  premium: { photos: 8, videos: 2, stories: 1 },
  black: { photos: 12, videos: 4, stories: 5 },
};

export function MediaManagerClient({ userId, profileId, planCode }: MediaManagerClientProps) {
  const [refreshKey, setRefreshKey] = useState(0);

  const limits = PLAN_LIMITS[planCode as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.free;

  /**
   * Handle successful upload - refresh galleries
   */
  const handleUploadSuccess = () => {
    setRefreshKey(prev => prev + 1);
  };

  // Determine accepted types based on plan
  const acceptedTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/heic',
    'image/heif',
    ...(limits.videos > 0 ? ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'] : [])
  ];

  return (
    <div className="space-y-8">
      {/* Unified Upload Section */}
      <div className="bg-white rounded-lg border p-6">
        <div className="mb-4">
          <h2 className="text-xl font-semibold">Upload de Mídias</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Limite do plano: {limits.photos} fotos{limits.videos > 0 ? ` e ${limits.videos} vídeos` : ''}
          </p>
          {limits.videos === 0 && (
            <div className="flex items-start gap-2 mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-yellow-700">
                Vídeos não disponíveis no plano Free. Faça upgrade para Premium ou Black para adicionar vídeos.
              </p>
            </div>
          )}
        </div>
        <MediaUpload 
          onUploadSuccess={handleUploadSuccess}
          acceptedTypes={acceptedTypes}
          profileId={profileId}
        />
      </div>

      <Separator />

      {/* Photos Gallery */}
      <div className="bg-white rounded-lg border p-6">
        <MediaGallery 
          key={`photos-${refreshKey}`}
          fixedTypeFilter="image"
          profileId={profileId}
          showCoverAction={true}
          planLimit={limits.photos}
          galleryTitle="Galeria de Fotos"
          onRefresh={() => setRefreshKey(prev => prev + 1)}
        />
      </div>

      {/* Videos Gallery - only show if plan allows videos */}
      {limits.videos > 0 && (
        <>
          <Separator />
          <div className="bg-white rounded-lg border p-6">
            <MediaGallery 
              key={`videos-${refreshKey}`}
              fixedTypeFilter="video"
              profileId={profileId}
              showCoverAction={false}
              planLimit={limits.videos}
              galleryTitle="Galeria de Vídeos"
              onRefresh={() => setRefreshKey(prev => prev + 1)}
            />
          </div>
        </>
      )}

      {/* Stories Section */}
      <Separator />
      {limits.stories === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-semibold text-yellow-900 mb-1">
                Stories não disponíveis no plano Free
              </h3>
              <p className="text-sm text-yellow-700">
                Faça upgrade para Premium ou Black para publicar stories que expiram em 24 horas.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <StoriesManager userId={userId} planCode={planCode} />
      )}
    </div>
  );
}
