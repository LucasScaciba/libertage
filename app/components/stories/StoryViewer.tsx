'use client';

import { useState, useEffect, useRef } from 'react';
import { StoryWithUser } from '@/types';
import { X, ChevronLeft, ChevronRight, Flag, Trash2 } from 'lucide-react';
import { StoryProgressBar } from './StoryProgressBar';
import { StoryReportModal } from './StoryReportModal';
import { toast } from 'sonner';

interface StoryViewerProps {
  stories: StoryWithUser[];
  initialStoryId: string;
  onClose: () => void;
  currentUserId?: string;
}

export function StoryViewer({
  stories,
  initialStoryId,
  onClose,
  currentUserId
}: StoryViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(
    stories.findIndex(s => s.id === initialStoryId) || 0
  );
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const currentStory = stories[currentIndex];
  const isOwner = currentUserId === currentStory?.user_id;

  // Record view when story opens
  useEffect(() => {
    if (currentStory) {
      fetch(`/api/stories/${currentStory.id}/view`, {
        method: 'POST'
      }).catch(console.error);
    }
  }, [currentStory?.id]);

  // Handle video playback and progress
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => {
      setIsPaused(false);
      startProgress();
    };

    const handlePause = () => {
      setIsPaused(true);
      stopProgress();
    };

    const handleEnded = () => {
      setTimeout(() => {
        goToNext();
      }, 500);
    };

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);

    // Auto play
    video.play().catch(console.error);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
      stopProgress();
    };
  }, [currentIndex]);

  const startProgress = () => {
    stopProgress();
    const video = videoRef.current;
    if (!video) return;

    progressIntervalRef.current = setInterval(() => {
      const progress = (video.currentTime / video.duration) * 100;
      setProgress(progress);
    }, 100);
  };

  const stopProgress = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  };

  const goToNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setProgress(0);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja deletar este story?')) {
      return;
    }

    try {
      const response = await fetch(`/api/stories/${currentStory.id}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error);
      }

      toast.success('Story deletado com sucesso');
      
      // Remove from list and move to next
      const newStories = stories.filter(s => s.id !== currentStory.id);
      if (newStories.length === 0) {
        onClose();
      } else {
        goToNext();
      }
    } catch (error: any) {
      toast.error(error.message || 'Erro ao deletar story');
    }
  };

  const handleClickArea = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const third = rect.width / 3;

    if (x < third) {
      goToPrevious();
    } else if (x > third * 2) {
      goToNext();
    } else {
      // Middle area - toggle pause
      const video = videoRef.current;
      if (video) {
        if (video.paused) {
          video.play();
        } else {
          video.pause();
        }
      }
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        goToPrevious();
      } else if (e.key === 'ArrowRight') {
        goToNext();
      } else if (e.key === 'Escape') {
        onClose();
      } else if (e.key === ' ') {
        e.preventDefault();
        const video = videoRef.current;
        if (video) {
          if (video.paused) {
            video.play();
          } else {
            video.pause();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex]);

  // Touch swipe support
  const touchStartX = useRef(0);
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;

    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        goToNext();
      } else {
        goToPrevious();
      }
    }
  };

  if (!currentStory) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Progress bars */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4">
        <StoryProgressBar
          currentIndex={currentIndex}
          totalStories={stories.length}
          progress={progress}
        />
      </div>

      {/* Header */}
      <div className="absolute top-12 left-0 right-0 z-10 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-500 p-0.5">
            <div className="w-full h-full rounded-full bg-white p-0.5">
              {currentStory.user.profile_photo_url ? (
                <img
                  src={currentStory.user.profile_photo_url}
                  alt={currentStory.user.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-gray-200 flex items-center justify-center">
                  <span className="text-sm font-semibold text-gray-600">
                    {currentStory.user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          </div>
          <div>
            <p className="text-white font-semibold">{currentStory.user.name}</p>
            <p className="text-white/70 text-sm">
              {new Date(currentStory.created_at).toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-2 rounded-full bg-black/30 hover:bg-black/50 transition"
        >
          <X className="w-6 h-6 text-white" />
        </button>
      </div>

      {/* Video */}
      <div
        className="w-full h-full flex items-center justify-center cursor-pointer"
        onClick={handleClickArea}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <video
          ref={videoRef}
          src={currentStory.video_url}
          className="max-w-full max-h-full object-contain"
          playsInline
        />
      </div>

      {/* Navigation hints */}
      {currentIndex > 0 && (
        <button
          onClick={goToPrevious}
          className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/30 hover:bg-black/50 transition"
        >
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>
      )}

      {currentIndex < stories.length - 1 && (
        <button
          onClick={goToNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/30 hover:bg-black/50 transition"
        >
          <ChevronRight className="w-6 h-6 text-white" />
        </button>
      )}

      {/* Actions */}
      <div className="absolute bottom-4 left-0 right-0 z-10 px-4 flex justify-center gap-4">
        {isOwner ? (
          <button
            onClick={handleDelete}
            className="px-4 py-2 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center gap-2 transition"
          >
            <Trash2 className="w-4 h-4" />
            Deletar
          </button>
        ) : (
          <button
            onClick={() => setReportModalOpen(true)}
            className="px-4 py-2 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center gap-2 transition"
          >
            <Flag className="w-4 h-4" />
            Denunciar
          </button>
        )}
      </div>

      {/* Report Modal */}
      <StoryReportModal
        storyId={currentStory.id}
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
      />
    </div>
  );
}
