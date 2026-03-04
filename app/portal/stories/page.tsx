'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { StoryUploadButton } from '@/app/components/stories/StoryUploadButton';
import { StoryAnalytics } from '@/app/components/stories/StoryAnalytics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Eye, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { StoryExpirationService } from '@/lib/services/story-expiration.service';

export default function StoriesPage() {
  const [user, setUser] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [stories, setStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStoryId, setSelectedStoryId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const supabase = createClient();

      // Get user
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      setUser(authUser);

      // Get subscription
      const { data: subData } = await supabase
        .from('subscriptions')
        .select('*, plan:plans(*)')
        .eq('user_id', authUser.id)
        .eq('status', 'active')
        .single();

      setSubscription(subData);

      // Get stories
      await fetchStories(authUser.id);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStories = async (userId: string) => {
    try {
      const response = await fetch(`/api/stories/user/${userId}`);
      const data = await response.json();

      if (data.success) {
        setStories(data.stories || []);
      }
    } catch (error) {
      console.error('Error fetching stories:', error);
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
      fetchStories(user.id);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao deletar story');
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-gray-500">Carregando...</p>
      </div>
    );
  }

  const planCode = subscription?.plan?.code || 'free';
  const activeStories = stories.filter(s => s.status === 'active');

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Meus Stories</h1>
          <p className="text-gray-600 mt-1">
            Gerencie seus stories e veja analytics
          </p>
        </div>
        {user && (
          <StoryUploadButton
            userId={user.id}
            userPlan={planCode}
            activeStoriesCount={activeStories.length}
            onUploadSuccess={() => fetchStories(user.id)}
          />
        )}
      </div>

      {/* Plan Info */}
      <Card>
        <CardContent className="pt-6">
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
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">Você ainda não publicou nenhum story</p>
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
            const timeRemaining = StoryExpirationService.formatTimeRemaining(
              new Date(story.expires_at)
            );

            return (
              <Card key={story.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">
                        Stories {new Date(story.created_at).toLocaleDateString('pt-BR')}
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
                  <div style={{ 
                    width: '100%', 
                    maxWidth: '180px', 
                    margin: '0 auto 1rem auto',
                    backgroundColor: '#000',
                    borderRadius: '0.5rem',
                    overflow: 'hidden'
                  }}>
                    <video
                      src={story.video_url}
                      style={{ 
                        width: '100%',
                        maxHeight: '280px',
                        objectFit: 'contain',
                        display: 'block'
                      }}
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
