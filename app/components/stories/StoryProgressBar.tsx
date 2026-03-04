'use client';

import { cn } from '@/lib/utils';

interface StoryProgressBarProps {
  currentIndex: number;
  totalStories: number;
  progress: number;
}

export function StoryProgressBar({
  currentIndex,
  totalStories,
  progress
}: StoryProgressBarProps) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: totalStories }).map((_, index) => (
        <div
          key={index}
          className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden"
        >
          <div
            className={cn(
              'h-full bg-white transition-all duration-100',
              index < currentIndex && 'w-full',
              index === currentIndex && `w-[${progress}%]`,
              index > currentIndex && 'w-0'
            )}
            style={
              index === currentIndex
                ? { width: `${progress}%` }
                : undefined
            }
          />
        </div>
      ))}
    </div>
  );
}
