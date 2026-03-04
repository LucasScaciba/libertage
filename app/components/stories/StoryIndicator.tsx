'use client';

import { cn } from '@/lib/utils';
import Image from 'next/image';

interface StoryIndicatorProps {
  user: {
    name: string;
    profile_photo_url: string | null;
    slug: string;
  };
  hasActiveStory: boolean;
  onClick: () => void;
  className?: string;
}

export function StoryIndicator({
  user,
  hasActiveStory,
  onClick,
  className
}: StoryIndicatorProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col items-center gap-2 flex-shrink-0',
        className
      )}
    >
      <div
        className={cn(
          'relative w-16 h-16 rounded-full p-0.5',
          hasActiveStory
            ? 'bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-500'
            : 'bg-gray-300'
        )}
      >
        <div className="w-full h-full rounded-full bg-white p-0.5">
          {user.profile_photo_url ? (
            <Image
              src={user.profile_photo_url}
              alt={user.name}
              width={64}
              height={64}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <div className="w-full h-full rounded-full bg-gray-200 flex items-center justify-center">
              <span className="text-xl font-semibold text-gray-600">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>
      </div>
      <span className="text-xs text-gray-700 max-w-[64px] truncate">
        {user.name}
      </span>
    </button>
  );
}
