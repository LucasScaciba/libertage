'use client';

import { useState, useEffect, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { trackStoryView } from '@/lib/utils/analytics-tracking';

interface Story {
  id: string;
  user_id: string;
  video_url: string;
  thumbnail_url: string | null;
  created_at: string;
  expires_at: string;
}

interface StoryWithProfile extends Story {
  profile: {
    name: string;
    avatar_url: string | null;
    slug: string;
  };
}

interface StoriesCarouselProps {
  size?: 'default' | 'small';
  filters?: {
    gender?: string;
    service?: string;
    city?: string;
    search?: string;
  };
}

export function StoriesCarousel({ size = 'default', filters }: StoriesCarouselProps) {
  const [stories, setStories] = useState<StoryWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    setLoading(true);
    fetchStories();
  }, [filters?.gender, filters?.service, filters?.city, filters?.search]);

  const fetchStories = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters?.gender) params.append('gender', filters.gender);
      if (filters?.service) params.append('service', filters.service);
      if (filters?.city) params.append('city', filters.city);
      if (filters?.search) params.append('search', filters.search);

      const response = await fetch(`/api/stories/catalog?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setStories(data.stories || []);
      }
    } catch (error) {
      console.error('Error fetching stories:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get stories for the selected user
  const userStories = selectedUserId 
    ? stories.filter(s => s.user_id === selectedUserId)
    : [];

  const currentStory = userStories[currentStoryIndex];

  // Handle video end - move to next story or close modal
  const handleVideoEnd = () => {
    if (currentStoryIndex < userStories.length - 1) {
      setCurrentStoryIndex(currentStoryIndex + 1);
    } else {
      // Close modal when all stories are done
      setSelectedUserId(null);
      setCurrentStoryIndex(0);
    }
  };

  // Reset video when story changes
  useEffect(() => {
    if (videoRef.current && currentStory) {
      videoRef.current.load();
      videoRef.current.play().catch(err => console.error('Error playing video:', err));
      
      // Track story view
      trackStoryView(currentStory.id);
    }
  }, [currentStory]);

  const handleAvatarClick = (userId: string) => {
    setSelectedUserId(userId);
    setCurrentStoryIndex(0);
  };

  const handleCloseModal = () => {
    setSelectedUserId(null);
    setCurrentStoryIndex(0);
  };

  if (loading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex flex-col items-center gap-2 flex-shrink-0">
            <div 
              className={`rounded-full bg-gray-200 animate-pulse ${
                size === 'small' ? 'w-14 h-14' : 'w-20 h-20'
              }`}
            />
            <div className="w-16 h-3 bg-gray-200 rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  if (stories.length === 0) {
    return null;
  }

  // Group stories by user to show unique avatars
  const uniqueUsers = Array.from(
    new Map(stories.map(story => [story.user_id, story])).values()
  );

  const avatarSize = size === 'small' ? 'w-14 h-14' : 'w-20 h-20';
  const ringSize = size === 'small' ? 'p-[2px]' : 'p-[3px]';
  const textSize = size === 'small' ? 'text-xs' : 'text-sm';

  return (
    <>
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
        {uniqueUsers.map((story) => (
          <button
            key={story.user_id}
            onClick={() => handleAvatarClick(story.user_id)}
            className="flex flex-col items-center gap-2 flex-shrink-0 group"
          >
            {/* Avatar with gradient ring */}
            <div 
              className={`rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 ${ringSize}`}
            >
              <div className="bg-white rounded-full p-[2px]">
                <div className={`${avatarSize} rounded-full overflow-hidden`}>
                  {story.profile.avatar_url ? (
                    <img 
                      src={story.profile.avatar_url} 
                      alt={story.profile.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-600 font-semibold">
                        {story.profile.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Name */}
            <span className={`${textSize} text-gray-700 max-w-[80px] truncate group-hover:text-gray-900`}>
              {story.profile.name.split(' ')[0]}
            </span>
          </button>
        ))}
      </div>

      {/* Story Viewer Modal */}
      {currentStory && (
        <Dialog open={!!selectedUserId} onOpenChange={handleCloseModal}>
          <DialogContent className="max-w-md p-0">
            <div className="relative bg-black">
              {/* Progress bars */}
              <div className="absolute top-2 left-2 right-2 z-10 flex gap-1">
                {userStories.map((_, index) => (
                  <div 
                    key={index}
                    className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden"
                  >
                    <div 
                      className={`h-full bg-white transition-all ${
                        index < currentStoryIndex ? 'w-full' : 
                        index === currentStoryIndex ? 'w-0 animate-progress' : 'w-0'
                      }`}
                    />
                  </div>
                ))}
              </div>

              {/* Close button */}
              <button
                onClick={handleCloseModal}
                className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition"
              >
                ×
              </button>

              {/* Profile info */}
              <div className="absolute top-12 left-4 z-10 flex items-center gap-2">
                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white">
                  {currentStory.profile.avatar_url ? (
                    <img 
                      src={currentStory.profile.avatar_url} 
                      alt={currentStory.profile.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-600 flex items-center justify-center">
                      <span className="text-white text-sm font-semibold">
                        {currentStory.profile.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                <span className="text-white font-semibold text-sm drop-shadow-lg">
                  {currentStory.profile.name}
                </span>
              </div>

              {/* Video */}
              <video
                ref={videoRef}
                src={currentStory.video_url}
                autoPlay
                playsInline
                onEnded={handleVideoEnd}
                className="w-full"
                style={{ maxHeight: '80vh', objectFit: 'contain' }}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
