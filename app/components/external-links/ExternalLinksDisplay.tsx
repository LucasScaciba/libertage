'use client';

/**
 * ExternalLinksDisplay Component
 * 
 * Displays external links on public profile pages.
 * Fetches links via public API and renders them as clickable cards with icons.
 * 
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 10.1, 10.2, 10.3
 */

import { useEffect, useState } from 'react';
import { IconMapper } from '@/lib/utils/icon-mapper';
import type { ExternalLinkRecord } from '@/types';

interface ExternalLinksDisplayProps {
  profileId: string;
}

export function ExternalLinksDisplay({ profileId }: ExternalLinksDisplayProps) {
  const [links, setLinks] = useState<ExternalLinkRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLinks();
  }, [profileId]);

  const fetchLinks = async () => {
    try {
      const response = await fetch(`/api/external-links?profileId=${profileId}`);
      
      if (!response.ok) {
        console.error('Failed to fetch external links');
        setLinks([]);
        return;
      }

      const data = await response.json();
      if (data.success && data.data) {
        setLinks(data.data);
      }
    } catch (error) {
      console.error('Error fetching external links:', error);
      setLinks([]);
    } finally {
      setLoading(false);
    }
  };

  // Don't render section if no links (Requirement 7.6)
  if (!loading && links.length === 0) {
    return null;
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-3">Minhas Redes</h3>
        <p className="text-gray-500">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-base font-semibold text-gray-900 mb-3">Minhas Redes</h3>
      <div className="space-y-3">
        {links.map((link) => (
          <a
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 group"
          >
            {/* Icon */}
            <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-gray-100 rounded-full group-hover:bg-blue-100 transition-colors">
              <IconMapper iconKey={link.icon_key} size={20} className="text-gray-700 group-hover:text-blue-600" />
            </div>
            
            {/* Title */}
            <div className="flex-1 min-w-0">
              <p className="text-base font-medium text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                {link.title}
              </p>
            </div>
            
            {/* Arrow indicator */}
            <div className="flex-shrink-0">
              <svg
                className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
