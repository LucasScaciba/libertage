'use client';

/**
 * MediaManagerClient
 * 
 * Client component for managing photos, videos, and stories.
 * Displays all media types in a single scrollable page.
 */

import { PhotosManager } from './PhotosManager';
import { VideosManager } from './VideosManager';
import { StoriesManager } from './StoriesManager';

interface MediaManagerClientProps {
  userId: string;
  profileId: string;
  planCode: string;
}

export function MediaManagerClient({ userId, profileId, planCode }: MediaManagerClientProps) {
  return (
    <div className="flex flex-col gap-8">
      {/* Photos Section */}
      <div className="mb-8">
        <PhotosManager profileId={profileId} planCode={planCode} />
      </div>

      {/* Videos Section */}
      <div className="mb-8">
        <VideosManager profileId={profileId} planCode={planCode} />
      </div>

      {/* Stories Section */}
      <div>
        <StoriesManager userId={userId} planCode={planCode} />
      </div>
    </div>
  );
}
