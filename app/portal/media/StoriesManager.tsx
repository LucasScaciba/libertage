'use client';

/**
 * StoriesManager Component
 * 
 * Manages stories with 24-hour expiration.
 * Reuses existing story components and logic.
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Eye, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { StoryUploadButton } from '@/app/components/stories/StoryUploadButton';
import { StoryAnalytics } from '@/app/components/stories/StoryAnalytics';

interface StoriesManagerProps {
  userId: string;
  planCode: 'free' | 'premium' | 'black' | string;
}

/**
 * Client-safe time remaining formatter
 */
function formatTimeRemaining(expiresAt: Date): string {
  const now = new Date();
  const expires = new Date(expiresAt);
  const diff = expires.getTime() - now.getTime();
  const seconds = Math.max(0, Math.floor(diff / 1000));
  
  if (seconds === 0) {
    return 'Expirado';
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
}

export function StoriesManager({ userId, planCode }: StoriesManagerProps) {
  const [stories, setStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStoryId, setSelectedStoryId] = useState<string | null>(null);

  useEffect(() => {
    fetchStories();
  }, [userId]);

  const fetchStories = async () => {
    try {
      const response = await fetch(`/api/stories/user/${userId}`);
      const data = await response.json();

      if (data.success) {
        setStories(data.stories || []);
      }
    } catch (error) {
      console.error('Error fetching stories:', error);
      toast.error('Erro ao carregar stories');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (storyId: string) => {
    if (!confirm('Tem certeza que deseja deletar este story?')) {
      return;
    }

    try {
      const response = await fetch(`/api/stories/${storyId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error);
      }

      toast.success('Story deletado com sucesso');
      fetchStories();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao deletar story');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-gray-500">Carregando stories...</p>
        </CardContent>
      </Card>
    );
  }

  const activeStories = stories.filter(s => s.status === 'active');

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Meus Stories</CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                Stories expiram automaticamente após 24 horas
              </p>
            </div>
            <StoryUploadButton
              userId={userId}
              userPlan={planCode as 'free' | 'premium' | 'black'}
              activeStoriesCount={activeStories.length}
              onUploadSuccess={fetchStories}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Plano Atual</p>
              <p className="text-lg font-semibold capitalize">{planCode}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Stories Ativos</p>
              <p className="text-lg font-semibold">
                {activeStories.length} / {planCode === 'premium' ? 1 : planCode === 'black' ? 5 : 0}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stories List */}
      {stories.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12 text-gray-500">
              <p className="mb-4">Você ainda não publicou nenhum story</p>
              {planCode === 'free' && (
                <p className="text-sm text-gray-400">
                  Faça upgrade para Premium ou Black para publicar stories
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {stories.map((story) => {
            const isExpired = story.status !== 'active';
            const timeRemaining = formatTimeRemaining(
              new Date(story.expires_at)
            );

            return (
              <Card key={story.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">
                        Story {new Date(story.created_at).toLocaleDateString('pt-BR')}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4" />
                        {isExpired ? (
                          <span className="text-red-600">Expirado</span>
                        ) : (
                          <span>Expira em {timeRemaining}</span>
                        )}
                      </div>
                    </div>
                    {!isExpired && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(story.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Video Preview */}
                  <div className="aspect-[9/16] max-h-64 bg-black rounded-lg overflow-hidden mb-4">
                    <video
                      src={story.video_url}
                      className="w-full h-full object-contain"
                      controls
                    />
                  </div>

                  {/* Analytics Toggle */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedStoryId(
                      selectedStoryId === story.id ? null : story.id
                    )}
                    className="w-full"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    {selectedStoryId === story.id ? 'Ocultar' : 'Ver'} Analytics
                  </Button>

                  {/* Analytics */}
                  {selectedStoryId === story.id && (
                    <div className="mt-4">
                      <StoryAnalytics storyId={story.id} />
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
