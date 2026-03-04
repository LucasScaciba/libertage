'use client';

/**
 * ExternalLinksManagerClient
 * 
 * Client wrapper for ExternalLinksManager component.
 * Handles client-side state and interactions.
 */

import { ExternalLinksManager } from '@/app/components/external-links/ExternalLinksManager';

interface ExternalLinksManagerClientProps {
  profileId: string;
}

export function ExternalLinksManagerClient({ profileId }: ExternalLinksManagerClientProps) {
  return <ExternalLinksManager profileId={profileId} />;
}
