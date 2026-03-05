'use client';

/**
 * ExternalLinksManager Component
 * 
 * Manages external links in the professional portal.
 * Allows adding, editing, removing, and reordering links.
 * 
 * Requirements: 5.1-5.9, 6.1-6.3, 8.1-8.3, 9.3-9.5
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUp, ArrowDown, Edit, Trash2, Plus } from 'lucide-react';
import { 
  IconBrandInstagram, 
  IconBrandTiktok, 
  IconBrandYoutube, 
  IconBrandFacebook,
  IconBrandOnlyfans,
  IconBrandPatreon,
  IconDiamond,
  IconHeart,
  IconMovie,
  IconLink
} from '@tabler/icons-react';
import type { ExternalLinkRecord } from '@/types';
import { LinkFormDialog } from './LinkFormDialog';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';

// Map social network titles to icons
const getSocialIcon = (title: string) => {
  const iconMap: Record<string, any> = {
    'Instagram': IconBrandInstagram,
    'Tiktok': IconBrandTiktok,
    'Youtube': IconBrandYoutube,
    'Facebook': IconBrandFacebook,
    'Onlyfans': IconBrandOnlyfans,
    'Patreon': IconBrandPatreon,
    'Privacy': IconDiamond,
    'Fansly': IconHeart,
    'Canal Adulto': IconMovie,
  };
  
  return iconMap[title] || IconLink;
};

interface ExternalLinksManagerProps {
  profileId: string;
}

export function ExternalLinksManager({ profileId }: ExternalLinksManagerProps) {
  const [links, setLinks] = useState<ExternalLinkRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [planLimit, setPlanLimit] = useState<number | null>(null);
  const [planCode, setPlanCode] = useState('');
  
  // Dialog states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<ExternalLinkRecord | null>(null);
  const [deletingLink, setDeletingLink] = useState<ExternalLinkRecord | null>(null);

  useEffect(() => {
    fetchLinks();
    fetchPlanInfo();
  }, [profileId]);

  const fetchLinks = async () => {
    try {
      const response = await fetch(`/api/external-links?profileId=${profileId}`);
      
      if (!response.ok) {
        throw new Error('Erro ao carregar links');
      }

      const data = await response.json();
      if (data.success && data.data) {
        setLinks(data.data);
      }
    } catch (err: any) {
      console.error('Error fetching links:', err);
      setError(err.message || 'Erro ao carregar links');
    } finally {
      setLoading(false);
    }
  };

  const fetchPlanInfo = async () => {
    try {
      const response = await fetch('/api/subscriptions/plans');
      const data = await response.json();
      
      if (data.subscription?.plan) {
        const plan = data.subscription.plan;
        setPlanCode(plan.code);
        
        // Set limits based on plan
        if (plan.code === 'free') {
          setPlanLimit(3);
        } else if (plan.code === 'premium') {
          setPlanLimit(10);
        } else if (plan.code === 'black') {
          setPlanLimit(null); // Unlimited
        }
      }
    } catch (err) {
      console.error('Error fetching plan info:', err);
    }
  };

  const handleAdd = () => {
    setEditingLink(null);
    setIsFormOpen(true);
  };

  const handleEdit = (link: ExternalLinkRecord) => {
    setEditingLink(link);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (link: ExternalLinkRecord) => {
    setDeletingLink(link);
    setIsDeleteOpen(true);
  };

  const handleFormSubmit = async (title: string, url: string) => {
    setError('');
    setSuccess('');

    try {
      if (editingLink) {
        // Update existing link
        const response = await fetch(`/api/external-links/${editingLink.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, url }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Erro ao atualizar link');
        }

        setSuccess('Link atualizado com sucesso!');
      } else {
        // Create new link
        const response = await fetch('/api/external-links', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, url }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Erro ao criar link');
        }

        setSuccess('Link adicionado com sucesso!');
      }

      setIsFormOpen(false);
      await fetchLinks();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message);
      throw err; // Re-throw to let form handle it
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingLink) return;

    setError('');
    setSuccess('');

    try {
      const response = await fetch(`/api/external-links/${deletingLink.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao remover link');
      }

      setSuccess('Link removido com sucesso!');
      setIsDeleteOpen(false);
      setDeletingLink(null);
      await fetchLinks();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleReorder = async (linkId: string, direction: 'up' | 'down') => {
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/external-links/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: linkId, direction }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao reordenar link');
      }

      await fetchLinks();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const canAddMore = planLimit === null || links.length < planLimit;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Links Externos</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">Carregando...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Links Externos</CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                {planLimit !== null 
                  ? `${links.length}/${planLimit} links utilizados`
                  : `${links.length} links (ilimitado)`
                }
              </p>
            </div>
            <Button
              onClick={handleAdd}
              disabled={!canAddMore}
              className="flex items-center gap-2"
            >
              <Plus size={16} />
              Adicionar Link
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Error/Success Messages */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}
          
          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
              {success}
            </div>
          )}

          {/* Plan Limit Warning */}
          {!canAddMore && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm">
              Você atingiu o limite de {planLimit} links do plano {planCode}. 
              Faça upgrade para adicionar mais links.
            </div>
          )}

          {/* Links List */}
          {links.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>Nenhum link adicionado ainda.</p>
              <p className="text-sm mt-1">Clique em "Adicionar Link" para começar.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {links.map((link, index) => {
                const IconComponent = getSocialIcon(link.title);
                
                return (
                  <div
                    key={link.id}
                    className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                  >
                    {/* Icon */}
                    <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-gray-100 rounded-full">
                      <IconComponent size={20} className="text-gray-700" />
                    </div>

                    {/* Title and URL */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{link.title}</p>
                      <p className="text-sm text-gray-500 truncate">{link.url}</p>
                    </div>

                  {/* Reorder Buttons */}
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleReorder(link.id, 'up')}
                      disabled={index === 0}
                      className="p-2"
                      title="Mover para cima"
                    >
                      <ArrowUp size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleReorder(link.id, 'down')}
                      disabled={index === links.length - 1}
                      className="p-2"
                      title="Mover para baixo"
                    >
                      <ArrowDown size={16} />
                    </Button>
                  </div>

                  {/* Edit Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(link)}
                    className="p-2"
                    title="Editar"
                  >
                    <Edit size={16} />
                  </Button>

                  {/* Delete Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteClick(link)}
                    className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                    title="Remover"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              );
            })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <LinkFormDialog
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        initialTitle={editingLink?.title || ''}
        initialUrl={editingLink?.url || ''}
        isEditing={!!editingLink}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false);
          setDeletingLink(null);
        }}
        onConfirm={handleDeleteConfirm}
        linkTitle={deletingLink?.title || ''}
      />
    </>
  );
}
