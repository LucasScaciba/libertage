'use client';

/**
 * LinkFormDialog Component
 * 
 * Form dialog for adding/editing external links.
 * Includes client-side validation for title and URL.
 * 
 * Requirements: 5.2, 5.3, 5.4, 5.5, 8.1, 8.2, 8.3, 9.3, 9.4, 9.5
 */

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  IconBrandInstagram, 
  IconBrandTiktok, 
  IconBrandYoutube, 
  IconBrandFacebook,
  IconBrandOnlyfans,
  IconBrandPatreon,
  IconDiamond,
  IconHeart,
  IconMovie
} from '@tabler/icons-react';

const SOCIAL_NETWORKS = [
  { value: 'Instagram', label: 'Instagram', icon: IconBrandInstagram },
  { value: 'Tiktok', label: 'Tiktok', icon: IconBrandTiktok },
  { value: 'Youtube', label: 'Youtube', icon: IconBrandYoutube },
  { value: 'Facebook', label: 'Facebook', icon: IconBrandFacebook },
  { value: 'Onlyfans', label: 'Onlyfans', icon: IconBrandOnlyfans },
  { value: 'Patreon', label: 'Patreon', icon: IconBrandPatreon },
  { value: 'Privacy', label: 'Privacy', icon: IconDiamond },
  { value: 'Fansly', label: 'Fansly', icon: IconHeart },
  { value: 'Canal Adulto', label: 'Canal Adulto', icon: IconMovie },
];

interface LinkFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (title: string, url: string) => Promise<void>;
  initialTitle?: string;
  initialUrl?: string;
  isEditing?: boolean;
}

export function LinkFormDialog({
  isOpen,
  onClose,
  onSubmit,
  initialTitle = '',
  initialUrl = '',
  isEditing = false,
}: LinkFormDialogProps) {
  const [title, setTitle] = useState(initialTitle);
  const [url, setUrl] = useState(initialUrl);
  const [titleError, setTitleError] = useState('');
  const [urlError, setUrlError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Reset form when dialog opens/closes or initial values change
  useEffect(() => {
    if (isOpen) {
      setTitle(initialTitle);
      setUrl(initialUrl);
      setTitleError('');
      setUrlError('');
      setSubmitting(false);
    }
  }, [isOpen, initialTitle, initialUrl]);

  const validateTitle = (value: string): boolean => {
    const trimmed = value.trim();
    
    if (trimmed.length === 0) {
      setTitleError('O título não pode estar vazio');
      return false;
    }
    
    if (trimmed.length > 100) {
      setTitleError('O título deve ter entre 1 e 100 caracteres');
      return false;
    }
    
    setTitleError('');
    return true;
  };

  const validateUrl = (value: string): boolean => {
    const trimmed = value.trim();
    
    if (trimmed.length === 0) {
      setUrlError('A URL não pode estar vazia');
      return false;
    }
    
    // Check protocol
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      setUrlError('URL inválida. Certifique-se de incluir http:// ou https://');
      return false;
    }
    
    // Check length
    if (trimmed.length > 2048) {
      setUrlError('URL muito longa. O limite é de 2048 caracteres');
      return false;
    }
    
    // Basic domain validation
    try {
      const urlObj = new URL(trimmed);
      if (!urlObj.hostname || urlObj.hostname.length === 0) {
        setUrlError('URL inválida. O domínio não é válido');
        return false;
      }
    } catch (e) {
      setUrlError('URL inválida. O domínio não é válido');
      return false;
    }
    
    setUrlError('');
    return true;
  };

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (titleError) {
      validateTitle(value);
    }
  };

  const handleUrlChange = (value: string) => {
    setUrl(value);
    if (urlError) {
      validateUrl(value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate both fields
    const isTitleValid = validateTitle(title);
    const isUrlValid = validateUrl(url);
    
    if (!isTitleValid || !isUrlValid) {
      return;
    }
    
    setSubmitting(true);
    
    try {
      await onSubmit(title.trim(), url.trim());
      // Dialog will be closed by parent component on success
    } catch (err) {
      // Error is handled by parent component
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Link' : 'Adicionar Link'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4" style={{ padding: '1.5rem' }}>
              {/* Social Network Select */}
              <div className="space-y-2">
                <Label htmlFor="title">
                  Rede Social <span className="text-red-500">*</span>
                </Label>
                <select
                  id="title"
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  disabled={submitting}
                  className={`flex h-10 w-full rounded-md border ${titleError ? 'border-red-500' : 'border-input'} bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  <option value="">Selecione uma rede social</option>
                  {SOCIAL_NETWORKS.map((network) => (
                    <option key={network.value} value={network.value}>
                      {network.label}
                    </option>
                  ))}
                </select>
                {titleError && (
                  <p className="text-sm text-red-600">{titleError}</p>
                )}
              </div>

              {/* URL Field */}
              <div className="space-y-2">
                <Label htmlFor="url">
                  URL <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="url"
                  type="url"
                  value={url}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  onBlur={() => validateUrl(url)}
                  placeholder="https://exemplo.com"
                  disabled={submitting}
                  className={urlError ? 'border-red-500' : ''}
                />
                {urlError ? (
                  <p className="text-sm text-red-600">{urlError}</p>
                ) : (
                  <p className="text-sm text-gray-500">
                    Deve começar com http:// ou https://
                  </p>
                )}
              </div>
            </div>

            <div style={{ 
              padding: '1rem 1.5rem', 
              borderTop: '1px solid hsl(var(--border))',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '0.5rem'
            }}>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={submitting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={submitting || !!titleError || !!urlError}
              >
                {submitting ? 'Salvando...' : isEditing ? 'Salvar' : 'Adicionar'}
              </Button>
            </div>
          </form>
      </DialogContent>
    </Dialog>
  );
}
